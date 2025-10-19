const express = require('express');
const router = express.Router();
const Player = require('../models/Player');

// Get leaderboard
router.get('/', async (req, res) => {
  try {
    const players = await Player.find({
      $expr: { $gt: [{ $add: ['$wins', '$losses', '$draws'] }, 0] }
    })
    .select('username wins losses draws')
    .lean();

    const leaderboard = players.map(player => {
      const totalGames = player.wins + player.losses + player.draws;
      const winPercentage = totalGames > 0 ? 
        Math.round((player.wins / totalGames) * 100 * 100) / 100 : 0;
      
      return {
        username: player.username,
        wins: player.wins,
        losses: player.losses,
        draws: player.draws,
        total_games: totalGames,
        win_percentage: winPercentage
      };
    })
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.win_percentage - a.win_percentage;
    })
    .slice(0, 10);

    res.json({ success: true, leaderboard });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({ success: false, error: 'Failed to get leaderboard' });
  }
});

// Get player stats
router.get('/player/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const player = await Player.findOne({ username });
    
    if (!player) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }
    
    const totalGames = player.wins + player.losses + player.draws;
    const winPercentage = totalGames > 0 ? 
      Math.round((player.wins / totalGames) * 100 * 100) / 100 : 0;
    
    res.json({
      success: true,
      player: {
        username: player.username,
        wins: player.wins,
        losses: player.losses,
        draws: player.draws,
        totalGames,
        winPercentage
      }
    });
  } catch (error) {
    console.error('Error getting player stats:', error);
    res.status(500).json({ success: false, error: 'Failed to get player stats' });
  }
});

module.exports = router;
