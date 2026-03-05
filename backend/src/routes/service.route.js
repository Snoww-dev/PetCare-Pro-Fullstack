import { Router } from 'express';
import {
  createService,
  getServices,
  getServiceById,
  updateService,
  deleteService,
  toggleServiceStatus,
} from '../controllers/service.controller.js';

const router = Router();

router.post('/', createService);
router.get('/', getServices);
router.get('/:id', getServiceById);
router.put('/:id', updateService);
router.patch('/:id/toggle-status', toggleServiceStatus);
router.delete('/:id', deleteService);

export default router;
