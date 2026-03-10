function validateRegister(body) {
  const errors = [];
  if (!body.username || body.username.trim().length < 2) {
    errors.push('Le nom d\'utilisateur doit contenir au moins 2 caracteres');
  }
  if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    errors.push('Email invalide');
  }
  if (!body.password || body.password.length < 6) {
    errors.push('Le mot de passe doit contenir au moins 6 caracteres');
  }
  return errors;
}

function validateLogin(body) {
  const errors = [];
  if (!body.username || body.username.trim().length < 2) errors.push('Nom d\'utilisateur requis (min. 2 caractères)');
  if (!body.password) errors.push('Mot de passe requis');
  return errors;
}

module.exports = { validateRegister, validateLogin };
