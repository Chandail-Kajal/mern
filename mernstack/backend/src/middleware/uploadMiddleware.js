import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
 
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
 
const UPLOADS_ROOT = path.join(__dirname, "../uploads");
const DIRS = {
  images:   path.join(UPLOADS_ROOT, "images"),
  files:    path.join(UPLOADS_ROOT, "files"),
  audio:    path.join(UPLOADS_ROOT, "audio"),
  videos:   path.join(UPLOADS_ROOT, "videos"),
  stickers: path.join(UPLOADS_ROOT, "stickers"),
};
Object.values(DIRS).forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });
 
const BLOCKED = new Set([".exe",".bat",".cmd",".sh",".msi",".dmg",".apk",".ps1"]);
 
export const categorise = (mimetype, ext) => {
  if (/^image\//.test(mimetype)) return { folder: DIRS.images,  type: ext === ".gif" ? "gif" : "image" };
  if (/^video\//.test(mimetype)) return { folder: DIRS.videos,  type: "video" };
  if (/^audio\//.test(mimetype)) return { folder: DIRS.audio,   type: "audio" };
  return                                { folder: DIRS.files,   type: "file"  };
};
 
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, categorise(file.mimetype, ext).folder);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname));
  },
});
 
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (BLOCKED.has(ext)) return cb(new Error("File type not allowed for security reasons."));
  cb(null, true);
};
 
export const upload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } });