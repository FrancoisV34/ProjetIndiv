const jwt = require('jsonwebtoken');
const authMiddleware = require('../src/middleware/auth.middleware');
const errorHandler = require('../src/middleware/error.middleware');
const validate = require('../src/middleware/validate.middleware');

process.env.JWT_SECRET = 'test_jwt_secret';
process.env.NODE_ENV = 'test';

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

describe('errorHandler — mode développement', () => {
  it('inclut stack quand NODE_ENV=development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const err = new Error('Test error');
    const req = {};
    const res = mockRes();
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ stack: expect.any(String) })
    );

    process.env.NODE_ENV = originalEnv;
  });
});

describe('task.validator', () => {
  const { validateTask } = require('../src/validators/task.validator');

  it('titre > 255 chars → erreur', () => {
    const errors = validateTask({ title: 'a'.repeat(256) });
    expect(errors).toContain('Le titre ne doit pas depasser 255 caracteres');
  });

  it('status invalide → erreur', () => {
    const errors = validateTask({ title: 'Test', status: 'archived' });
    expect(errors).toContain('Le statut doit etre "todo", "in_progress" ou "done"');
  });

  it('priority invalide → erreur', () => {
    const errors = validateTask({ title: 'Test', priority: 'critical' });
    expect(errors).toContain('La priorite doit etre "low", "medium" ou "high"');
  });

  it('due_date invalide → erreur', () => {
    const errors = validateTask({ title: 'Test', due_date: 'not-a-date' });
    expect(errors).toContain("La date d'echeance est invalide");
  });
});

describe('category.validator', () => {
  const { validateCategory } = require('../src/validators/category.validator');

  it('name > 100 chars → erreur', () => {
    const errors = validateCategory({ name: 'a'.repeat(101) });
    expect(errors).toContain('Le nom ne doit pas depasser 100 caracteres');
  });
});

describe('upload.middleware', () => {
  const express = require('express');
  const supertest = require('supertest');
  const fs = require('fs');
  const upload = require('../src/middleware/upload.middleware');

  let uploadApp;
  const uploadedFiles = [];

  beforeAll(() => {
    uploadApp = express();
    uploadApp.use((req, _res, next) => {
      req.userId = 999;
      next();
    });
    uploadApp.post('/upload', upload.single('avatar'), (req, res) => {
      if (req.file) uploadedFiles.push(req.file.path);
      res.json({ filename: req.file ? req.file.filename : null });
    });
    uploadApp.use((err, _req, res, _next) => {
      res.status(400).json({ error: err.message });
    });
  });

  afterAll(() => {
    for (const filePath of uploadedFiles) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  });

  it('accepte image/jpeg', async () => {
    const res = await supertest(uploadApp)
      .post('/upload')
      .attach('avatar', Buffer.from('fake-jpeg'), { filename: 'test.jpg', contentType: 'image/jpeg' });
    expect(res.status).toBe(200);
  });

  it('accepte image/png', async () => {
    const res = await supertest(uploadApp)
      .post('/upload')
      .attach('avatar', Buffer.from('fake-png'), { filename: 'test.png', contentType: 'image/png' });
    expect(res.status).toBe(200);
  });

  it('accepte image/webp', async () => {
    const res = await supertest(uploadApp)
      .post('/upload')
      .attach('avatar', Buffer.from('fake-webp'), { filename: 'test.webp', contentType: 'image/webp' });
    expect(res.status).toBe(200);
  });

  it('rejette application/pdf → 400', async () => {
    const res = await supertest(uploadApp)
      .post('/upload')
      .attach('avatar', Buffer.from('fake-pdf'), { filename: 'test.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Format image non support/);
  });
});
