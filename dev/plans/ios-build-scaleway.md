# CaveShuttle → iOS Release auf dem Scaleway Mac mini

Plan for the next agent session. Read the skill
`ios-build-scaleway-mac` (`~/.config/devin/skills/ios-build-scaleway-mac/SKILL.md`)
FIRST — it contains the Mac access, signing state, and every known pitfall.
This file only contains the CaveShuttle-specific steps and ordering.

## Context

- Local repo: `/var/www/CaveShuttle` (Capacitor 8, appId `de.z11.caveshuttle`,
  `webDir: dist`, Android path `./caveshuttle`)
- `ios/App/` already exists (incl. `App.xcodeproj` + `CapApp-SPM`) — do NOT
  `npx cap add ios` again
- Remote: `$MAC_HOST` (defined in `dev/.env`, gitignored — `m1@<scaleway-ip>`),
  repo goes to `~/repos/CaveShuttle`
- Signing is READY: Apple Development + Apple Distribution identities are in
  the Mac's login keychain (team `SVFZHJF78U`, paid program)
- Reference for the workflow: `/var/www/Roboyard/dev/macos-build-setup.sh`

## Steps

### 0. provisioning profile already exists
The user has already created the provisioning profile in developer.apple.com:
- App ID `de.z11.caveshuttle` (Identifiers → "+")
- Profile: "App Store Connect" → name **`CaveShuttle AppStore`** → was downloaded into `/var/www/Roboyard/dev/xcode/CaveShuttle_AppStore.mobileprovision`

### 1. Inspect the project (local, first)
- `cat package.json` — find the web build script name, Node version hints,
  Capacitor plugin list
- `ls ios/App/` — `.xcodeproj` or `.xcworkspace`? Capacitor 8 = SPM
- Check `dist/` exists / how it's produced; check `capacitor.config.json`
- Read `AGENTS.md` rules (Playwright chromium path, test conventions in
  `tests/`)

### 2. Prepare the Mac (can run NOW, in parallel with Roboyard work)
- Install Node.js user-local per skill §6, add PATH to `~/.zshrc`
- `mkdir -p ~/repos && git clone https://github.com/rubo77/CaveShuttle.git`
  (verify the real remote with `git remote -v` locally) or rsync
- Write `dev/macos-build-setup.sh` — EVERY Mac command goes there (skill §8)

### 3. First build (needs the profile? NO — Debug needs nothing)
- `npm ci` (or `npm install` — check lockfile type)
- `npm run build` (exact script name from package.json)
- `npx cap sync ios`
- `xcodebuild -project ios/App/App.xcodeproj -scheme App \
   -configuration Debug -sdk iphonesimulator \
   -destination 'generic/platform=iOS Simulator' build`
- Simulator verify: boot → install → launch `de.z11.caveshuttle` →
  screenshot → `scp` back and LOOK at it (skill §7)

### 4. Signing (needs the .mobileprovision from step 0)
- Install profile to `~/Library/MobileDevice/Provisioning Profiles/`
- Verify name == `CaveShuttle AppStore`
- Release archive per skill §5 with `PROVISIONING_PROFILE_SPECIFIER="CaveShuttle AppStore"`
- Keychain ritual first: unlock-keychain → set-keychain-settings -t 36000 →
  `npm`-only projects have no Gradle daemon problem
- `xcodebuild -exportArchive` with an ExportOptions.plist (copy pattern from
  `/var/www/Roboyard/iosApp/ExportOptions.plist`, swap name/bundle-id)

### 5. Rules
- Log every Mac command into `dev/macos-build-setup.sh`
- `dev/xcode/` must be in `.gitignore`
- Never commit; never deploy; ask before anything touching production
- If a build step is missing info → check Roboyard's setup script first,
  the same Mac/environment is already proven working end-to-end
