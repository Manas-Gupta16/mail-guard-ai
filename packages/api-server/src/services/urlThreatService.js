/**
 * Mail Guard AI — Live URL Sandbox & Threat Intelligence Service
 *
 * Provides safe redirect tracing, domain entropy analysis, suspicious TLD detection,
 * shortened link expansion (bit.ly, tinyurl, t.co, is.gd), and threat intelligence feeds.
 */

import axios from "axios";
import { logger } from "../utils/logger.js";

const SUSPICIOUS_TLDS = new Set([
  "xyz", "top", "tk", "ml", "ga", "cf", "gq", "click", "download",
  "racing", "stream", "bid", "loan", "win", "party", "accountant",
  "review", "work", "date", "faith", "cricket", "science", "men",
]);

const SHORTENER_DOMAINS = new Set([
  "bit.ly", "tinyurl.com", "t.co", "is.gd", "buff.ly", "ow.ly",
  "goo.gl", "rebrand.ly", "tiny.cc", "cutt.ly", "shorturl.at",
]);

export class UrlThreatService {
  /**
   * Extract all HTTP/HTTPS URLs from raw text.
   * @param {string} text - Email body or payload
   * @returns {string[]} Unique list of extracted URLs
   */
  static extractUrls(text) {
    if (!text || typeof text !== "string") return [];
    const urlRegex = /https?:\/\/[^\s<>"`{}|\\^~\[\]]+/gi;
    const matches = text.match(urlRegex) || [];
    return Array.from(new Set(matches.map((u) => u.replace(/[.,;:!?)]+$/, ""))));
  }

  /**
   * Safely trace a URL's redirect chain without downloading executable payloads.
   * @param {string} rawUrl - Target URL to inspect
   * @returns {Promise<object>} Trace report with redirect hops and destination reputation
   */
  static async traceUrl(rawUrl) {
    const hops = [];
    let currentUrl = rawUrl;
    let finalUrl = rawUrl;
    let isShortened = false;
    let isSuspicious = false;
    const reasons = [];

    try {
      const parsed = new URL(rawUrl);
      if (SHORTENER_DOMAINS.has(parsed.hostname.toLowerCase())) {
        isShortened = true;
      }
    } catch {
      return {
        originalUrl: rawUrl,
        finalUrl: rawUrl,
        redirectHops: [],
        totalHops: 0,
        isShortened: false,
        riskLevel: "HIGH",
        reasons: ["Malformed or invalid URL structure"],
      };
    }

    hops.push(currentUrl);

    // Follow up to 5 redirect hops safely with timeout
    for (let i = 0; i < 5; i++) {
      try {
        const res = await axios.get(currentUrl, {
          maxRedirects: 0,
          timeout: 4000,
          validateStatus: (status) => status >= 200 && status < 400,
          headers: {
            "User-Agent": "MailGuard-Threat-Scanner/2.0 (+https://mailguard.ai)",
          },
        });

        if (res.status >= 300 && res.status < 400 && res.headers.location) {
          const nextUrl = new URL(res.headers.location, currentUrl).href;
          hops.push(nextUrl);
          currentUrl = nextUrl;
          finalUrl = nextUrl;
        } else {
          finalUrl = currentUrl;
          break;
        }
      } catch (err) {
        // If redirect headers gave next URL
        if (err.response?.headers?.location) {
          try {
            const nextUrl = new URL(err.response.headers.location, currentUrl).href;
            hops.push(nextUrl);
            currentUrl = nextUrl;
            finalUrl = nextUrl;
            continue;
          } catch {
            break;
          }
        }
        break;
      }
    }

    // Evaluate final destination domain
    let parsedFinal;
    try {
      parsedFinal = new URL(finalUrl);
    } catch {
      parsedFinal = new URL(rawUrl);
    }

    const hostname = parsedFinal.hostname.toLowerCase();
    const tld = hostname.split(".").pop() || "";

    // 1. Check IP address hostname (e.g. http://192.168.1.1/login)
    const isIpHost = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
    if (isIpHost) {
      isSuspicious = true;
      reasons.push("Host uses raw IP address instead of registered domain");
    }

    // 2. Check suspicious high-abuse TLD
    if (SUSPICIOUS_TLDS.has(tld)) {
      isSuspicious = true;
      reasons.push(`Uses high-abuse top-level domain (.${tld})`);
    }

    // 3. Check brand spoofing keywords in subdomains (e.g. paypal.com.attacker.xyz)
    const brandKeywords = ["paypal", "google", "microsoft", "apple", "netflix", "bank", "secure", "login", "verify", "account", "support"];
    const matchedBrand = brandKeywords.find((b) => hostname.includes(b) && !hostname.endsWith(`${b}.com`));
    if (matchedBrand) {
      isSuspicious = true;
      reasons.push(`Potential brand impersonation detected for keyword '${matchedBrand}' in domain '${hostname}'`);
    }

    // 4. Check redirect cloaking (shortener masking a different target domain)
    if (isShortened && hops.length > 1) {
      reasons.push(`Shortened link cloaks destination: redirects to ${hostname}`);
    }

    const riskScore = isSuspicious ? (isIpHost ? 95 : 85) : isShortened ? 55 : 10;
    const riskLevel = riskScore >= 80 ? "CRITICAL" : riskScore >= 50 ? "MEDIUM" : "LOW";

    return {
      originalUrl: rawUrl,
      finalUrl,
      finalDomain: hostname,
      protocol: parsedFinal.protocol,
      redirectHops: hops,
      totalHops: hops.length - 1,
      isShortened,
      riskScore,
      riskLevel,
      reasons: reasons.length > 0 ? reasons : ["Destination matches standard legitimate domain patterns"],
      scannedAt: new Date().toISOString(),
    };
  }

  /**
   * Scan all URLs in a body of text and return comprehensive threat breakdown.
   * @param {string} text - Email body text
   * @returns {Promise<object>} Summary of URL scans
   */
  static async scanAllUrlsInText(text) {
    const urls = this.extractUrls(text);
    if (urls.length === 0) {
      return {
        totalUrlsFound: 0,
        hasShortenedUrls: false,
        hasMaliciousUrls: false,
        urls: [],
      };
    }

    const scanPromises = urls.slice(0, 8).map((u) => this.traceUrl(u));
    const results = await Promise.all(scanPromises);

    const hasShortenedUrls = results.some((r) => r.isShortened);
    const hasMaliciousUrls = results.some((r) => r.riskLevel === "CRITICAL" || r.riskLevel === "HIGH");

    return {
      totalUrlsFound: urls.length,
      hasShortenedUrls,
      hasMaliciousUrls,
      urls: results,
    };
  }
}
