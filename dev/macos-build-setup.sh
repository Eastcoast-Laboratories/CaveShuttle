#!/usr/bin/env bash
# CaveShuttle iOS build on the Scaleway Mac mini (m1@62.210.150.197).
# macOS 26.6.1 arm64, Xcode 26.5 already installed, license accepted.
# Signing state: see ~/.config/devin/skills/ios-build-scaleway-mac/SKILL.md
# (team SVFZHJF78U, both identities in login.keychain-db).
# CaveShuttle is Capacitor 8 + SPM — no .xcworkspace, build App.xcodeproj.
# Reference/proven workflow: /var/www/Roboyard/dev/macos-build-setup.sh

# ----------------------------------------------------------------------
# 1) Node.js user-local (required for npm + @capacitor/cli — Capacitor 8).
# ----------------------------------------------------------------------
cd ~/devtools
curl -sL -o node.tar.xz \
  "https://nodejs.org/dist/v22.20.0/node-v22.20.0-darwin-arm64.tar.xz"
tar xJf node.tar.xz
ln -sfn node-v22.20.0-darwin-arm64 node
export PATH="$HOME/devtools/node/bin:$PATH"
grep -q 'devtools/node/bin' ~/.zshrc || \
  echo 'export PATH="$HOME/devtools/node/bin:$PATH"' >> ~/.zshrc
node --version   # v22.20.0
npm --version

# ----------------------------------------------------------------------
# 2) Get the sources onto the Mac.
#    The GitHub SSH remote needs a deploy key on the Mac; rsync from the
#    laptop is the proven path (skill §2). Run on the LAPTOP:
# ----------------------------------------------------------------------
#   rsync -avz --delete \
#     --exclude .git/ --exclude node_modules/ --exclude dist/ \
#     --exclude '*/build/' --exclude .gradle/ --exclude local.properties \
#     --exclude playwright-report/ --exclude test-results/ \
#     /var/www/CaveShuttle/ m1@62.210.150.197:~/repos/CaveShuttle/

# ----------------------------------------------------------------------
# 3) Web build + Capacitor sync (webDir is dist/, build runs sync-levelpack-meta).
# ----------------------------------------------------------------------
cd ~/repos/CaveShuttle
export PATH="$HOME/devtools/node/bin:$PATH"
npm ci
npm run build          # vite build → dist/
npx cap sync ios       # copies dist/ into ios/App/App/public + SPM deps

# ----------------------------------------------------------------------
# 4) Debug build for the simulator (no signing needed).
#    xcodebuild resolves the SPM packages in ios/App/CapApp-SPM itself.
# ----------------------------------------------------------------------
xcodebuild -project ios/App/App.xcodeproj -scheme App \
  -configuration Debug -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  build

# ----------------------------------------------------------------------
# 5) Boot the existing "iPhone 17" simulator, install, launch, screenshot.
# ----------------------------------------------------------------------
xcrun simctl boot "iPhone 17" || true
APP_PATH=$(find ~/Library/Developer/Xcode/DerivedData/App-*/Build/Products/Debug-iphonesimulator \
  -name "App.app" | head -1)
xcrun simctl install booted "$APP_PATH"
xcrun simctl launch booted de.z11.caveshuttle
sleep 10
xcrun simctl io booted screenshot /var/tmp/caveshuttle-ios.png
# copy back to the laptop and LOOK at it:
#   scp m1@62.210.150.197:/var/tmp/caveshuttle-ios.png /var/tmp/devin/
# crash reports (if it dies): ~/Library/Logs/DiagnosticReports/*.ips

# ----------------------------------------------------------------------
# 6) Provisioning profile (already created in the portal, step 0 of the plan):
#    App ID de.z11.caveshuttle, profile name "CaveShuttle AppStore".
#    The .mobileprovision sits in dev/xcode/ on the laptop (gitignored);
#    rsync brings it along — then install it on the Mac:
# ----------------------------------------------------------------------
mkdir -p ~/Library/MobileDevice/Provisioning\ Profiles
cp ~/repos/CaveShuttle/dev/xcode/CaveShuttle_AppStore.mobileprovision \
   ~/Library/MobileDevice/Provisioning\ Profiles/
# verify the profile name inside the plist:
security cms -D -i ~/Library/MobileDevice/Provisioning\ Profiles/CaveShuttle_AppStore.mobileprovision \
  > /var/tmp/cs-profile.plist
/usr/libexec/PlistBuddy -c "Print :Name" /var/tmp/cs-profile.plist
# must print: CaveShuttle AppStore

# ----------------------------------------------------------------------
# 7) Release archive + IPA export (manual signing — headless-safe).
#
#    CRITICAL (verified 2026-10-09): the keychain unlock and the xcodebuild
#    that calls codesign MUST run inside the SAME ssh session / same spawned
#    process tree. An unlock in one SSH session does NOT propagate — a build
#    started in a fresh session still fails with errSecInternalComponent.
#    npm project — no Gradle daemon to stop (that pitfall was Roboyard/KMP).
# ----------------------------------------------------------------------
# One command chain (or one nohup bash -c '...') — keep unlock + build together:
security unlock-keychain -p "$MAC_PASSWORD" ~/Library/Keychains/login.keychain-db
security set-keychain-settings -t 36000 ~/Library/Keychains/login.keychain-db
security set-key-partition-list -S apple-tool:,apple:,codesign: -s \
  -k "$MAC_PASSWORD" ~/Library/Keychains/login.keychain-db
security find-identity -v -p codesigning
# must list "Apple Distribution: Ruben Barkow-Kuder (SVFZHJF78U)"

xcodebuild -project ios/App/App.xcodeproj -scheme App \
  -configuration Release -sdk iphoneos \
  -destination 'generic/platform=iOS' \
  -archivePath build/App.xcarchive archive \
  CODE_SIGN_STYLE=Manual CODE_SIGN_IDENTITY="Apple Distribution" \
  DEVELOPMENT_TEAM=SVFZHJF78U \
  PROVISIONING_PROFILE_SPECIFIER="CaveShuttle AppStore"

# exportArchive also calls codesign — it needs its OWN unlock first
# (fresh ssh session => run the security unlock-keychain line again here):
security unlock-keychain -p "$MAC_PASSWORD" ~/Library/Keychains/login.keychain-db
xcodebuild -exportArchive -archivePath build/App.xcarchive \
  -exportPath build/ipa -exportOptionsPlist dev/ExportOptions.plist
# → build/ipa/App.ipa — copy back: scp m1@62.210.150.197:~/repos/CaveShuttle/build/ipa/App.ipa build/ios/CaveShuttle.ipa
# Upload: Xcode Organizer / Transporter app / xcrun altool --upload-app
#   (needs App Store Connect API key or app-specific password)

# KNOWN ISSUE: destination=upload in ExportOptions.plist fails with
# "Error Downloading App Information" while the app record does not exist
# yet in App Store Connect. Use destination=export (current dev/ExportOptions.plist),
# upload the .ipa later once the app is created at appstoreconnect.apple.com.
#
# ExportOptions.plist lives in dev/ (see dev/ExportOptions.plist):
#   method app-store-connect, signingStyle manual, teamID SVFZHJF78U,
#   provisioningProfiles { de.z11.caveshuttle: "CaveShuttle AppStore" }
#
# CAPACITOR NOTE: @capacitor-mlkit/barcode-scanning has no Package.swift and
# is NOT SPM-compatible — cap sync warns and the plugin is not bundled on
# iOS (QR scanner unavailable there until the plugin gains SPM support or
# is replaced). Build still succeeds.
