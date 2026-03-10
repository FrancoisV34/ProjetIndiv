const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'taskflow_db',
  process.env.DB_USER || 'taskflow',
  process.env.DB_PASSWORD || 'taskflow_password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
  }
);

async function connectDB() {
  await sequelize.authenticate();
  console.log('MySQL connected');
  await sequelize.sync({ alter: true });
  console.log('Tables synchronized');
}

module.exports = { sequelize, connectDB };
