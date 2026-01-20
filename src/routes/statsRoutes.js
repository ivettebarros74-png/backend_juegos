const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

// Obtener estadísticas del usuario
router.get('/user/:userId', statsController.getUserStats);

// Guardar sesión de juego
router.post('/session', statsController.saveGameSession);

// Obtener historial de partidas
router.get('/history/:userId', statsController.getGameHistory);

// Obtener ranking global
router.get('/leaderboard', statsController.getLeaderboard);

// Resetear estadísticas (solo para desarrollo/testing)
router.delete('/reset/:userId', statsController.resetUserStats);

module.exports = router;