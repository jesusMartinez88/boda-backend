import * as playlistRepository from "../repositories/music-playlist.repository.js";
import { extractYouTubeId } from "../utils/youtube.js";

export const listMusicPlaylist = async (userId) => {
  return playlistRepository.listSongs(userId);
};

export const createMusicSong = async (payload, userId) => {
  const orderIndex =
    payload.order_index !== undefined ? payload.order_index : await playlistRepository.getNextOrderIndex(userId);

  return playlistRepository.createSong({
    ...payload,
    userId,
    youtube_id: payload.youtube_id || extractYouTubeId(payload.youtube_url),
    order_index: orderIndex,
  });
};

export const patchMusicSong = async (id, payload, userId) => {
  const existing = await playlistRepository.getSongById(id, userId);
  if (!existing) {
    const error = new Error("Song not found");
    error.code = "NOT_FOUND";
    throw error;
  }

  const nextData = { ...payload };

  if (payload.youtube_url !== undefined) {
    nextData.youtube_id = extractYouTubeId(payload.youtube_url);
  } else if (payload.youtube_id === undefined) {
    nextData.youtube_id = existing.youtube_id;
  }

  return playlistRepository.updateSongPartial(id, nextData, userId);
};

export const removeMusicSong = async (id, userId) => {
  const existing = await playlistRepository.getSongById(id, userId);
  if (!existing) {
    const error = new Error("Song not found");
    error.code = "NOT_FOUND";
    throw error;
  }

  await playlistRepository.deleteSong(id, userId);
};

export const reorderMusicPlaylist = async (songs, userId) => {
  await playlistRepository.reorderSongsTransaction(songs, userId);
  return playlistRepository.listSongs(userId);
};
