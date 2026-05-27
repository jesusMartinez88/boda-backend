import { FIELD_LIMITS, sanitizeObject, validateFields } from "../utils/validation.js";
import { extractYouTubeId, isValidYouTubeUrl } from "../utils/youtube.js";

const LIMITS = {
  TITLE: 200,
  ARTIST: 200,
  NOTE: FIELD_LIMITS.GUEST_NOTES,
};

const isInteger = (value) => Number.isInteger(value);

const normalizePayload = (payload) => {
  if (!payload || typeof payload !== "object") {
    return {};
  }

  const normalized = { ...payload };

  if (normalized.youtube_url === undefined && normalized.youtubeUrl !== undefined) {
    normalized.youtube_url = normalized.youtubeUrl;
  }

  if (normalized.youtube_id === undefined && normalized.youtubeId !== undefined) {
    normalized.youtube_id = normalized.youtubeId;
  }

  if (normalized.order_index === undefined && normalized.orderIndex !== undefined) {
    const parsed = Number(normalized.orderIndex);
    normalized.order_index = Number.isNaN(parsed) ? normalized.orderIndex : parsed;
  }

  delete normalized.youtubeUrl;
  delete normalized.youtubeId;
  delete normalized.orderIndex;

  return normalized;
};

const parseIdParam = (idParam) => {
  const parsed = Number(idParam);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return { error: "Invalid id parameter", code: "INVALID_ID" };
  }
  return { value: parsed };
};

const validateOrderIndex = (orderIndex) => {
  if (orderIndex === undefined) return null;
  if (!isInteger(orderIndex) || orderIndex < 0) {
    return "order_index must be a non-negative integer";
  }
  return null;
};

const validateRequiredString = (value, fieldName) => {
  if (typeof value !== "string" || !value.trim()) {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateCreatePayload = (payload) => {
  const sanitized = sanitizeObject(normalizePayload(payload));
  const errors = [];

  const titleError = validateRequiredString(sanitized.title, "title");
  const artistError = validateRequiredString(sanitized.artist, "artist");
  if (titleError) errors.push(titleError);
  if (artistError) errors.push(artistError);

  if (!isValidYouTubeUrl(sanitized.youtube_url)) {
    errors.push("youtube_url must be a valid YouTube URL");
  }

  const lengthValidation = validateFields(
    {
      title: sanitized.title?.trim(),
      artist: sanitized.artist?.trim(),
      note: sanitized.note,
    },
    {
      title: LIMITS.TITLE,
      artist: LIMITS.ARTIST,
      note: LIMITS.NOTE,
    },
  );

  errors.push(...lengthValidation.errors);

  const orderError = validateOrderIndex(sanitized.order_index);
  if (orderError) errors.push(orderError);

  if (errors.length > 0) {
    return { error: errors[0], code: "VALIDATION_ERROR" };
  }

  const youtubeId = sanitized.youtube_id || extractYouTubeId(sanitized.youtube_url);
  if (!youtubeId) {
    return { error: "youtube_url must contain a valid YouTube video id", code: "VALIDATION_ERROR" };
  }

  return {
    value: {
      title: sanitized.title.trim(),
      artist: sanitized.artist.trim(),
      youtube_url: sanitized.youtube_url.trim(),
      youtube_id: youtubeId,
      note: sanitized.note ? String(sanitized.note).trim() : null,
      order_index: sanitized.order_index,
    },
  };
};

export const validatePatchPayload = (payload) => {
  const sanitized = sanitizeObject(normalizePayload(payload));
  const allowedKeys = new Set(["title", "artist", "youtube_url", "youtube_id", "note", "order_index"]);
  const keys = Object.keys(sanitized);

  if (keys.length === 0) {
    return { error: "Payload is empty", code: "VALIDATION_ERROR" };
  }

  const hasInvalidField = keys.some((key) => !allowedKeys.has(key));
  if (hasInvalidField) {
    return { error: "Payload contains unsupported fields", code: "VALIDATION_ERROR" };
  }

  const errors = [];

  if (sanitized.title !== undefined) {
    const titleError = validateRequiredString(sanitized.title, "title");
    if (titleError) errors.push(titleError);
  }

  if (sanitized.artist !== undefined) {
    const artistError = validateRequiredString(sanitized.artist, "artist");
    if (artistError) errors.push(artistError);
  }

  if (sanitized.youtube_url !== undefined && !isValidYouTubeUrl(sanitized.youtube_url)) {
    errors.push("youtube_url must be a valid YouTube URL");
  } else if (sanitized.youtube_url !== undefined && !extractYouTubeId(sanitized.youtube_url)) {
    errors.push("youtube_url must contain a valid YouTube video id");
  }

  const lengthValidation = validateFields(
    {
      title: sanitized.title?.trim(),
      artist: sanitized.artist?.trim(),
      note: sanitized.note,
    },
    {
      title: LIMITS.TITLE,
      artist: LIMITS.ARTIST,
      note: LIMITS.NOTE,
    },
  );
  errors.push(...lengthValidation.errors);

  const orderError = validateOrderIndex(sanitized.order_index);
  if (orderError) errors.push(orderError);

  if (errors.length > 0) {
    return { error: errors[0], code: "VALIDATION_ERROR" };
  }

  return {
    value: {
      ...(sanitized.title !== undefined ? { title: sanitized.title.trim() } : {}),
      ...(sanitized.artist !== undefined ? { artist: sanitized.artist.trim() } : {}),
      ...(sanitized.youtube_url !== undefined ? { youtube_url: sanitized.youtube_url.trim() } : {}),
      ...(sanitized.youtube_id !== undefined ? { youtube_id: sanitized.youtube_id } : {}),
      ...(sanitized.note !== undefined ? { note: sanitized.note ? String(sanitized.note).trim() : null } : {}),
      ...(sanitized.order_index !== undefined ? { order_index: sanitized.order_index } : {}),
    },
  };
};

export const validateReorderPayload = (payload) => {
  if (!payload || !Array.isArray(payload.songs) || payload.songs.length === 0) {
    return { error: "songs must be a non-empty array", code: "VALIDATION_ERROR" };
  }

  const seenIds = new Set();
  const seenOrders = new Set();

  for (const song of payload.songs) {
    if (!song || !isInteger(song.id) || song.id <= 0) {
      return { error: "Every song id must be a positive integer", code: "VALIDATION_ERROR" };
    }

    if (!isInteger(song.order) || song.order < 0) {
      return { error: "Every song order must be a non-negative integer", code: "VALIDATION_ERROR" };
    }

    if (seenIds.has(song.id)) {
      return { error: "Song ids must be unique", code: "VALIDATION_ERROR" };
    }

    if (seenOrders.has(song.order)) {
      return { error: "Song orders must be unique", code: "VALIDATION_ERROR" };
    }

    seenIds.add(song.id);
    seenOrders.add(song.order);
  }

  return { value: payload.songs };
};

export const validateIdParam = parseIdParam;
