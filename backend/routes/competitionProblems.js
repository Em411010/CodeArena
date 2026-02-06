import express from 'express';
import { body, validationResult } from 'express-validator';
import CompetitionProblem from '../models/CompetitionProblem.js';
import Lobby from '../models/Lobby.js';
import { protect, authorize, requireApproval } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/competition-problems
// @desc    Get all competition problems (Shared + Own for teachers, All for admin)
// @access  Private/Teacher/Admin
router.get('/', protect, authorize('teacher', 'admin'), requireApproval, async (req, res) => {
  try {
    let filter = {};

    // Teachers see shared problems (created by admin) + their own problems
    if (req.user.role === 'teacher') {
      filter = {
        $or: [
          { isShared: true },
          { createdBy: req.user.id }
        ]
      };
    }
    // Admin sees all problems

    const problems = await CompetitionProblem.find(filter)
      .populate('createdBy', 'username')
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

// @route   GET /api/competition-problems/:id
// @desc    Get single competition problem
// @access  Private/Teacher/Admin (or participant during match)
router.get('/:id', protect, async (req, res) => {
  try {
    const problem = await CompetitionProblem.findById(req.params.id);

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }

    // Check access
    if (req.user.role === 'student') {
      // Students can only see problems during an active match they're in
      const activeLobby = await Lobby.findOne({
        status: 'ONGOING',
        problems: req.params.id,
        'participants.user': req.user.id
      });

      if (!activeLobby) {
        return res.status(403).json({
          success: false,
          message: 'You can only view competition problems during an active match'
        });
      }

      // Return problem without hidden test case outputs
      const sanitizedProblem = problem.toObject();
      sanitizedProblem.testCases = sanitizedProblem.testCases.filter(tc => !tc.isHidden);

      return res.json({
        success: true,
        data: sanitizedProblem
      });
    }

    // Teachers can only see their own problems or shared problems (unless admin)
    if (req.user.role === 'teacher' && 
        problem.createdBy.toString() !== req.user.id && 
        !problem.isShared) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this problem'
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

// @route   POST /api/competition-problems
// @desc    Create competition problem (Teacher/Admin)
// @access  Private/Teacher/Admin
router.post('/', protect, authorize('teacher', 'admin'), requireApproval, [
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

    const problemData = {
      ...req.body,
      createdBy: req.user.id,
      isShared: req.user.role === 'admin' ? (req.body.isShared || false) : false
    };

    const problem = await CompetitionProblem.create(problemData);

    res.status(201).json({
      success: true,
      data: problem
    });
  } catch (error) {
    console.error('Create competition problem error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/competition-problems/:id
// @desc    Update competition problem
// @access  Private/Teacher (own) or Admin
router.put('/:id', protect, authorize('teacher', 'admin'), requireApproval, async (req, res) => {
  try {
    let problem = await CompetitionProblem.findById(req.params.id);

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }

    // Teachers can only update their own problems, Admin can update shared problems
    if (req.user.role === 'teacher') {
      if (problem.createdBy.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this problem'
        });
      }
      // Teachers cannot make their problems shared
      delete req.body.isShared;
    }
    
    // Admin can update isShared field
    if (req.user.role === 'admin' && req.body.isShared !== undefined) {
      problem.isShared = req.body.isShared;
    }

    // Check if problem is used in an ongoing match
    const ongoingLobby = await Lobby.findOne({
      status: 'ONGOING',
      problems: req.params.id
    });

    if (ongoingLobby) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update problem while it is being used in an ongoing match'
      });
    }

    problem = await CompetitionProblem.findByIdAndUpdate(req.params.id, req.body, {
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

// @route   DELETE /api/competition-problems/:id
// @desc    Delete competition problem
// @access  Private/Teacher (own) or Admin
router.delete('/:id', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const problem = await CompetitionProblem.findById(req.params.id);

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }

    // Teachers can only delete their own problems
    if (req.user.role === 'teacher' && problem.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this problem'
      });
    }

    // Check if problem is used in any lobby
    const usedInLobby = await Lobby.findOne({ problems: req.params.id });
    if (usedInLobby) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete problem that is used in a lobby'
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
