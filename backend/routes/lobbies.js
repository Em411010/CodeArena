import express from 'express';
import { body, validationResult } from 'express-validator';
import Lobby from '../models/Lobby.js';
import CompetitionProblem from '../models/CompetitionProblem.js';
import { protect, authorize, requireApproval } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/lobbies
// @desc    Get lobbies (Teachers see their own, Admin sees all)
// @access  Private/Teacher/Admin
router.get('/', protect, authorize('teacher', 'admin'), requireApproval, async (req, res) => {
  try {
    const filter = {};
    const { status } = req.query;

    if (req.user.role === 'teacher') {
      filter.teacher = req.user.id;
    }

    if (status) {
      filter.status = status;
    }

    const lobbies = await Lobby.find(filter)
      .populate('teacher', 'username email')
      .populate('problems', 'title difficulty')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: lobbies.length,
      data: lobbies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/lobbies/my-matches
// @desc    Get student's participated matches
// @access  Private/Student
router.get('/my-matches', protect, async (req, res) => {
  try {
    const lobbies = await Lobby.find({
      'participants.user': req.user.id
    })
      .populate('teacher', 'username')
      .select('-problems -accessCode')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: lobbies.length,
      data: lobbies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/lobbies/join
// @desc    Join a lobby with access code
// @access  Private/Student
router.post('/join', protect, [
  body('accessCode').trim().notEmpty().withMessage('Access code is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { accessCode } = req.body;

    const lobby = await Lobby.findOne({ 
      accessCode: accessCode.toUpperCase() 
    }).populate('teacher', 'username');

    if (!lobby) {
      return res.status(404).json({
        success: false,
        message: 'Invalid access code'
      });
    }

    // Check if lobby is finished
    if (lobby.status === 'FINISHED') {
      return res.status(400).json({
        success: false,
        message: 'This match has already ended'
      });
    }

    // Check if already a participant
    if (lobby.isParticipant(req.user.id)) {
      return res.json({
        success: true,
        message: 'Already joined this lobby',
        data: {
          _id: lobby._id,
          name: lobby.name,
          status: lobby.status,
          teacher: lobby.teacher,
          participantCount: lobby.participants.length
        }
      });
    }

    // Check if late join is allowed
    if (lobby.status === 'ONGOING' && !lobby.settings.allowLateJoin) {
      return res.status(400).json({
        success: false,
        message: 'This match has already started and late join is not allowed'
      });
    }

    // Check max participants
    if (lobby.participants.length >= lobby.settings.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'This lobby is full'
      });
    }

    // Add participant
    lobby.participants.push({ user: req.user.id });
    await lobby.save();

    // Emit socket event
    const io = req.app.get('io');
    io.to(`lobby-${lobby._id}`).emit('participant-joined', {
      participantCount: lobby.participants.length
    });

    res.json({
      success: true,
      message: 'Successfully joined the lobby',
      data: {
        _id: lobby._id,
        name: lobby.name,
        status: lobby.status,
        teacher: lobby.teacher,
        participantCount: lobby.participants.length
      }
    });
  } catch (error) {
    console.error('Join lobby error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/lobbies/:id
// @desc    Get lobby details
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const lobby = await Lobby.findById(req.params.id)
      .populate('teacher', 'username email')
      .populate('participants.user', 'username');

    if (!lobby) {
      return res.status(404).json({
        success: false,
        message: 'Lobby not found'
      });
    }

    // Access control
    const isTeacher = lobby.teacher._id.toString() === req.user.id;
    const isParticipant = lobby.isParticipant(req.user.id);
    const isAdmin = req.user.role === 'admin';
    const isStudent = req.user.role === 'student';

    // Students can view lobby if it's in WAITING status (to join)
    // Or if they're already participants
    if (!isTeacher && !isParticipant && !isAdmin && !isStudent) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this lobby'
      });
    }

    // Prepare response based on role and status
    let responseData = lobby.toObject();

    // Students can only see problems during ONGOING match
    if (req.user.role === 'student') {
      if (lobby.status !== 'ONGOING') {
        delete responseData.problems;
      } else {
        // Populate problems for ongoing match
        await lobby.populate('problems', 'title difficulty description allowedLanguages constraints inputFormat outputFormat sampleInput sampleOutput timeLimit memoryLimit maxScore');
        responseData = lobby.toObject();
        
        // Remove hidden test cases from problems
        if (responseData.problems) {
          responseData.problems = responseData.problems.map(p => {
            const prob = { ...p };
            delete prob.testCases;
            return prob;
          });
        }
      }
      // Hide access code from students
      delete responseData.accessCode;
    } else {
      await lobby.populate('problems', 'title difficulty maxScore');
      responseData = lobby.toObject();
    }

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Get lobby error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/lobbies
// @desc    Create a new lobby
// @access  Private/Teacher
router.post('/', protect, authorize('teacher', 'admin'), requireApproval, [
  body('name').trim().notEmpty().withMessage('Lobby name is required'),
  body('duration').isInt({ min: 5, max: 480 }).withMessage('Duration must be 5-480 minutes'),
  body('problems').isArray({ min: 1 }).withMessage('At least one problem is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, description, duration, problems, settings } = req.body;

    // Verify all problems exist and belong to the teacher
    const validProblems = await CompetitionProblem.find({
      _id: { $in: problems },
      createdBy: req.user.id
    });

    if (validProblems.length !== problems.length) {
      return res.status(400).json({
        success: false,
        message: 'Some problems are invalid or do not belong to you'
      });
    }

    const lobby = await Lobby.create({
      name,
      description,
      duration,
      problems,
      settings,
      teacher: req.user.id
    });

    await lobby.populate('problems', 'title difficulty');

    res.status(201).json({
      success: true,
      data: lobby
    });
  } catch (error) {
    console.error('Create lobby error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/lobbies/:id/start
// @desc    Start a match
// @access  Private/Teacher (owner)
router.put('/:id/start', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const lobby = await Lobby.findById(req.params.id);

    if (!lobby) {
      return res.status(404).json({
        success: false,
        message: 'Lobby not found'
      });
    }

    // Only owner or admin can start
    if (lobby.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to start this match'
      });
    }

    if (lobby.status !== 'WAITING') {
      return res.status(400).json({
        success: false,
        message: 'Match can only be started from WAITING status'
      });
    }

    // Start the match
    const now = new Date();
    lobby.status = 'ONGOING';
    lobby.startTime = now;
    lobby.endTime = new Date(now.getTime() + lobby.duration * 60000);
    await lobby.save();

    // Populate problems for socket event
    await lobby.populate('problems', 'title difficulty description allowedLanguages constraints inputFormat outputFormat sampleInput sampleOutput timeLimit memoryLimit maxScore');

    // Emit socket event to all participants
    const io = req.app.get('io');
    io.to(`lobby-${lobby._id}`).emit('match-started', {
      lobbyId: lobby._id,
      startTime: lobby.startTime,
      endTime: lobby.endTime,
      problems: lobby.problems.map(p => ({
        _id: p._id,
        title: p.title,
        difficulty: p.difficulty,
        description: p.description,
        allowedLanguages: p.allowedLanguages,
        constraints: p.constraints,
        inputFormat: p.inputFormat,
        outputFormat: p.outputFormat,
        sampleInput: p.sampleInput,
        sampleOutput: p.sampleOutput,
        timeLimit: p.timeLimit,
        memoryLimit: p.memoryLimit,
        maxScore: p.maxScore
      }))
    });

    res.json({
      success: true,
      message: 'Match started',
      data: lobby
    });
  } catch (error) {
    console.error('Start match error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/lobbies/:id/end
// @desc    End a match
// @access  Private/Teacher (owner)
router.put('/:id/end', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const lobby = await Lobby.findById(req.params.id);

    if (!lobby) {
      return res.status(404).json({
        success: false,
        message: 'Lobby not found'
      });
    }

    if (lobby.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to end this match'
      });
    }

    if (lobby.status !== 'ONGOING') {
      return res.status(400).json({
        success: false,
        message: 'Match is not ongoing'
      });
    }

    lobby.status = 'FINISHED';
    lobby.endTime = new Date();
    await lobby.save();

    // Emit socket event
    const io = req.app.get('io');
    io.to(`lobby-${lobby._id}`).emit('match-ended', {
      lobbyId: lobby._id,
      endTime: lobby.endTime
    });

    res.json({
      success: true,
      message: 'Match ended',
      data: lobby
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/lobbies/:id/leaderboard
// @desc    Get lobby leaderboard
// @access  Private (participants and teacher)
router.get('/:id/leaderboard', protect, async (req, res) => {
  try {
    const lobby = await Lobby.findById(req.params.id)
      .populate('participants.user', 'username')
      .populate('teacher', 'username');

    if (!lobby) {
      return res.status(404).json({
        success: false,
        message: 'Lobby not found'
      });
    }

    // Check access
    const isTeacher = lobby.teacher._id.toString() === req.user.id;
    const isParticipant = lobby.isParticipant(req.user.id);
    const isAdmin = req.user.role === 'admin';

    if (!isTeacher && !isParticipant && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view leaderboard'
      });
    }

    // Check if leaderboard is enabled
    if (!lobby.settings.showLeaderboard && !isTeacher && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Leaderboard is hidden for this match'
      });
    }

    // Sort participants by score
    const leaderboard = lobby.participants
      .map(p => ({
        user: p.user,
        score: p.score,
        solvedCount: p.solvedProblems.length,
        joinedAt: p.joinedAt
      }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.solvedCount - a.solvedCount;
      })
      .map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));

    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/lobbies/:id
// @desc    Delete a lobby
// @access  Private/Teacher (owner) or Admin
router.delete('/:id', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const lobby = await Lobby.findById(req.params.id);

    if (!lobby) {
      return res.status(404).json({
        success: false,
        message: 'Lobby not found'
      });
    }

    if (lobby.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (lobby.status === 'ONGOING') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an ongoing match'
      });
    }

    await lobby.deleteOne();

    res.json({
      success: true,
      message: 'Lobby deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;
