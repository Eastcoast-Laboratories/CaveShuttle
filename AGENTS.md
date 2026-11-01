# Project Instructions

- Use `$HOME/.playwright-browsers/chromium-1194/chrome-linux/chrome` as the local Playwright Chromium executable.
- Keep Playwright tests and all other automated tests version-controlled under `tests/`; do not leave tests only in temporary or external locations.
- Every test file must start with a comment that states exactly what it verifies and gives the exact command for running it. For browser-backed tests, the command must use the Playwright Chromium executable under `$HOME/.playwright-browsers/`.
- Do not blindly accept the user's assumptions or claims. Always verify technically before agreeing — if a claim is wrong, say so clearly.
- After implementing a feature that affects gameplay or visuals, add one short bullet each to `DE_CHANGES` and `EN_CHANGES` in `dev/add_changelog.sh` (it generates fastlane changelogs, the Play Store changelog, and `CHANGELOG.md`/`CHANGELOG_de.md`). Keep entries as short as possible; skip style-only or otherwise unimportant changes — Play Store limit is 500 chars per language.
