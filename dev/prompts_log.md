# Prompts Log

## 26-10-11 (executed via dev/prompts/ios-app-icon.md)

"Replace the stub iOS app icon with the Android artwork — upscale
ic_launcher_foreground.png 192→1024, flatten to RGB on #FFFFFF, overwrite
AppIcon-512@2x.png, bump CURRENT_PROJECT_VERSION, rsync to the Mac,
archive + export/upload, verify the icon inside the xcarchive, run the
backup afterwards."

## 26-10-10/11

"The app record is now at appstoreconnect.apple.com/apps/6821246830/distribution"

"The IP shouldn't be in the repo — move everything that doesn't belong
in the public git into a .env file (ios-build-scaleway.md and
macos-build-setup.sh)."

"Prepare everything in a md file in dev/ for the store entry:
screenshots, description, privacy-policy URL, age rating, app-privacy
questionnaire — gather the data from the other existing store listings."

"I added Anna as administrator for my apps, but nothing new shows up in
her TestFlight."

"Remove the vibration when rotating via tilt — it may only happen when
pressing the rotate button, not triggered by tilt rotation. And in
multiplayer on one screen the game crashed on iOS after a minute of
playing with tilt steering — tilt steering in single-device multiplayer
must be disabled, it makes no sense. Then make a new build on the Mac
and publish."

"Commit everything, then: the player names entered at the end for the
highscore must be trimmed if not already done, otherwise a trailing
space lands in the DB. If changes are needed you don't need a new Mac
build yet."

"If not done yet, build a new version on the Mac."

## 26-10-16

"In the hamburger menu: the 'Steuerung' section must always be expanded
by default, unless it was manually collapsed — that should be
remembered."

"Apply copilot-style-review. 2. When activating tilt steering, the
current position must be applied once as the calibration, as if the
button had been pressed (DRY)."

"Apply copilot-style-review."
