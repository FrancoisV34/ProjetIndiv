# TaskFlow — Gestionnaire de tâches

**Projet Individuel CDA — RNCP 37873 (Niveau 2 Avancé)**

TaskFlow est une application web full-stack de gestion de tâches avec authentification JWT, filtrage avancé, statistiques de tableau de bord et documentation Swagger. Développé en **Node.js/Express + Angular 21 + MySQL**.

---

## Pourquoi MySQL ?

MySQL a été choisi pour les raisons suivantes :

- **Données relationnelles** : les entités `User → Category → Task` forment un graphe de relations naturellement modélisé avec des clés étrangères et des contraintes d'intégrité (`ON DELETE CASCADE`, `ON DELETE SET NULL`).
- **Robustesse et maturité** : MySQL est un SGBD éprouvé, massivement utilisé en production, avec un excellent support Sequelize (ORM).
- **Contraintes métier** : les statuts (`todo/in_progress/done`) et priorités (`low/medium/high`) sont modélisés en ENUM, garantissant l'intégrité côté DB.
- **Déploiement simplifié** : le plugin MySQL de Railway permet un déploiement en 1 clic avec toutes les variables d'environnement préconfigurées.

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Backend | Node.js 20 + Express 4 |
| ORM | Sequelize 6 |
| Base de données | MySQL 8 |
| Authentification | JWT (access 15min) + Refresh token (7j) |
| Sécurité | bcryptjs, helmet, CORS configurable |
| Upload | Multer (avatars) |
| Documentation | Swagger (swagger-jsdoc + swagger-ui-express) |
| Frontend | Angular 21 + Angular Material |
| Tests | Jest + Supertest (coverage ≥ 70%) |
| Conteneurisation | Docker Compose (MySQL local) |
| Déploiement | Railway |

---

## Modèle Logique de Données (MLD)

```
users
  id          INT PK AUTO_INCREMENT
  username    VARCHAR(50) UNIQUE NOT NULL
  email       VARCHAR(255) UNIQUE NOT NULL
  password_hash VARCHAR(255) NOT NULL
  avatar_url  VARCHAR(500) NULL
  refresh_token TEXT NULL
  created_at  DATETIME

categories
  id          INT PK AUTO_INCREMENT
  name        VARCHAR(100) NOT NULL
  color       VARCHAR(7) DEFAULT '#6366f1'
  user_id     INT FK → users.id (CASCADE)
  created_at  DATETIME
  updated_at  DATETIME

tasks
  id          INT PK AUTO_INCREMENT
  title       VARCHAR(255) NOT NULL
  description TEXT NULL
  status      ENUM('todo','in_progress','done') DEFAULT 'todo'
  priority    ENUM('low','medium','high') DEFAULT 'medium'
  due_date    DATE NULL
  user_id     INT FK → users.id (CASCADE)
  category_id INT FK → categories.id (SET NULL)
  created_at  DATETIME
  updated_at  DATETIME
```

---

## Prérequis

| Outil | Version | Vérification |
|-------|---------|--------------|
| Node.js | 20+ | `node -v` |
| npm | 9+ | `npm -v` |
| Docker Desktop | 4+ | `docker -v` |
| Git | 2+ | `git -v` |

---

## Installation locale

### 1. Cloner le projet

```bash
git clone <url-du-repo>
cd ProjetIndiv
```

### 2. Démarrer MySQL via Docker

```bash
docker compose up -d
# MySQL disponible sur le port 3306
```

### 3. Configurer et démarrer le backend

```bash
cd backend
cp .env.example .env
# Éditer .env si besoin (JWT_SECRET, REFRESH_TOKEN_SECRET, etc.)
npm install
npm run dev
# Serveur disponible sur http://localhost:3000
```

### 4. Démarrer le frontend

```bash
cd ../frontend
npm install
npx ng serve --proxy-config proxy.conf.json
# Application disponible sur http://localhost:4200
```

---

## Commandes utiles

```bash
# Backend
npm run dev          # Démarrage en mode watch
npm run start        # Démarrage production
npm run test         # Tests Jest
npm run test:coverage # Tests + rapport de couverture

# Docker
docker compose up -d    # Démarrer MySQL
docker compose down     # Arrêter MySQL
docker compose down -v  # Arrêter + supprimer les données
```

---

## Architecture du projet

