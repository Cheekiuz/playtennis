// ==UserScript==
// @name         PlayTennis: Save Facebook event
// @namespace    https://www.playtennis.lt
// @version      1.6.1
// @updateURL    https://www.playtennis.lt/playtennis-facebook.user.js
// @downloadURL  https://www.playtennis.lt/playtennis-facebook.user.js
// @description  Reads the Facebook event date from a fresh copy of the event page and sends it to PlayTennis
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
  const VERSION = "1.6.1";
  const TZ = "Europe/Vilnius";

  const MONTHS = {
    january: 1, jan: 1, february: 2, feb: 2, march: 3, mar: 3, april: 4, apr: 4, may: 5,
    june: 6, jun: 6, july: 7, jul: 7, august: 8, aug: 8, september: 9, sep: 9, sept: 9,
    october: 10, oct: 10, november: 11, nov: 11, december: 12, dec: 12,
    // Lithuanian, full genitive forms and the short forms Facebook uses ("lapkr.", "spal.")
    sausio: 1, saus: 1, vasario: 2, vas: 2, kovo: 3, kov: 3, balandžio: 4, balandzio: 4, bal: 4,
    gegužės: 5, geguzes: 5, geg: 5, birželio: 6, birzelio: 6, birž: 6, bir: 6,
    liepos: 7, liep: 7, lie: 7, rugpjūčio: 8, rugpjucio: 8, rugp: 8, rgp: 8,
    rugsėjo: 9, rugsejo: 9, rugs: 9, rgs: 9, spalio: 10, spal: 10, spa: 10,
    lapkričio: 11, lapkricio: 11, lapkr: 11, lap: 11, gruodžio: 12, grudzio: 12, gruod: 12, gru: 12,
  };

  const MONTH_RE = Object.keys(MONTHS)
    .sort((a, b) => b.length - a.length)
    .join("|");

  const WEEKDAYS = {
    sunday: 0, sun: 0, monday: 1, mon: 1, tuesday: 2, tue: 2, wednesday: 3, wed: 3,
    thursday: 4, thu: 4, friday: 5, fri: 5, saturday: 6, sat: 6,
    sekmadienį: 0, sekmadienis: 0, pirmadienį: 1, pirmadienis: 1, antradienį: 2, antradienis: 2,
    trečiadienį: 3, trečiadienis: 3, ketvirtadienį: 4, ketvirtadienis: 4,
    penktadienį: 5, penktadienis: 5, šeštadienį: 6, šeštadienis: 6,
  };
  const WEEKDAY_RE = Object.keys(WEEKDAYS)
    .sort((a, b) => b.length - a.length)
    .join("|");

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

  function pickEvent(data) {
    const list = Array.isArray(data) ? data : data && data["@graph"] ? data["@graph"] : [data];
    for (const row of list) {
      if (!row) continue;
      const type = row["@type"];
      if (type === "Event" || (Array.isArray(type) && type.includes("Event")) || /Event$/.test(String(type))) return row;
    }
    return null;
  }

  function jsonLd() {
    const nodes = document.querySelectorAll('script[type="application/ld+json"]');
    for (const node of nodes) {
      try {
        const found = pickEvent(JSON.parse(node.textContent || ""));
        if (found) return found;
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

  function today() {
    return formatInTz(new Date());
  }

  function addDays(iso, days) {
    const [y, m, d] = iso.split("-").map(Number);
    return formatInTz(new Date(Date.UTC(y, m - 1, d + days, 12)));
  }

  function monthNumber(value) {
    return MONTHS[String(value || "").toLowerCase().replace(/\.$/, "")] || 0;
  }

  /** A date written without a year means the next time it happens, never a date that already passed. */
  function withInferredYear(month, day) {
    const now = today();
    const year = Number(now.slice(0, 4));
    const thisYear = ymd(year, month, day);
    return thisYear && thisYear < addDays(now, -7) ? ymd(year + 1, month, day) : thisYear;
  }

  function toCalendarDate(value) {
    if (value == null || value === "") return "";
    const trimmed = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    // Offset form: the written calendar day is Facebook's local day.
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
    return parseNamedDate(trimmed);
  }

  /** Reads a date written as text: "Saturday, November 7, 2026", "Sat, Nov 7", "2026 m. lapkričio 7 d.", "lapkr. 7 d." */
  function parseNamedDate(text) {
    if (!text) return "";
    const m = `(${MONTH_RE})\\.?`;
    const year = `(20\\d{2})`;
    const patterns = [
      // November 7, 2026 / Nov 7 2026 / Nov 7
      { re: new RegExp(`\\b${m}\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+${year})?(?![\\d:])`, "i"), order: "mdy" },
      // 7 November 2026 / 7 Nov
      { re: new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+${m}(?:,?\\s+${year})?`, "i"), order: "dmy" },
      // 2026 m. lapkričio 7 d.
      { re: new RegExp(`\\b${year}\\s*m\\.?\\s*${m}\\s+(\\d{1,2})`, "i"), order: "ymd" },
      // lapkričio 7 d. / lapkr. 7 d.
      { re: new RegExp(`\\b${m}\\s+(\\d{1,2})\\s*d\\b`, "i"), order: "md" },
    ];

    let best = null;
    for (const { re, order } of patterns) {
      const match = text.match(re);
      if (!match) continue;
      let y = 0;
      let month = 0;
      let day = 0;
      if (order === "mdy") {
        month = monthNumber(match[1]);
        day = Number(match[2]);
        y = Number(match[3] || 0);
      } else if (order === "dmy") {
        day = Number(match[1]);
        month = monthNumber(match[2]);
        y = Number(match[3] || 0);
      } else if (order === "ymd") {
        y = Number(match[1]);
        month = monthNumber(match[2]);
        day = Number(match[3]);
      } else {
        month = monthNumber(match[1]);
        day = Number(match[2]);
      }
      if (!month || !day) continue;
      const date = y ? ymd(y, month, day) : withInferredYear(month, day);
      if (!date) continue;
      // Earliest position in the text wins.
      if (!best || (match.index || 0) < best.index) best = { index: match.index || 0, date };
    }
    return best ? best.date : "";
  }

  /** Facebook writes "Today", "Tomorrow" or just "Saturday at 10:00" for events in the next days. */
  function parseRelativeDate(text) {
    const lower = String(text || "").toLowerCase().trim();
    if (!lower || lower.length > 80) return "";
    const time = "[^\\d]{0,12}\\d{1,2}[:.]\\d{2}";
    if (new RegExp(`^(?:today|šiandien|siandien)${time}`, "i").test(lower)) return today();
    if (new RegExp(`^(?:tomorrow|rytoj)${time}`, "i").test(lower)) return addDays(today(), 1);
    const match = lower.match(new RegExp(`^(?:this\\s+|next\\s+)?(${WEEKDAY_RE})${time}`, "i"));
    if (!match) return "";
    const target = WEEKDAYS[match[1].toLowerCase()];
    const now = today();
    const [y, m, d] = now.split("-").map(Number);
    const current = new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
    return addDays(now, (target - current + 7) % 7);
  }

  function isNoiseDateText(text) {
    return /registr|deadline|\biki\b|until|before|baigiasi|sale starts|interested|going|invite|share|host|discussion|comment|people responded|posted|published|created|updated/i.test(
      text,
    );
  }

  /**
   * Dates written in short UI labels after the event title.
   * Returns scored candidates; the description is never scanned.
   */
  function findWrittenDates() {
    const main = document.querySelector('[role="main"]') || document.querySelector("main") || document.body;
    if (!main) return [];
    const h1 = main.querySelector("h1");
    const nodes = Array.from(main.querySelectorAll("span, div, time, h2, h3"));
    const scored = [];
    let seenTitle = !h1;

    for (const el of nodes) {
      if (h1 && (el === h1 || h1.contains(el))) {
        seenTitle = true;
        continue;
      }
      if (!seenTitle) continue;

      const text = String(el.innerText || el.getAttribute("aria-label") || "")
        .replace(/\s+/g, " ")
        .trim();
      if (text.length < 5 || text.length > 160) continue;
      if (el.querySelector("h1")) continue;
      if (isNoiseDateText(text)) continue;

      const explicit = parseNamedDate(text);
      const date = explicit || parseRelativeDate(text);
      if (!date) continue;

      let score = explicit ? 10 : 6;
      if (new RegExp(`\\b(${WEEKDAY_RE})`, "i").test(text)) score += 12;
      if (/\b20\d{2}\b/.test(text)) score += 6;
      if (/\b\d{1,2}[:.]\d{2}\b|\bat\b|\bval\b|utc|gmt/i.test(text)) score += 4;
      if (text.length <= 60) score += 3;
      score += Math.max(0, 25 - scored.length);

      scored.push({ date, score, text: text.slice(0, 90) });
      if (scored.length >= 30) break;
    }

    return scored.sort((a, b) => b.score - a.score);
  }

  function readMeta(html, name) {
    const a = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]*content=["']([^"']*)["']`, "i"));
    if (a) return a[1];
    const b = html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${name}["']`, "i"));
    return b ? b[1] : "";
  }

  /**
   * Facebook is a single page app: the open page can still carry data from the first event you loaded.
   * Requesting the event URL again returns data for this event only.
   */
  async function readFreshEventPage(id) {
    const urls = [`https://www.facebook.com/events/${id}/`];
    for (const url of urls) {
      for (const credentials of ["omit", "include"]) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 7000);
          const response = await fetch(url, { credentials, signal: controller.signal, headers: { Accept: "text/html" } });
          clearTimeout(timer);
          if (!response.ok) continue;
          const html = await response.text();

          let ld = null;
          for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
            try {
              ld = pickEvent(JSON.parse(match[1]));
            } catch {
              /* ignore */
            }
            if (ld) break;
          }
          const result = {
            ldStart: toCalendarDate(ld && ld.startDate),
            ldEnd: toCalendarDate(ld && ld.endDate),
            metaStart: toCalendarDate(readMeta(html, "event:start_time")),
            metaEnd: toCalendarDate(readMeta(html, "event:end_time")),
            ld,
          };
          if (result.ldStart || result.metaStart) return result;
        } catch {
          /* try the next option */
        }
      }
    }
    return null;
  }

  function guessCity(text) {
    const body = text || "";
    if (/Palanga/i.test(body)) return "Palanga";
    if (/Kaunas/i.test(body)) return "Kaunas";
    if (/Klaip/i.test(body)) return "Klaipėda";
    if (/Vilnius|SEB Arena|Sportima/i.test(body)) return "Vilnius";
    if (/Rīga|Riga/i.test(body)) return "Rīga";
    if (/Tallinn/i.test(body)) return "Tallinn";
    return "";
  }

  function addCandidate(list, date, source, text) {
    if (!date) return;
    const existing = list.find((item) => item.date === date);
    if (existing) {
      existing.sources.push(source);
      return;
    }
    list.push({ date, sources: [source], text: text || "" });
  }

  async function sendToPlayTennis(button) {
    const id = eventIdFromUrl(location.href);
    if (!id) {
      alert("Open a Facebook event page first (URL should contain /events/123...).");
      return;
    }
    const label = button.textContent;
    button.textContent = "Reading event…";
    button.disabled = true;

    try {
      const url = `https://www.facebook.com/events/${id}`;
      const main = document.querySelector('[role="main"]') || document.body;
      const scoped = ((main && main.innerText) || "").slice(0, 1200);
      const ld = jsonLd();
      const fresh = await readFreshEventPage(id);
      const written = findWrittenDates();

      // Ordered by trust. The first one is used as the default, the rest are shown for review.
      const candidates = [];
      if (fresh) {
        addCandidate(candidates, fresh.ldStart, "event data");
        addCandidate(candidates, fresh.metaStart, "event meta");
      }
      if (written[0]) addCandidate(candidates, written[0].date, "page text", written[0].text);
      for (const item of written.slice(1, 3)) addCandidate(candidates, item.date, "page text (other)", item.text);
      addCandidate(candidates, toCalendarDate(ld && ld.startDate), "open page data");

      const start = candidates[0] ? candidates[0].date : "";
      if (!start) {
        alert("Could not read the event date from the page. Make sure the event finished loading, then try again.");
        return;
      }

      const sourceLd = (fresh && fresh.ld) || ld;
      let title = (sourceLd && sourceLd.name) || meta('meta[property="og:title"]') || document.title || "";
      title = title.replace(/\s*\|\s*Facebook\s*$/i, "").trim();

      let end = (fresh && (fresh.ldEnd || fresh.metaEnd)) || toCalendarDate(ld && ld.endDate) || start;
      if (end < start) end = start;

      const desc =
        (sourceLd && sourceLd.description) ||
        meta('meta[property="og:description"]') ||
        meta('meta[name="description"]') ||
        "";

      let venue = "";
      let city = "";
      if (sourceLd && sourceLd.location) {
        if (typeof sourceLd.location === "string") venue = sourceLd.location;
        else {
          venue = sourceLd.location.name || "";
          city =
            (sourceLd.location.address &&
              (sourceLd.location.address.addressLocality || sourceLd.location.address.addressRegion)) ||
            "";
        }
      }
      if (!city) city = guessCity(title + "\n" + scoped + "\n" + desc);

      const payload = {
        title,
        startDate: start,
        endDate: end || start,
        city: city || "",
        venue: venue || "",
        description: desc || "",
        url,
        dateCandidates: candidates.slice(0, 5),
        helperVersion: VERSION,
        freshRead: Boolean(fresh),
      };
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
      location.href = `${CATCH_URL}#fb=${encoded}`;
    } finally {
      button.textContent = label;
      button.disabled = false;
    }
  }

  function ensureBadge() {
    if (document.getElementById(BADGE_ID)) return;
    const badge = document.createElement("div");
    badge.id = BADGE_ID;
    badge.textContent = "PT";
    badge.title = `PlayTennis helper is active (v${VERSION})`;
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
      sendToPlayTennis(btn);
    });
    document.documentElement.appendChild(btn);
  }

  ensureButton();
  setInterval(ensureButton, 1000);
  window.addEventListener("popstate", ensureButton);
})();
