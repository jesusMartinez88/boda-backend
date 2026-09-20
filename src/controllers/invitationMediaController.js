import { mkdir, readdir, rename, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

const MEDIA_ROOT = resolve(process.env.INVITATION_MEDIA_DIR || "assets/fotos");
const MAX_PIXELS = 20_000_000;
const MAX_DIMENSION = 2560;
const ACCEPTED_FORMATS = new Set(["jpeg", "png", "webp"]);

const userDirectory = (slug) => join(MEDIA_ROOT, slug);
const mediaUrl = (slug, name) => `/media/fotos/${encodeURIComponent(slug)}/${encodeURIComponent(name)}`;

const safeMediaName = (name) => name === "cover.webp" || /^[0-9a-f-]{36}\.webp$/i.test(name);

const invalidImageError = () => {
  const error = new Error("Only valid JPEG, PNG and WebP images are allowed");
  error.status = 415;
  return error;
};

const saveAsWebp = async (file, targetPath) => {
  if (!file?.buffer?.length) {
    const error = new Error("Image file is required");
    error.status = 400;
    throw error;
  }

  const image = sharp(file.buffer, { limitInputPixels: MAX_PIXELS, failOn: "error" });
  let metadata;
  try {
    metadata = await image.metadata();
  } catch {
    throw invalidImageError();
  }
  if (!metadata.format || !ACCEPTED_FORMATS.has(metadata.format)) {
    throw invalidImageError();
  }

  const temporaryPath = `${targetPath}.${randomUUID()}.webp`;
  try {
    await image
      .rotate()
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 88, effort: 4 })
      .toFile(temporaryPath);
    await rename(temporaryPath, targetPath);
  } finally {
    await rm(temporaryPath, { force: true });
  }
};

export const listMine = async (req, res, next) => {
  try {
    const { slug } = req.userContext;
    const directory = userDirectory(slug);
    let files = [];
    try {
      files = await readdir(directory);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }

    const photos = files.filter(safeMediaName).sort();
    res.json({
      success: true,
      data: {
        coverUrl: photos.includes("cover.webp") ? mediaUrl(slug, "cover.webp") : null,
        galleryUrls: photos.filter((name) => name !== "cover.webp").map((name) => mediaUrl(slug, name)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const uploadCover = async (req, res, next) => {
  try {
    const { slug } = req.userContext;
    const directory = userDirectory(slug);
    await mkdir(directory, { recursive: true });
    await saveAsWebp(req.file, join(directory, "cover.webp"));
    res.status(201).json({ success: true, data: { url: mediaUrl(slug, "cover.webp") } });
  } catch (error) {
    next(error);
  }
};

export const uploadGallery = async (req, res, next) => {
  try {
    const { slug } = req.userContext;
    const files = req.files ?? [];
    if (!files.length) {
      return res.status(400).json({ success: false, message: "At least one image is required" });
    }

    const directory = userDirectory(slug);
    await mkdir(directory, { recursive: true });
    const existingGallery = (await readdir(directory)).filter(
      (name) => safeMediaName(name) && name !== "cover.webp",
    );
    if (existingGallery.length + files.length > 12) {
      return res.status(400).json({ success: false, message: "A maximum of 12 gallery photos is allowed" });
    }
    const urls = [];
    for (const file of files) {
      const name = `${randomUUID()}.webp`;
      await saveAsWebp(file, join(directory, name));
      urls.push(mediaUrl(slug, name));
    }
    res.status(201).json({ success: true, data: { urls } });
  } catch (error) {
    next(error);
  }
};

export const removeMine = async (req, res, next) => {
  try {
    const { name } = req.params;
    if (!safeMediaName(name)) {
      return res.status(400).json({ success: false, message: "Invalid media name" });
    }
    await rm(join(userDirectory(req.userContext.slug), name), { force: true });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

export const listPublic = async (req, res, next) => {
  try {
    const directory = userDirectory(req.userContext.slug);
    let files = [];
    try {
      files = await readdir(directory);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    const photos = files.filter(safeMediaName).sort();
    res.json({
      success: true,
      data: {
        coverUrl: photos.includes("cover.webp") ? mediaUrl(req.userContext.slug, "cover.webp") : null,
        galleryUrls: photos.filter((name) => name !== "cover.webp").map((name) => mediaUrl(req.userContext.slug, name)),
      },
    });
  } catch (error) {
    next(error);
  }
};