```
ProjetIndiv/
├── docker-compose.yml          # MySQL 8 conteneurisé
├── Procfile                    # Config Railway
├── railway.toml                # Config déploiement
├── backend/
│   ├── .env.example            # Variables d'environnement
│   ├── jest.config.js          # Configuration Jest
│   ├── package.json
│   ├── src/
│   │   ├── server.js           # Point d'entrée
│   │   ├── app.js              # Express (helmet, morgan, CORS, routes, Swagger)
│   │   ├── swagger.js          # Spec OpenAPI 3.0
│   │   ├── config/db.js        # Connexion + sync Sequelize
│   │   ├── models/             # User, Category, Task + associations
│   │   ├── controllers/        # auth, task, category, user
│   │   ├── routes/             # Routes annotées @swagger
│   │   ├── middleware/         # auth.middleware, validate, error, upload
│   │   └── validators/         # Règles de validation
│   └── tests/
│       ├── auth.test.js        # Tests register/login/refresh/logout
│       ├── tasks.test.js       # CRUD tasks + contrôle accès
│       ├── categories.test.js  # CRUD categories
│       └── middleware.test.js  # auth, error handler, validate
└── frontend/
    ├── proxy.conf.json         # Proxy /api → backend:3000
    └── src/app/
        ├── core/
        │   ├── models/         # user.model.ts, task.model.ts
        │   ├── services/       # AuthService (signals), TaskService, CategoryService
        │   ├── interceptors/   # authInterceptor (auto-refresh JWT)
        │   └── guards/         # authGuard
        ├── features/
        │   ├── auth/           # Login, Register
        │   ├── dashboard/      # Dashboard (stats + filtres)
        │   └── tasks/          # TaskList, TaskCard, TaskForm
        └── shared/
            └── components/     # Navbar (avec avatar)
```

---

## Endpoints API

Documentation interactive complète : **`GET /api-docs`** (Swagger UI)

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/api/auth/register` | Non | Inscription |
| POST | `/api/auth/login` | Non | Connexion |
| POST | `/api/auth/refresh` | Non | Renouveler l'access token |
| POST | `/api/auth/logout` | Non | Déconnexion (invalide le refresh token) |
| GET | `/api/users/me` | Oui | Profil utilisateur |
| POST | `/api/users/avatar` | Oui | Upload avatar (multipart/form-data) |
| GET | `/api/tasks` | Oui | Lister les tâches (filtres + pagination) |
| POST | `/api/tasks` | Oui | Créer une tâche |
| PUT | `/api/tasks/:id` | Oui | Modifier une tâche |
| DELETE | `/api/tasks/:id` | Oui | Supprimer une tâche |
| GET | `/api/categories` | Oui | Lister les catégories |
| POST | `/api/categories` | Oui | Créer une catégorie |
| PUT | `/api/categories/:id` | Oui | Modifier une catégorie |
| DELETE | `/api/categories/:id` | Oui | Supprimer une catégorie |

### Filtres disponibles sur `GET /api/tasks`

```
?status=todo|in_progress|done
?category_id=<id>
?search=<mot-clé>
?page=1&limit=20
```

---

## Sécurité

- **Mots de passe** : hashés avec bcryptjs (salt rounds = 10)
- **Access token JWT** : durée de vie 15 minutes
- **Refresh token** : durée de vie 7 jours, stocké en DB, invalidé à la déconnexion
- **Helmet** : sécurisation des en-têtes HTTP
- **CORS** : origines autorisées configurables via `ALLOWED_ORIGINS`
- **Validation** : chaque route valide les entrées avant traitement
- **Accès isolé** : chaque utilisateur ne voit que ses propres données (filtrage `user_id`)

---

## Déploiement Railway

1. Créer un projet Railway → "Deploy from GitHub repo"
2. Ajouter le plugin **MySQL** → les variables `MYSQL_*` sont injectées automatiquement
3. Configurer les variables d'environnement :
   ```
   JWT_SECRET=<valeur sécurisée>
   REFRESH_TOKEN_SECRET=<valeur sécurisée>
   DB_HOST=${{MySQL.MYSQL_HOST}}
   DB_PORT=${{MySQL.MYSQL_PORT}}
   DB_NAME=${{MySQL.MYSQL_DATABASE}}
   DB_USER=${{MySQL.MYSQL_USER}}
   DB_PASSWORD=${{MySQL.MYSQL_PASSWORD}}
   ALLOWED_ORIGINS=https://<votre-frontend>.railway.app
   NODE_ENV=production
   ```
4. Le `railway.toml` configure automatiquement la commande de démarrage.

---

## Tests

```bash
cd backend
npm run test:coverage
```

Couverture cible : **≥ 70%** sur les lignes, fonctions et instructions.

Les tests utilisent des mocks Jest (sans base de données réelle) pour :
- `auth.test.js` — register, login, refresh, logout
- `tasks.test.js` — CRUD complet + contrôle d'accès sans token
- `categories.test.js` — CRUD + pagination
- `middleware.test.js` — authMiddleware, errorHandler, validate

---

## Dépannage

| Problème | Solution |
|----------|----------|
| `MySQL connected` n'apparaît pas | Vérifier que Docker Desktop tourne |
| Port 3000 déjà utilisé | Modifier `PORT` dans `backend/.env` |
| Port 4200 déjà utilisé | `npx ng serve --port 4201 --proxy-config proxy.conf.json` |
| `ng: command not found` | Utiliser `npx ng` |
| Erreur CORS | Vérifier `ALLOWED_ORIGINS` dans `.env` |
| `npm install` échoue | Vérifier `node -v` (doit être 20+) |
