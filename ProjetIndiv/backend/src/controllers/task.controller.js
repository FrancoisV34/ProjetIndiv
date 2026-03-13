const { Op } = require('sequelize');
const { Task, Category } = require('../models/index');

async function list(req, res, next) {
  try {
    const { status, category_id, search, page = 1, limit = 20 } = req.query;

    const where = { user_id: req.userId };

    if (status) where.status = status;
    if (category_id) where.category_id = category_id;
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Task.findAndCountAll({
      where,
      include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'color'] }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { title, description, status, priority, due_date, category_id } = req.body;

    if (category_id) {
      const cat = await Category.findOne({ where: { id: category_id, user_id: req.userId } });
      if (!cat) return res.status(400).json({ error: 'Categorie invalide' });
    }

    const task = await Task.create({
      title: title.trim(),
      description: description || null,
      status: status || 'todo',
      priority: priority || 'medium',
      due_date: due_date || null,
      user_id: req.userId,
      category_id: category_id || null,
    });

    const taskWithCategory = await Task.findByPk(task.id, {
      include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'color'] }],
    });

    res.status(201).json(taskWithCategory);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const task = await Task.findOne({ where: { id: req.params.id, user_id: req.userId } });
    if (!task) return res.status(404).json({ error: 'Tache non trouvee' });

    const { title, description, status, priority, due_date, category_id } = req.body;

    if (category_id !== undefined) {
      if (category_id !== null) {
        const cat = await Category.findOne({ where: { id: category_id, user_id: req.userId } });
        if (!cat) return res.status(400).json({ error: 'Categorie invalide' });
      }
      task.category_id = category_id;
    }

    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (due_date !== undefined) task.due_date = due_date;

    await task.save();

    const taskWithCategory = await Task.findByPk(task.id, {
      include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'color'] }],
    });

    res.json(taskWithCategory);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const deleted = await Task.destroy({ where: { id: req.params.id, user_id: req.userId } });
    if (!deleted) return res.status(404).json({ error: 'Tache non trouvee' });
    res.json({ message: 'Tache supprimee' });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update, remove };
