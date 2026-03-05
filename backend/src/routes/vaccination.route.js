import { Router } from 'express';
import { createVaccination, getVaccinationsByPet } from '../controllers/vaccination.controller.js';

const router = Router();

router.post('/', createVaccination);
router.get('/pet/:pet_id', getVaccinationsByPet);

export default router;
