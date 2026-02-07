import Lobby from '../models/Lobby.js';

// Check for quiz bee problem time tracking every 10 seconds
// NOTE: In quiz bee mode, the host manually controls problem progression
// This scheduler only notifies the host when time is up for a problem
export const startQuizBeeScheduler = (io) => {
  setInterval(async () => {
    try {
      const now = new Date();
      
      // Find all ongoing quiz bee matches
      const quizBeeMatches = await Lobby.find({
        status: 'ONGOING',
        matchType: 'QUIZ_BEE',
        problemStartTime: { $exists: true }
      });

      for (const lobby of quizBeeMatches) {
        const timeSinceStart = (now - new Date(lobby.problemStartTime)) / 1000 / 60; // in minutes
        const timePerProblem = lobby.timePerProblem;

        // Check if time for current problem has expired
        if (timeSinceStart >= timePerProblem) {
          // Notify host that time is up (but don't auto-advance)
          // Host will manually advance to next problem
          io.to(`lobby-${lobby._id}`).emit('problem-time-expired', {
            lobbyId: lobby._id,
            currentProblemIndex: lobby.currentProblemIndex,
            message: 'Time is up for current problem. Host can advance to next problem.'
          });

          console.log(`Quiz Bee ${lobby._id}: Time expired for problem ${lobby.currentProblemIndex + 1}. Waiting for host to advance.`);
          
          // Update the problemStartTime to prevent repeated notifications
          // Add 1 hour to the time so it won't trigger again until host advances
          lobby.problemStartTime = new Date(now.getTime() + 60 * 60 * 1000);
          await lobby.save();
        }
        
        // Check if all problems completed (when host has advanced through all)
        if (lobby.currentProblemIndex >= lobby.problems.length) {
          lobby.status = 'FINISHED';
          lobby.endTime = now;
          await lobby.save();

          io.to(`lobby-${lobby._id}`).emit('match-ended', {
            lobbyId: lobby._id,
            endTime: now,
            reason: 'All problems completed'
          });

          console.log(`Quiz Bee ${lobby._id} (${lobby.name}) ended - all problems completed`);
        }
      }
    } catch (error) {
      console.error('Error in quiz bee scheduler:', error);
    }
  }, 10000); // Check every 10 seconds
};
