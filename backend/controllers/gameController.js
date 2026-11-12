const crypto = require('crypto');
const mongoose = require('mongoose');
const Game = require('../models/Game');
const User = require('../models/User');
const { themes, findTheme, inSeason, publicTheme } = require('../data/themes');

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 12;
const CODE_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O or 1/I mix-ups
const CODE_LENGTH = 5;

class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

const sameId = (a, b) => a != null && b != null && String(a) === String(b);
const randomItem = (list) => list[crypto.randomInt(list.length)];

const makeCode = () => {
    let code = '';
    for (let i = 0; i < CODE_LENGTH; i++) code += randomItem(CODE_LETTERS);
    return code;
};

const cleanNickname = async (nickname, userId) => {
    let name = typeof nickname === 'string' ? nickname.trim() : '';
    if (!name) {
        const user = await User.findById(userId).select('firstName');
        name = user ? user.firstName : '';
    }
    if (!name) throw new HttpError(400, 'Please enter a nickname.');
    if (name.length > 20) throw new HttpError(400, 'Nicknames can be at most 20 characters.');
    return name;
};

const findPlayer = (game, userId) => game.players.find((p) => sameId(p.userId, userId));

const requireMember = (game, userId) => {
    const player = findPlayer(game, userId);
    if (!player) throw new HttpError(403, 'You are not in this game.');
    return player;
};

const requireHost = (game, userId) => {
    requireMember(game, userId);
    if (!sameId(game.hostId, userId)) throw new HttpError(403, 'Only the host can do that.');
};

const requireStatus = (game, ...allowed) => {
    if (!allowed.includes(game.status)) {
        throw new HttpError(409, `That can't be done right now (game is in "${game.status}").`);
    }
};

// Load a game, apply `change`, and save. If someone else changed the same game
// in between, the save is rejected (optimistic concurrency) and we retry with
// fresh data, so simultaneous votes or joins never overwrite each other.
const mutate = async (code, change) => {
    for (let attempt = 0; attempt < 6; attempt++) {
        const game = await Game.findOne({ code: String(code).toUpperCase() });
        if (!game) throw new HttpError(404, 'No game with that code.');
        const result = await change(game);
        if (result === 'deleted') return null;
        try {
            await game.save();
            return game;
        } catch (error) {
            if (error instanceof mongoose.Error.VersionError) continue;
            throw error;
        }
    }
    throw new HttpError(503, 'The game is busy. Please try again.');
};

// Count votes, decide whether the impostor was caught, and award points.
// Impostor escapes: +2 for the impostor. Impostor caught: +1 for everyone
// who voted for them.
const finishRound = (game) => {
    const tally = new Map();
    for (const p of game.players) {
        if (p.vote) tally.set(String(p.vote), (tally.get(String(p.vote)) || 0) + 1);
    }

    const most = Math.max(0, ...tally.values());
    const leaders = [...tally.entries()].filter(([, n]) => n === most && n > 0).map(([id]) => id);
    const caught = leaders.length === 1 && sameId(leaders[0], game.impostorId);

    for (const p of game.players) {
        if (caught && sameId(p.vote, game.impostorId)) p.score += 1;
        if (!caught && sameId(p.userId, game.impostorId)) p.score += 2;
    }

    game.lastResult = { impostorId: game.impostorId, word: game.word, caught, tally };
    game.status = 'results';
};

const allVoted = (game) => game.players.every((p) => p.vote != null);

const resetRound = (game) => {
    game.status = 'lobby';
    game.word = null;
    game.impostorId = null;
    game.players.forEach((p) => { p.vote = null; });
};

