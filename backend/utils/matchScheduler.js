import Lobby from '../models/Lobby.js';

// Check for expired matches every 30 seconds
export const startMatchScheduler = (io) => {
  setInterval(async () => {
    try {
      const now = new Date();
      
      // Find all ongoing matches that have passed their end time
      const expiredMatches = await Lobby.find({
        status: 'ONGOING',
        endTime: { $lte: now }
      });

      for (const lobby of expiredMatches) {
        // End the match
        lobby.status = 'FINISHED';
        await lobby.save();

        // Emit socket event to all participants
        io.to(`lobby-${lobby._id}`).emit('match-ended', {
          lobbyId: lobby._id.toString(),
          endTime: lobby.endTime,
          reason: 'Time limit reached'
        });

        console.log(`Match ${lobby._id} (${lobby.name}) automatically ended due to time expiration`);
      }
    } catch (error) {
      console.error('Error in match scheduler:', error);
    }
  }, 30000); // Check every 30 seconds
};
