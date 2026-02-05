import express from 'express';
import { body, validationResult } from 'express-validator';
import SampleProblem from '../models/SampleProblem.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/sample-problems
// @desc    Get all sample problems (Public)
// @access  Public (but login required)
router.get('/', protect, async (req, res) => {
  try {
    const { difficulty, language, search } = req.query;
    const filter = {};

    if (difficulty) filter.difficulty = difficulty;
    if (language) filter.allowedLanguages = language;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    const problems = await SampleProblem.find(filter)
      .select('-testCases.expectedOutput') // Hide expected outputs
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: problems.length,
      data: problems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/sample-problems/:id
// @desc    Get single sample problem
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const problem = await SampleProblem.findById(req.params.id)
      .select('-testCases.expectedOutput'); // Hide expected outputs

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }

    res.json({
      success: true,
      data: problem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/sample-problems
// @desc    Create sample problem (Admin/Teacher)
// @access  Private/Admin/Teacher
router.post('/', protect, authorize('admin', 'teacher'), [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('difficulty').isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty'),
  body('allowedLanguages').isArray({ min: 1 }).withMessage('At least one language is required'),
  body('testCases').isArray({ min: 1 }).withMessage('At least one test case is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const problem = await SampleProblem.create({
      ...req.body,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: problem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/sample-problems/:id
// @desc    Update sample problem
// @access  Private/Admin/Teacher
router.put('/:id', protect, authorize('admin', 'teacher'), async (req, res) => {
  try {
    let problem = await SampleProblem.findById(req.params.id);

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }

    // Only admin or creator can update
    if (req.user.role !== 'admin' && problem.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this problem'
      });
    }

    problem = await SampleProblem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      data: problem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/sample-problems/:id
// @desc    Delete sample problem
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const problem = await SampleProblem.findById(req.params.id);

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }

    await problem.deleteOne();

    res.json({
      success: true,
      message: 'Problem deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;
