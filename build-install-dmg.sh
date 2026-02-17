#!/usr/bin/env bash
# ============================================================================
# build-install-dmg.sh
# Builds Notemac++ as an installable .dmg for macOS
# The DMG contains the .app that the user drags into /Applications
# ============================================================================
set -euo pipefail

APP_NAME="Notemac++"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log()   { echo -e "${GREEN}[✓]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; }
info()  { echo -e "${BLUE}[i]${NC} $1"; }
step()  { echo -e "\n${CYAN}━━━ $1 ━━━${NC}"; }

# ──────────────────────────────────────────────────────────
# 1. Check & install prerequisites
# ──────────────────────────────────────────────────────────
step "Checking prerequisites"

# macOS check
if [[ "$(uname)" != "Darwin" ]]; then
  error "This script must be run on macOS to build a .dmg"
  exit 1
fi
log "Running on macOS $(sw_vers -productVersion)"

# Xcode Command Line Tools
if ! xcode-select -p &>/dev/null; then
  warn "Xcode Command Line Tools not found. Installing..."
  xcode-select --install
  echo "Please complete the Xcode CLT installation and re-run this script."
  exit 1
fi
log "Xcode Command Line Tools available"

# Homebrew
if ! command -v brew &>/dev/null; then
  warn "Homebrew not found. Installing..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  # Add brew to PATH for Apple Silicon
  if [[ -f /opt/homebrew/bin/brew ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  fi
fi
log "Homebrew available"

# Node.js (via brew if missing)
if ! command -v node &>/dev/null; then
  warn "Node.js not found. Installing via Homebrew..."
  brew install node
fi
NODE_VERSION=$(node -v)
log "Node.js $NODE_VERSION"

# npm
if ! command -v npm &>/dev/null; then
  error "npm not found even though Node.js is installed. Please reinstall Node."
  exit 1
fi
log "npm $(npm -v)"

# python3 (needed by some native modules)
if ! command -v python3 &>/dev/null; then
  warn "python3 not found. Installing via Homebrew..."
  brew install python3
fi
log "python3 available"

# create-dmg (for fancy DMG creation)
if ! command -v create-dmg &>/dev/null; then
  warn "create-dmg not found. Installing via Homebrew..."
  brew install create-dmg
fi
log "create-dmg available"

# ──────────────────────────────────────────────────────────
# 2. Install Node dependencies
# ──────────────────────────────────────────────────────────
step "Installing dependencies"

if [ ! -d "node_modules" ]; then
  info "Running npm install..."
  npm install
else
  info "node_modules exists. Running npm install to ensure everything is up to date..."
  npm install
fi
log "Dependencies installed"

# ──────────────────────────────────────────────────────────
# 3. Set up app icon from Icons/ folder
# ──────────────────────────────────────────────────────────
step "Setting up app icon"

mkdir -p public

if [ -f "Icons/icon.icns" ]; then
  cp Icons/icon.icns public/icon.icns
  cp Icons/icon.png public/icon.png
  log "App icon copied from Icons/"
else
  # Fallback: build .icns from individual PNGs in Icons/
  ICONSET_DIR=$(mktemp -d)/Notemac.iconset
  mkdir -p "$ICONSET_DIR"
  for SIZE in 16 32 64 128 256 512 1024; do
    [ -f "Icons/icon_${SIZE}x${SIZE}.png" ] && cp "Icons/icon_${SIZE}x${SIZE}.png" "$ICONSET_DIR/icon_${SIZE}x${SIZE}.png"
  done
  cp "$ICONSET_DIR/icon_32x32.png" "$ICONSET_DIR/icon_16x16@2x.png" 2>/dev/null || true
  cp "$ICONSET_DIR/icon_64x64.png" "$ICONSET_DIR/icon_32x32@2x.png" 2>/dev/null || true
  cp "$ICONSET_DIR/icon_256x256.png" "$ICONSET_DIR/icon_128x128@2x.png" 2>/dev/null || true
  cp "$ICONSET_DIR/icon_512x512.png" "$ICONSET_DIR/icon_256x256@2x.png" 2>/dev/null || true
  cp "$ICONSET_DIR/icon_1024x1024.png" "$ICONSET_DIR/icon_512x512@2x.png" 2>/dev/null || true
  rm -f "$ICONSET_DIR/icon_64x64.png" "$ICONSET_DIR/icon_1024x1024.png"
  iconutil -c icns "$ICONSET_DIR" -o public/icon.icns 2>/dev/null || {
    cp Icons/icon.png public/icon.png
  }
  log "App icon built from Icons/ PNGs"
fi

# ──────────────────────────────────────────────────────────
# 4. Build the web assets
# ──────────────────────────────────────────────────────────
step "Building web assets"

info "Running TypeScript compilation and Vite build..."
npm run build
log "Web assets built → dist/"

# ──────────────────────────────────────────────────────────
# 5. Build the Electron app with electron-builder
# ──────────────────────────────────────────────────────────
step "Building Electron app"

info "Running electron-builder for macOS..."
npx electron-builder --mac --config.mac.target=dir 2>&1 | tail -20
log "Electron app built"

# Find the .app
APP_PATH=$(find release -name "*.app" -maxdepth 3 -type d 2>/dev/null | head -1)
if [ -z "$APP_PATH" ]; then
  error "Could not find built .app in release/"
  exit 1
fi
log "Found app: $APP_PATH"

# ──────────────────────────────────────────────────────────
# 6. Create the installable DMG
# ──────────────────────────────────────────────────────────
step "Creating installable DMG"

DMG_NAME="${APP_NAME}-Installer"
DMG_OUTPUT="release/${DMG_NAME}.dmg"

# Remove old DMG if exists
rm -f "$DMG_OUTPUT"

# Use create-dmg for a professional installer DMG with drag-to-Applications
info "Creating DMG with Applications shortcut..."
create-dmg \
  --volname "$APP_NAME Installer" \
  --volicon "public/icon.icns" \
  --window-pos 200 120 \
  --window-size 660 400 \
  --icon-size 80 \
  --icon "$APP_NAME.app" 180 180 \
  --app-drop-link 480 180 \
  --hide-extension "$APP_NAME.app" \
  --no-internet-enable \
  "$DMG_OUTPUT" \
  "$APP_PATH" \
  2>&1 || {
    # create-dmg returns non-zero even on success sometimes; check if file exists
    true
  }

if [ -f "$DMG_OUTPUT" ]; then
  DMG_SIZE=$(du -h "$DMG_OUTPUT" | cut -f1)
  log "Installable DMG created: $DMG_OUTPUT ($DMG_SIZE)"
else
  # Fallback: use hdiutil directly
  warn "create-dmg may have failed. Falling back to hdiutil..."

  STAGING_DIR=$(mktemp -d)
  cp -R "$APP_PATH" "$STAGING_DIR/"
  ln -s /Applications "$STAGING_DIR/Applications"

  hdiutil create -volname "$APP_NAME Installer" \
    -srcfolder "$STAGING_DIR" \
    -ov -format UDZO \
    "$DMG_OUTPUT"

  rm -rf "$STAGING_DIR"

  if [ -f "$DMG_OUTPUT" ]; then
    DMG_SIZE=$(du -h "$DMG_OUTPUT" | cut -f1)
    log "Installable DMG created (hdiutil): $DMG_OUTPUT ($DMG_SIZE)"
  else
    error "Failed to create DMG"
    exit 1
  fi
fi

# ──────────────────────────────────────────────────────────
# Done
# ──────────────────────────────────────────────────────────
step "Build complete!"
echo ""
echo -e "  ${GREEN}Installable DMG:${NC} $DMG_OUTPUT"
echo ""
echo "  To install:"
echo "    1. Double-click the .dmg to mount it"
echo "    2. Drag $APP_NAME to the Applications folder"
echo "    3. Launch from Applications or Spotlight"
echo ""
