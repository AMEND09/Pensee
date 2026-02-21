# Pensée

A writing improvement platform built in React Native with Expo.

## Features

- **Daily challenges** seeded by date (either a single creative word or a textual excerpt).
- Each prompt includes three rhetorical devices or distinctive words for incorporation.
- **10‑minute writing session** with live word count.
- Built‑in **dictionary** and **thesaurus** lookup available during writing.
- Post‑session **reflection form** capturing vocabulary used, devices applied, successes, failures, and personal thoughts.
- **Statistics** modal showing average word count and consistency streak.
- Entire interface uses **modal dialogs** rather than tabs for a smooth, skeuomorphic experience.
- Warm color palette and serif typography for a traditional notebook aesthetic.

## Getting started

```bash
npm install
npm run web   # or `npm run android` / `npm run ios`
```

Open the app and tap "Start Writing". Click on any word or device to see its definition. The dictionary/thesaurus field is available during a session.

All sections appear as modals that can be dismissed by tapping outside.

## Project structure

The core screen lives at `app/(tabs)/index.tsx` (tabs layout disabled). Utility modules under `utils/` manage prompts and definitions.

---

Feel free to extend prompts, persist stats, or refine the theme to suit your needs.