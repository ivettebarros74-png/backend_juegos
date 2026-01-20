const Game = require('../models/gameModel');

// Obtener todos los juegos
exports.getAllGames = async (req, res) => {
  try {
    const games = await Game.findAll({
      where: { isActive: true },
      order: [['players', 'DESC']]
    });
    res.json(games);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener juegos', error: error.message });
  }
};

// Obtener un juego por ID
exports.getGameById = async (req, res) => {
  try {
    const game = await Game.findByPk(req.params.id);
    if (!game) {
      return res.status(404).json({ message: 'Juego no encontrado' });
    }
    res.json(game);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener juego', error: error.message });
  }
};

// Crear un nuevo juego
exports.createGame = async (req, res) => {
  try {
    const game = await Game.create(req.body);
    res.status(201).json(game);
  } catch (error) {
    res.status(400).json({ message: 'Error al crear juego', error: error.message });
  }
};

// Actualizar un juego
exports.updateGame = async (req, res) => {
  try {
    const game = await Game.findByPk(req.params.id);
    if (!game) {
      return res.status(404).json({ message: 'Juego no encontrado' });
    }
    await game.update(req.body);
    res.json(game);
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar juego', error: error.message });
  }
};

// Eliminar un juego (soft delete)
exports.deleteGame = async (req, res) => {
  try {
    const game = await Game.findByPk(req.params.id);
    if (!game) {
      return res.status(404).json({ message: 'Juego no encontrado' });
    }
    await game.update({ isActive: false });
    res.json({ message: 'Juego eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar juego', error: error.message });
  }
};

// Incrementar contador de jugadores
exports.incrementPlayers = async (req, res) => {
  try {
    const game = await Game.findByPk(req.params.id);
    if (!game) {
      return res.status(404).json({ message: 'Juego no encontrado' });
    }
    await game.increment('players');
    res.json(game);
  } catch (error) {
    res.status(500).json({ message: 'Error al incrementar jugadores', error: error.message });
  }
};