const express = require('express');
const cors = require('cors');
require('dotenv').config();

const sequelize = require('./config/database');
const gameRoutes = require('./routes/gameRoutes');
const statsRoutes = require('./routes/statsRoutes'); // NUEVA LÍNEA
const errorHandler = require('./middleware/errorHandler');

// Importar TODOS los modelos
const Game = require('./models/gameModel');
const UserStats = require('./models/userStatsModel');
const GameSession = require('./models/gameSessionModel');
const DailyProgress = require('./models/dailyProgressModel');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/games', gameRoutes);
app.use('/api/stats', statsRoutes); // NUEVA LÍNEA

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API de juegos funcionando correctamente' });
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
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
