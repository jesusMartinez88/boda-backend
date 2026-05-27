const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be",
]);

const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

export const isValidYouTubeUrl = (input) => {
  if (typeof input !== "string" || !input.trim()) {
    return false;
  }

  try {
    const url = new URL(input.trim());
    return YOUTUBE_HOSTS.has(url.hostname.toLowerCase());
  } catch {
    return false;
  }
};

export const extractYouTubeId = (input) => {
  if (typeof input !== "string" || !input.trim()) {
    return null;
  }

  try {
    const url = new URL(input.trim());
    const hostname = url.hostname.toLowerCase();

    if (!YOUTUBE_HOSTS.has(hostname)) {
      return null;
    }

    if (hostname.includes("youtu.be")) {
      const shortId = url.pathname.split("/").filter(Boolean)[0];
      return YOUTUBE_ID_REGEX.test(shortId) ? shortId : null;
    }

    const idFromQuery = url.searchParams.get("v");
    if (YOUTUBE_ID_REGEX.test(idFromQuery)) {
      return idFromQuery;
    }

    const pathParts = url.pathname.split("/").filter(Boolean);
    const possibleId = pathParts[pathParts.length - 1];

    if (["embed", "shorts", "live", "v"].includes(pathParts[0]) && YOUTUBE_ID_REGEX.test(possibleId)) {
      return possibleId;
    }

    return null;
  } catch {
    return null;
  }
};
