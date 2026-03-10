const request = require('supertest');

// Mock de la DB avant tout import
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.REFRESH_TOKEN_SECRET = 'test_refresh_secret';
process.env.NODE_ENV = 'test';

// Mock Sequelize models
jest.mock('../src/models/index', () => {
  const users = new Map();
  let nextId = 1;

  const User = {
    findOne: jest.fn(({ where }) => {
      for (const u of users.values()) {
        if (where.email && u.email === where.email) return Promise.resolve(u);
        if (where.username && u.username === where.username) return Promise.resolve(u);
        if (where.refresh_token && u.refresh_token === where.refresh_token) return Promise.resolve(u);
      }
      return Promise.resolve(null);
    }),
    findByPk: jest.fn((id) => Promise.resolve(users.get(id) || null)),
    create: jest.fn(async (data) => {
      const bcrypt = require('bcryptjs');
      const id = nextId++;
      const user = {
        id,
        username: data.username,
        email: data.email,
        password_hash: await bcrypt.hash(data.password_hash, 10),
        refresh_token: null,
        avatar_url: null,
        update: jest.fn(async (fields) => { Object.assign(user, fields); return user; }),
        comparePassword: jest.fn((pwd) => bcrypt.compare(pwd, user.password_hash)),
        toJSON: () => {
          const { password_hash, refresh_token, ...rest } = user;
          return rest;
        },
      };
      users.set(id, user);
      return user;
    }),
    update: jest.fn(async (fields, { where }) => {
      for (const u of users.values()) {
        if (where.refresh_token && u.refresh_token === where.refresh_token) {
          Object.assign(u, fields);
        }
      }
    }),
    _reset: () => { users.clear(); nextId = 1; },
  };

  return { User, Category: {}, Task: {} };
});

const app = require('../src/app');

beforeEach(() => {
  const { User } = require('../src/models/index');
  User._reset();
  jest.clearAllMocks();
});

describe('POST /api/auth/register', () => {
  it('crée un utilisateur avec succès', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'alice', email: 'alice@test.com', password: 'secret123' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user.email).toBe('alice@test.com');
    expect(res.body.user).not.toHaveProperty('password_hash');
  });

  it('rejette si champs manquants', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'x', email: 'invalid', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('rejette si email déjà utilisé', async () => {
    const { User } = require('../src/models/index');
    // Premier register
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'alice', email: 'alice@test.com', password: 'secret123' });

    // Simuler email existant
    User.findOne.mockResolvedValueOnce({ email: 'alice@test.com' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'alice2', email: 'alice@test.com', password: 'secret123' });

    expect(res.status).toBe(409);
  });

  it('rejette si username déjà pris', async () => {
    const { User } = require('../src/models/index');
    User.findOne
      .mockResolvedValueOnce(null) // email check OK
      .mockResolvedValueOnce({ username: 'alice' }); // username taken

    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'alice', email: 'new@test.com', password: 'secret123' });

    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  it('connecte un utilisateur avec succès', async () => {
    // Register d'abord
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'bob', email: 'bob@test.com', password: 'secret123' });

    const { User } = require('../src/models/index');
    // Récupérer l'utilisateur créé pour le mock login
    const createdUser = User.create.mock.results[0]?.value;
    User.findOne.mockResolvedValueOnce(createdUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'bob', password: 'secret123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('refreshToken');
  });

  it('rejette un mauvais mot de passe', async () => {
    const { User } = require('../src/models/index');
    const bcrypt = require('bcryptjs');
    const fakeUser = {
      email: 'bob@test.com',
      password_hash: await bcrypt.hash('correct', 10),
      comparePassword: (pwd) => bcrypt.compare(pwd, fakeUser.password_hash),
      update: jest.fn(),
    };
    User.findOne.mockResolvedValueOnce(fakeUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'bob', password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });

  it('rejette si username inconnu', async () => {
    const { User } = require('../src/models/index');
    User.findOne.mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'nobody', password: 'secret123' });

    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/refresh', () => {
  it('renvoie un nouveau token avec un refresh token valide', async () => {
    const jwt = require('jsonwebtoken');
    const { User } = require('../src/models/index');
    const validRefresh = jwt.sign({ userId: 1 }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

    User.findByPk.mockResolvedValueOnce({
      id: 1,
      refresh_token: validRefresh,
      toJSON: () => ({ id: 1 }),
    });

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: validRefresh });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('rejette si refresh token manquant', async () => {
    const res = await request(app).post('/api/auth/refresh').send({});
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('déconnecte avec succès', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken: 'sometoken' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/reussie/i);
  });
});
