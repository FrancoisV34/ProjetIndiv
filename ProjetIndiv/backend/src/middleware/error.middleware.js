function errorHandler(err, req, res, _next) {
  console.error(err);

  const statusCode = err.statusCode || err.status || 500;

  const response = {
    error: err.name || 'Error',
    message: err.message || 'Erreur serveur interne',
    statusCode,
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
