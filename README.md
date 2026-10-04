# Mat Log

Personal BJJ training log. A single-page web app with no build step, served by GitHub Pages.

**Live app:** https://zohayrahmad.github.io/matlog/

## Install on your phone
1. Open the live link in Safari (iPhone) or Chrome (Android).
2. Share → **Add to Home Screen**.
3. First launch: tap **Restore backup** and pick your latest `matlog-backup-*.json`. You only do this once.

After that, updates pushed to `main` show up automatically the next time you open the app while online, and your data stays put. It works offline too.

## Data
- Everything lives on the device (`localStorage`, key `matlog_v1`). Nothing is sent anywhere.
- **Settings (gear icon) → Back up** saves a JSON file to Files/iCloud. That's insurance against losing the phone; you don't need it for updates.
- Restoring keeps a copy of whatever was there before under `matlog_v1_before_restore`.

## Files
- `index.html`: the whole app
- `sw.js`: service worker for offline use and auto-updates
- `manifest.webmanifest`, `icons/`: home-screen install
