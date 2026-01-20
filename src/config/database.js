const { Sequelize } = require('sequelize');
require('dotenv').config();

// Determinar el dialecto (postgres en producción, mysql en desarrollo)
const dialect = process.env.DB_DIALECT || 'mysql';

const sequelize = new Sequelize(
  process.env.DB_NAME || process.env.DATABASE_URL,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || (dialect === 'postgres' ? 5432 : 3306),
    dialect: dialect,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: process.env.NODE_ENV === 'production' && dialect === 'postgres' ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {}
  }
);

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log(`✅ Conexión a la base de datos ${dialect} exitosa`);
  } catch (error) {
    console.error('❌ Error al conectar a la base de datos:', error);
  }
};

testConnection();

module.exports = sequelize;