const jwt = require('jsonwebtoken');
const { User } = require('../models/index');

function generateAccessToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1d' });
}

function generateRefreshToken(userId) {
  return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
}

async function register(req, res, next) {
  try {
    const { username, email, password } = req.body;

    const existingEmail = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existingEmail) {
      return res.status(409).json({ error: 'Cet email est deja utilise' });
    }

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(409).json({ error: 'Ce nom d\'utilisateur est deja pris' });
    }

    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password_hash: password,
    });

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    await user.update({ refresh_token: refreshToken });

    res.status(201).json({ token: accessToken, refreshToken, user });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: 'Nom d\'utilisateur ou mot de passe incorrect' });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ error: 'Nom d\'utilisateur ou mot de passe incorrect' });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    await user.update({ refresh_token: refreshToken });

    res.json({ token: accessToken, refreshToken, user });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token manquant' });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch {
      return res.status(401).json({ error: 'Refresh token invalide ou expire' });
    }

    const user = await User.findByPk(decoded.userId);
    if (!user || user.refresh_token !== refreshToken) {
      return res.status(401).json({ error: 'Refresh token invalide' });
    }

    const accessToken = generateAccessToken(user.id);
    res.json({ token: accessToken });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await User.update({ refresh_token: null }, { where: { refresh_token: refreshToken } });
    }
    res.json({ message: 'Deconnexion reussie' });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, refresh, logout };
