import { Router } from "express";
import {
  createPetType,
  deletePetType,
  getPetTypes,
  updatePetType,
} from "../controllers/petType.controller.js";

const router = Router();

router.post("/", createPetType);
router.get("/", getPetTypes);
router.put("/:id", updatePetType);
router.delete("/:id", deletePetType);

export default router;
