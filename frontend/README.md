# Impostor: Web Front End

React + TypeScript + Vite, same structure as the class "Getting Started with MERN A" tutorial.
Talks to the API in `../backend` (spec: `../docs/openapi.yaml`).

## Run locally

```bash
# terminal 1: the API (needs MongoDB and backend/.env, see backend/.env.example)
cd backend && npm install && npm run dev

# terminal 2: the website
cd frontend && npm install && npm run dev   # http://localhost:5173, calls the API at http://localhost:5000
```

With no `BREVO_API_KEY` in `backend/.env`, verification and reset emails are printed in
terminal 1. Copy the link from there into the browser.

## Pages

| Path | What it is |
|---|---|
| `/` | Log in (email + password). First page on initial access. |
| `/register` | Create an account, then "check your email" |
| `/verify?token=…` | Opened from the verification email |
| `/forgot-password`, `/reset-password?token=…` | Password reset by email |
| `/login-error` | Generic "email or password is incorrect" page |
| `/home` | Host a room (pick a word theme) or join with a code. Protected. |
| `/game/:code` | The game: lobby → your word → vote → results → next round. Protected. |

All API calls are in `src/lib/api.ts`. The game page checks for updates every 1.5 s
(`src/lib/useGame.ts`). Holiday themes restyle the page (`src/lib/holiday.ts` and the
"Holiday skins" section at the end of `src/index.css`).

## Deploy to the droplet (hammrti.me)

```bash
npm run build                       # outputs dist/
scp -r dist/* user@hammrti.me:/var/www/html/
```

nginx forwards `/api` to Node on port 5000 and sends every other path to `index.html`
so React Router works on refresh (the email links open `/verify` and `/reset-password`
directly, so this matters):

```nginx
location /api/ { proxy_pass http://localhost:5000; proxy_set_header Host $host; }
location /     { try_files $uri /index.html; }
```
