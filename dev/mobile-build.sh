#!/bin/bash
# Mobile build script for caveshuttle
# Prepares the web app and syncs with Capacitor for Android Studio
# Usage: bash dev/mobile-build.sh [options] [platform]

set -e  # Exit on error

# Default configuration
UPDATE_VERSION=false
UPDATE_MAJOR=false
FORCE_SYNC=false
PLATFORM="android"

# Show help information
show_help() {
  echo "\ncaveshuttle Mobile Build Script\n"
  echo "Usage: bash dev/mobile-build.sh [options] [platform]\n"
  echo "Options:"
  echo "  -h, --help                Show this help message"
  echo "  -u, --update-version      Update version: increment minor version in package.json"
  echo "  -m, --major               Update version: increment major version, reset minor and patch to 0"
  echo "  -s, --sync-only           Only sync native apps with latest web code (no build)"
  echo ""
  echo "Platforms:"
  echo "  android    Build and open Android project (default)"
  echo "  ios        Build and open iOS project"
  echo ""
  exit 0
}

# Process command line arguments
parse_args() {
  while [[ $# -gt 0 ]]; do
    case $1 in
      -h|--help)
        show_help
        ;;
      -u|--update-version)
        UPDATE_VERSION=true
        shift
        ;;
      -m|--major)
        UPDATE_VERSION=true
        UPDATE_MAJOR=true
        shift
        ;;
      -s|--sync-only)
        FORCE_SYNC=true
        shift
        ;;
      android|ios)
        PLATFORM=$1
        shift
        ;;
      *)
        echo "Unknown option: $1"
        show_help
        ;;
    esac
  done
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
  if [ -f "$GRADLE_FILE" ]; then
    CURRENT_CODE=$(grep -oP 'versionCode\s+\K\d+' "$GRADLE_FILE")
    if [ -n "$CURRENT_CODE" ]; then
      NEW_CODE=$((CURRENT_CODE + 1))
      echo "Updating Android versionCode: $CURRENT_CODE → $NEW_CODE"
      sed -i "s/versionCode $CURRENT_CODE/versionCode $NEW_CODE/" "$GRADLE_FILE"
      sed -i "s/versionName \"[^\"]*\"/versionName \"$NEW_VERSION\"/" "$GRADLE_FILE"
    fi
  fi
}

# Parse command line arguments
parse_args "$@"

# Update version if requested
if [ "$UPDATE_VERSION" = true ]; then
  update_version
fi

# Build the web app (unless sync-only)
if [ "$FORCE_SYNC" = false ]; then
  echo "Building caveshuttle web app for mobile..."
  npm run build
fi

# Disable Capacitor telemetry
echo "Disabling Capacitor telemetry..."
npx cap telemetry off 2>/dev/null || true

# Sync with Capacitor
echo "Syncing with Capacitor ($PLATFORM)..."
npx cap sync $PLATFORM

# Open in IDE
echo "Opening $PLATFORM project..."
if [ "$PLATFORM" = "android" ]; then
  # Try snap installation first
  if [ -f "/snap/android-studio/current/bin/studio.sh" ]; then
    echo "Opening Android Studio from snap with:"
    echo "/snap/android-studio/current/bin/studio.sh android"
  elif [ -f "/usr/local/android-studio/bin/studio.sh" ]; then
    echo "Opening Android Studio from /usr/local with:"
    echo "/usr/local/android-studio/bin/studio.sh android"
  else
    echo "Android Studio not found, using Capacitor open..."
    npx cap open android
  fi
elif [ "$PLATFORM" = "ios" ]; then
  npx cap open ios
fi

echo "Mobile build preparation complete!"
