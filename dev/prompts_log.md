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

26-10-24 "550 plus 100 is 700?" (screenshot: level breakdown shows
BUNKER 550 + BUTTON 100 but total says 700 pts)

26-10-24 "In the local highscore your own name is highlighted with a
CSS glow — that should also work in the global highscore, including
when you are one player of a two-player composition."

26-10-24 "The label 'Global' in the highscore view is not very clear —
suggest something more meaningful" (chose: Local/Online pair)

26-10-24 "commit that, then: on the first game start, tilt steering
should default to ON and auto thrust to OFF."

26-10-24 "commit that, then: in the tutorial, depending on the setting,
instead of 'press left or right' it must ask to tilt in that direction."

26-10-24 "commit that, then: the tutorial screen before the guided
tutorial starts should be split into multiple pages with a next button
at the bottom and dots showing the current page, so it always fits on
a phone landscape screen."

26-10-24 "The Play Store links in the game on the start page and in
the level complete dialog should get different referrer links, so you
can see who used which."

26-10-24 "commit that, then: tilt steering must not be on by default
on laptops — only on mobile devices and in mobile browsers."

26-10-24 "When the 'Tippe überall zum Schießen.' hint disappears with
joystick OFF, an empty line must remain as a placeholder — otherwise
the tilt button jumps down when toggled on."

26-11-01 "Multiplayer could also be called 'Co-Op' on the start screen; make a plan of what could be renamed instead of player 1 or 2 so it becomes clearer that it is Co-Op."
26-11-01 "The word Co-Op only needs to be added in the frontend; the variable names can all stay."
26-11-01 "Remember: new features that affect gameplay or visuals are always added here (dev/add_changelog.sh DE_CHANGES/EN_CHANGES) — as short as possible, only if truly relevant, so no style changes or unimportant stuff."
26-11-01 "The player name and co-pilot input fields in the menu do not use the full width yet — stretch them."
26-11-01 "The level editor should start with the right-side Pack Builder publish tool collapsed."
26-11-01 "The left sidebar must get a collapse/expand mechanism and the right one too."
26-11-01 "The left sidebar must get a collapse/expand mechanism and the right one too."
26-11-01 "The right side button must go to the right edge and must not steal height — there is room next to the up/down arrows."
26-11-01 "The left one all the way to the left."
26-11-01 "The left one to the left of 'back to menu'."
26-11-01 "The right one must float in the top right corner so it takes no space."
26-11-01 "The back to menu button must leave enough room on the left so the collapse button stays clickable."
26-11-01 "The bar with back to menu and pack builder and the languages must collapse along."
26-11-01 "The right one must be a bit higher."
26-11-01 "Set it to -10px. Is px even the right unit in the level editor? Is that not problematic on different phone displays?"
26-11-01 "The left bar now covers the tool buttons; the tool row needs a margin-top so it sits right."
26-11-01 "The language buttons overlap the pack builder button. Instead make a language selector dropdown like in the main menu, sitting right of the pack builder button."
26-11-01 "The 4 elements at the top must be tighter together, less margin, so they do not protrude into the level area, and the language selector must be 30maller."
26-11-01 "When tilt steering is on, it still does not work when holding the phone overhead while lying down, i.e. with the screen side facing down."
26-11-01 "In the tutorial you should also be able to swipe one step forward and back."
26-11-01 "Face-down the direction is still inverted — up/down swapped, maybe left/right too."
26-11-01 "Build it to the phone."
26-11-01 "I discarded all of that; now just swap the forward/backward tilt once more, since left/right is correct."
26-11-01 "Perfect, now the game should detect when you sit up and turn the phone — 5s after turning, save the current position as new calibration; same when lying down and flipping the phone over. Also add the new feature to add_changelog."
26-11-01 "Works, but it should not take neutral as the new position — take the same position the calibrate button would capture at the moment the 5s expire (DRY)."
26-11-03 "That is bad — flying left for 5s would suddenly recalibrate. Remove the 50-degree trigger, only recalibrate when the phone flips face-down, and shorten to 2.4s instead of 5."
26-11-03 "Face-down in portrait still has left/right swapped; everything else is correct."
