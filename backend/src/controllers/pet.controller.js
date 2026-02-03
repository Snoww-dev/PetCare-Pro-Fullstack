import Pet from '../models/pet.model.js';

export const createPet = async (req, res) => {
    try {
        const { name, pet_type_id, breed_id, owner_id, gender, birth_date, color, weight, avatar_url, health_status, notes } = req.body;
        if (!name || !pet_type_id || !breed_id || !owner_id) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        const newPet = new Pet({ name, pet_type_id, breed_id, owner_id, gender, birth_date, color, weight, avatar_url, health_status, notes, created_by: req.user._id });
        await newPet.save();
        res.status(201).json({ message: 'Pet created successfully', pet: newPet });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const getPets = async (req, res) => {
    try {
        const pets = await Pet.find().populate('pet_type_id breed_id owner_id created_by');
        res.status(200).json(pets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const getPetById = async (req, res) => {
    try {
        const petId = req.params.id;
        const pet = await Pet.findById(petId).populate('pet_type_id breed_id owner_id created_by');
        if (!pet) {
            return res.status(404).json({ message: 'Pet not found' });
        }
        res.status(200).json(pet);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const updatePet = async (req, res) => {
    try {
        const petId = req.params.id;
        const updatedPet = await Pet.findByIdAndUpdate(petId, { new: true });
        if (!updatedPet) {
            return res.status(404).json({ message: 'Pet not found' });
        }
        res.status(200).json({ message: 'Pet updated successfully', pet: updatedPet });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const deletePet = async (req, res) => {
    try {
        const petId = req.params.id;
        const deletedPet = await Pet.findByIdAndDelete(petId);
        if (!deletedPet) {
            return res.status(404).json({ message: 'Pet not found' });
        }
        res.status(200).json({ message: 'Pet deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}