// ==UserScript==
// @name         PlayTennis: Save Facebook event
// @namespace    https://www.playtennis.lt
// @version      1.2.0
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
    february: 2,
    march: 3,
    april: 4,
    may: 5,
    june: 6,
    july: 7,
    august: 8,
    september: 9,
    october: 10,
    november: 11,
    december: 12,
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

  function toCalendarDate(value) {
    if (value == null || value === "") return "";
    const trimmed = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

    const isoPrefix = trimmed.match(/^(\d{4}-\d{2}-\d{2})[T\s]/);
    if (isoPrefix) {
      if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(trimmed)) {
        const parsed = Date.parse(trimmed);
        if (Number.isFinite(parsed)) return formatInTz(new Date(parsed));
      }
      return isoPrefix[1];
    }

    if (/^\d{10}$/.test(trimmed)) return formatInTz(new Date(Number(trimmed) * 1000));
    if (/^\d{13}$/.test(trimmed)) return formatInTz(new Date(Number(trimmed)));

    const fromText = extractFromText(trimmed);
    if (fromText) return fromText;

    const parsed = Date.parse(trimmed);
    if (!Number.isFinite(parsed)) return "";
    return formatInTz(new Date(parsed));
  }

  function extractFromText(text) {
    if (!text) return "";
    const named = [];
    const numeric = [];

    for (const m of text.matchAll(
      /\b(?:(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*,?\s+)?(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})\b/gi,
    )) {
      named.push(ymd(Number(m[3]), EN_MONTHS[m[2].toLowerCase()], Number(m[1])));
    }

    for (const m of text.matchAll(
      /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(20\d{2})\b/gi,
    )) {
      named.push(ymd(Number(m[3]), EN_MONTHS[m[1].toLowerCase()], Number(m[2])));
    }

    for (const m of text.matchAll(
      /\b(20\d{2})\s*m\.?\s*(sausio|vasario|kovo|balandžio|balandzio|gegužės|geguzes|birželio|birzelio|liepos|rugpjūčio|rugpjucio|rugsėjo|rugsejo|spalio|lapkričio|lapkricio|gruodžio|grudzio)\s+(\d{1,2})/gi,
    )) {
      named.push(ymd(Number(m[1]), LT_MONTHS[m[2].toLowerCase()], Number(m[3])));
    }

    const yearHint = text.match(/\b(20\d{2})\b/);
    const year = yearHint ? Number(yearHint[1]) : new Date().getFullYear();
    for (const m of text.matchAll(
      /\b(sausio|vasario|kovo|balandžio|balandzio|gegužės|geguzes|birželio|birzelio|liepos|rugpjūčio|rugpjucio|rugsėjo|rugsejo|spalio|lapkričio|lapkricio|gruodžio|grudzio)\s+(\d{1,2})\s*d\.?/gi,
    )) {
      named.push(ymd(year, LT_MONTHS[m[1].toLowerCase()], Number(m[2])));
    }

    for (const m of text.matchAll(/\b(20\d{2})[./-](\d{1,2})[./-](\d{1,2})\b/g)) {
      numeric.push(ymd(Number(m[1]), Number(m[2]), Number(m[3])));
    }

    const today = formatInTz(new Date());
    const pick = (values) => {
      const unique = [...new Set(values.filter(Boolean))];
      if (!unique.length) return "";
      const upcoming = unique.filter((d) => d >= today).sort();
      return upcoming[0] || unique.sort().at(-1) || "";
    };

    return pick(named) || pick(numeric);
  }

  function mainText() {
    const main = document.querySelector('[role="main"]') || document.querySelector("main");
    if (main && main.innerText) return main.innerText.slice(0, 4000);
    return (document.body && document.body.innerText ? document.body.innerText.slice(0, 4000) : "") || "";
  }

  function timeElementsDate() {
    const root = document.querySelector('[role="main"]') || document;
    const nodes = root.querySelectorAll("time[datetime]");
    for (const node of nodes) {
      const value = toCalendarDate(node.getAttribute("datetime") || "");
      if (value) return value;
    }
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
    const scoped = mainText();

    let title = (ld && ld.name) || meta('meta[property="og:title"]') || document.title || "";
    title = title.replace(/\s*\|\s*Facebook\s*$/i, "").trim();

    let start =
      toCalendarDate(ld && ld.startDate) ||
      toCalendarDate(meta('meta[property="event:start_time"]')) ||
      timeElementsDate() ||
      extractFromText(scoped);

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
    if (!city) city = guessCity(scoped);

    if (!start) {
      alert("Could not find the event date on this page. Wait for it to finish loading, then try again.");
      return;
    }

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
    badge.title = "PlayTennis helper is active";
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
