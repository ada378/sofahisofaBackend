import express from 'express';
import { 
  createLead, 
  getAllLeads, 
  updateLead, 
  deleteLead 
} from '../controllers/leadController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Public route - Create lead
router.post('/', createLead);

// Admin routes
router.get('/', protect, admin, getAllLeads);
router.put('/:id', protect, admin, updateLead);
router.delete('/:id', protect, admin, deleteLead);

export default router;
