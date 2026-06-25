A full-stack URL shortener with real-time click analytics, Redis-based rate limiting, and a one-command Docker setup.

**Live Demo → 
- **Frontend:**[snipurl.vercel.app](https://url-shortener-one-sand.vercel.app/)**
- **Backend:** https://url-shortener-backend-rxwu.onrender.com

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Backend | Node.js, Express.js, Redis, Render |
| Frontend | React, Vite, Tailwind CSS, Chart.js, Vercel |
| DevOps | Docker, Docker Compose, Upstash |

---

## Features

- Shorten any URL instantly with a 7-character unique ID
- Custom aliases and optional link expiry via Redis TTL
- Atomic click tracking using Redis INCR (race-condition safe)
- Analytics dashboard with hourly click history chart
- Sliding window rate limiter — built with Redis, no external library
- One-command local setup via Docker Compose

---

## Quick Start

**With Docker (recommended)**
```bash
git clone https://github.com/Harshit2N/shortener.git
cd shortener
cp .env.example .env
docker compose up --build
```

| Service | URL |
|---|---|
| Backend API | http://localhost:3000 |
| Redis GUI | http://localhost:8081 |

**Without Docker**
```bash
# Start Redis
docker run -d -p 6379:6379 --name redis redis:7-alpine

# Backend
cd backend && npm install && npm run dev

# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

---

## Environment Variables

**Backend (`.env`)**
```env
PORT=3000
BASE_URL=http://localhost:3000
NODE_ENV=development
REDIS_URL=redis://localhost:6379
ALLOWED_ORIGIN=http://localhost:5173
```

**Frontend (`frontend/.env`)**
```env
VITE_API_URL=http://localhost:3000
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/shorten` | Create a short URL |
| `GET` | `/:shortId` | Redirect to original URL |
| `GET` | `/preview/:shortId` | Preview destination without redirecting |
| `GET` | `/api/analytics/:shortId` | Get click analytics |
| `DELETE` | `/api/shorten/:shortId` | Delete a short URL |
| `GET` | `/health` | Health check |

**POST `/api/shorten`**
```json
// Request
{ "url": "https://example.com", "alias": "my-link", "ttl": 86400 }

// Response 201
{ "success": true, "shortId": "aB3_xZ9", "shortUrl": "http://localhost:3000/aB3_xZ9" }
```

---

## How Redis Is Used

```
url:<shortId>               →  original long URL (with optional TTL)
clicks:<shortId>            →  total click count  (atomic INCR)
clicks:history:<shortId>    →  timestamps list    (capped at 500)
ratelimit:<ip>              →  request counter    (expires in 60s)
all:urls                    →  set of all shortIds
```

---

## Deployment

| Service | Platform |
|---|---|
| Backend | Render (Docker) |
| Frontend | Vercel |
| Redis | Upstash |

---

## Project Structure

```
url-shortener/
├── backend/
│   ├── src/
│   │   ├── routes/        # shorten.js, redirect.js
│   │   ├── middleware/    # rateLimiter.js
│   │   ├── services/      # redis.js
│   │   └── index.js
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/         # Home.jsx, Dashboard.jsx
│   │   ├── components/    # ClickChart.jsx
│   │   └── api/           # api.js
│   └── vercel.json
└── docker-compose.yml
```
## Preview
<img width="1440" height="900" alt="image" src="https://github.com/user-attachments/assets/24a58eac-7966-435d-903b-d270bbc11137" />
<img width="1440" height="900" alt="image" src="https://github.com/user-attachments/assets/f32bfa56-700c-4ce1-9e74-973af6563f28" />



---

Built by [Harshit Singh Shakya](https://github.com/Harshit2N)
