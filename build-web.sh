#!/usr/bin/env bash
# ============================================================================
# build-web.sh
# Builds Notemac++ for the web and opens it in the default browser
# Works on macOS, Linux, and WSL
# ============================================================================
set -euo pipefail

APP_NAME="Notemac++"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Default port (can be overridden: PORT=8080 ./build-web.sh)
PORT="${PORT:-4173}"

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
# 1. Detect OS
# ──────────────────────────────────────────────────────────
OS="$(uname -s)"
case "$OS" in
  Darwin) PLATFORM="macos" ;;
  Linux)
    if grep -qi microsoft /proc/version 2>/dev/null; then
      PLATFORM="wsl"
    else
      PLATFORM="linux"
    fi
    ;;
  MINGW*|MSYS*|CYGWIN*) PLATFORM="windows" ;;
  *) PLATFORM="unknown" ;;
esac

# ──────────────────────────────────────────────────────────
# 2. Check & install prerequisites
# ──────────────────────────────────────────────────────────
step "Checking prerequisites ($PLATFORM)"

install_node_macos() {
  if command -v brew &>/dev/null; then
    brew install node
  else
    warn "Homebrew not found. Installing Homebrew first..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    if [[ -f /opt/homebrew/bin/brew ]]; then
      eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
    brew install node
  fi
}

install_node_linux() {
  if command -v apt-get &>/dev/null; then
    info "Installing Node.js via apt..."
    # Use NodeSource for up-to-date Node
    if ! command -v curl &>/dev/null; then
      sudo apt-get update && sudo apt-get install -y curl
    fi
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
  elif command -v dnf &>/dev/null; then
    info "Installing Node.js via dnf..."
    sudo dnf install -y nodejs npm
  elif command -v pacman &>/dev/null; then
    info "Installing Node.js via pacman..."
    sudo pacman -Sy --noconfirm nodejs npm
  elif command -v apk &>/dev/null; then
    info "Installing Node.js via apk..."
    sudo apk add nodejs npm
  else
    error "No supported package manager found (apt, dnf, pacman, apk)."
    error "Please install Node.js manually: https://nodejs.org/"
    exit 1
  fi
}

# Node.js check
if ! command -v node &>/dev/null; then
  warn "Node.js not found. Installing..."
  case "$PLATFORM" in
    macos) install_node_macos ;;
    linux|wsl) install_node_linux ;;
    *)
      error "Please install Node.js manually: https://nodejs.org/"
      exit 1
      ;;
  esac
fi

NODE_VERSION=$(node -v)
log "Node.js $NODE_VERSION"

# npm check
if ! command -v npm &>/dev/null; then
  error "npm not found even though Node.js is installed."
  error "Try: npm install -g npm"
  exit 1
fi
log "npm $(npm -v)"

# Check Node version is >= 18
NODE_MAJOR=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_MAJOR" -lt 18 ]; then
  warn "Node.js v18+ recommended (you have $NODE_VERSION)."
  warn "Some features may not work correctly."
fi

# ──────────────────────────────────────────────────────────
# 3. Install Node dependencies
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
# 4. Build the web version
# ──────────────────────────────────────────────────────────
step "Building web version"

info "Running TypeScript compilation and Vite build..."
npm run build
log "Web assets built → dist/"

# Quick sanity check
if [ ! -f "dist/index.html" ]; then
  error "Build failed — dist/index.html not found"
  exit 1
fi

BUILD_SIZE=$(du -sh dist | cut -f1)
log "Build size: $BUILD_SIZE"

# ──────────────────────────────────────────────────────────
# 5. Find an available port
# ──────────────────────────────────────────────────────────
step "Starting web server"

find_open_port() {
  local port=$1
  while lsof -iTCP:"$port" -sTCP:LISTEN &>/dev/null 2>&1 || \
        ss -tlnp 2>/dev/null | grep -q ":$port " 2>/dev/null; do
    port=$((port + 1))
    if [ "$port" -gt 65535 ]; then
      error "No available port found"
      exit 1
    fi
  done
  echo "$port"
}

ACTUAL_PORT=$(find_open_port "$PORT")
if [ "$ACTUAL_PORT" != "$PORT" ]; then
  warn "Port $PORT is in use, using port $ACTUAL_PORT instead"
fi

URL="http://localhost:$ACTUAL_PORT"

# ──────────────────────────────────────────────────────────
# 6. Open browser
# ──────────────────────────────────────────────────────────
open_browser() {
  local url="$1"
  case "$PLATFORM" in
    macos)
      open "$url"
      ;;
    linux)
      if command -v xdg-open &>/dev/null; then
        xdg-open "$url" &>/dev/null &
      elif command -v gnome-open &>/dev/null; then
        gnome-open "$url" &>/dev/null &
      elif command -v firefox &>/dev/null; then
        firefox "$url" &>/dev/null &
      elif command -v chromium-browser &>/dev/null; then
        chromium-browser "$url" &>/dev/null &
      else
        warn "Could not detect a browser. Open manually: $url"
      fi
      ;;
    wsl)
      # Use Windows browser from WSL
      if command -v wslview &>/dev/null; then
        wslview "$url"
      elif command -v explorer.exe &>/dev/null; then
        explorer.exe "$url"
      elif command -v cmd.exe &>/dev/null; then
        cmd.exe /c start "$url"
      else
        warn "Could not open browser from WSL. Open manually: $url"
      fi
      ;;
    *)
      warn "Unknown platform. Open manually: $url"
      ;;
  esac
}

# ──────────────────────────────────────────────────────────
# 7. Start Vite preview server and open browser
# ──────────────────────────────────────────────────────────

info "Starting server on $URL"
echo ""
echo -e "  ${GREEN}╔═══════════════════════════════════════════╗${NC}"
echo -e "  ${GREEN}║                                           ║${NC}"
echo -e "  ${GREEN}║   $APP_NAME is running!               ║${NC}"
echo -e "  ${GREEN}║                                           ║${NC}"
echo -e "  ${GREEN}║   Local:   ${NC}${CYAN}$URL${NC}$(printf '%*s' $((20 - ${#URL} + 24)) '')${GREEN}║${NC}"
echo -e "  ${GREEN}║                                           ║${NC}"
echo -e "  ${GREEN}║   Press Ctrl+C to stop the server         ║${NC}"
echo -e "  ${GREEN}║                                           ║${NC}"
echo -e "  ${GREEN}╚═══════════════════════════════════════════╝${NC}"
echo ""

# Open browser after a short delay (let server spin up)
(sleep 1.5 && open_browser "$URL") &
BROWSER_PID=$!

# Cleanup on exit
cleanup() {
  echo ""
  info "Shutting down server..."
  kill "$BROWSER_PID" 2>/dev/null || true
  log "Server stopped. Goodbye!"
}
trap cleanup EXIT INT TERM

# Run the Vite preview server (serves dist/ folder)
npx vite preview --port "$ACTUAL_PORT" --host localhost --strictPort
