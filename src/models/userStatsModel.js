const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserStats = sequelize.define('UserStats', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: 'ID único del usuario (puede ser temporal desde frontend)'
  },
  totalGames: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Total de partidas jugadas'
  },
  totalScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Puntuación total acumulada'
  },
  totalTime: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Tiempo total jugado en segundos'
  },
  currentStreak: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Racha actual de días consecutivos'
  },
  bestStreak: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Mejor racha de días consecutivos'
  },
  lastPlayedDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Última fecha que jugó (formato YYYY-MM-DD)'
  },
  gamesPerCategory: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Conteo de juegos por categoría: {Aritmética: 10, Álgebra: 5}'
  },
  scoresPerCategory: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Puntos acumulados por juego: {Suma: 1200, Resta: 800}'
  },
  achievements: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Lista de logros: [{name: "Primera Partida", unlockedAt: "2024-01-20"}]'
  }
}, {
  tableName: 'user_stats',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId']
    }
  ]
});

module.exports = UserStats;