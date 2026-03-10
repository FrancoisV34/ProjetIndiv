const jwt = require('jsonwebtoken');
const authMiddleware = require('../src/middleware/auth.middleware');
const errorHandler = require('../src/middleware/error.middleware');
const validate = require('../src/middleware/validate.middleware');

process.env.JWT_SECRET = 'test_jwt_secret';

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('authMiddleware', () => {
  it('appelle next() avec un token valide', () => {
    const token = jwt.sign({ userId: 42 }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.userId).toBe(42);
  });

  it('retourne 401 si header manquant', () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('retourne 401 si token invalide', () => {
    const req = { headers: { authorization: 'Bearer invalid.token' } };
    const res = mockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('retourne 401 si token expiré', () => {
    const expired = jwt.sign({ userId: 1 }, process.env.JWT_SECRET, { expiresIn: '-1s' });
    const req = { headers: { authorization: `Bearer ${expired}` } };
    const res = mockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('errorHandler middleware', () => {
  it('retourne le statusCode de l\'erreur', () => {
    const err = { statusCode: 422, message: 'Validation error', name: 'ValidationError', stack: '' };
    const req = {};
    const res = mockRes();
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 422 }));
  });

  it('retourne 500 par défaut', () => {
    const err = new Error('Something went wrong');
    const req = {};
    const res = mockRes();
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 500 }));
  });
});

describe('validate middleware', () => {
  it('appelle next() si pas d\'erreurs', () => {
    const validator = () => [];
    const middleware = validate(validator);
    const req = { body: {} };
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('retourne 400 si erreurs de validation', () => {
    const validator = () => ['Champ requis'];
    const middleware = validate(validator);
    const req = { body: {} };
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ errors: ['Champ requis'] });
    expect(next).not.toHaveBeenCalled();
  });
});
