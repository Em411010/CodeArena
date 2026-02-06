import mongoose from 'mongoose';
import crypto from 'crypto';

const participantSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  score: {
    type: Number,
    default: 0
  },
  solvedProblems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CompetitionProblem'
  }]
});

const lobbySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Lobby name is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  accessCode: {
    type: String,
    unique: true,
    uppercase: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  problems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CompetitionProblem'
  }],
  participants: [participantSchema],
  status: {
    type: String,
    enum: ['WAITING', 'ONGOING', 'FINISHED'],
    default: 'WAITING'
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // in minutes
    required: [true, 'Duration is required'],
    min: [5, 'Minimum duration is 5 minutes'],
    max: [480, 'Maximum duration is 8 hours']
  },
  matchType: {
    type: String,
    enum: ['STANDARD', 'QUIZ_BEE'],
    default: 'STANDARD'
  },
  timePerProblem: {
    type: Number, // in minutes, only for QUIZ_BEE mode
    min: [1, 'Minimum time per problem is 1 minute'],
    max: [30, 'Maximum time per problem is 30 minutes']
  },
  currentProblemIndex: {
    type: Number,
    default: 0 // For QUIZ_BEE mode to track which problem participants are on
  },
  problemStartTime: {
    type: Date // When current problem started (for QUIZ_BEE mode)
  },
  settings: {
    maxParticipants: {
      type: Number,
      default: 100
    },
    allowLateJoin: {
      type: Boolean,
      default: false
    },
    showLeaderboard: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Generate unique access code before saving
lobbySchema.pre('save', function(next) {
  if (!this.accessCode) {
    this.accessCode = crypto.randomBytes(3).toString('hex').toUpperCase();
  }
  next();
});

// Virtual for checking if match is active
lobbySchema.virtual('isActive').get(function() {
  return this.status === 'ONGOING';
});

// Method to check if user is participant
lobbySchema.methods.isParticipant = function(userId) {
  return this.participants.some(p => {
    // Handle both populated (p.user is an object with _id) and unpopulated (p.user is ObjectId) cases
    const participantUserId = p.user._id || p.user;
    return participantUserId.toString() === userId.toString();
  });
};

const Lobby = mongoose.model('Lobby', lobbySchema);

export default Lobby;
