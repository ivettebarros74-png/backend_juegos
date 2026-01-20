const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DailyProgress = sequelize.define('DailyProgress', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'ID del usuario'
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Fecha del progreso (YYYY-MM-DD)'
  },
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Puntos obtenidos ese día'
  },
  gamesPlayed: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Partidas jugadas ese día'
  }
}, {
  tableName: 'daily_progress',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'date']
    },
    {
      fields: ['userId']
    },
    {
      fields: ['date']
    }
  ]
});

module.exports = DailyProgress;