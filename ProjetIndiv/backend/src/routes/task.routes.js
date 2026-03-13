const { Router } = require('express');
const { list, create, update, remove } = require('../controllers/task.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { validateTask } = require('../validators/task.validator');

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Gestion des tâches
 */

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Lister les tâches (avec filtres et pagination)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [todo, in_progress, done]
 *         description: Filtrer par statut
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: integer
 *         description: Filtrer par catégorie
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Recherche dans le titre et la description
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Liste paginée des tâches
 */
router.get('/', list);

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Créer une nouvelle tâche
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               status:
 *                 type: string
 *                 enum: [todo, in_progress, done]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *               due_date: { type: string, format: date }
 *               category_id: { type: integer }
 *     responses:
 *       201:
 *         description: Tâche créée
 */
router.post('/', validate(validateTask), create);

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Modifier une tâche
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               status: { type: string }
 *               priority: { type: string }
 *               due_date: { type: string }
 *               category_id: { type: integer }
 *     responses:
 *       200:
 *         description: Tâche modifiée
 *       404:
 *         description: Tâche non trouvée
 */
router.put('/:id', update);

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Supprimer une tâche
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tâche supprimée
 *       404:
 *         description: Tâche non trouvée
 */
router.delete('/:id', remove);

module.exports = router;