// What one player is allowed to see. Nobody learns the impostor or the word
// they shouldn't know until the results.
const viewFor = (game, userId) => {
    const me = requireMember(game, userId);
    const inRound = game.status === 'reveal' || game.status === 'voting';
    const isImpostor = inRound && sameId(game.impostorId, userId);
    const theme = findTheme(game.theme);
    const isHost = sameId(game.hostId, userId);
    const nameOf = (id) => {
        const p = findPlayer(game, id);
        return p ? p.nickname : 'Someone who left';
    };

    let result = null;
    if (game.status === 'results' && game.lastResult) {
        const r = game.lastResult;
        result = {
            impostorId: r.impostorId,
            impostorNickname: nameOf(r.impostorId),
            word: r.word,
            caught: r.caught,
            votes: game.players.map((p) => ({
                userId: p.userId,
                nickname: p.nickname,
                votes: (r.tally && r.tally.get(String(p.userId))) || 0,
                votedFor: p.vote
            })).sort((a, b) => b.votes - a.votes)
        };
    }

    return {
        code: game.code,
        status: game.status,
        round: game.round,
        theme: theme ? publicTheme(theme) : { id: game.theme, name: game.theme },
        hostId: game.hostId,
        minPlayers: MIN_PLAYERS,
        maxPlayers: MAX_PLAYERS,
        players: game.players.map((p) => ({
            userId: p.userId,
            nickname: p.nickname,
            score: p.score,
            isHost: sameId(p.userId, game.hostId),
            hasVoted: game.status === 'voting' ? p.vote != null : undefined
        })),
        you: {
            userId: me.userId,
            nickname: me.nickname,
            isHost,
            isImpostor,
            // The impostor gets no word, only the theme.
            word: inRound && !isImpostor ? game.word : null,
            vote: game.status === 'voting' || game.status === 'results' ? me.vote : null
        },
        canStart: isHost && ['lobby', 'results'].includes(game.status) && game.players.length >= MIN_PLAYERS,
        result,
        updatedAt: game.updatedAt
    };
};

const handle = (fn) => async (req, res) => {
    try {
        await fn(req, res);
    } catch (error) {
        if (error instanceof HttpError) {
            return res.status(error.status).json({ message: error.message });
        }
        console.error(error);
        return res.status(500).json({ message: 'Server error.' });
    }
};

// GET /api/themes
const listThemes = handle(async (req, res) => {
    const now = new Date();
    res.json({
        themes: themes.map((t) => publicTheme(t, now)),
        featured: inSeason(now).map((t) => t.id)
    });
});

// POST /api/games  { theme, nickname }
const createGame = handle(async (req, res) => {
    const themeId = req.body.theme || 'classic';
    if (!findTheme(themeId)) throw new HttpError(400, 'Unknown theme.');
    const nickname = await cleanNickname(req.body.nickname, req.userId);

    for (let attempt = 0; attempt < 10; attempt++) {
        try {
            const game = await Game.create({
                code: makeCode(),
                hostId: req.userId,
                theme: themeId,
                players: [{ userId: req.userId, nickname }]
            });
            return res.status(201).json(viewFor(game, req.userId));
        } catch (error) {
            if (error.code !== 11000) throw error; // code already taken: try another
        }
    }
    throw new HttpError(503, 'Could not create a game. Please try again.');
});

// POST /api/games/join  { code, nickname }
const joinGame = handle(async (req, res) => {
    const code = typeof req.body.code === 'string' ? req.body.code.trim() : '';
    if (!code) throw new HttpError(400, 'Please enter a room code.');
    const nickname = await cleanNickname(req.body.nickname, req.userId);

    const game = await mutate(code, (g) => {
        if (findPlayer(g, req.userId)) return; // already in: just rejoin
        requireStatus(g, 'lobby', 'results');
        if (g.players.length >= MAX_PLAYERS) throw new HttpError(409, 'This game is full.');
        if (g.players.some((p) => p.nickname.toLowerCase() === nickname.toLowerCase())) {
            throw new HttpError(409, 'Someone in this game already has that nickname.');
        }
        g.players.push({ userId: req.userId, nickname });
    });
    res.json(viewFor(game, req.userId));
});

// GET /api/games/:code
const getGame = handle(async (req, res) => {
    const game = await Game.findOne({ code: String(req.params.code).toUpperCase() });
    if (!game) throw new HttpError(404, 'No game with that code.');
    res.json(viewFor(game, req.userId));
});

