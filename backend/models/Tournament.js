const mongoose = require('mongoose');

const TournamentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  gameMode: {
    type: String,
    required: true,
    enum: ['BR Ranked', 'Clash Squad', 'Custom Room', 'Solo Showdown'],
    default: 'BR Ranked'
  },
  map: {
    type: String,
    required: true,
    enum: ['Bermuda', 'Purgatory', 'Kalahari', 'Alpine'],
    default: 'Bermuda'
  },
  entryFee: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  prizePool: {
    type: Number,
    required: true,
    min: 0
  },
  slots: {
    type: Number,
    required: true,
    min: 2
  },
  playersJoined: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  matchDateTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed'],
    default: 'upcoming'
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  roomDetails: {
    roomId: {
      type: String,
      default: ''
    },
    roomPassword: {
      type: String,
      default: ''
    }
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  results: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rank: { type: Number },
    kills: { type: Number, default: 0 },
    prizeWon: { type: Number, default: 0 }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Tournament', TournamentSchema);
