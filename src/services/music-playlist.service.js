import * as playlistRepository from "../repositories/music-playlist.repository.js";
import { extractYouTubeId } from "../utils/youtube.js";

export const listMusicPlaylist = async () => {
  return playlistRepository.listSongs();
};

export const createMusicSong = async (payload) => {
  const orderIndex =
    payload.order_index !== undefined ? payload.order_index : await playlistRepository.getNextOrderIndex();

  return playlistRepository.createSong({
    ...payload,
    youtube_id: payload.youtube_id || extractYouTubeId(payload.youtube_url),
    order_index: orderIndex,
  });
};

export const patchMusicSong = async (id, payload) => {
  const existing = await playlistRepository.getSongById(id);
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

  return playlistRepository.updateSongPartial(id, nextData);
};

export const removeMusicSong = async (id) => {
  const existing = await playlistRepository.getSongById(id);
  if (!existing) {
    const error = new Error("Song not found");
    error.code = "NOT_FOUND";
    throw error;
  }

  await playlistRepository.deleteSong(id);
};

export const reorderMusicPlaylist = async (songs) => {
  await playlistRepository.reorderSongsTransaction(songs);
  return playlistRepository.listSongs();
};
