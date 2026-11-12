const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');

const {
    listThemes, createGame, joinGame, getGame, setTheme,
    startRound, openVoting, castVote, finishVoting, leaveGame
} = require('../controllers/gameController');

// Word themes (no login needed so the home page can show them)
router.get('/themes', listThemes);

// Everything about games needs a logged-in user (Authorization: Bearer <token>)
router.post('/games', requireAuth, createGame);
router.post('/games/join', requireAuth, joinGame);
router.get('/games/:code', requireAuth, getGame);
router.put('/games/:code/theme', requireAuth, setTheme);
router.post('/games/:code/start', requireAuth, startRound);
router.post('/games/:code/voting', requireAuth, openVoting);
router.post('/games/:code/vote', requireAuth, castVote);
router.post('/games/:code/finish', requireAuth, finishVoting);
router.post('/games/:code/leave', requireAuth, leaveGame);

module.exports = router;
