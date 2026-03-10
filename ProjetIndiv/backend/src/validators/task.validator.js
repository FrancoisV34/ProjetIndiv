const VALID_STATUSES = ['todo', 'in_progress', 'done'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];

function validateTask(body) {
  const errors = [];
  if (!body.title || body.title.trim().length === 0) {
    errors.push('Le titre est requis');
  }
  if (body.title && body.title.length > 255) {
    errors.push('Le titre ne doit pas depasser 255 caracteres');
  }
  if (body.status && !VALID_STATUSES.includes(body.status)) {
    errors.push('Le statut doit etre "todo", "in_progress" ou "done"');
  }
  if (body.priority && !VALID_PRIORITIES.includes(body.priority)) {
    errors.push('La priorite doit etre "low", "medium" ou "high"');
  }
  if (body.due_date && isNaN(Date.parse(body.due_date))) {
    errors.push('La date d\'echeance est invalide');
  }
  return errors;
}

module.exports = { validateTask };
