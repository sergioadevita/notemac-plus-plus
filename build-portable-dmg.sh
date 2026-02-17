#!/usr/bin/env bash
# ============================================================================
# build-portable-dmg.sh
# Builds Notemac++ as a portable .dmg that runs directly from the disk image
# No installation needed — just mount and double-click the app
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
NC='\033[0m'

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
  if [[ -f /opt/homebrew/bin/brew ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  fi
fi
log "Homebrew available"

# Node.js
if ! command -v node &>/dev/null; then
  warn "Node.js not found. Installing via Homebrew..."
  brew install node
fi
log "Node.js $(node -v)"

# npm
if ! command -v npm &>/dev/null; then
  error "npm not found. Please reinstall Node.js."
  exit 1
fi
log "npm $(npm -v)"

# python3
if ! command -v python3 &>/dev/null; then
  warn "python3 not found. Installing via Homebrew..."
  brew install python3
fi
log "python3 available"

# ──────────────────────────────────────────────────────────
# 2. Install Node dependencies
# ──────────────────────────────────────────────────────────
step "Installing dependencies"

if [ ! -d "node_modules" ]; then
  info "Running npm install..."
  npm install
else
  info "Ensuring dependencies are up to date..."
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
# 5. Build the Electron app (unpacked)
# ──────────────────────────────────────────────────────────
step "Building Electron app (portable)"

info "Running electron-builder (unpacked .app)..."
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
# 6. Create a portable (direct-run) DMG
# ──────────────────────────────────────────────────────────
step "Creating portable DMG"

DMG_NAME="${APP_NAME}-Portable"
DMG_OUTPUT="release/${DMG_NAME}.dmg"
rm -f "$DMG_OUTPUT"

# Portable DMG: contains just the .app, no Applications symlink
# The user mounts it and runs the app directly from the mounted volume

STAGING_DIR=$(mktemp -d)
cp -R "$APP_PATH" "$STAGING_DIR/"

# Add a README to explain portable usage
cat > "$STAGING_DIR/README.txt" <<EOF
╔═══════════════════════════════════════════════╗
║           $APP_NAME — Portable Edition          ║
╠═══════════════════════════════════════════════╣
║                                               ║
║  Just double-click "$APP_NAME.app" to run!      ║
║                                               ║
║  No installation needed.                      ║
║  This app runs directly from the disk image.  ║
║                                               ║
║  To unmount, eject the disk image from Finder  ║
║  or drag it to the Trash.                      ║
║                                               ║
╚═══════════════════════════════════════════════╝
EOF

# Create a read-write DMG first, then convert to compressed read-only
info "Packaging into DMG..."
TEMP_DMG=$(mktemp -u).dmg

# Calculate needed size (app size + 20MB buffer)
APP_SIZE_MB=$(du -sm "$STAGING_DIR" | cut -f1)
DMG_SIZE_MB=$((APP_SIZE_MB + 20))

hdiutil create \
  -volname "$APP_NAME Portable" \
  -srcfolder "$STAGING_DIR" \
  -ov -format UDZO \
  -imagekey zlib-level=9 \
  "$DMG_OUTPUT"

rm -rf "$STAGING_DIR"

if [ -f "$DMG_OUTPUT" ]; then
  DMG_SIZE=$(du -h "$DMG_OUTPUT" | cut -f1)
  log "Portable DMG created: $DMG_OUTPUT ($DMG_SIZE)"
else
  error "Failed to create portable DMG"
  exit 1
fi

# ──────────────────────────────────────────────────────────
# Done
# ──────────────────────────────────────────────────────────
step "Build complete!"
echo ""
echo -e "  ${GREEN}Portable DMG:${NC} $DMG_OUTPUT"
echo ""
echo "  To use:"
echo "    1. Double-click the .dmg to mount it"
echo "    2. Double-click $APP_NAME.app to run it directly"
echo "    3. No installation required!"
echo ""
echo "  Note: macOS may show a security warning on first launch."
echo "  Go to System Settings → Privacy & Security → Open Anyway"
echo ""
