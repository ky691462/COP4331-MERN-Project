const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    nickname: { type: String, required: true, trim: true, maxlength: 20 },
    score: { type: Number, default: 0 },
    // Who this player voted for in the current round (null = not voted yet)
    vote: { type: mongoose.Schema.Types.ObjectId, default: null },
    joinedAt: { type: Date, default: Date.now }
}, { _id: false });

const resultSchema = new mongoose.Schema({
    impostorId: mongoose.Schema.Types.ObjectId,
    word: String,
    caught: Boolean,
    // userId (as string) -> number of votes received
    tally: { type: Map, of: Number }
}, { _id: false });

const gameSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true, uppercase: true },
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    theme: { type: String, required: true },
    // lobby -> reveal (everyone sees their word, clues are given out loud)
    //       -> voting -> results -> (next round) reveal ...
    status: {
        type: String,
        enum: ['lobby', 'reveal', 'voting', 'results'],
        default: 'lobby'
    },
    round: { type: Number, default: 0 },
    word: { type: String, default: null },
    impostorId: { type: mongoose.Schema.Types.ObjectId, default: null },
    usedWords: { type: [String], default: [] },
    players: { type: [playerSchema], default: [] },
    lastResult: { type: resultSchema, default: null }
}, {
    timestamps: true,
    // Two requests that change the same game at the same moment can't
    // overwrite each other: the second save fails and is retried.
    optimisticConcurrency: true
});

// Abandoned games are cleaned up 6 hours after their last change.
gameSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 6 * 60 * 60 });

module.exports = mongoose.model('Game', gameSchema);
