import Lobby from '../models/Lobby.js';

// Check for quiz bee problem transitions every 10 seconds
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
          const nextIndex = lobby.currentProblemIndex + 1;

          // Check if there are more problems
          if (nextIndex < lobby.problems.length) {
            // Move to next problem
            lobby.currentProblemIndex = nextIndex;
            lobby.problemStartTime = now;
            await lobby.save();

            // Emit socket event to all participants
            io.to(`lobby-${lobby._id}`).emit('problem-change', {
              lobbyId: lobby._id,
              currentProblemIndex: nextIndex,
              problemId: lobby.problems[nextIndex],
              timePerProblem: lobby.timePerProblem,
              totalProblems: lobby.problems.length
            });

            console.log(`Quiz Bee ${lobby._id}: Advanced to problem ${nextIndex + 1}/${lobby.problems.length}`);
          } else {
            // All problems completed, end the match
            lobby.status = 'FINISHED';
            lobby.endTime = now;
            await lobby.save();

            io.to(`lobby-${lobby._id}`).emit('match-ended', {
              lobbyId: lobby._id,
              endTime: now,
              reason: 'All problems completed'
            });

            console.log(`Quiz Bee ${lobby._id} (${lobby.name}) automatically ended - all problems completed`);
          }
        }
      }
    } catch (error) {
      console.error('Error in quiz bee scheduler:', error);
    }
  }, 10000); // Check every 10 seconds
};
