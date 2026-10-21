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

# update_version() lives in dev/version-bump.sh, which is also runnable
# standalone (bash dev/version-bump.sh -u|-m).
source "$(dirname "$0")/version-bump.sh"

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
