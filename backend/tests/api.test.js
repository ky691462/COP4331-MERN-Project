// Route tests (Node's built-in test runner + Supertest) against a real MongoDB
// test database. Run with: npm test
// (uses MONGO_TEST_URI, default mongodb://127.0.0.1:27017/impostor_test)

const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
delete process.env.BREVO_API_KEY; // never send real email from tests

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const { sent } = require('../services/mailer');
const User = require('../models/User');
const Game = require('../models/Game');

const MONGO_URI = process.env.MONGO_TEST_URI || 'mongodb://127.0.0.1:27017/impostor_test';
const PASSWORD = 'Secret#123';

before(async () => {
    await mongoose.connect(MONGO_URI);
    await mongoose.connection.db.dropDatabase();
    await User.init();
    await Game.init();
});

after(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();
});

const tokenFromLastEmail = (to, path) => {
    const email = [...sent].reverse().find((e) => e.to === to && e.text.includes(path));
    return email.text.match(/token=([a-f0-9]+)/)[1];
};

// Register, click the emailed link, log in. Returns the JWT.
const signUp = async (firstName) => {
    const email = `${firstName.toLowerCase()}@example.com`;
    await request(app).post('/api/register')
        .send({ firstName, lastName: 'Test', email, password: PASSWORD }).expect(201);
    await request(app).post('/api/verify-email')
        .send({ token: tokenFromLastEmail(email, '/verify') }).expect(200);
    const res = await request(app).post('/api/login').send({ email, password: PASSWORD }).expect(200);
    return { token: res.body.token, id: res.body.user.id, email };
};

const as = (user) => ({ Authorization: `Bearer ${user.token}` });

describe('auth and email verification', () => {
    test('rejects weak passwords', async () => {
        const res = await request(app).post('/api/register')
            .send({ firstName: 'Weak', lastName: 'Pw', email: 'weak@example.com', password: 'password' });
        assert.equal(res.status, 400);
    });

    test('cannot log in before verifying, can after', async () => {
        const email = 'new@example.com';
        await request(app).post('/api/register')
            .send({ firstName: 'New', lastName: 'User', email, password: PASSWORD }).expect(201);

        const blocked = await request(app).post('/api/login').send({ email, password: PASSWORD });
        assert.equal(blocked.status, 403);
        assert.equal(blocked.body.needsVerification, true);

        await request(app).post('/api/verify-email').send({ token: 'nope' }).expect(400);
        await request(app).post('/api/verify-email')
            .send({ token: tokenFromLastEmail(email, '/verify') }).expect(200);
        await request(app).post('/api/login').send({ email, password: PASSWORD }).expect(200);
    });

    test('duplicate email is rejected', async () => {
        await request(app).post('/api/register')
            .send({ firstName: 'New', lastName: 'User', email: 'NEW@example.com', password: PASSWORD })
            .expect(409);
    });

    test('password reset by email', async () => {
        const email = 'new@example.com';
        await request(app).post('/api/forgot-password').send({ email }).expect(200);
        const token = tokenFromLastEmail(email, '/reset-password');
        await request(app).post('/api/reset-password').send({ token, password: 'NewPass#456' }).expect(200);
        await request(app).post('/api/reset-password').send({ token, password: 'NewPass#456' }).expect(400);
        await request(app).post('/api/login').send({ email, password: 'NewPass#456' }).expect(200);
    });

    test('game routes need a login', async () => {
        await request(app).post('/api/games').send({ theme: 'animals' }).expect(401);
    });
});

