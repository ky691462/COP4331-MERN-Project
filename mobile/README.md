# Impostor: Mobile App

React Native with Expo (SDK 58) and Expo Router. Same API, same look and same game as the
website: log in, host a room with a word theme (holiday themes restyle the app), join by
code or by scanning the room QR code, see your word, vote, see results.

## Run it

```bash
cd mobile
npm install
npx expo start
```

Then either:

- **Android emulator** (Android Studio → Device Manager → start a phone), press `a` in the terminal.
- **Your phone**: install **Expo Go**, then scan the QR code in the terminal (same Wi-Fi as your computer).
- **iOS simulator** (Mac with Xcode): press `i`.

By default the app talks to the live API at `https://hammrti.me`. To use a backend running
on your computer instead:

```bash
EXPO_PUBLIC_API_URL=http://10.0.2.2:5000 npx expo start        # Android emulator
EXPO_PUBLIC_API_URL=http://<your-computer-ip>:5000 npx expo start   # real phone
```

The QR scanner needs a real phone's camera; on an emulator, type the room code instead.

## Demo tip

Host a room on the website on the projector, then scan its QR code with the phone app to join.
Both clients play in the same game.

## Code map

| Path | What |
|---|---|
| `src/app/` | Screens (Expo Router: each file is a screen) |
| `src/app/game/[code].tsx` | The game: lobby → your word → vote → results |
| `src/lib/api.ts` | Every API call |
| `src/lib/app-context.tsx` | Login (token kept in the phone's secure storage), light/dark, holiday skin |
| `src/lib/colors.ts` | Brand and holiday colors (same values as the website) |
| `src/components/` | Tiles, buttons, fields, theme picker, top bar |

Checks: `npx tsc --noEmit` and `npx expo lint`.
