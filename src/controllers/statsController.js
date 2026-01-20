const UserStats = require('../models/userStatsModel');
const GameSession = require('../models/gameSessionModel');
const DailyProgress = require('../models/dailyProgressModel');
const { Op } = require('sequelize');

// ====================
// OBTENER ESTADÍSTICAS DEL USUARIO
// ====================
exports.getUserStats = async (req, res) => {
  try {
    const { userId } = req.params;

    // Buscar o crear estadísticas del usuario
    let stats = await UserStats.findOne({ where: { userId } });

    if (!stats) {
      // Crear estadísticas iniciales si no existen
      stats = await UserStats.create({
        userId,
        totalGames: 0,
        totalScore: 0,
        totalTime: 0,
        currentStreak: 0,
        bestStreak: 0,
        gamesPerCategory: {},
        scoresPerCategory: {},
        achievements: []
      });
    }

    // Obtener progreso diario de los últimos 30 días
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyProgress = await DailyProgress.findAll({
      where: {
        userId,
        date: {
          [Op.gte]: thirtyDaysAgo
        }
      },
      order: [['date', 'ASC']]
    });

    // Calcular promedio de puntuación
    const averageScore = stats.totalGames > 0 
      ? Math.round(stats.totalScore / stats.totalGames) 
      : 0;

    // Parsear campos JSON
    let scoresPerCategory = stats.scoresPerCategory;
    if (typeof scoresPerCategory === 'string') {
      scoresPerCategory = JSON.parse(scoresPerCategory);
    }
    if (!scoresPerCategory || typeof scoresPerCategory !== 'object') {
      scoresPerCategory = {};
    }

    let gamesPerCategory = stats.gamesPerCategory;
    if (typeof gamesPerCategory === 'string') {
      gamesPerCategory = JSON.parse(gamesPerCategory);
    }
    if (!gamesPerCategory || typeof gamesPerCategory !== 'object') {
      gamesPerCategory = {};
    }

    let achievements = stats.achievements;
    if (typeof achievements === 'string') {
      achievements = JSON.parse(achievements);
    }
    if (!Array.isArray(achievements)) {
      achievements = [];
    }

    // Calcular áreas fuertes y débiles
    const sorted = Object.entries(scoresPerCategory).sort((a, b) => b[1] - a[1]);
    const strongAreas = sorted.slice(0, 2).map(([area]) => area);
    const weakAreas = sorted.slice(-2).map(([area]) => area);

    // Responder con todos los datos
    res.json({
      userId: stats.userId,
      totalGames: stats.totalGames,
      totalScore: stats.totalScore,
      averageScore,
      totalTime: stats.totalTime,
      currentStreak: stats.currentStreak,
      bestStreak: stats.bestStreak,
      gamesPerCategory,
      scoresPerCategory,
      dailyProgress: dailyProgress.map(dp => ({
        date: dp.date,
        score: dp.score,
        gamesPlayed: dp.gamesPlayed
      })),
      achievements,
      strongAreas,
      weakAreas
    });

  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({ 
      error: 'Error al obtener estadísticas del usuario',
      details: error.message 
    });
  }
};

