const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

// Obtener estadísticas del usuario
router.get('stats/user/:userId', statsController.getUserStats);

// Guardar sesión de juego
router.post('stats/session', statsController.saveGameSession);

// Obtener historial de partidas
router.get('stats/history/:userId', statsController.getGameHistory);

// Obtener ranking global
router.get('stats/leaderboard', statsController.getLeaderboard);

// Resetear estadísticas (solo para desarrollo/testing)
router.delete('stats/reset/:userId', statsController.resetUserStats);

module.exports = router;
