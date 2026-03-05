import { Router } from 'express';
import { createPet, getPets, getPetById, updatePet, deletePet, getPetFormOptions } from '../controllers/pet.controller.js';

const router = Router();

// Create a new pet
router.post('/create-pet', createPet);
// Get all pets
router.get('/get-all-pets', getPets);
// Get options for pet form (types, breeds, owners)
router.get('/options', getPetFormOptions);
// Get a pet by ID
router.get('/get-pet/:id', getPetById);
// Update a pet by ID
router.put('/update-pet/:id', updatePet);
// Delete a pet by ID
router.delete('/delete-pet/:id', deletePet);

export default router;
