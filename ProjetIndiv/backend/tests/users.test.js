const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test_jwt_secret';
process.env.REFRESH_TOKEN_SECRET = 'test_refresh_secret';
process.env.NODE_ENV = 'test';

let mockFileToInject = null;

jest.mock('../src/middleware/upload.middleware', () => ({
  single: jest.fn(() => (req, res, next) => {
    if (mockFileToInject) req.file = mockFileToInject;
    next();
  }),
}));

jest.mock('../src/models/index', () => ({
  User: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
  },
  Category: {},
  Task: {},
}));

const app = require('../src/app');

function makeToken(userId = 1) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

function makeUser(overrides = {}) {
  return {
    id: 1,
    username: 'alice',
    email: 'alice@test.com',
    update: jest.fn(async function (c) { Object.assign(this, c); }),
    comparePassword: jest.fn(async () => true),
    ...overrides,
  };
}

beforeEach(() => {
  mockFileToInject = null;
  jest.clearAllMocks();
});

describe('GET /api/users/me', () => {
  it('200 — retourne le profil utilisateur', async () => {
    const { User } = require('../src/models/index');
    User.findByPk.mockResolvedValueOnce(makeUser());

    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.username).toBe('alice');
  });

  it('404 — utilisateur introuvable', async () => {
    const { User } = require('../src/models/index');
    User.findByPk.mockResolvedValueOnce(null);

    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(404);
  });

  it('401 — sans token', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/users/avatar', () => {
  it('400 — aucun fichier', async () => {
    const res = await request(app)
      .post('/api/users/avatar')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/fichier/i);
  });

  it('200 — upload réussi', async () => {
    mockFileToInject = { filename: 'avatar-1-123.jpg' };
    const { User } = require('../src/models/index');
    User.findByPk.mockResolvedValueOnce(makeUser());

    const res = await request(app)
      .post('/api/users/avatar')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.avatar_url).toContain('avatar-1-123.jpg');
  });

  it('404 — fichier présent mais utilisateur introuvable', async () => {
    mockFileToInject = { filename: 'avatar-1-123.jpg' };
    const { User } = require('../src/models/index');
    User.findByPk.mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/api/users/avatar')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/users/me', () => {
  it('200 — mise à jour username', async () => {
    const { User } = require('../src/models/index');
    User.findByPk.mockResolvedValueOnce(makeUser());
    User.findOne.mockResolvedValueOnce(null);

    const res = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ username: 'newname' });

    expect(res.status).toBe(200);
  });

  it('409 — username déjà pris', async () => {
    const { User } = require('../src/models/index');
    User.findByPk.mockResolvedValueOnce(makeUser());
    User.findOne.mockResolvedValueOnce({ id: 99, username: 'newname' });

    const res = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ username: 'newname' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/utilisateur/i);
  });

  it('200 — mise à jour email', async () => {
    const { User } = require('../src/models/index');
    User.findByPk.mockResolvedValueOnce(makeUser());
    User.findOne.mockResolvedValueOnce(null);

    const res = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ email: 'new@test.com' });

    expect(res.status).toBe(200);
  });

  it('409 — email déjà utilisé', async () => {
    const { User } = require('../src/models/index');
    User.findByPk.mockResolvedValueOnce(makeUser());
    User.findOne.mockResolvedValueOnce({ id: 99, email: 'new@test.com' });

    const res = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ email: 'new@test.com' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/email/i);
  });

  it('400 — newPassword sans currentPassword', async () => {
    const { User } = require('../src/models/index');
    User.findByPk.mockResolvedValueOnce(makeUser());

    const res = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ newPassword: 'newpass123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/actuel/i);
  });

  it('401 — currentPassword incorrect', async () => {
    const { User } = require('../src/models/index');
    User.findByPk.mockResolvedValueOnce(
      makeUser({ comparePassword: jest.fn(async () => false) })
    );

    const res = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ currentPassword: 'wrong', newPassword: 'newpass123' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/incorrect/i);
  });

  it('200 — changement de mot de passe réussi', async () => {
    const { User } = require('../src/models/index');
    User.findByPk.mockResolvedValueOnce(makeUser());

    const res = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ currentPassword: 'correct', newPassword: 'newpass123' });

    expect(res.status).toBe(200);
  });

  it('404 — utilisateur introuvable', async () => {
    const { User } = require('../src/models/index');
    User.findByPk.mockResolvedValueOnce(null);

    const res = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ username: 'something' });

    expect(res.status).toBe(404);
  });
});
