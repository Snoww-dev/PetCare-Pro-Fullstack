import { Router } from "express";
import {
  createBreed,
  deleteBreed,
  getBreeds,
  updateBreed,
} from "../controllers/breed.controller.js";

const router = Router();

router.post("/", createBreed);
router.get("/", getBreeds);
router.put("/:id", updateBreed);
router.delete("/:id", deleteBreed);

export default router;
