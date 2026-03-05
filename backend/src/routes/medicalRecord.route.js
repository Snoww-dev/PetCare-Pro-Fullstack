import { Router } from 'express';
import {
  createMedicalRecord,
  getAllMedicalRecords,
  getMedicalRecordsByPetId,
  updateMedicalRecord,
  deleteMedicalRecord,
} from '../controllers/medicalRecord.controller.js';

const router = Router();

router.post('/', createMedicalRecord);
router.get('/', getAllMedicalRecords);
router.get('/:id', getMedicalRecordsByPetId);
router.put('/:id', updateMedicalRecord);
router.delete('/:id', deleteMedicalRecord);

export default router;
