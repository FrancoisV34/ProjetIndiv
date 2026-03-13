const User = require('./user.model');
const Category = require('./category.model');
const Task = require('./task.model');

// Associations
User.hasMany(Category, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Category.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Task, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Task.belongsTo(User, { foreignKey: 'user_id' });

Category.hasMany(Task, { foreignKey: 'category_id', onDelete: 'SET NULL' });
Task.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

module.exports = { User, Category, Task };
