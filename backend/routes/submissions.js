import express from 'express';
import { body, validationResult } from 'express-validator';
import Submission from '../models/Submission.js';
import SampleProblem from '../models/SampleProblem.js';
import CompetitionProblem from '../models/CompetitionProblem.js';
import Lobby from '../models/Lobby.js';
import { protect, authorize } from '../middleware/auth.js';
import { executeCode } from '../services/codeExecutor.js';

const router = express.Router();

// @route   POST /api/submissions
// @desc    Submit solution
// @access  Private
router.post('/', protect, [
  body('problemId').notEmpty().withMessage('Problem ID is required'),
  body('problemType').isIn(['SampleProblem', 'CompetitionProblem']).withMessage('Invalid problem type'),
  body('language').isIn(['javascript', 'python', 'java', 'cpp', 'c']).withMessage('Invalid language'),
  body('code').notEmpty().withMessage('Code is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { problemId, problemType, lobbyId, language, code } = req.body;

    // Get the problem
    let problem;
    if (problemType === 'SampleProblem') {
      problem = await SampleProblem.findById(problemId);
    } else {
      problem = await CompetitionProblem.findById(problemId);
      
      // For competition problems, verify lobby access
      if (lobbyId) {
        const lobby = await Lobby.findById(lobbyId);
        
        if (!lobby) {
          return res.status(404).json({
            success: false,
            message: 'Lobby not found'
          });
        }

        if (lobby.status !== 'ONGOING') {
          return res.status(400).json({
            success: false,
            message: 'Submissions are only allowed during an active match'
          });
        }

        if (!lobby.isParticipant(req.user.id)) {
          return res.status(403).json({
            success: false,
            message: 'You are not a participant in this match'
          });
        }

        if (!lobby.problems.includes(problemId)) {
          return res.status(400).json({
            success: false,
            message: 'This problem is not part of this match'
          });
        }
      }
    }

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }

    // Check if language is allowed
    if (!problem.allowedLanguages.includes(language)) {
      return res.status(400).json({
        success: false,
        message: `${language} is not allowed for this problem`
      });
    }

    // Execute code against test cases using Piston API
    const timeLimit = problem.timeLimit || 3000;
    const executionResult = await executeCode(code, language, problem.testCases, timeLimit);

    // Calculate score for competition problems
    let score = 0;
    if (problemType === 'CompetitionProblem' && executionResult.verdict === 'ACCEPTED') {
      score = problem.maxScore;
    } else if (problemType === 'CompetitionProblem') {
      // Partial scoring
      score = Math.floor((executionResult.testCasesPassed / executionResult.totalTestCases) * problem.maxScore);
    }

    // Create submission
    const submission = await Submission.create({
      user: req.user.id,
      problem: problemId,
      problemType,
      lobby: lobbyId || null,
      language,
      code,
      verdict: executionResult.verdict,
      score,
      testCasesPassed: executionResult.testCasesPassed,
      totalTestCases: executionResult.totalTestCases,
      executionTime: executionResult.executionTime,
      memoryUsed: executionResult.memoryUsed,
      errorMessage: executionResult.errorMessage
    });

    // Notify lobby about new submission (so teacher can see updates in real-time)
    if (lobbyId) {
      const io = req.app.get('io');
      io.to(`lobby-${lobbyId}`).emit('leaderboard-update', {
        lobbyId,
        userId: req.user.id,
        problemId,
        verdict: executionResult.verdict
      });
    }

    // Update lobby participant score if competition submission
    if (lobbyId && executionResult.verdict === 'ACCEPTED') {
      const lobby = await Lobby.findById(lobbyId);
      const participantIndex = lobby.participants.findIndex(
        p => p.user.toString() === req.user.id
      );

      if (participantIndex !== -1) {
        const participant = lobby.participants[participantIndex];
        
        // Only add score if not already solved
        if (!participant.solvedProblems.includes(problemId)) {
          participant.solvedProblems.push(problemId);
          participant.score += score;
          await lobby.save();

          // Check if all participants have solved all problems
          const allParticipantsFinished = lobby.participants.every(
            p => p.solvedProblems.length === lobby.problems.length
          );

          if (allParticipantsFinished && lobby.status === 'ONGOING') {
            // End the match automatically
            lobby.status = 'FINISHED';
            lobby.endTime = new Date();
            await lobby.save();

            io.to(`lobby-${lobbyId}`).emit('match-ended', {
              lobbyId,
              endTime: lobby.endTime,
              reason: 'All participants completed all problems'
            });
          }
        }
      }
    }

    res.status(201).json({
      success: true,
      data: {
        _id: submission._id,
        verdict: submission.verdict,
        score: submission.score,
        testCasesPassed: submission.testCasesPassed,
        totalTestCases: submission.totalTestCases,
        executionTime: submission.executionTime,
        memoryUsed: submission.memoryUsed,
        errorMessage: submission.errorMessage
      }
    });
  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/submissions
// @desc    Get user's submissions
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { problemId, lobbyId, verdict } = req.query;
    const filter = { user: req.user.id };

    if (problemId) filter.problem = problemId;
    if (lobbyId) filter.lobby = lobbyId;
    if (verdict) filter.verdict = verdict;

    const submissions = await Submission.find(filter)
      .populate('problem', 'title')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      count: submissions.length,
      data: submissions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/submissions/lobby/:lobbyId
// @desc    Get all submissions for a lobby (Teacher only)
// @access  Private/Teacher
router.get('/lobby/:lobbyId', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const lobby = await Lobby.findById(req.params.lobbyId);

    if (!lobby) {
      return res.status(404).json({
        success: false,
        message: 'Lobby not found'
      });
    }

    // Only owner or admin can see all submissions
    if (lobby.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const submissions = await Submission.find({ lobby: req.params.lobbyId })
      .populate('user', 'username')
      .populate('problem', 'title')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: submissions.length,
      data: submissions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/submissions/:id
// @desc    Get single submission
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('problem', 'title')
      .populate('user', 'username');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Only owner, lobby teacher, or admin can view
    const isOwner = submission.user._id.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    let isTeacher = false;
    if (submission.lobby) {
      const lobby = await Lobby.findById(submission.lobby);
      isTeacher = lobby && lobby.teacher.toString() === req.user.id;
    }

    if (!isOwner && !isTeacher && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    res.json({
      success: true,
      data: submission
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;
