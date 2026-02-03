import Router from 'express';
import { createPet, getPets, getPetById, updatePet, deletePet } from '../controllers/pet.controller.js';
import { protectedRoute } from '../middlewares/auth.middleware.js';
const router = Router();

// Create a new pet
router.post('/create-pet', protectedRoute, createPet);
// Get all pets
router.get('/get-all-pets', protectedRoute, getPets);
// Get a pet by ID
router.get('/get-pet/:id', protectedRoute, getPetById);
// Update a pet by ID
router.put('/update-pet/:id', protectedRoute, updatePet);
// Delete a pet by ID
router.delete('/delete-pet/:id', protectedRoute, deletePet);

export default router;