import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  problem: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'problemType'
  },
  problemType: {
    type: String,
    enum: ['SampleProblem', 'CompetitionProblem'],
    required: true
  },
  lobby: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lobby',
    default: null // null for sample problem submissions
  },
  language: {
    type: String,
    enum: ['javascript', 'python', 'java', 'cpp', 'c'],
    required: true
  },
  code: {
    type: String,
    required: true
  },
  verdict: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'WRONG_ANSWER', 'TIME_LIMIT_EXCEEDED', 'MEMORY_LIMIT_EXCEEDED', 'RUNTIME_ERROR', 'COMPILATION_ERROR'],
    default: 'PENDING'
  },
  score: {
    type: Number,
    default: 0
  },
  testCasesPassed: {
    type: Number,
    default: 0
  },
  totalTestCases: {
    type: Number,
    default: 0
  },
  executionTime: {
    type: Number, // milliseconds
    default: 0
  },
  memoryUsed: {
    type: Number, // KB
    default: 0
  },
  errorMessage: {
    type: String,
    default: ''
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
submissionSchema.index({ user: 1, problem: 1, lobby: 1 });
submissionSchema.index({ lobby: 1, verdict: 1 });

const Submission = mongoose.model('Submission', submissionSchema);

export default Submission;
