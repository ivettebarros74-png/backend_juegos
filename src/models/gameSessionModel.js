const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GameSession = sequelize.define('GameSession', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'ID del usuario que jugó'
  },
  gameId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID del juego (1=Suma, 2=Multiplicación, etc.)'
  },
  gameName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Nombre del juego'
  },
  category: {
    type: DataTypes.ENUM('Aritmética', 'Álgebra', 'Geometría'),
    allowNull: false,
    comment: 'Categoría del juego'
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Puntuación obtenida en la partida'
  },
  timePlayed: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Tiempo jugado en segundos'
  },
  level: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: 'Nivel alcanzado en la partida'
  },
  correctAnswers: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Respuestas correctas'
  },
  wrongAnswers: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Respuestas incorrectas'
  },
  accuracy: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    comment: 'Precisión en porcentaje (0-100)'
  }
}, {
  tableName: 'game_sessions',
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['gameId']
    },
    {
      fields: ['createdAt']
    }
  ]
});

module.exports = GameSession;