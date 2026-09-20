import express from "express";
import multer from "multer";
import { processFolderPhotos, getUploadProgress, getUploadedJSON, uploadFiles } from "../controllers/bulkUploadController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Start processing folder with photos (path-based)
router.post("/process-folder", processFolderPhotos);

// Upload files directly from browser
router.post("/upload-files", upload.array("files"), uploadFiles);

// Get upload progress
router.get("/progress/:sessionId", getUploadProgress);

// Get uploaded JSON data
router.get("/json/:sessionId", getUploadedJSON);

export default router;
