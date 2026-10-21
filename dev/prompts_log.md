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

## 26-10-19

"We need a new option under 'Steuerung' below the tilt settings, above
the calibrate button: 'auto-thrust (Aim)' / 'Tilt Back to thrust
(Rotate)' — the label changes with Aim/Rotate mode. When the switch is
off, the thrust button is also visible in tilt mode on the right where
it usually is, and the fire button becomes visible top-right where it
usually is; the shield button on the left then stretches over the whole
height since tilt is only used for steering."

"The fire button is now narrower than the normal one — it must be as
wide as the thrust button."

"The stutter thrust still engages when the switch is off in aim mode."

"hamburgerMenu.js tiltModeHint: 'auto-thrust at 90% rotation' must be
removed from the help text when it is off, so the text has to be split.
tiltHint: 'tilt back to thrust.' must also be removed then."

"The text can actually be removed entirely, since it is already shown
below in the toggle."

"'tilt direction = target heading' must remain even when auto thrust is
off."

"'tap anywhere to fire' is duplicated when tilt is on (was already the
case before, unrelated to the new button)."

"When the tutorial is completed it should say 'now you're on your own'
or similar, and instead of 'next level' something fitting. Suggest 5
proposals."

"5"

"The title still says 'level 1 complete' and the button says 'next
level', and it starts level 2 after the tutorial."

"In the HUD and the hamburger menu icon top-right in game, all px must
be replaced with VH or VW — maybe min(vh, vw)? On an iPhone with very
high DPI the hamburger icon is tiny, and there are probably other
problems too."

"The hamburger icon is now too far down, roughly one icon height too
low — move it up by exactly the icon's height."

"No, it is simply positioned wrong: it now docks exactly at the HUD's
bottom edge and extends downward — it must extend upward instead, and
the menu that opens must start exactly where the hamburger icon sits."

"The HUD needs a bit less padding top and bottom — space is wasted
there; it can be slimmer with the same font size."

"But now the hamburger menu is still like before the shrinking — make
the padding a variable so it can be used to shift the hamburger menu
along."

"The menu starts at the right place now, but the hamburger icon is
still too far down by half."

## 26-10-20

"index.css: I additionally adjusted margin-top: -1vh — now it looks
good, I hope I didn't revert everything?"

"add_changelog.sh DE_CHANGES — is anything to add since 5.1?"

"add --help and -h option that shows all options and add an option to
update the major version."

"I think updating the version number is not add_changelog's job but
mobile-build's instead — build it so it says mobile-build must be
called instead, not add_changelog. The option should stay but only
print the text, not update anything."

"Make version-bump.sh also work standalone with a --help option."

"The hamburger button needs to be a bit wider, and pressing the button
again must close the menu."

"When fuel is nearly empty the timer sound plays, but after collecting
fuel again it does not stop even though the danger is over."