// ====================
// GUARDAR SESIÓN DE JUEGO
// ====================
exports.saveGameSession = async (req, res) => {
  try {
    const {
      userId,
      gameId,
      gameName,
      category,
      score,
      timePlayed,
      level,
      correctAnswers,
      wrongAnswers
    } = req.body;

    // Validaciones
    if (!userId || !gameId || !gameName || !category || score === undefined) {
      return res.status(400).json({ 
        error: 'Faltan datos requeridos',
        required: ['userId', 'gameId', 'gameName', 'category', 'score']
      });
    }

    // Validar categoría
    const validCategories = ['Aritmética', 'Álgebra', 'Geometría'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ 
        error: 'Categoría inválida',
        validCategories 
      });
    }

    // Calcular precisión
    const totalAnswers = (correctAnswers || 0) + (wrongAnswers || 0);
    const accuracy = totalAnswers > 0 
      ? Math.round((correctAnswers / totalAnswers) * 100) 
      : 0;

    // Guardar sesión de juego
    const session = await GameSession.create({
      userId,
      gameId,
      gameName,
      category,
      score,
      timePlayed: timePlayed || 0,
      level: level || 1,
      correctAnswers: correctAnswers || 0,
      wrongAnswers: wrongAnswers || 0,
      accuracy
    });

    // Actualizar estadísticas del usuario
    let stats = await UserStats.findOne({ where: { userId } });

    if (!stats) {
      stats = await UserStats.create({ userId });
    }

    // Actualizar totales
    stats.totalGames += 1;
    stats.totalScore += score;
    stats.totalTime += timePlayed || 0;

    // Actualizar juegos por categoría
    let gamesPerCategory = stats.gamesPerCategory;
    
    // IMPORTANTE: Parsear si es string
    if (typeof gamesPerCategory === 'string') {
      gamesPerCategory = JSON.parse(gamesPerCategory);
    }
    if (!gamesPerCategory || typeof gamesPerCategory !== 'object') {
      gamesPerCategory = {};
    }
    
    gamesPerCategory[category] = (gamesPerCategory[category] || 0) + 1;
    stats.gamesPerCategory = gamesPerCategory;

    // Actualizar puntos por juego
    let scoresPerCategory = stats.scoresPerCategory;
    
    // IMPORTANTE: Parsear si es string
    if (typeof scoresPerCategory === 'string') {
      scoresPerCategory = JSON.parse(scoresPerCategory);
    }
    if (!scoresPerCategory || typeof scoresPerCategory !== 'object') {
      scoresPerCategory = {};
    }
    
    scoresPerCategory[gameName] = (scoresPerCategory[gameName] || 0) + score;
    stats.scoresPerCategory = scoresPerCategory;

    // Actualizar progreso diario
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    let dailyProgress = await DailyProgress.findOne({
      where: { userId, date: today }
    });

    if (dailyProgress) {
      dailyProgress.score += score;
      dailyProgress.gamesPlayed += 1;
      await dailyProgress.save();
    } else {
      await DailyProgress.create({
        userId,
        date: today,
        score,
        gamesPlayed: 1
      });
    }

    // Actualizar racha
    const lastPlayedDate = stats.lastPlayedDate;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (!lastPlayedDate) {
      // Primera vez que juega
      stats.currentStreak = 1;
      stats.bestStreak = 1;
    } else if (lastPlayedDate === yesterdayStr) {
      // Continuó la racha
      stats.currentStreak += 1;
      if (stats.currentStreak > stats.bestStreak) {
        stats.bestStreak = stats.currentStreak;
      }
    } else if (lastPlayedDate !== today) {
      // Rompió la racha
      stats.currentStreak = 1;
    }
    // Si lastPlayedDate === today, no cambiar la racha

    stats.lastPlayedDate = today;

    // Verificar y desbloquear logros
    const newAchievements = checkAchievements(stats);
    if (newAchievements.length > 0) {
      let achievements = stats.achievements;
      
      // IMPORTANTE: Parsear si es string
      if (typeof achievements === 'string') {
        achievements = JSON.parse(achievements);
      }
      if (!Array.isArray(achievements)) {
        achievements = [];
      }
      
      achievements.push(...newAchievements);
      stats.achievements = achievements;
    }

    await stats.save();

    res.status(201).json({
      message: 'Partida guardada exitosamente',
      session: {
        id: session.id,
        score: session.score,
        accuracy: session.accuracy
      },
      stats: {
        totalGames: stats.totalGames,
        totalScore: stats.totalScore,
        currentStreak: stats.currentStreak
      },
      newAchievements: newAchievements.map(a => a.name)
    });

  } catch (error) {
    console.error('Error saving game session:', error);
    res.status(500).json({ 
      error: 'Error al guardar la sesión de juego',
      details: error.message 
    });
  }
};

