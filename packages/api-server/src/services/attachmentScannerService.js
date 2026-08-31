import crypto from "crypto";
import { logger } from "../utils/logger.js";

/**
 * Mocked VirusTotal / Threat Intelligence attachment scanner.
 * In production, this would send the file hash to VirusTotal, CrowdStrike, or run YARA rules.
 */
export class AttachmentScannerService {
  /**
   * Scan an attachment for known malware signatures.
   * @param {Object} file - The file object from Multer (contains buffer, originalname, mimetype, size)
   * @returns {Object} Threat scan results
   */
  static async scanAttachment(file) {
    if (!file || !file.buffer) {
      throw new Error("Invalid file buffer provided for scanning.");
    }

    const startTime = Date.now();
    
    // 1. Calculate File Hash (SHA-256)
    const hashSum = crypto.createHash("sha256");
    hashSum.update(file.buffer);
    const sha256 = hashSum.digest("hex");

    // 2. Mock Threat Intelligence Lookup
    // We mock the response based on the filename for demonstration purposes.
    const isMalicious = file.originalname.toLowerCase().includes("malware") || 
                        file.originalname.toLowerCase().includes("virus") ||
                        file.originalname.toLowerCase().includes("payload");

    let threatType = null;
    let confidence = 0;
    
    if (isMalicious) {
      threatType = "Ransomware.WannaCry.Gen1";
      confidence = 99;
    } else if (file.originalname.toLowerCase().endsWith(".exe") || file.originalname.toLowerCase().endsWith(".zip")) {
      threatType = "Suspicious.Filetype";
      confidence = 65;
    } else {
        confidence = 0;
    }

    const latency = Date.now() - startTime;

    logger.info({ sha256, filename: file.originalname, isMalicious, latency }, "Attachment scanned");

    return {
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      sha256,
      scanResult: {
        isMalicious,
        threatType,
        confidence,
        scannedAt: new Date().toISOString(),
        engine: "MailGuard AI Sandbox (Mocked)",
      }
    };
  }
}
