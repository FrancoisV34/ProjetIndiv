const { Sequelize } = require('sequelize');

// Base de données SQLite in-memory pour les tests
const sequelize = new Sequelize('sqlite::memory:', { logging: false });

module.exports = { sequelize };
