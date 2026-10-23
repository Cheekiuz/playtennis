// ==UserScript==
// @name         PlayTennis: Save Facebook event
// @namespace    https://www.playtennis.lt
// @version      1.3.0
// @description  Adds a Save to PlayTennis button on Facebook event pages
// @author       PlayTennis
// @match        https://www.facebook.com/*
// @match        https://facebook.com/*
// @match        https://web.facebook.com/*
// @match        https://m.facebook.com/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function () {
  const CATCH_URL = "https://www.playtennis.lt/admin/facebook-catch";
  const BUTTON_ID = "playtennis-save-event-btn";
  const BADGE_ID = "playtennis-helper-badge";
  const TZ = "Europe/Vilnius";

  const EN_MONTHS = {
    january: 1,
    jan: 1,
    february: 2,
    feb: 2,
    march: 3,
    mar: 3,
    april: 4,
    apr: 4,
    may: 5,
    june: 6,
    jun: 6,
    july: 7,
    jul: 7,
    august: 8,
    aug: 8,
    september: 9,
    sep: 9,
    october: 10,
    oct: 10,
    november: 11,
    nov: 11,
    december: 12,
    dec: 12,
  };

  const LT_MONTHS = {
    sausio: 1,
    vasario: 2,
    kovo: 3,
    balandzio: 4,
    balandžio: 4,
    geguzes: 5,
    gegužės: 5,
    birzelio: 6,
    birželio: 6,
    liepos: 7,
    rugpjucio: 8,
    rugpjūčio: 8,
    rugsejo: 9,
    rugsėjo: 9,
    spalio: 10,
    lapkricio: 11,
    lapkričio: 11,
    grudzio: 12,
    gruodžio: 12,
  };

  function eventIdFromUrl(href) {
    const match = String(href || "").match(/\/events\/(?:[^/]+\/)?(\d{8,})/i);
    return match ? match[1] : null;
  }

  function isEventPage() {
    return Boolean(eventIdFromUrl(location.href));
  }

  function meta(sel) {
    const el = document.querySelector(sel);
    return (el && (el.getAttribute("content") || el.content)) || "";
  }

  function jsonLd() {
    const nodes = document.querySelectorAll('script[type="application/ld+json"]');
    for (const node of nodes) {
      try {
        const data = JSON.parse(node.textContent || "");
        const list = Array.isArray(data) ? data : [data];
        for (const row of list) {
          if (!row) continue;
          const type = row["@type"];
          if (type === "Event" || (Array.isArray(type) && type.includes("Event"))) return row;
        }
      } catch {
        /* ignore */
      }
    }
    return null;
  }

  function ymd(year, month, day) {
    if (!year || month < 1 || month > 12 || day < 1 || day > 31) return "";
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function formatInTz(date) {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  }

  function monthNumber(value) {
    const key = String(value || "").toLowerCase();
    return EN_MONTHS[key] || LT_MONTHS[key] || 0;
  }

  function toCalendarDate(value) {
    if (value == null || value === "") return "";
    const trimmed = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

    // Keep Facebook's local calendar day when an offset is present.
    const offsetIso = trimmed.match(/^(\d{4}-\d{2}-\d{2})T[0-9:.]+[+-]\d{2}:?\d{2}$/);
    if (offsetIso) return offsetIso[1];

    const utcIso = trimmed.match(/^(\d{4}-\d{2}-\d{2})T[0-9:.]+Z$/i);
    if (utcIso) {
      const parsed = Date.parse(trimmed);
      if (Number.isFinite(parsed)) return formatInTz(new Date(parsed));
    }

    const isoPrefix = trimmed.match(/^(\d{4}-\d{2}-\d{2})[T\s]/);
    if (isoPrefix) return isoPrefix[1];

    if (/^\d{10}$/.test(trimmed)) return formatInTz(new Date(Number(trimmed) * 1000));
    if (/^\d{13}$/.test(trimmed)) return formatInTz(new Date(Number(trimmed)));

    const fromText = firstNamedDate(trimmed);
    if (fromText) return fromText;

    const parsed = Date.parse(trimmed);
    if (!Number.isFinite(parsed)) return "";
    return formatInTz(new Date(parsed));
  }

  function firstNamedDate(text) {
    if (!text) return "";
    const yearFallback = Number((text.match(/\b(20\d{2})\b/) || [])[1] || new Date().getFullYear());
    const patterns = [
      /\b(?:(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*),?\s+(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(20\d{2})\b/gi,
      /\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(20\d{2})\b/gi,
      /\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(20\d{2})\b/gi,
      /\b(20\d{2})\s*m\.?\s*(sausio|vasario|kovo|balandžio|balandzio|gegužės|geguzes|birželio|birzelio|liepos|rugpjūčio|rugpjucio|rugsėjo|rugsejo|spalio|lapkričio|lapkricio|gruodžio|grudzio)\s+(\d{1,2})/gi,
      /\b(sausio|vasario|kovo|balandžio|balandzio|gegužės|geguzes|birželio|birzelio|liepos|rugpjūčio|rugpjucio|rugsėjo|rugsejo|spalio|lapkričio|lapkricio|gruodžio|grudzio)\s+(\d{1,2})\s*d\.?/gi,
      /\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+(\d{1,2})(?:,?\s+(20\d{2}))?\b/gi,
    ];

    const hits = [];
    for (const pattern of patterns) {
      for (const match of text.matchAll(pattern)) {
        const date = dateFromGroups(match, yearFallback);
        if (date) hits.push({ index: match.index || 0, date });
      }
    }
    if (!hits.length) return "";
    hits.sort((a, b) => a.index - b.index);
    return hits[0].date;
  }

  function dateFromGroups(match, yearFallback) {
    const parts = match.slice(1).filter(Boolean);
    if (!parts.length) return "";
    if (/^20\d{2}$/.test(parts[0]) && parts[1] && parts[2]) {
      const month = monthNumber(parts[1]);
      return month ? ymd(Number(parts[0]), month, Number(parts[2])) : "";
    }
    if (monthNumber(parts[0]) && parts[1]) {
      const month = monthNumber(parts[0]);
      const day = Number(parts[1]);
      const year = parts[2] && /^20\d{2}$/.test(parts[2]) ? Number(parts[2]) : yearFallback;
      return ymd(year, month, day);
    }
    if (/^\d{1,2}$/.test(parts[0]) && monthNumber(parts[1])) {
      const day = Number(parts[0]);
      const month = monthNumber(parts[1]);
      const year = parts[2] && /^20\d{2}$/.test(parts[2]) ? Number(parts[2]) : yearFallback;
      return ymd(year, month, day);
    }
    return "";
  }

  function headerText() {
    const main = document.querySelector('[role="main"]') || document.querySelector("main") || document.body;
    if (!main) return "";
    // Event date usually sits near the top of the event column, not deep in the description.
    return (main.innerText || "").slice(0, 1200);
  }

  function findEmbeddedEventDate(eventId) {
    const html = document.documentElement.innerHTML;
    const id = String(eventId);

    const timestampPatterns = [
      new RegExp(`"event_id"\\s*:\\s*"?${id}"?[\\s\\S]{0,2500}?"start_timestamp"\\s*:\\s*(\\d{10})`, "i"),
      new RegExp(`"start_timestamp"\\s*:\\s*(\\d{10})[\\s\\S]{0,2500}?"event_id"\\s*:\\s*"?${id}"?`, "i"),
      new RegExp(`"id"\\s*:\\s*"${id}"[\\s\\S]{0,2500}?"start_timestamp"\\s*:\\s*(\\d{10})`, "i"),
      new RegExp(`"start_timestamp"\\s*:\\s*(\\d{10})[\\s\\S]{0,800}?"${id}"`, "i"),
    ];
    for (const pattern of timestampPatterns) {
      const match = html.match(pattern);
      if (match) {
        const date = toCalendarDate(match[1]);
        if (date) return date;
      }
    }

    const sentencePatterns = [
      new RegExp(`"event_id"\\s*:\\s*"?${id}"?[\\s\\S]{0,2500}?"day_time_sentence"\\s*:\\s*"([^"]+)"`, "i"),
      new RegExp(`"day_time_sentence"\\s*:\\s*"([^"]+)"[\\s\\S]{0,2500}?"event_id"\\s*:\\s*"?${id}"?`, "i"),
      /"day_time_sentence"\s*:\s*"([^"]+)"/i,
    ];
    for (const pattern of sentencePatterns) {
      const match = html.match(pattern);
      if (match) {
        const date = toCalendarDate(match[1]) || firstNamedDate(match[1]);
        if (date) return date;
      }
    }

    const startTimeMatch = html.match(new RegExp(`"${id}"[\\s\\S]{0,1200}?"start_time"\\s*:\\s*(\\d{10})`, "i"));
    if (startTimeMatch) return toCalendarDate(startTimeMatch[1]);

    return "";
  }

  function guessCity(text) {
    const body = text || "";
    if (/Kaunas/i.test(body)) return "Kaunas";
    if (/Klaip/i.test(body)) return "Klaipėda";
    if (/Vilnius|SEB Arena|Sportima/i.test(body)) return "Vilnius";
    if (/Rīga|Riga/i.test(body)) return "Rīga";
    if (/Tallinn/i.test(body)) return "Tallinn";
    return "";
  }

  function sendToPlayTennis() {
    const ld = jsonLd();
    const id = eventIdFromUrl(location.href);
    if (!id) {
      alert("Open a Facebook event page first (URL should contain /events/123...).");
      return;
    }
    const url = `https://www.facebook.com/events/${id}`;
    const header = headerText();

    let title = (ld && ld.name) || meta('meta[property="og:title"]') || document.title || "";
    title = title.replace(/\s*\|\s*Facebook\s*$/i, "").trim();

    // Priority: Facebook embedded timestamp for THIS event → JSON-LD → meta → visible header text.
    let start =
      findEmbeddedEventDate(id) ||
      toCalendarDate(ld && ld.startDate) ||
      toCalendarDate(meta('meta[property="event:start_time"]')) ||
      firstNamedDate(header);

    let end =
      toCalendarDate(ld && ld.endDate) ||
      toCalendarDate(meta('meta[property="event:end_time"]')) ||
      start;

    const desc =
      (ld && ld.description) || meta('meta[property="og:description"]') || meta('meta[name="description"]') || "";

    let venue = "";
    let city = "";
    if (ld && ld.location) {
      if (typeof ld.location === "string") venue = ld.location;
      else {
        venue = ld.location.name || "";
        city =
          (ld.location.address &&
            (ld.location.address.addressLocality || ld.location.address.addressRegion)) ||
          "";
      }
    }
    if (!city) city = guessCity(header + "\n" + desc);

    if (!start) {
      alert("Could not find the event date on this page. Wait for it to finish loading, then try again.");
      return;
    }

    const confirmed = window.confirm(
      `Save to PlayTennis?\n\n${title}\nDate: ${start}${end && end !== start ? ` → ${end}` : ""}\n${city ? `City: ${city}\n` : ""}\nIf the date is wrong, click Cancel and edit it later in admin.`,
    );
    if (!confirmed) return;

    const payload = {
      title,
      startDate: start,
      endDate: end || start,
      city: city || "",
      venue: venue || "",
      description: desc || "",
      url,
    };
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    location.href = `${CATCH_URL}#fb=${encoded}`;
  }

  function ensureBadge() {
    if (document.getElementById(BADGE_ID)) return;
    const badge = document.createElement("div");
    badge.id = BADGE_ID;
    badge.textContent = "PT";
    badge.title = "PlayTennis helper is active (v1.3.0)";
    badge.style.cssText = [
      "position:fixed",
      "top:12px",
      "right:12px",
      "z-index:2147483647",
      "width:28px",
      "height:28px",
      "border-radius:999px",
      "background:#c8f135",
      "color:#0f172a",
      "font:700 11px/28px system-ui,sans-serif",
      "text-align:center",
      "box-shadow:0 4px 14px rgba(0,0,0,.35)",
      "pointer-events:none",
    ].join(";");
    document.documentElement.appendChild(badge);
  }

  function ensureButton() {
    ensureBadge();
    const existing = document.getElementById(BUTTON_ID);
    if (!isEventPage()) {
      if (existing) existing.remove();
      return;
    }
    if (existing) return;

    const btn = document.createElement("button");
    btn.id = BUTTON_ID;
    btn.type = "button";
    btn.textContent = "Save to PlayTennis";
    btn.style.cssText = [
      "position:fixed",
      "right:16px",
      "bottom:16px",
      "z-index:2147483647",
      "padding:12px 16px",
      "border:0",
      "border-radius:999px",
      "background:#c8f135",
      "color:#0f172a",
      "font:600 14px/1.2 system-ui,sans-serif",
      "box-shadow:0 8px 24px rgba(0,0,0,.35)",
      "cursor:pointer",
    ].join(";");
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      sendToPlayTennis();
    });
    document.documentElement.appendChild(btn);
  }

  ensureButton();
  setInterval(ensureButton, 1000);
  window.addEventListener("popstate", ensureButton);
})();
