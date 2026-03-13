const { Category } = require('../models/index');

async function list(req, res, next) {
  try {
    const { page, limit } = req.query;

    if (page && limit) {
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const { count, rows } = await Category.findAndCountAll({
        where: { user_id: req.userId },
        order: [['name', 'ASC']],
        limit: parseInt(limit),
        offset,
      });
      return res.json({
        data: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit)),
        },
      });
    }

    const categories = await Category.findAll({
      where: { user_id: req.userId },
      order: [['name', 'ASC']],
    });
    res.json(categories);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { name, color } = req.body;
    const category = await Category.create({
      name: name.trim(),
      color: color || '#6366f1',
      user_id: req.userId,
    });
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const category = await Category.findOne({
      where: { id: req.params.id, user_id: req.userId },
    });
    if (!category) return res.status(404).json({ error: 'Categorie non trouvee' });

    if (req.body.name !== undefined) category.name = req.body.name.trim();
    if (req.body.color !== undefined) category.color = req.body.color;
    await category.save();

    res.json(category);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const deleted = await Category.destroy({
      where: { id: req.params.id, user_id: req.userId },
    });
    if (!deleted) return res.status(404).json({ error: 'Categorie non trouvee' });
    res.json({ message: 'Categorie supprimee' });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update, remove };
