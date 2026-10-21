#!/bin/bash
# Shared version-bump helper for dev scripts (mobile-build.sh). When
# sourced it only defines update_version(); when executed directly it
# parses its options and performs the bump. All version paths are
# relative to the repository root.

show_help() {
  echo "Usage: bash dev/version-bump.sh [options]"
  echo ""
  echo "Bumps the CaveShuttle version in package.json, src/version.js,"
  echo "package-lock.json, caveshuttle/app/build.gradle and the iOS"
  echo "Xcode project. versionCode/CURRENT_PROJECT_VERSION is always"
  echo "incremented by 1."
  echo ""
  echo "Options:"
  echo "  -h, --help             Show this help message"
  echo "  -u, --update-version   Minor bump: X.Y -> X.(Y+1)"
  echo "  -m, --major            Major bump: X.Y -> (X+1).0"
  echo ""
  echo "When sourced instead of executed, this file only defines"
  echo "update_version() for callers like mobile-build.sh."
  echo ""
  exit "${1:-0}"
}

# Update version in package.json
update_version() {
  PACKAGE_FILE="package.json"

  if [ ! -f "$PACKAGE_FILE" ]; then
    echo "Error: package.json not found!"
    return 1
  fi

  # Extract current version from package.json
  CURRENT_VERSION=$(grep -oP '"version":\s*"\K[^"]+' "$PACKAGE_FILE")

  if [ -z "$CURRENT_VERSION" ]; then
    echo "Error: Could not find version in package.json"
    return 1
  fi

  # Split version into major.minor.patch
  MAJOR=$(echo "$CURRENT_VERSION" | cut -d. -f1)
  MINOR=$(echo "$CURRENT_VERSION" | cut -d. -f2)
  PATCH=$(echo "$CURRENT_VERSION" | cut -d. -f3)

  # Increment version based on update type
  if [ "$UPDATE_MAJOR" = true ]; then
    # Major update: increment major, reset minor to 0
    NEW_MAJOR=$((MAJOR + 1))
    NEW_VERSION="$NEW_MAJOR.0"
    echo "Updating version (major): $CURRENT_VERSION → $NEW_VERSION"
  else
    # Minor update: increment minor
    NEW_MINOR=$((MINOR + 1))
    NEW_VERSION="$MAJOR.$NEW_MINOR"
    echo "Updating version (minor): $CURRENT_VERSION → $NEW_VERSION"
  fi

  sed -i "s/\"version\":\s*\"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" "$PACKAGE_FILE"

  # Update version.js
  VERSION_FILE="src/version.js"
  if [ -f "$VERSION_FILE" ]; then
    CURRENT_VERSION_JS=$(grep -oP "APP_VERSION = '\K[^']+" "$VERSION_FILE")
    if [ -n "$CURRENT_VERSION_JS" ]; then
      echo "Updating version.js: $CURRENT_VERSION_JS → $NEW_VERSION"
      sed -i "s/APP_VERSION = '$CURRENT_VERSION_JS'/APP_VERSION = '$NEW_VERSION'/" "$VERSION_FILE"
    fi
  fi

  # Update package-lock.json
  echo "Updating package-lock.json..."
  npm install --package-lock-only --quiet

  # Update Android versionCode in build.gradle
  GRADLE_FILE="caveshuttle/app/build.gradle"
  NEW_CODE=""
  if [ -f "$GRADLE_FILE" ]; then
    CURRENT_CODE=$(grep -oP 'versionCode\s+\K\d+' "$GRADLE_FILE")
    if [ -n "$CURRENT_CODE" ]; then
      NEW_CODE=$((CURRENT_CODE + 1))
      echo "Updating Android versionCode: $CURRENT_CODE → $NEW_CODE"
      sed -i "s/versionCode $CURRENT_CODE/versionCode $NEW_CODE/" "$GRADLE_FILE"
      sed -i "s/versionName \"[^\"]*\"/versionName \"$NEW_VERSION\"/" "$GRADLE_FILE"
    fi
  fi

  # Update iOS versions in the Xcode project — same numbers as Android:
  # MARKETING_VERSION = versionName, CURRENT_PROJECT_VERSION = versionCode
  PBX_FILE="ios/App/App.xcodeproj/project.pbxproj"
  if [ -f "$PBX_FILE" ]; then
    if [ -z "$NEW_CODE" ]; then
      CURRENT_CODE=$(grep -oP 'CURRENT_PROJECT_VERSION = \K\d+' "$PBX_FILE" | head -1)
      if [ -n "$CURRENT_CODE" ]; then
        NEW_CODE=$((CURRENT_CODE + 1))
      fi
    fi
    if [ -n "$NEW_CODE" ]; then
      echo "Updating iOS: MARKETING_VERSION → $NEW_VERSION, CURRENT_PROJECT_VERSION → $NEW_CODE"
      sed -i "s/MARKETING_VERSION = [^;]*/MARKETING_VERSION = $NEW_VERSION/" "$PBX_FILE"
      sed -i "s/CURRENT_PROJECT_VERSION = [^;]*/CURRENT_PROJECT_VERSION = $NEW_CODE/" "$PBX_FILE"
    fi
  fi
}

# Standalone mode: parse arguments and run the bump. This block is
# skipped when the file is sourced (e.g. by mobile-build.sh).
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  UPDATE_MAJOR=false
  RUN_BUMP=false
  for arg in "$@"; do
    case "$arg" in
      -h|--help)
        show_help
        ;;
      -u|--update-version)
        RUN_BUMP=true
        ;;
      -m|--major)
        RUN_BUMP=true
        UPDATE_MAJOR=true
        ;;
      *)
        echo "ERROR: Unknown option: $arg"
        show_help 1
        ;;
    esac
  done
  if [ "$RUN_BUMP" = false ]; then
    show_help 1
  fi
  # Version paths are relative to the repository root.
  cd "$(dirname "${BASH_SOURCE[0]}")/.."
  update_version
fi
