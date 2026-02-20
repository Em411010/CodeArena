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
          matchType: lobby.matchType,
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
      lobbyId: lobby._id.toString(),
      userId: req.user.id,
      username: req.user.username,
      participantCount: lobby.participants.length
    });

    res.json({
      success: true,
      message: 'Successfully joined the lobby',
      data: {
        _id: lobby._id,
        name: lobby.name,
        status: lobby.status,
        matchType: lobby.matchType,
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
      await lobby.populate('problems', 'title difficulty description allowedLanguages constraints inputFormat outputFormat sampleInput sampleOutput timeLimit memoryLimit maxScore');
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
  body('problems').isArray({ min: 1 }).withMessage('At least one problem is required'),
  body('matchType').optional().isIn(['STANDARD', 'QUIZ_BEE']).withMessage('Invalid match type'),
  body('timePerProblem').optional().isInt({ min: 1, max: 30 }).withMessage('Time per problem must be 1-30 minutes')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, description, duration, problems, settings, matchType, timePerProblem } = req.body;

    // Validate quiz bee specific requirements
    if (matchType === 'QUIZ_BEE') {
      if (!timePerProblem) {
        return res.status(400).json({
          success: false,
          message: 'Time per problem is required for Quiz Bee mode'
        });
      }
      
      // Check if total time matches duration
      const totalTime = timePerProblem * problems.length;
      if (totalTime > duration) {
        return res.status(400).json({
          success: false,
          message: `Total time for all problems (${totalTime} min) exceeds match duration (${duration} min)`
        });
      }
    }

    // Verify all problems exist and are accessible (own problems or shared problems)
    const validProblems = await CompetitionProblem.find({
      _id: { $in: problems },
      $or: [
        { createdBy: req.user.id },
        { isShared: true }
      ]
    });

    if (validProblems.length !== problems.length) {
      return res.status(400).json({
        success: false,
        message: 'Some problems are invalid or not accessible to you'
      });
    }

    const lobbyData = {
      name,
      description,
      duration,
      problems,
      settings,
      teacher: req.user.id,
      matchType: matchType || 'STANDARD'
    };
    
    if (matchType === 'QUIZ_BEE') {
      lobbyData.timePerProblem = timePerProblem;
    }

    const lobby = await Lobby.create(lobbyData);

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
    
    // For QUIZ_BEE mode, initialize problem tracking but don't reveal yet
    if (lobby.matchType === 'QUIZ_BEE') {
      lobby.currentProblemIndex = 0;
      // Don't set problemStartTime - host must reveal the first problem manually
      lobby.problemStartTime = null;
    }
    
    await lobby.save();
    
    // Verify saved state
    const savedLobby = await Lobby.findById(lobby._id);
    console.log(`[start-match] Lobby ${lobby._id}: matchType=${savedLobby.matchType}, problemStartTime=${savedLobby.problemStartTime}, timePerProblem=${savedLobby.timePerProblem}, duration=${savedLobby.duration}`);

    // Populate problems for socket event
    await lobby.populate('problems', 'title difficulty description allowedLanguages constraints inputFormat outputFormat sampleInput sampleOutput timeLimit memoryLimit maxScore');

    // Emit socket event to all participants
    const io = req.app.get('io');
    const eventData = {
      lobbyId: lobby._id.toString(),
      startTime: lobby.startTime,
      endTime: lobby.endTime,
      matchType: lobby.matchType,
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
    };
    
    // Add quiz bee specific data
    if (lobby.matchType === 'QUIZ_BEE') {
      eventData.currentProblemIndex = lobby.currentProblemIndex;
      eventData.timePerProblem = lobby.timePerProblem;
      eventData.problemStartTime = lobby.problemStartTime;
    }
    
    io.to(`lobby-${lobby._id}`).emit('match-started', eventData);

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
      lobbyId: lobby._id.toString(),
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

    // Debug logging
    console.log('=== Leaderboard Access Debug ===');
    console.log('User ID:', req.user.id);
    console.log('Teacher ID:', lobby.teacher._id.toString());
    console.log('Is Teacher:', isTeacher);
    console.log('Is Participant:', isParticipant);
    console.log('Is Admin:', isAdmin);
    console.log('Participants:', lobby.participants.map(p => ({
      userId: p.user?._id?.toString() || p.user?.toString() || p.user,
      username: p.user?.username
    })));
    console.log('===============================');

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

// @route   PUT /api/lobbies/:id/next-problem
// @desc    Advance to next problem in Quiz Bee mode (Host control)
// @access  Private/Teacher (owner) or Admin
router.put('/:id/next-problem', protect, authorize('teacher', 'admin'), async (req, res) => {
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

    if (lobby.matchType !== 'QUIZ_BEE') {
      return res.status(400).json({
        success: false,
        message: 'This endpoint is only for Quiz Bee matches'
      });
    }

    if (lobby.status !== 'ONGOING') {
      return res.status(400).json({
        success: false,
        message: 'Match is not ongoing'
      });
    }

    const nextIndex = lobby.currentProblemIndex + 1;

    if (nextIndex >= lobby.problems.length) {
      return res.status(400).json({
        success: false,
        message: 'No more problems available'
      });
    }

    // Advance to next problem - but don't reveal it yet
    lobby.currentProblemIndex = nextIndex;
    lobby.problemStartTime = null; // Host must click "Reveal" for each problem
    await lobby.save();
    
    console.log(`[next-problem] Lobby ${lobby._id}: advanced to problem ${nextIndex}, problemStartTime=${lobby.problemStartTime}`);

    // Get populated lobby data
    const populatedLobby = await Lobby.findById(lobby._id).populate('problems');

    // Emit socket event to all participants
    const io = req.app.get('io');
    io.to(`lobby-${lobby._id}`).emit('problem-change', {
      lobbyId: lobby._id.toString(),
      currentProblemIndex: nextIndex,
      problemId: lobby.problems[nextIndex],
      timePerProblem: lobby.timePerProblem,
      totalProblems: lobby.problems.length,
      problemRevealed: false // Problem not revealed yet
    });

    res.json({
      success: true,
      message: `Advanced to problem ${nextIndex + 1}/${lobby.problems.length}`,
      data: {
        currentProblemIndex: nextIndex,
        problemStartTime: lobby.problemStartTime
      }
    });
  } catch (error) {
    console.error('Error advancing problem:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/lobbies/:id/reveal-problem
// @desc    Reveal current problem to participants (Host control)
// @access  Private/Teacher (owner) or Admin
router.put('/:id/reveal-problem', protect, authorize('teacher', 'admin'), async (req, res) => {
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

    if (lobby.matchType !== 'QUIZ_BEE') {
      return res.status(400).json({
        success: false,
        message: 'This endpoint is only for Quiz Bee matches'
      });
    }

    if (lobby.status !== 'ONGOING') {
      return res.status(400).json({
        success: false,
        message: 'Match is not ongoing'
      });
    }

    // Start timer for current problem if not already started
    if (!lobby.problemStartTime) {
      lobby.problemStartTime = new Date();
      await lobby.save();
    }

    console.log(`[reveal-problem] Lobby ${lobby._id}: timePerProblem=${lobby.timePerProblem}, problemStartTime=${lobby.problemStartTime}`);

    // Emit socket event to reveal problem
    const io = req.app.get('io');
    io.to(`lobby-${lobby._id}`).emit('problem-revealed', {
      lobbyId: lobby._id.toString(),
      currentProblemIndex: lobby.currentProblemIndex,
      problemId: lobby.problems[lobby.currentProblemIndex],
      timePerProblem: lobby.timePerProblem,
      totalProblems: lobby.problems.length,
      problemStartTime: lobby.problemStartTime
    });

    res.json({
      success: true,
      message: 'Problem revealed to participants',
      data: {
        currentProblemIndex: lobby.currentProblemIndex,
        problemStartTime: lobby.problemStartTime
      }
    });
  } catch (error) {
    console.error('Error revealing problem:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;