describe('a full game', () => {
    let host, ana, ben, cal, code;

    before(async () => {
        host = await signUp('Hosty');
        ana = await signUp('Ana');
        ben = await signUp('Ben');
        cal = await signUp('Cal');
    });

    test('themes list includes holidays and general themes', async () => {
        const res = await request(app).get('/api/themes').expect(200);
        const ids = res.body.themes.map((t) => t.id);
        ['animals', 'halloween', 'winter-holidays'].forEach((id) => assert.ok(ids.includes(id)));
        assert.equal(res.body.themes[0].words, undefined); // words stay secret
    });

    test('host creates a themed lobby', async () => {
        const res = await request(app).post('/api/games').set(as(host))
            .send({ theme: 'halloween', nickname: 'Host' }).expect(201);
        code = res.body.code;
        assert.equal(res.body.theme.id, 'halloween');
        assert.equal(res.body.theme.kind, 'holiday');
        assert.equal(res.body.you.isHost, true);
        assert.equal(res.body.canStart, false);
    });

    test('unknown theme is rejected', async () => {
        await request(app).post('/api/games').set(as(host)).send({ theme: 'nope' }).expect(400);
    });

    test('cannot start with fewer than 3 players', async () => {
        await request(app).post(`/api/games/${code}/start`).set(as(host)).expect(409);
    });

    test('players join (code is case-insensitive) and nicknames must be unique', async () => {
        await request(app).post('/api/games/join').set(as(ana))
            .send({ code: code.toLowerCase(), nickname: 'Ana' }).expect(200);
        await request(app).post('/api/games/join').set(as(ben))
            .send({ code, nickname: 'ana' }).expect(409);
        const res = await request(app).post('/api/games/join').set(as(ben))
            .send({ code, nickname: 'Ben' }).expect(200);
        assert.equal(res.body.players.length, 3);
        await request(app).post('/api/games/join').set(as(host)).send({ code: 'ZZZZZ' }).expect(404);
    });

    test('only the host can change the theme or start', async () => {
        await request(app).put(`/api/games/${code}/theme`).set(as(ana)).send({ theme: 'animals' }).expect(403);
        await request(app).post(`/api/games/${code}/start`).set(as(ana)).expect(403);
        const res = await request(app).put(`/api/games/${code}/theme`).set(as(host))
            .send({ theme: 'animals' }).expect(200);
        assert.equal(res.body.theme.id, 'animals');
    });

    let impostor;
    test('starting deals one impostor and the same word to everyone else', async () => {
        await request(app).post(`/api/games/${code}/start`).set(as(host)).expect(200);

        const views = await Promise.all([host, ana, ben].map((u) =>
            request(app).get(`/api/games/${code}`).set(as(u)).expect(200)));
        const impostors = views.filter((v) => v.body.you.isImpostor);
        const crew = views.filter((v) => !v.body.you.isImpostor);

        assert.equal(impostors.length, 1);
        assert.equal(impostors[0].body.you.word, null);
        assert.equal(new Set(crew.map((v) => v.body.you.word)).size, 1);
        assert.ok(crew[0].body.you.word);
        views.forEach((v) => assert.equal(v.body.status, 'reveal'));

        impostor = [host, ana, ben].find((u) => u.id === impostors[0].body.you.userId);
    });

    test('nobody can join mid-round', async () => {
        await request(app).post('/api/games/join').set(as(cal)).send({ code, nickname: 'Cal' }).expect(409);
    });

    test('voting: no self votes, simultaneous votes all count, results reveal the impostor', async () => {
        await request(app).post(`/api/games/${code}/vote`).set(as(host))
            .send({ targetId: ana.id }).expect(409); // voting not open yet
        await request(app).post(`/api/games/${code}/voting`).set(as(host)).expect(200);
        await request(app).post(`/api/games/${code}/vote`).set(as(host))
            .send({ targetId: host.id }).expect(400);

        // Everyone except the impostor votes for the impostor; the impostor
        // votes for someone else. All at the same moment.
        const voters = [host, ana, ben];
        const target = (u) => (u === impostor ? voters.find((v) => v !== impostor) : impostor);
        await Promise.all(voters.map((u) =>
            request(app).post(`/api/games/${code}/vote`).set(as(u)).send({ targetId: target(u).id }).expect(200)));

        const res = await request(app).get(`/api/games/${code}`).set(as(ana)).expect(200);
        assert.equal(res.body.status, 'results');
        assert.equal(res.body.result.caught, true);
        assert.equal(res.body.result.impostorId, impostor.id);
        assert.equal(res.body.result.votes[0].votes, 2);
        const scores = Object.fromEntries(res.body.players.map((p) => [p.userId, p.score]));
        assert.equal(scores[impostor.id], 0);
        voters.filter((u) => u !== impostor).forEach((u) => assert.equal(scores[u.id], 1));
    });

    test('someone can join between rounds and the next round starts', async () => {
        await request(app).post('/api/games/join').set(as(cal)).send({ code, nickname: 'Cal' }).expect(200);
        const res = await request(app).post(`/api/games/${code}/start`).set(as(host)).expect(200);
        assert.equal(res.body.round, 2);
        assert.equal(res.body.result, null);
    });

    test('host can end voting early; a tie means the impostor escapes', async () => {
        await request(app).post(`/api/games/${code}/voting`).set(as(host)).expect(200);
        const res = await request(app).post(`/api/games/${code}/finish`).set(as(host)).expect(200);
        assert.equal(res.body.status, 'results');
        assert.equal(res.body.result.caught, false);
    });

    test('host leaving hands the game to someone else', async () => {
        await request(app).post(`/api/games/${code}/leave`).set(as(host)).expect(200);
        const res = await request(app).get(`/api/games/${code}`).set(as(ana)).expect(200);
        assert.equal(res.body.players.length, 3);
        assert.equal(res.body.hostId, ana.id);
        await request(app).get(`/api/games/${code}`).set(as(host)).expect(403);
    });

    test('the game is deleted when everyone leaves', async () => {
        for (const u of [ana, ben, cal]) {
            await request(app).post(`/api/games/${code}/leave`).set(as(u)).expect(200);
        }
        await request(app).get(`/api/games/${code}`).set(as(ana)).expect(404);
    });
});