// ====================
// OBTENER HISTORIAL DE PARTIDAS
// ====================
exports.getGameHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, page = 1, gameId } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Construir filtros
    const where = { userId };
    if (gameId) {
      where.gameId = parseInt(gameId);
    }

    // Obtener sesiones
    const { count, rows: sessions } = await GameSession.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      sessions: sessions.map(s => ({
        id: s.id,
        gameId: s.gameId,
        gameName: s.gameName,
        category: s.category,
        score: s.score,
        timePlayed: s.timePlayed,
        level: s.level,
        accuracy: s.accuracy,
        playedAt: s.createdAt
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error getting game history:', error);
    res.status(500).json({ 
      error: 'Error al obtener historial de partidas',
      details: error.message 
    });
  }
};

// ====================
// OBTENER RANKINGS GLOBALES
// ====================
exports.getLeaderboard = async (req, res) => {
  try {
    const { limit = 10, category } = req.query;

    let where = {};
    
    // Filtrar por categoría si se especifica
    if (category) {
      where = {
        scoresPerCategory: {
          [Op.like]: `%"${category}"%`
        }
      };
    }

    const topPlayers = await UserStats.findAll({
      where,
      order: [['totalScore', 'DESC']],
      limit: parseInt(limit),
      attributes: ['userId', 'totalScore', 'totalGames', 'bestStreak']
    });

    res.json({
      leaderboard: topPlayers.map((player, index) => ({
        rank: index + 1,
        userId: player.userId,
        totalScore: player.totalScore,
        totalGames: player.totalGames,
        bestStreak: player.bestStreak,
        averageScore: player.totalGames > 0 
          ? Math.round(player.totalScore / player.totalGames) 
          : 0
      }))
    });

  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({ 
      error: 'Error al obtener ranking',
      details: error.message 
    });
  }
};

// ====================
// FUNCIÓN AUXILIAR: Verificar y desbloquear logros
// ====================
function checkAchievements(stats) {
  const newAchievements = [];
  
  // Parsear achievements si es string
  let existingAchievements = stats.achievements;
  if (typeof existingAchievements === 'string') {
    existingAchievements = JSON.parse(existingAchievements);
  }
  if (!Array.isArray(existingAchievements)) {
    existingAchievements = [];
  }
  
  const existingAchievementNames = existingAchievements.map(a => a.name);

  const achievements = [
    {
      name: 'Primera Partida',
      condition: stats.totalGames === 1,
      icon: '🎮'
    },
    {
      name: 'Jugador Dedicado',
      condition: stats.totalGames === 10,
      icon: '🎯'
    },
    {
      name: 'Centurión',
      condition: stats.totalGames === 100,
      icon: '💯'
    },
    {
      name: 'Racha de 5',
      condition: stats.currentStreak >= 5,
      icon: '🔥'
    },
    {
      name: 'Racha de 10',
      condition: stats.currentStreak >= 10,
      icon: '🔥🔥'
    },
    {
      name: 'Racha de 30',
      condition: stats.currentStreak >= 30,
      icon: '🔥🔥🔥'
    },
    {
      name: 'Mil Puntos',
      condition: stats.totalScore >= 1000,
      icon: '⭐'
    },
    {
      name: 'Diez Mil Puntos',
      condition: stats.totalScore >= 10000,
      icon: '⭐⭐'
    },
    {
      name: 'Maestro Matemático',
      condition: stats.totalScore >= 50000,
      icon: '🏆'
    },
    {
      name: 'Maratonista',
      condition: stats.totalTime >= 3600, // 1 hora
      icon: '⏱️'
    }
  ];

  achievements.forEach(achievement => {
    if (achievement.condition && !existingAchievementNames.includes(achievement.name)) {
      newAchievements.push({
        name: achievement.name,
        icon: achievement.icon,
        unlockedAt: new Date().toISOString()
      });
    }
  });

  return newAchievements;
}

// ====================
// RESETEAR ESTADÍSTICAS (para testing)
// ====================
exports.resetUserStats = async (req, res) => {
  try {
    const { userId } = req.params;

    await UserStats.destroy({ where: { userId } });
    await GameSession.destroy({ where: { userId } });
    await DailyProgress.destroy({ where: { userId } });

    res.json({ 
      message: 'Estadísticas reseteadas exitosamente',
      userId 
    });

  } catch (error) {
    console.error('Error resetting user stats:', error);
    res.status(500).json({ 
      error: 'Error al resetear estadísticas',
      details: error.message 
    });
  }
};