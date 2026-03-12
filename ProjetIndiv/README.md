# TaskFlow — Gestionnaire de tâches

**Projet Individuel CDA — RNCP 37873 (Niveau 2 Avancé)**

TaskFlow est une application web full-stack de gestion de tâches avec authentification JWT, filtrage avancé, statistiques de tableau de bord et documentation Swagger. Développé en **Node.js/Express + Angular 21 + MySQL**.

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Backend | Node.js 20 + Express 4 |
| ORM | Sequelize 6 |
| Base de données | MySQL 8 |
| Authentification | JWT (access 1j) + Refresh token (7j) |
| Sécurité | bcryptjs, helmet, CORS configurable |
| Upload | Multer (avatars, max 4 Mo, jpeg/png/webp) |
| Documentation | Swagger (swagger-jsdoc + swagger-ui-express) |
| Frontend | Angular 21 + Angular Material + Lucide Icons |
| Tests | Jest + Supertest (couverture ≥ 92%) |
| Conteneurisation | Docker Compose (MySQL local) |
| Déploiement | Railway |

---

## Prérequis

| Outil | Version | Vérification |
|-------|---------|--------------|
| Node.js | 20+ | `node -v` |
| npm | 9+ | `npm -v` |
| Docker Desktop | 4+ | `docker -v` |
| Git | 2+ | `git -v` |

---

## Installation et lancement local

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

### 3. Backend

```bash
cd backend
cp .env.example .env
# Éditer .env si besoin (JWT_SECRET, REFRESH_TOKEN_SECRET, etc.)
npm install
npm run dev
# API disponible sur http://localhost:3000
# Swagger UI sur http://localhost:3000/api-docs
```

### 4. Frontend

```bash
cd frontend
npm install
npm start
# Application disponible sur http://localhost:4200
```

> Le script `npm start` lance `npx ng serve --proxy-config proxy.conf.json`, ce qui proxifie automatiquement les appels `/api/*` vers `http://localhost:3000`.

---

## Commandes utiles

```bash
# Backend (dans /backend)
npm run dev           # Démarrage en mode watch
npm start             # Démarrage production
npm test              # Tests Jest
npm run test:coverage # Tests + rapport de couverture HTML

# Frontend (dans /frontend)
npm start             # Dev server + proxy
npm run build         # Build production (dist/)

# Docker (à la racine)
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
│
├── backend/
│   ├── .env.example            # Variables d'environnement à copier
│   ├── jest.config.js          # Configuration Jest
│   ├── src/
│   │   ├── server.js           # Point d'entrée (écoute HTTP)
│   │   ├── app.js              # Express : helmet, morgan, CORS, routes, Swagger
│   │   ├── swagger.js          # Spec OpenAPI 3.0
│   │   ├── config/
│   │   │   └── db.js           # Connexion + sync Sequelize
│   │   ├── models/
│   │   │   ├── user.model.js   # Modèle User (bcrypt hook, comparePassword)
│   │   │   ├── task.model.js   # Modèle Task (ENUM status/priority)
│   │   │   ├── category.model.js
│   │   │   └── index.js        # Associations + export centralisé
│   │   ├── controllers/
│   │   │   ├── auth.controller.js     # register, login, refresh, logout
│   │   │   ├── task.controller.js     # list, create, update, remove
│   │   │   ├── category.controller.js # list, create, update, remove
│   │   │   └── user.controller.js     # getMe, uploadAvatar, updateMe
│   │   ├── routes/
│   │   │   ├── auth.routes.js         # /api/auth/*
│   │   │   ├── task.routes.js         # /api/tasks/*
│   │   │   ├── category.routes.js     # /api/categories/*
│   │   │   └── user.routes.js         # /api/users/*
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js     # Vérification JWT + injection req.userId
│   │   │   ├── validate.middleware.js # Exécute un validator et renvoie 400 si erreurs
│   │   │   ├── error.middleware.js    # Handler global d'erreurs (500 par défaut)
│   │   │   └── upload.middleware.js   # Multer : diskStorage, fileFilter, 4 Mo max
│   │   └── validators/
│   │       ├── auth.validator.js      # Règles register/login
│   │       ├── task.validator.js      # Règles title/status/priority/due_date
│   │       └── category.validator.js  # Règles name/color
│   └── tests/
│       ├── auth.test.js        # register, login, refresh (3 cas), logout
│       ├── tasks.test.js       # CRUD + filtres status/search/category_id
│       ├── categories.test.js  # CRUD + pagination
│       ├── users.test.js       # getMe, uploadAvatar, updateMe (12 cas)
│       └── middleware.test.js  # authMiddleware, errorHandler, validate,
│                               # upload fileFilter, task/category validators
│
└── frontend/
    ├── proxy.conf.json         # Proxy /api → http://localhost:3000
    └── src/app/
        ├── app.routes.ts       # Routes Angular (lazy loading)
        ├── core/
        │   ├── models/
        │   │   ├── user.model.ts      # Interface User + Avatar
        │   │   └── task.model.ts      # Interface Task, Category, filtres
        │   ├── services/
        │   │   ├── auth.service.ts    # Signals currentUser, login/register/logout
        │   │   ├── task.service.ts    # CRUD tâches + filtres
        │   │   ├── category.service.ts# CRUD catégories
        │   │   └── user.service.ts    # Profil + upload avatar
        │   ├── interceptors/
        │   │   └── auth.interceptor.ts # Injecte le Bearer token + auto-refresh JWT
        │   └── guards/
        │       └── auth.guard.ts      # Redirige vers /login si non authentifié
        ├── features/
        │   ├── auth/
        │   │   ├── login.component.ts    # Formulaire de connexion
        │   │   └── register.component.ts # Formulaire d'inscription
        │   ├── dashboard/
        │   │   └── dashboard.component.ts # Stats (todo/in_progress/done) + vue liste/tableau
        │   ├── tasks/
        │   │   ├── task-list.component.ts  # Liste paginée avec filtres
        │   │   ├── task-card.component.ts  # Carte individuelle (statut, priorité, date)
        │   │   └── task-form.component.ts  # Formulaire création/édition
        │   └── profile/
        │       └── profile.component.ts    # Édition profil + upload avatar
        └── shared/
            └── components/
                └── navbar.component.ts     # Barre de navigation (avatar, déconnexion)
```

