const express = require('express');
const cors = require('cors');
require('dotenv').config();

const sequelize = require('./config/database');
const gameRoutes = require('./routes/gameRoutes');
const statsRoutes = require('./routes/statsRoutes');
const errorHandler = require('./middleware/errorHandler');

// Importar TODOS los modelos
const Game = require('./models/gameModel');
const UserStats = require('./models/userStatsModel');
const GameSession = require('./models/gameSessionModel');
const DailyProgress = require('./models/dailyProgressModel');

const app = express();
const PORT = process.env.PORT || 3000;

// Obtener orígenes permitidos y normalizar (quitar / al final)
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim().replace(/\/$/, ''))
  : ['http://localhost:5173', 'http://localhost:3000'];

console.log('📍 Orígenes CORS permitidos:', allowedOrigins);

// Middleware CORS configurado correctamente
app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (Postman, curl, apps móviles)
    if (!origin) return callback(null, true);
    
    // Normalizar el origin (quitar / al final si existe)
    const normalizedOrigin = origin.replace(/\/$/, '');
    
    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }
    
    const msg = `CORS: Origen ${origin} no permitido`;
    console.warn(msg);
    console.warn(`Orígenes válidos: ${allowedOrigins.join(', ')}`);
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas


// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ 
    message: 'API de juegos funcionando correctamente',
    version: '1.0.0',
    allowedOrigins: allowedOrigins,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Middleware de manejo de errores
app.use(errorHandler);

// Sincronizar base de datos y iniciar servidor
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente');

    // Solo en desarrollo, usar alter
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      console.log('✅ Tablas sincronizadas (modo desarrollo)');
    } else {
      // En producción, solo verificar que existan las tablas
      console.log('✅ Usando tablas existentes (modo producción)');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
      console.log(`📍 Orígenes CORS permitidos:`);
      allowedOrigins.forEach(origin => console.log(`   - ${origin}`));
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
