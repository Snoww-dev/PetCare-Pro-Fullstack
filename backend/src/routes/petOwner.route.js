import { Router } from 'express';
import {
  createPetOwner,
  getPetOwners,
  getPetOwnerById,
  updatePetOwner,
  deletePetOwner,
  searchPetOwners,
} from '../controllers/petOwner.controller.js';

const router = Router();

router.post('/', createPetOwner);
router.get('/', getPetOwners);
router.get('/search', searchPetOwners);
router.get('/:id', getPetOwnerById);
router.put('/:id', updatePetOwner);
router.delete('/:id', deletePetOwner);

export default router;