---

## Où sont gérées les features

| Feature | Backend | Frontend |
|---------|---------|----------|
| Authentification (register/login/logout) | `auth.controller.js` + `auth.routes.js` | `auth.service.ts`, `login/register.component.ts` |
| Refresh automatique du JWT | `auth.controller.js` (`/refresh`) | `auth.interceptor.ts` (intercepte les 401 et retente) |
| Gestion des tâches (CRUD) | `task.controller.js` + `task.routes.js` | `task.service.ts`, `task-list/card/form.component.ts` |
| Filtres tâches (status, search, category) | `task.controller.js` (clause `where` Sequelize) | `task-list.component.ts` (query params) |
| Catégories (CRUD) | `category.controller.js` + `category.routes.js` | `category.service.ts` (utilisé dans task-form) |
| Profil utilisateur | `user.controller.js` (`getMe`, `updateMe`) | `profile.component.ts` + `user.service.ts` |
| Upload avatar | `upload.middleware.js` (Multer) + `user.controller.js` | `profile.component.ts` (multipart/form-data) |
| Dashboard & statistiques | — (calculé côté client depuis les tâches) | `dashboard.component.ts` |
| Validation des entrées | `validators/` + `validate.middleware.js` | Formulaires Angular réactifs |
| Protection des routes | `auth.middleware.js` (JWT) | `auth.guard.ts` |
| Documentation API | `swagger.js` + annotations JSDoc dans les routes | — |

---

## Modèle de données (MLD)

```
users
  id            INT PK AUTO_INCREMENT
  username      VARCHAR(50) UNIQUE NOT NULL
  email         VARCHAR(255) UNIQUE NOT NULL
  password_hash VARCHAR(255) NOT NULL
  avatar_url    VARCHAR(500) NULL
  refresh_token TEXT NULL
  created_at    DATETIME

categories
  id         INT PK AUTO_INCREMENT
  name       VARCHAR(100) NOT NULL
  color      VARCHAR(7) DEFAULT '#6366f1'
  user_id    INT FK → users.id (CASCADE)
  created_at DATETIME
  updated_at DATETIME

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

## Endpoints API

Documentation interactive complète : **`http://localhost:3000/api-docs`** (Swagger UI)

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/api/auth/register` | Non | Inscription |
| POST | `/api/auth/login` | Non | Connexion |
| POST | `/api/auth/refresh` | Non | Renouveler l'access token |
| POST | `/api/auth/logout` | Non | Déconnexion (invalide le refresh token) |
| GET | `/api/users/me` | Oui | Profil utilisateur |
| PUT | `/api/users/me` | Oui | Modifier username / email / mot de passe |
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

## Tests

```bash
cd backend
npm run test:coverage
```

Couverture actuelle : **≥ 92%** sur les instructions et lignes.

Les tests utilisent des mocks Jest (sans base de données réelle) :

| Fichier | Ce qui est testé |
|---------|-----------------|
| `auth.test.js` | register (succès + conflits), login, refresh (5 cas dont token expiré/invalide), logout |
| `tasks.test.js` | CRUD complet, filtres status/search/category_id, contrôle d'accès |
| `categories.test.js` | CRUD + pagination |
| `users.test.js` | getMe, uploadAvatar (avec/sans fichier), updateMe (username, email, password, conflits 409) |
| `middleware.test.js` | authMiddleware, errorHandler (prod + dev), validate, upload fileFilter (jpeg/png/webp/pdf), task et category validators |

---

## Sécurité

- **Mots de passe** : hashés avec bcryptjs (salt rounds = 10)
- **Access token JWT** : durée de vie 1 jour
- **Refresh token** : durée de vie 7 jours, stocké en DB, invalidé à la déconnexion
- **Helmet** : sécurisation des en-têtes HTTP
- **CORS** : origines autorisées configurables via `ALLOWED_ORIGINS`
- **Validation** : chaque route valide les entrées avant traitement (validators + middleware)
- **Accès isolé** : chaque utilisateur ne voit que ses propres données (filtrage `user_id` systématique)
- **Upload** : type MIME vérifié (jpeg/png/webp uniquement), taille limitée à 4 Mo

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

## Dépannage

| Problème | Solution |
|----------|----------|
| `MySQL connected` n'apparaît pas | Vérifier que Docker Desktop tourne et relancer `docker compose up -d` |
| Port 3000 déjà utilisé | Modifier `PORT` dans `backend/.env` |
| Port 4200 déjà utilisé | `npx ng serve --port 4201 --proxy-config proxy.conf.json` |
| `ng: command not found` | Utiliser `npx ng` à la place |
| Erreur CORS | Vérifier `ALLOWED_ORIGINS` dans `.env` (doit correspondre à l'URL du frontend) |
| `npm install` échoue | Vérifier `node -v` (doit être 20+) |
| Les avatars ne s'affichent pas | Vérifier que le dossier `backend/uploads/avatars/` existe (créé automatiquement au démarrage) |
