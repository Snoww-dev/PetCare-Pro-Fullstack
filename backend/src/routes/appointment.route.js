import { Router } from 'express';
import {
  createAppointment,
  getAppointmentsByDate,
  getAppointments,
  updateAppointmentStatus,
} from '../controllers/appointment.controller.js';

const router = Router();

router.post('/', createAppointment);
router.get('/', getAppointments);
router.get('/by-date', getAppointmentsByDate);
router.patch('/:id/status', updateAppointmentStatus);

export default router;
