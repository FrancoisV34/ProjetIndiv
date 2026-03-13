function validateCategory(body) {
  const errors = [];
  if (!body.name || body.name.trim().length === 0) {
    errors.push('Le nom est requis');
  }
  if (body.name && body.name.length > 100) {
    errors.push('Le nom ne doit pas depasser 100 caracteres');
  }
  if (body.color && !/^#[0-9A-Fa-f]{6}$/.test(body.color)) {
    errors.push('La couleur doit etre un code hexadecimal valide (ex: #6366f1)');
  }
  return errors;
}

module.exports = { validateCategory };