// PUT /api/games/:code/theme  { theme }   (host, between rounds)
const setTheme = handle(async (req, res) => {
    if (!findTheme(req.body.theme)) throw new HttpError(400, 'Unknown theme.');
    const game = await mutate(req.params.code, (g) => {
        requireHost(g, req.userId);
        requireStatus(g, 'lobby', 'results');
        if (g.theme !== req.body.theme) {
            g.theme = req.body.theme;
            g.usedWords = [];
        }
    });
    res.json(viewFor(game, req.userId));
});

// POST /api/games/:code/start   (host) — starts the first or the next round
const startRound = handle(async (req, res) => {
    const game = await mutate(req.params.code, (g) => {
        requireHost(g, req.userId);
        requireStatus(g, 'lobby', 'results');
        if (g.players.length < MIN_PLAYERS) {
            throw new HttpError(409, `You need at least ${MIN_PLAYERS} players to start.`);
        }

        const words = findTheme(g.theme).words;
        let unused = words.filter((w) => !g.usedWords.includes(w));
        if (unused.length === 0) {
            g.usedWords = [];
            unused = words;
        }
        g.word = randomItem(unused);
        g.usedWords.push(g.word);
        g.impostorId = randomItem(g.players).userId;
        g.players.forEach((p) => { p.vote = null; });
        g.lastResult = null;
        g.round += 1;
        g.status = 'reveal';
    });
    res.json(viewFor(game, req.userId));
});

// POST /api/games/:code/voting   (host) — clues are done, open the vote
const openVoting = handle(async (req, res) => {
    const game = await mutate(req.params.code, (g) => {
        requireHost(g, req.userId);
        requireStatus(g, 'reveal');
        g.status = 'voting';
    });
    res.json(viewFor(game, req.userId));
});

// POST /api/games/:code/vote  { targetId }
const castVote = handle(async (req, res) => {
    const { targetId } = req.body;
    const game = await mutate(req.params.code, (g) => {
        const me = requireMember(g, req.userId);
        requireStatus(g, 'voting');
        if (!findPlayer(g, targetId)) throw new HttpError(400, 'That player is not in this game.');
        if (sameId(targetId, req.userId)) throw new HttpError(400, "You can't vote for yourself.");
        me.vote = targetId;
        if (allVoted(g)) finishRound(g);
    });
    res.json(viewFor(game, req.userId));
});

// POST /api/games/:code/finish   (host) — end the vote without waiting for everyone
const finishVoting = handle(async (req, res) => {
    const game = await mutate(req.params.code, (g) => {
        requireHost(g, req.userId);
        requireStatus(g, 'voting');
        finishRound(g);
    });
    res.json(viewFor(game, req.userId));
});

// POST /api/games/:code/leave
const leaveGame = handle(async (req, res) => {
    const game = await mutate(req.params.code, async (g) => {
        requireMember(g, req.userId);
        g.players = g.players.filter((p) => !sameId(p.userId, req.userId));

        if (g.players.length === 0) {
            await Game.deleteOne({ _id: g._id });
            return 'deleted';
        }
        if (sameId(g.hostId, req.userId)) g.hostId = g.players[0].userId;

        // Votes for the person who left don't count any more.
        g.players.forEach((p) => { if (sameId(p.vote, req.userId)) p.vote = null; });

        const inRound = g.status === 'reveal' || g.status === 'voting';
        if (inRound && (g.players.length < MIN_PLAYERS || sameId(g.impostorId, req.userId))) {
            resetRound(g); // round can't continue: back to the lobby
        } else if (g.status === 'voting' && allVoted(g)) {
            finishRound(g);
        }
    });
    res.json({ message: game ? 'You left the game.' : 'You left, and the empty game was closed.' });
});

module.exports = {
    listThemes, createGame, joinGame, getGame, setTheme,
    startRound, openVoting, castVote, finishVoting, leaveGame
};
