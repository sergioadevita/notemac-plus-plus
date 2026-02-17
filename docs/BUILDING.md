# Building Notemac++

Notemac++ can be built as a web application or as a native macOS desktop app. All build scripts auto-install missing prerequisites.

## Prerequisites

- **Node.js** (18+)
- **npm**
- **python3** + **Pillow** (for icon generation)
- **macOS** (required for DMG builds)

The build scripts will install these automatically via Homebrew if they're not present.

## Web Application

### Development Server

```bash
npm install
npm run dev
```

Opens a development server at `http://localhost:5173` with hot module replacement.

### Production Build

```bash
./build-web.sh
```

This script:

1. Detects your platform (macOS, Linux, WSL, Windows)
2. Installs Node.js if missing
3. Runs `npm install`
4. Builds with Vite
5. Serves the result at `http://localhost:4173`

Works on macOS, Linux, and Windows (via WSL).

## Desktop Application (macOS)

### Development Mode

```bash
npm run electron:dev
```

Starts Vite dev server and Electron simultaneously with hot reload.

### Portable DMG

```bash
./build-portable-dmg.sh
```

Creates a self-contained DMG at `release/Notemac++-Portable.dmg`. The user mounts the disk image and runs the app directly — no installation needed.

Build steps:

1. Check/install prerequisites (Xcode CLT, Homebrew, Node.js, python3)
2. `npm install`
3. Generate app icon (Pillow-based octopus-on-notepad icon)
4. `npm run build` (TypeScript + Vite)
5. `npx electron-builder --mac --config.mac.target=dir`
6. Package into compressed DMG with `hdiutil`

### Installable DMG

```bash
./build-install-dmg.sh
```

Creates a professional installer DMG at `release/Notemac++-Installer.dmg` with a drag-to-Applications layout.

Additional prerequisites: `create-dmg` (installed via Homebrew automatically).

Build steps are the same as portable, except the final DMG is created with `create-dmg` for a polished installer experience with an Applications folder shortcut.

## Build Outputs

| Build | Output | Size (approx.) |
|---|---|---|
| Web | `dist/` | ~300 KB (gzipped) |
| Portable DMG | `release/Notemac++-Portable.dmg` | ~90 MB |
| Installer DMG | `release/Notemac++-Installer.dmg` | ~90 MB |

## Icon Assets

All icon assets live in the `Icons/` folder at the project root, which is the single source of truth for the app icon. It contains pre-generated PNGs at all required sizes (16px through 1024px) and a macOS `.icns` file. Both build scripts copy from `Icons/` into `public/` at build time. If you need to regenerate the icons, use `generate_icon.py` (Pillow-based) followed by `generate_icns.py` to rebuild the `.icns`.

## Configuration

Electron builder configuration is in `package.json` under the `"build"` key:

- **App ID**: `com.notemac.plusplus`
- **Product Name**: Notemac++
- **Target**: macOS (DMG and directory)
- **Window style**: `hiddenInset` title bar with custom traffic light positioning

## TypeScript

The project uses `tsc -b` for type checking. Test files (`src/__tests__/`) are excluded from the main TypeScript compilation via `tsconfig.json` — Vitest handles its own TypeScript processing.
