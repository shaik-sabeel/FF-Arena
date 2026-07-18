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
    enum: ['BR Ranked', 'Clash Squad', 'Custom Room', 'Solo Showdown', 'Lone Wolf'],
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
  prizeDistribution: {
    winnerCount: {
      type: Number,
      default: 1,
      min: 1
    },
    prizes: [{
      rank: { type: Number },
      amount: { type: Number, default: 0 }
    }]
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
  observersJoined: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  maxObservers: {
    type: Number,
    default: 5
  },
  observerReward: {
    type: Number,
    default: 0
  },
  perKillReward: {
    type: Number,
    default: 0
  },
  observerVotes: [{
    observer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    results: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rank: { type: Number },
      kills: { type: Number, default: 0 }
    }],
    submittedAt: { type: Date, default: Date.now }
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
    },
    disputed: {
      type: Boolean,
      default: false
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
  paymentQrOption: {
    type: String,
    enum: ['qr_durga', 'qr_kowshik'],
    default: 'qr_durga'
  },
  pendingRegistrations: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['player', 'observer'],
      default: 'player'
    },
    utr: {
      type: String,
      required: true
    },
    submittedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Tournament', TournamentSchema);
