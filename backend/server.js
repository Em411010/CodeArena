import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars FIRST before importing passport (which needs env vars)
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import connectDB from './config/db.js';
import passport from './config/passport.js';
import { startMatchScheduler } from './utils/matchScheduler.js';
import { startQuizBeeScheduler } from './utils/quizBeeScheduler.js';

// Route imports
import authRoutes from './routes/auth.js';
import oauthRoutes from './routes/oauth.js';
import userRoutes from './routes/users.js';
import sampleProblemRoutes from './routes/sampleProblems.js';
import competitionProblemRoutes from './routes/competitionProblems.js';
import lobbyRoutes from './routes/lobbies.js';
import submissionRoutes from './routes/submissions.js';

// Connect to database
connectDB();

const app = express();
const httpServer = createServer(app);

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.FRONTEND_URL // Will be set in production
].filter(Boolean);

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io accessible to routes
app.set('io', io);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (same-origin requests, mobile apps, Postman)
    if (!origin) return callback(null, true);
    
    // In production, allow requests from same domain
    if (process.env.NODE_ENV === 'production') {
      // Allow any origin in production (since frontend is served from same domain)
      return callback(null, true);
    }
    
    // In development, check allowed origins
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS: Origin not in allowedOrigins:', origin);
      callback(null, true); // Allow for now
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(passport.initialize());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', oauthRoutes); // OAuth routes
app.use('/api/users', userRoutes);
app.use('/api/sample-problems', sampleProblemRoutes);
app.use('/api/competition-problems', competitionProblemRoutes);
app.use('/api/lobbies', lobbyRoutes);
app.use('/api/submissions', submissionRoutes);

// Health check (before static files)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CodeArena API is running' });
});

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  const frontendBuildPath = path.join(__dirname, '../frontend/dist');
  console.log('Serving static files from:', frontendBuildPath);
  
  app.use(express.static(frontendBuildPath));
  
  // Handle React Router - send all non-API requests to index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a lobby room
  socket.on('join-lobby', (lobbyId) => {
    socket.join(`lobby-${lobbyId}`);
    console.log(`Socket ${socket.id} joined lobby-${lobbyId}`);
  });

  // Leave a lobby room
  socket.on('leave-lobby', (lobbyId) => {
    socket.leave(`lobby-${lobbyId}`);
    console.log(`Socket ${socket.id} left lobby-${lobbyId}`);
  });

  // Host controls for quiz bee mode
  socket.on('host-next-problem', (data) => {
    io.to(`lobby-${data.lobbyId}`).emit('problem-change', data);
    console.log(`Host advanced to problem ${data.currentProblemIndex + 1} in lobby ${data.lobbyId}`);
  });

  socket.on('host-show-problem', (data) => {
    io.to(`lobby-${data.lobbyId}`).emit('problem-revealed', data);
    console.log(`Host revealed problem ${data.currentProblemIndex + 1} in lobby ${data.lobbyId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Start the match scheduler to auto-end expired matches
  startMatchScheduler(io);
  console.log('Match scheduler started');
  // Start the quiz bee scheduler to handle problem transitions
  startQuizBeeScheduler(io);
  console.log('Quiz bee scheduler started');
});

export { io };
