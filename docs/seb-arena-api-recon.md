# SEB Arena API Reconnaissance

> **Status:** Digitouch WS API reverse-engineered from book.sebarena.lt bundles (Jul 2026).
> **Do not commit session tokens, cookies, or credentials to this file.**

## System overview

| Item | Value |
|------|-------|
| Booking portal | https://book.sebarena.lt/ |
| WS API base | `https://ws.tenisopasaulis.lt/api` |
| Marketing/options API | `https://api.sebarena.lt/wp-json/data/v1/` |
| Tennis booking route | `#/rezervuoti/tenisas` |
| Vendor | Digitouch |
| Operator | Teniso Pasaulis UAB |

## Authentication

**Availability read (`placeInfoBatch`) works without login** — empty `sessionToken` is accepted.

Optional login for user-specific slots:

```
POST /v1/login
Content-Type: multipart/form-data
Body: username, password
Response: { status: "success", data: { session_token: "..." } }
```

Token validation: `POST /v1/checkToken` with FormData `session_token`.

## Places (venue surfaces)

`GET /v1/allPlacesInfo` — no auth required.

| placeID | placeName | PlayTennis club |
|---------|-----------|-----------------|
| 2 | Vidaus hard | seb-arena |
| 8 | Kilimas | seb-arena |
| 18 | Vidaus hard plėtra | seb-arena |
| 5 | Bernardinai gruntas | seb-bernardinai |
| 20 | Bernardinai sint. žolė | seb-bernardinai |

## Availability (live slots)

```
POST /v1/placeInfoBatch
Content-Type: application/json

{
  "excludeCourtName": false,
  "excludeInfoUrl": true,
  "places": [2, 8, 18],
  "dates": ["2026-07-28"],
  "salePoint": 11,
  "sessionToken": ""
}
```

`salePoint`: `11` = web, `13` = mobile app.

### Response shape

```json
{
  "status": "success",
  "data": [
    {
      "place": 2,
      "data": [[
        {
          "courtID": 1,
          "courtName": "SEB 01",
          "date": "2026-07-28",
          "timetable": {
            "18:00:00": {
              "from": "18:00:00",
              "to": "18:30:00",
              "status": "free"
            }
          }
        }
      ]]
    }
  ]
}
```

### Status mapping (Digitouch → PlayTennis)

| Digitouch | PlayTennis |
|-----------|------------|
| `free` | `available` |
| `fullsell`, `mysell` | `for_sale` |
| `full`, `my`, `mycart`, `user-time`, `user-cart-time`, `my` | `booked` |

### Court name → PlayTennis ID

| courtName | ID |
|-----------|-----|
| SEB 01 … SEB 21 | `1` … `21` |
| Centrinis (CC) | `C` |
| K1 … K6 | `K1` … `K6` |
| BS 01 gruntas … BS 10 | `1` … `10` |
| BS 11/12 sint. žolė | `11`, `12` |

## PlayTennis env

- `SEB_ARENA_PROVIDER=mock|scrape|seb`
- `SEB_ARENA_SALE_POINT=11` (optional, default 11)
- `SEB_ARENA_BOOKING_USERNAME` / `SEB_ARENA_BOOKING_PASSWORD` (optional, for authenticated reads)

## Legal

- Use read-only polling at low frequency (30–60s cache)
- Prefer official API partnership long-term
