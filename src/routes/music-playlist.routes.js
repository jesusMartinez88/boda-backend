import express from "express";
import { authenticateJWT } from "../middleware/auth.js";
import { resolveUserContext } from "../middleware/resolveUserContext.js";
import {
  createSong,
  deleteSong,
  getPlaylist,
  patchSong,
  reorderSongs,
} from "../controllers/music-playlist.controller.js";

const router = express.Router();

router.use(authenticateJWT);
router.use(resolveUserContext);

router.get("/", getPlaylist);
router.post("/", createSong);
router.patch("/:id", patchSong);
router.delete("/:id", deleteSong);
router.put("/reorder", reorderSongs);

export default router;
