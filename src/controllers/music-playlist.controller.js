import * as playlistService from "../services/music-playlist.service.js";
import {
  validateCreatePayload,
  validateIdParam,
  validatePatchPayload,
  validateReorderPayload,
} from "../validators/music-playlist.validator.js";

const sendError = (res, status, message, code) => {
  return res.status(status).json({
    success: false,
    message,
    ...(code ? { code } : {}),
  });
};

export const getPlaylist = async (req, res) => {
  try {
    const songs = await playlistService.listMusicPlaylist();
    return res.status(200).json({
      success: true,
      data: songs,
    });
  } catch (error) {
    console.error("Error getting music playlist:", error);
    return sendError(res, 500, "Internal server error", "INTERNAL_ERROR");
  }
};

export const createSong = async (req, res) => {
  const validation = validateCreatePayload(req.body);
  if (validation.error) {
    return sendError(res, 400, validation.error, validation.code);
  }

  try {
    const song = await playlistService.createMusicSong(validation.value);
    return res.status(201).json({
      success: true,
      data: song,
    });
  } catch (error) {
    console.error("Error creating playlist song:", error);
    return sendError(res, 500, "Internal server error", "INTERNAL_ERROR");
  }
};

export const patchSong = async (req, res) => {
  const idValidation = validateIdParam(req.params.id);
  if (idValidation.error) {
    return sendError(res, 400, idValidation.error, idValidation.code);
  }

  const bodyValidation = validatePatchPayload(req.body);
  if (bodyValidation.error) {
    return sendError(res, 400, bodyValidation.error, bodyValidation.code);
  }

  try {
    const song = await playlistService.patchMusicSong(idValidation.value, bodyValidation.value);
    return res.status(200).json({
      success: true,
      data: song,
    });
  } catch (error) {
    if (error.code === "NOT_FOUND") {
      return sendError(res, 404, "Song not found", "NOT_FOUND");
    }
    console.error("Error updating playlist song:", error);
    return sendError(res, 500, "Internal server error", "INTERNAL_ERROR");
  }
};

export const deleteSong = async (req, res) => {
  const idValidation = validateIdParam(req.params.id);
  if (idValidation.error) {
    return sendError(res, 400, idValidation.error, idValidation.code);
  }

  try {
    await playlistService.removeMusicSong(idValidation.value);
    return res.status(200).json({
      success: true,
      data: { deletedId: idValidation.value },
    });
  } catch (error) {
    if (error.code === "NOT_FOUND") {
      return sendError(res, 404, "Song not found", "NOT_FOUND");
    }
    console.error("Error deleting playlist song:", error);
    return sendError(res, 500, "Internal server error", "INTERNAL_ERROR");
  }
};

export const reorderSongs = async (req, res) => {
  const validation = validateReorderPayload(req.body);
  if (validation.error) {
    return sendError(res, 400, validation.error, validation.code);
  }

  try {
    const songs = await playlistService.reorderMusicPlaylist(validation.value);
    return res.status(200).json({
      success: true,
      data: songs,
    });
  } catch (error) {
    if (error.code === "NOT_FOUND") {
      return sendError(res, 404, error.message, "NOT_FOUND");
    }
    console.error("Error reordering playlist songs:", error);
    return sendError(res, 500, "Internal server error", "INTERNAL_ERROR");
  }
};
