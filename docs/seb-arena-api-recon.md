# SEB Arena API Reconnaissance

> **Status:** No public API documented. Integration pending official access or authenticated endpoint discovery.
> **Do not commit session tokens, cookies, or credentials to this file.**

## System overview

| Item | Value |
|------|-------|
| Booking portal | https://book.sebarena.lt/ |
| Tennis booking route | `#/rezervuoti/tenisas` |
| Vendor | Digitouch (https://more.digitouch.lt/en/seb-arena/) |
| Operator | Teniso Pasaulis UAB |
| Auth | Username/password, Google, Facebook — login required |
| Mobile app | SEB arena (iOS/Android) — same backend |

## Known facility data (PlayTennis mapping)

### SEB Arena indoor (Ąžuolyno g. 7)

- **28 tennis courts** total indoors
- PlayTennis court IDs: `1`–`28` (map to provider IDs once confirmed)
- Surfaces: 22 hard + 6 carpet (marketing site; verify in booking UI)

### Bernardinų sodo kortai (seasonal)

- 10 clay + 2 artificial grass (summer)
- Separate venue in booking system — future `seb-bernardinai` club ID

## How to capture endpoints (manual)

1. Log in at https://book.sebarena.lt/
2. Open DevTools → Network → filter **Fetch/XHR**
3. Navigate to **Tenisas** reservation and pick a date
4. Record for each request:
   - URL and HTTP method
   - Query/body parameters (date, sport, venue)
   - Response JSON shape (court id, slot start/end, status)
   - Auth mechanism (Bearer token, cookie name)
5. Paste shapes below — **redact tokens**

## Endpoint log (fill after inspection)

### Authentication

```
POST [unknown — capture from login flow]
Headers: [redacted]
Body: { username, password }
Response: { token?, session? }
```

### Availability / slot search

```
GET/POST [unknown — capture from rezervuoti/tenisas]
Params: date=YYYY-MM-DD, sport=tenisas, ...
Response shape (expected):
{
  "courts": [
    {
      "id": "provider-court-id",
      "name": "Kortas 12",
      "slots": [
        { "start": "2026-07-28T18:00:00", "end": "2026-07-28T19:00:00", "status": "available|booked|for_sale" }
      ]
    }
  ]
}
```

## PlayTennis adapter contract

[`SebArenaProvider`](../src/lib/providers/seb-arena-provider.ts) expects a **partner API** matching this normalized shape when configured via env:

```json
{
  "slots": [
    {
      "courtId": "12",
      "courtLabel": "Kortas 12",
      "start": "2026-07-28T16:00:00+03:00",
      "end": "2026-07-28T17:00:00+03:00",
      "status": "available"
    }
  ]
}
```

Env vars:

- `SEB_ARENA_API_BASE_URL` — base URL for partner feed
- `SEB_ARENA_API_TOKEN` — Bearer token (server-only)
- `SEB_ARENA_PROVIDER=mock|seb` — which provider the cron job uses

## Rate limits

- **Unknown** — start cron at 5-minute intervals; reduce if SEB/Digitouch specifies limits

## Legal

- Do not scrape production at scale without written approval
- Prefer official API or service account from Teniso Pasaulis
