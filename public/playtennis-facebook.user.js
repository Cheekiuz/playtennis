// ==UserScript==
// @name         PlayTennis: Save Facebook event
// @namespace    https://www.playtennis.lt
// @version      1.1.0
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

  function textDate() {
    const body = (document.body && document.body.innerText) || "";
    let m = body.match(/\b(20\d{2})[-./](\d{1,2})[-./](\d{1,2})\b/);
    if (m) return `${m[1]}-${`0${m[2]}`.slice(-2)}-${`0${m[3]}`.slice(-2)}`;
    m = body.match(
      /\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})\b/i,
    );
    if (m) {
      const months = {
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
      const mo = months[m[2].toLowerCase()];
      return `${m[3]}-${`0${mo}`.slice(-2)}-${`0${m[1]}`.slice(-2)}`;
    }
    return "";
  }

  function guessCity() {
    const body = (document.body && document.body.innerText) || "";
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

    let title = (ld && ld.name) || meta('meta[property="og:title"]') || document.title || "";
    title = title.replace(/\s*\|\s*Facebook\s*$/i, "").trim();

    let start = (ld && ld.startDate) || meta('meta[property="event:start_time"]') || "";
    let end = (ld && ld.endDate) || meta('meta[property="event:end_time"]') || start;
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
    if (!city) city = guessCity();
    if (!start) start = textDate();
    if (!start) {
      alert("Could not find the event date on this page. Wait for it to finish loading, then try again.");
      return;
    }

    const payload = {
      title,
      startDate: String(start).slice(0, 10),
      endDate: String(end || start).slice(0, 10),
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
