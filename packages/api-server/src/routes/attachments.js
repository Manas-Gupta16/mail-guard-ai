import express from "express";
import multer from "multer";
import { AttachmentScannerService } from "../services/attachmentScannerService.js";
import { logger } from "../utils/logger.js";

const router = express.Router();

// Configure multer to store files in memory for fast scanning
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB limit for attachments
});

/**
 * @route POST /api/v1/attachments/scan
 * @desc Upload one or multiple attachments to scan for malware.
 * @access Private (Requires API Key)
 */
router.post("/scan", upload.array("files", 10), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded." });
    }

    const results = [];
    for (const file of req.files) {
      const result = await AttachmentScannerService.scanAttachment(file);
      results.push(result);
    }

    res.json({
      success: true,
      message: `Successfully scanned ${req.files.length} attachment(s).`,
      results
    });
  } catch (error) {
    logger.error({ err: error }, "Error scanning attachments");
    next(error);
  }
});

export { router as attachmentRouter };
