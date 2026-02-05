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
    default: false
  }
});

const sampleProblemSchema = new mongoose.Schema({
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
    default: 'easy'
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
    default: 2000 // milliseconds
  },
  memoryLimit: {
    type: Number,
    default: 256 // MB
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tags: [{
    type: String
  }]
}, {
  timestamps: true
});

const SampleProblem = mongoose.model('SampleProblem', sampleProblemSchema);

export default SampleProblem;
