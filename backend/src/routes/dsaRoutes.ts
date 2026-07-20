import { Router } from 'express';
import {
  getAllProblems,
  getNewProblems,
  createProblem,
  bulkCreateProblems,
  updateProblem,
  deleteProblem,
} from '../controllers/dsaController';
import { adminOnly } from '../middleware/adminMiddleware';

const router = Router();

// ── Public routes (any user can read) ─────────────────────────
router.get('/', getAllProblems);
router.get('/new', getNewProblems);

// ── Admin-only routes ─────────────────────────────────────────
router.post('/',        adminOnly, createProblem);
router.post('/bulk',   adminOnly, bulkCreateProblems);
router.put('/:id',     adminOnly, updateProblem);
router.delete('/:id',  adminOnly, deleteProblem);

export default router;
