# Impostor

A party word game (COP 4331C MERN project). Everyone in a room gets the same secret word
except one player, the impostor, who only knows the theme. Players give clues out loud and
vote on who the impostor is.

Live: https://hammrti.me

| Folder | What |
|---|---|
| `backend/` | Node + Express + MongoDB API (auth with email verification, themes, games) |
| `frontend/` | React + TypeScript + Vite website |
| `mobile/` | React Native (Expo) app |
| `docs/openapi.yaml` | API spec, import into SwaggerHub |

## Run everything locally

```bash
# API (needs MongoDB running; copy backend/.env.example to backend/.env first)
cd backend && npm install && npm run dev
npm test                      # route tests (uses a test database)

# Website
cd frontend && npm install && npm run dev        # http://localhost:5173

# Mobile app
cd mobile && npm install && EXPO_PUBLIC_API_URL=http://10.0.2.2:5000 npx expo start
```

## Deploy on the droplet

1. Pull this repo on the droplet.
2. `cd backend && npm install --omit=dev`, then create `backend/.env` from `.env.example`:
   `MONGO_URI`, a long random `JWT_SECRET`, `APP_URL=https://hammrti.me`, and the Brevo
   `BREVO_API_KEY` / `EMAIL_FROM` for verification emails.
3. Stop the temporary lab API, then start this one on port 5000 (e.g. `pm2 start server.js --name impostor-api`).
4. `cd frontend && npm install && npm run build`, then copy `dist/*` to the folder nginx serves.
   nginx already forwards `/api` to port 5000 and sends other paths to `index.html`.

## Email

DigitalOcean blocks normal email (SMTP) ports, so the API sends through Brevo's HTTPS API.
Without a key (local development) the emails are printed in the API's terminal instead.
