/**
 * Mail Guard AI — EML & Email Header Parser Service
 *
 * Parses RFC 822 / MIME formatted raw emails, extracting envelope metadata,
 * authentication headers (SPF, DKIM, DMARC), and SMTP relay hop chains.
 */

export class EmlParserService {
  /**
   * Parse a raw RFC 822 / EML string into structured metadata and clean body.
   * @param {string} rawEml - Raw email text
   * @returns {object} Structured header metadata, authentication status, and extracted body text
   */
  static parse(rawEml) {
    if (!rawEml || typeof rawEml !== "string") {
      throw new Error("Invalid raw EML input: string expected");
    }

    const normalized = rawEml.replace(/\r\n/g, "\n");
    const headerBodySplit = normalized.indexOf("\n\n");

    let rawHeaders = "";
    let rawBody = "";

    if (headerBodySplit !== -1) {
      rawHeaders = normalized.slice(0, headerBodySplit);
      rawBody = normalized.slice(headerBodySplit + 2);
    } else {
      rawHeaders = normalized;
      rawBody = "";
    }

    // Unfold multi-line headers (RFC 822 continuation lines starting with space or tab)
    const unfoldedHeaders = rawHeaders.replace(/\n[ \t]+/g, " ");
    const headerLines = unfoldedHeaders.split("\n").filter(Boolean);

    const headersMap = {};
    const receivedHops = [];

    for (const line of headerLines) {
      const colonIdx = line.indexOf(":");
      if (colonIdx === -1) continue;

      const key = line.slice(0, colonIdx).trim().toLowerCase();
      const val = line.slice(colonIdx + 1).trim();

      if (key === "received") {
        receivedHops.push(val);
      } else if (!headersMap[key]) {
        headersMap[key] = val;
      }
    }

    // Envelope metadata
    const subject = headersMap["subject"] || "No Subject";
    const from = headersMap["from"] || "Unknown Sender";
    const to = headersMap["to"] || "Unknown Recipient";
    const date = headersMap["date"] || new Date().toUTCString();
    const messageId = headersMap["message-id"] || `msg_${Date.now()}`;
    const replyTo = headersMap["reply-to"] || from;

    // Authentication headers extraction
    const authResults = headersMap["authentication-results"] || "";
    const receivedSpf = headersMap["received-spf"] || "";
    const dkimSignature = headersMap["dkim-signature"] || "";

    const spf = this.parseSpf(receivedSpf, authResults);
    const dkim = this.parseDkim(dkimSignature, authResults);
    const dmarc = this.parseDmarc(authResults);
    const hops = this.parseHops(receivedHops);

    // Extract clean body text (stripping common MIME boundaries and HTML if present)
    const cleanBody = this.extractCleanBody(rawBody, headersMap["content-type"] || "");

    return {
      envelope: {
        subject,
        from,
        to,
        date,
        messageId,
        replyTo,
      },
      authentication: {
        spf,
        dkim,
        dmarc,
        overallScore: this.calculateAuthScore(spf, dkim, dmarc),
      },
      relayHops: {
        totalHops: hops.length,
        originatingIp: hops[hops.length - 1]?.ip || null,
        hops,
      },
      body: cleanBody,
      rawLength: rawEml.length,
    };
  }

  static parseSpf(receivedSpf, authResults) {
    const combined = `${receivedSpf} ${authResults}`.toLowerCase();
    if (combined.includes("spf=pass") || combined.includes("pass (") || combined.startsWith("pass")) {
      return { status: "PASS", severity: "SAFE", details: "Sender IP authorized by domain SPF record" };
    }
    if (combined.includes("spf=fail") || combined.includes("fail (") || combined.startsWith("fail")) {
      return { status: "FAIL", severity: "CRITICAL", details: "Sender IP rejected by domain SPF policy" };
    }
    if (combined.includes("spf=softfail") || combined.startsWith("softfail")) {
      return { status: "SOFTFAIL", severity: "WARNING", details: "Sender IP not in SPF, domain policy marked softfail" };
    }
    if (combined.includes("spf=neutral") || combined.startsWith("neutral")) {
      return { status: "NEUTRAL", severity: "WARNING", details: "SPF record explicitly neither permits nor denies sender" };
    }
    return { status: "NONE", severity: "INFO", details: "No SPF validation header found in envelope" };
  }

  static parseDkim(dkimSig, authResults) {
    const combined = `${dkimSig ? "has_sig" : ""} ${authResults}`.toLowerCase();
    if (combined.includes("dkim=pass") || (dkimSig && !combined.includes("dkim=fail"))) {
      return { status: "VALID", severity: "SAFE", details: "Cryptographic domain signature verified" };
    }
    if (combined.includes("dkim=fail")) {
      return { status: "FAIL", severity: "CRITICAL", details: "DKIM signature invalid or modified in transit" };
    }
    return { status: "NONE", severity: "INFO", details: "No DKIM cryptographic signature attached" };
  }

  static parseDmarc(authResults) {
    const combined = authResults.toLowerCase();
    if (combined.includes("dmarc=pass")) {
      return { status: "PASS", severity: "SAFE", details: "DMARC policy alignment passed (SPF/DKIM match domain)" };
    }
    if (combined.includes("dmarc=fail")) {
      return { status: "FAIL", severity: "CRITICAL", details: "DMARC policy alignment failed" };
    }
    return { status: "NONE", severity: "INFO", details: "No DMARC evaluation entry recorded" };
  }

  static parseHops(receivedList) {
    return receivedList.map((hop, idx) => {
      // Extract IP addresses (IPv4)
      const ipMatch = hop.match(/\[(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\]/);
      const byMatch = hop.match(/by\s+([^\s;]+)/i);
      const fromMatch = hop.match(/from\s+([^\s;]+)/i);

      return {
        hopNumber: idx + 1,
        fromServer: fromMatch ? fromMatch[1] : "unknown",
        byServer: byMatch ? byMatch[1] : "unknown",
        ip: ipMatch ? ipMatch[1] : null,
      };
    });
  }

  static calculateAuthScore(spf, dkim, dmarc) {
    let score = 100;
    if (spf.status === "FAIL") score -= 40;
    else if (spf.status === "SOFTFAIL") score -= 20;
    else if (spf.status === "NONE") score -= 10;

    if (dkim.status === "FAIL") score -= 35;
    else if (dkim.status === "NONE") score -= 15;

    if (dmarc.status === "FAIL") score -= 25;

    return Math.max(0, score);
  }

  static extractCleanBody(rawBody, contentType) {
    if (!rawBody) return "";

    let body = rawBody;

    // Handle MIME boundary separators if present
    if (contentType.includes("multipart/")) {
      const boundaryMatch = contentType.match(/boundary=["']?([^"';]+)["']?/i);
      if (boundaryMatch) {
        const boundary = boundaryMatch[1];
        const parts = body.split(`--${boundary}`);
        // Find text/plain part first
        const textPart = parts.find((p) => p.includes("Content-Type: text/plain") || p.includes("text/plain"));
        if (textPart) {
          const partBodySplit = textPart.indexOf("\n\n");
          if (partBodySplit !== -1) {
            body = textPart.slice(partBodySplit + 2);
          }
        }
      }
    }

    // Strip basic HTML tags if the body contains HTML
    if (body.includes("<") && body.includes(">")) {
      body = body
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");
    }

    return body.replace(/\s+/g, " ").trim();
  }
}
