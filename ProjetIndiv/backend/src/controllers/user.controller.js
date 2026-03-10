const path = require('path');
const bcrypt = require('bcryptjs');
const { User } = require('../models/index');

async function getMe(req, res, next) {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouve' });
    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function uploadAvatar(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const user = await User.findByPk(req.userId);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouve' });

    await user.update({ avatar_url: avatarUrl });

    res.json({ avatar_url: avatarUrl, user });
  } catch (err) {
    next(err);
  }
}

async function updateMe(req, res, next) {
  try {
    const { username, email, currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.userId);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    const changes = {};

    if (username && username !== user.username) {
      const existing = await User.findOne({ where: { username } });
      if (existing && existing.id !== req.userId) {
        return res.status(409).json({ error: 'Ce nom d\'utilisateur est déjà pris' });
      }
      changes.username = username;
    }

    if (email && email !== user.email) {
      const existing = await User.findOne({ where: { email } });
      if (existing && existing.id !== req.userId) {
        return res.status(409).json({ error: 'Cet email est déjà utilisé' });
      }
      changes.email = email;
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Le mot de passe actuel est requis' });
      }
      const valid = await user.comparePassword(currentPassword);
      if (!valid) {
        return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
      }
      changes.password_hash = await bcrypt.hash(newPassword, 10);
    }

    await user.update(changes);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

module.exports = { getMe, uploadAvatar, updateMe };
