const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test_jwt_secret';
process.env.REFRESH_TOKEN_SECRET = 'test_refresh_secret';
process.env.NODE_ENV = 'test';

const mockTasks = new Map();
let mockNextTaskId = 1;

const mockCategory = { id: 1, name: 'Work', color: '#6366f1', user_id: 1 };

jest.mock('../src/models/index', () => {
  return {
    User: {},
    Category: {
      findOne: jest.fn(({ where }) => {
        if (where.id === 1 && where.user_id === 1) return Promise.resolve(mockCategory);
        return Promise.resolve(null);
      }),
    },
    Task: {
      findAndCountAll: jest.fn(({ where, limit, offset }) => {
        let rows = Array.from(mockTasks.values()).filter(t => t.user_id === where.user_id);
        if (where.status) rows = rows.filter(t => t.status === where.status);
        const total = rows.length;
        rows = rows.slice(offset || 0, (offset || 0) + (limit || 20));
        return Promise.resolve({ count: total, rows });
      }),
      findByPk: jest.fn((id) => {
        const t = mockTasks.get(id);
        if (t) t.category = mockCategory;
        return Promise.resolve(t || null);
      }),
      findOne: jest.fn(({ where }) => {
        for (const t of mockTasks.values()) {
          if (t.id === parseInt(where.id) && t.user_id === where.user_id) return Promise.resolve(t);
        }
        return Promise.resolve(null);
      }),
      create: jest.fn(async (data) => {
        const id = mockNextTaskId++;
        const task = {
          id,
          ...data,
          category: null,
          save: jest.fn(async function() { mockTasks.set(this.id, this); }),
        };
        mockTasks.set(id, task);
        return task;
      }),
      destroy: jest.fn(({ where }) => {
        for (const [id, t] of mockTasks.entries()) {
          if (t.id === parseInt(where.id) && t.user_id === where.user_id) {
            mockTasks.delete(id);
            return Promise.resolve(1);
          }
        }
        return Promise.resolve(0);
      }),
    },
  };
});

const app = require('../src/app');

function makeToken(userId = 1) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

beforeEach(() => {
  mockTasks.clear();
  mockNextTaskId = 1;
  jest.clearAllMocks();
});

describe('GET /api/tasks', () => {
  it('retourne une liste paginée', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('rejette sans token', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
  });

  it('rejette avec token invalide', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
  });

  it('filtre par status=done', async () => {
    const res = await request(app)
      .get('/api/tasks?status=done')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
  });

  it('filtre par search=keyword', async () => {
    const res = await request(app)
      .get('/api/tasks?search=keyword')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
  });

  it('filtre par category_id=1', async () => {
    const res = await request(app)
      .get('/api/tasks?category_id=1')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
  });
});

describe('POST /api/tasks', () => {
  it('crée une tâche avec succès', async () => {
    const { Task } = require('../src/models/index');
    Task.findByPk.mockResolvedValueOnce({
      id: 1,
      title: 'Ma tâche',
      status: 'todo',
      priority: 'medium',
      user_id: 1,
      category: null,
    });

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ title: 'Ma tâche', status: 'todo', priority: 'medium' });

    expect(res.status).toBe(201);
  });

  it('rejette si titre manquant', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ status: 'todo' });

    expect(res.status).toBe(400);
  });

  it('rejette sans token', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Test' });
    expect(res.status).toBe(401);
  });

  it('400 — category_id invalide', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ title: 'Test task', category_id: 99 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Categorie/i);
  });
});

describe('PUT /api/tasks/:id', () => {
  it('modifie une tâche existante', async () => {
    const { Task } = require('../src/models/index');
    const fakeTask = {
      id: 1,
      title: 'Original',
      status: 'todo',
      user_id: 1,
      save: jest.fn(),
    };
    Task.findOne.mockResolvedValueOnce(fakeTask);
    Task.findByPk.mockResolvedValueOnce({ ...fakeTask, title: 'Modifiee', category: null });

    const res = await request(app)
      .put('/api/tasks/1')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ title: 'Modifiee' });

    expect(res.status).toBe(200);
  });

  it('retourne 404 si tâche inconnue', async () => {
    const { Task } = require('../src/models/index');
    Task.findOne.mockResolvedValueOnce(null);

    const res = await request(app)
      .put('/api/tasks/999')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ title: 'X' });

    expect(res.status).toBe(404);
  });

  it('400 — category_id invalide', async () => {
    const { Task } = require('../src/models/index');
    const fakeTask = {
      id: 1, title: 'Task', status: 'todo', user_id: 1,
      save: jest.fn(),
    };
    Task.findOne.mockResolvedValueOnce(fakeTask);

    const res = await request(app)
      .put('/api/tasks/1')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ category_id: 99 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Categorie/i);
  });
});

describe('DELETE /api/tasks/:id', () => {
  it('supprime une tâche existante', async () => {
    const { Task } = require('../src/models/index');
    Task.destroy.mockResolvedValueOnce(1);

    const res = await request(app)
      .delete('/api/tasks/1')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/supprim/i);
  });

  it('retourne 404 si tâche inconnue', async () => {
    const { Task } = require('../src/models/index');
    Task.destroy.mockResolvedValueOnce(0);

    const res = await request(app)
      .delete('/api/tasks/999')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(404);
  });
});
