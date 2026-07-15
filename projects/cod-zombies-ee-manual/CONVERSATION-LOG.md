# Build log

A record of the conversation that produced this app, for context when picking it back up.

## Turn 1 — initial build

**Request:** "Create an artifact for mobile devices that has Easter egg walkthroughs of the cod zombies maps from World at War to Black Ops 4."

**What was done:**
- Pulled the authoritative map/quest list from the Call of Duty Wiki "Main Quest" index to ground every map name and quest name (World at War → Black Ops 4).
- Built `zombies-easter-egg-manual.html`: a mobile-first, single-file app themed as an "element 115 dossier."
- Structure: game tabs → map cards → slide-in detail sheet with setup checklist, numbered major-step walkthrough, reward, difficulty, and field tips.
- Each quest written at **major-beat** granularity (honest about not fabricating frame-perfect / randomized steps). Maps without a real main quest were flagged and given their hidden-song note instead.
- Every map deep-links to its CoD Wiki quest page.

## Turn 2 — more detail, screenshots, YouTube links

**Request:** "Pull more details and screenshots for them. Also add links to YouTube guides."

**What was done:**
- **Screenshots: declined, on purpose.** Embedding Activision game stills raises copyright issues, so none were baked in. The video-guide links cover the visual need instead. This was called out to the user.
- **Video guides added:** every map got a "Watch video guides" button → a YouTube *search* URL scoped to that map + game, so links stay current and never rot.
- **Verified detail added** for the two most-played quests, rewritten from current written guides:
  - **Der Eisendrache (My Brother's Keeper)** — 9-step flow: dragon-head bow, bow upgrade puzzle, wisps → past, Keeper's tablet + golden rod, element-matched ritual circles, Ragnarok on pressure plates, pillar-dodge boss, clock-tower key. Marked `Verified`, `rand` removed (steps are fixed).
  - **Origins (Little Lost Girl)** — full setup (generators, Gramophone + Black Disc, Maxis Drone, G-Strike), staff parts, One-Inch-Punch chests (30 souls each, watch the robot Odin), four-substep Ultimate upgrades, optional rift finale. `Verified (parts vary)`.

## Turn 3 — packaging

**Request:** "Help me package the app and the conversation into a zip so I can port it over to Claude Code."

**What was done:**
- Assembled this project folder (`README.md`, `CLAUDE.md`, this log, and the app) and zipped it for import into Claude Code.

## Sources
- Call of Duty Wiki (Fandom) — Main Quest index + per-map guides (Der Eisendrache, Origins).
- General verification via current written walkthroughs.
- Not affiliated with Activision or Treyarch.
