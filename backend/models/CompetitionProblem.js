import mongoose from 'mongoose';

const testCaseSchema = new mongoose.Schema({
  input: {
    type: String,
    required: true
  },
  expectedOutput: {
    type: String,
    required: true
  },
  isHidden: {
    type: Boolean,
    default: true
  },
  points: {
    type: Number,
    default: 10
  }
});

const competitionProblemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  allowedLanguages: [{
    type: String,
    enum: ['javascript', 'python', 'java', 'cpp', 'c']
  }],
  testCases: [testCaseSchema],
  constraints: {
    type: String,
    default: ''
  },
  inputFormat: {
    type: String,
    default: ''
  },
  outputFormat: {
    type: String,
    default: ''
  },
  sampleInput: {
    type: String,
    default: ''
  },
  sampleOutput: {
    type: String,
    default: ''
  },
  timeLimit: {
    type: Number,
    default: 2000
  },
  memoryLimit: {
    type: Number,
    default: 256
  },
  maxScore: {
    type: Number,
    default: 100
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isShared: {
    type: Boolean,
    default: false // true for admin-created problems visible to all teachers
  },
  tags: [{
    type: String
  }],
  // Competition problems are hidden by default
  isPublished: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const CompetitionProblem = mongoose.model('CompetitionProblem', competitionProblemSchema);

export default CompetitionProblem;
