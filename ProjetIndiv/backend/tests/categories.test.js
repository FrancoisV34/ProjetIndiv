const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test_jwt_secret';
process.env.REFRESH_TOKEN_SECRET = 'test_refresh_secret';
process.env.NODE_ENV = 'test';

jest.mock('../src/models/index', () => {
  const cats = new Map();
  let nextId = 1;

  return {
    User: {},
    Task: {},
    Category: {
      findAll: jest.fn(({ where }) => {
        return Promise.resolve(Array.from(cats.values()).filter(c => c.user_id === where.user_id));
      }),
      findAndCountAll: jest.fn(({ where, limit, offset }) => {
        const rows = Array.from(cats.values()).filter(c => c.user_id === where.user_id);
        return Promise.resolve({ count: rows.length, rows: rows.slice(offset || 0, (offset || 0) + (limit || 10)) });
      }),
      findOne: jest.fn(({ where }) => {
        for (const c of cats.values()) {
          if (c.id === parseInt(where.id) && c.user_id === where.user_id) return Promise.resolve(c);
        }
        return Promise.resolve(null);
      }),
      create: jest.fn((data) => {
        const id = nextId++;
        const cat = {
          id,
          ...data,
          save: jest.fn(async function() { cats.set(this.id, this); }),
        };
        cats.set(id, cat);
        return Promise.resolve(cat);
      }),
      destroy: jest.fn(({ where }) => {
        for (const [id, c] of cats.entries()) {
          if (c.id === parseInt(where.id) && c.user_id === where.user_id) {
            cats.delete(id);
            return Promise.resolve(1);
          }
        }
        return Promise.resolve(0);
      }),
      _reset: () => { cats.clear(); nextId = 1; },
    },
  };
});

const app = require('../src/app');

function makeToken(userId = 1) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

beforeEach(() => {
  const { Category } = require('../src/models/index');
  Category._reset();
  jest.clearAllMocks();
});

describe('GET /api/categories', () => {
  it('retourne la liste des catégories', async () => {
    const res = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('supporte la pagination', async () => {
    const res = await request(app)
      .get('/api/categories?page=1&limit=5')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
  });

  it('rejette sans token', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/categories', () => {
  it('crée une catégorie avec succès', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ name: 'Perso', color: '#f59e0b' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Perso');
  });

  it('rejette si nom manquant', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ color: '#fff' });

    expect(res.status).toBe(400);
  });
});

describe('PUT /api/categories/:id', () => {
  it('modifie une catégorie existante', async () => {
    const { Category } = require('../src/models/index');
    const fakeCat = { id: 1, name: 'Old', color: '#111', user_id: 1, save: jest.fn() };
    Category.findOne.mockResolvedValueOnce(fakeCat);

    const res = await request(app)
      .put('/api/categories/1')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ name: 'New' });

    expect(res.status).toBe(200);
  });

  it('retourne 404 si catégorie inconnue', async () => {
    const { Category } = require('../src/models/index');
    Category.findOne.mockResolvedValueOnce(null);

    const res = await request(app)
      .put('/api/categories/999')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ name: 'X' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/categories/:id', () => {
  it('supprime une catégorie existante', async () => {
    const { Category } = require('../src/models/index');
    Category.destroy.mockResolvedValueOnce(1);

    const res = await request(app)
      .delete('/api/categories/1')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
  });

  it('retourne 404 si catégorie inconnue', async () => {
    const { Category } = require('../src/models/index');
    Category.destroy.mockResolvedValueOnce(0);

    const res = await request(app)
      .delete('/api/categories/999')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(404);
  });
});
