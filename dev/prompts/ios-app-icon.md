# Prompt: Replace the stub iOS app icon with the Android artwork

Context: the iOS build currently ships the default Capacitor stub icon
(blue zigzag on white — verified in `ios/App/App/Assets.xcassets/
AppIcon.appiconset/AppIcon-512@2x.png`). Android already shows the real
CaveShuttle artwork (synthwave sun over a blue grid landscape).
Same fix as done for Lalumo in /var/www/Musici (commit "feat(ios):
replace Capacitor stub app icon with the bird artwork", build 7.3 (45))
and for Roboyard (single-universal-1024 appiconset, build 144).

Read the `ios-build-scaleway-mac` skill first — remote Mac access,
signing state and keychain-unlock pitfalls are documented there.

## Facts specific to CaveShuttle (already verified)

- Capacitor project — no xcodegen, no Kotlin framework. Edit
  `ios/App/App.xcodeproj/project.pbxproj` directly for version bumps.
- `AppIcon.appiconset` is ALREADY the single-universal-1024 format
  (one `AppIcon-512@2x.png`, universal/ios/1024x1024 in Contents.json) —
  only the PNG needs replacing, do NOT touch Contents.json.
- Bundle ID `de.z11.caveshuttle`, profile `CaveShuttle AppStore`,
  team `SVFZHJF78U`; `dev/ExportOptions.plist` uses
  method=app-store-connect + destination=upload (exports AND uploads
  in one step, no local .ipa afterwards).
- Current versions in project.pbxproj: `CURRENT_PROJECT_VERSION = 15`
  and `MARKETING_VERSION = 5.2` — each appears TWICE (Debug+Release),
  bump both.

## Recipe

1. Source artwork (Android):
   - `caveshuttle/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png`
     (192x192 RGBA, full-bleed — alpha bbox covers the whole image)
   - background = plain `#FFFFFF` per
     `caveshuttle/app/src/main/res/values/ic_launcher_background.xml`
   - reference composed look: `mipmap-xxxhdpi/ic_launcher.png` (192x192)
   - The icon fills the whole square — no adaptive-icon inset, no
     background rim. The iOS icon is just the foreground art, full-bleed.
2. Resolution reality check (already searched, 2026-10-11): NO
   higher-res source of this artwork exists in the repo —
   `Splash.imageset/splash-2732x2732.png` is the tiny stub logo on white,
   `public/logo2.png` (777px) is a DIFFERENT artwork (green mining
   scene), `public/apple-touch-icon.png` (180px) is the same icon
   smaller. So: upscale `ic_launcher_foreground.png` 192 -> 1024 with
   `Image.LANCZOS` and flatten to RGB onto #FFFFFF (App Store Connect
   rejects alpha). Slightly soft is acceptable for a first fix; if a
   crisper result is wanted, regenerate the artwork at 1024px first.
3. Overwrite `ios/App/App/Assets.xcassets/AppIcon.appiconset/
   AppIcon-512@2x.png` with the 1024 RGB image.
4. Bump `CURRENT_PROJECT_VERSION` (both occurrences) in
   `ios/App/App.xcodeproj/project.pbxproj` — the icon is baked into the
   .app at archive time, so only a new binary ships it.
5. Sync to the Mac (`$MAC_HOST` from dev/.env):

   rsync -avz --delete /var/www/CaveShuttle/ "$MAC_HOST":~/repos/CaveShuttle/

   then archive + export on the Mac (keychain unlock in the SAME ssh
   session — exact commands in dev/macos-build-setup.sh):

   security unlock-keychain -p "$MAC_PASSWORD" ~/Library/Keychains/login.keychain-db
   xcodebuild -project ios/App/App.xcodeproj -scheme App \
     -configuration Release -sdk iphoneos \
     -destination 'generic/platform=iOS' \
     -archivePath build/App.xcarchive archive \
     CODE_SIGN_STYLE=Manual CODE_SIGN_IDENTITY="Apple Distribution" \
     DEVELOPMENT_TEAM=SVFZHJF78U \
     PROVISIONING_PROFILE_SPECIFIER="CaveShuttle AppStore"
   xcodebuild -exportArchive -archivePath build/App.xcarchive \
     -exportPath build/ipa -exportOptionsPlist dev/ExportOptions.plist

   destination=upload pushes straight to App Store Connect — watch the
   log for "Upload succeeded" / EXPORT SUCCEEDED.
6. Verify inside the new archive:
   `build/App.xcarchive/Products/Applications/App.app/` must contain
   `AppIcon60x60@2x.png` — it is CgBI/pngcrush format, not a plain PNG.
   View it via `sips -s format png <file> --out /var/tmp/check.png` on
   the Mac and scp it back, or strip the `CgBI` chunk and zlib-decode
   (rows are unfiltered BGRA -> swap to RGBA). Confirm it shows the
   synthwave artwork, not the zigzag stub.

## Notes / pitfalls

- The icon is a full-bleed square — iOS applies its own corner
  rounding; do not add padding or a mask yourself.
- Run the backup afterwards so the new archive is preserved:
  `bash /var/www/Roboyard/dev/backup-mac-mini.sh` (backs up all three
  apps' xcarchives).
- Another Devin session may be building Lalumo or Roboyard on the same
  Mac — check `ps aux | grep -E "xcodebuild|gradle"` on $MAC_HOST first
  and wait for it to finish; both apps share the keychain and
  `build/App.xcarchive` must not be touched mid-build.
- exportArchive re-signs and needs its own unlock in the same session;
  if you get `errSecInternalComponent`, the keychain in that process
  context is still locked (see the skill for set-key-partition-list).
- Check `git status` before/after; propose a commit message, never
  commit yourself.
