# Mat Log

A personal BJJ training log. It's a static web app with no build step, served by GitHub Pages and installable on your phone.

**Live app:** https://zohayrahmad.github.io/matlog/

## Install on your phone
1. Open the live link in Safari (iPhone) or Chrome (Android).
2. Share → **Add to Home Screen**.
3. First launch: tap **Restore backup** and pick your latest `matlog-backup-*.json`. You only do this once.

After that, updates merged into `main` arrive automatically the next time you open the app online, and your data stays put. It also works offline.

## What's in it
- **30-second log.** Tap through session type, length, rounds, how the rolls went and energy. Or tap **Say it** and describe the session: Mat Log fills in length, rounds, taps, what to work on, moves and injuries from your words. Optional extras: who you rolled with (higher, similar or newer, and who won), positional rounds, focus check-ins, a tap tally and notes.
- **Blue belt readiness.** A score built from mat time, skill, live performance and consistency, using widely shared standards. Real results from positional rounds and rolls override self-ratings once there's enough data. It includes a checklist, a predicted stripe level and a projected date.
- **Drill queue.** 10-minute partner or solo queues built from your weak spots, with a timer that keeps the screen awake.
- **Competition mode.** A countdown with a prep plan by phase, A-game rehearsal from your game plan, weigh-ins and a match log.
- **Coach report.** A one-page summary to share or print as a PDF.
- **Game plan.** Go-to moves from 12 key positions. **Library**: about 115 moves, rated and showing when you last worked them.
- **Review.** Week or month vs the period before, with a generated plan and your intention for next week.
- **Weekly target and streak.** It suggests ramping up once your current target holds for 4 weeks.

## Data
- Everything lives on the device (`localStorage`, key `matlog_v1`). Nothing is sent anywhere.
- **Settings → Back up** saves a JSON file to Files or iCloud. It's insurance against losing the phone; you don't need it for updates.
- Upgrades never drop data. Before a format upgrade, the old data is copied to `matlog_v1_pre_v<version>`, and restoring a backup keeps the previous data in `matlog_v1_before_restore`.

## Code
| File | Purpose |
|---|---|
| `index.html` | App shell |
| `css/app.css` | Design system (dark and light) |
| `js/data.js` | Curriculum, tags, readiness model constants |
| `js/store.js` | Storage, migration, date helpers |
| `js/analytics.js` | Readiness, streaks, reviews, insights (pure functions) |
| `js/charts.js` | SVG/HTML charts |
| `js/ui.js`, `js/screens.js` | Screens and sheets |
| `js/tools.js` | Drill queue, competition mode, coach report |
| `js/main.js` | Actions, input binding, startup |
| `sw.js` | Offline support and auto-updates |

Run the tests with `npm test` (Node 18+). There are no dependencies.

When you change any JS or CSS, bump the `?v=` query in `index.html` and the list in `sw.js` together with `CACHE`.
