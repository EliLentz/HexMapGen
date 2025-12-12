# My First Owlbear Rodeo Extension

A study extension for learning Owlbear Rodeo development.

## Features

- Show notifications in Owlbear Rodeo
- Get information about scene items
- Simple dice rolling functionality

## Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Install extension in Owlbear Rodeo:**
   - Open Owlbear Rodeo
   - Go to Settings > Extensions
   - Click "Add Extension"
   - Enter the manifest URL: `http://localhost:5173/manifest.json`
   - Click "Install"

## Technologies Used

- **Vite** - Build tool and development server
- **TypeScript** - Type-safe JavaScript
- **@owlbear-rodeo/sdk** - Owlbear Rodeo integration

## Architecture

- `manifest.json` - Extension configuration and metadata
- `src/main.ts` - Main extension code using the Owlbear Rodeo SDK
- `src/style.css` - Extension styling
- `public/icon.svg` - Extension icon

## Automatic Version Management

The extension automatically updates its version in `manifest.json` based on your commits and package version:

### Version Commands

```bash
# Bump patch version (0.0.1 → 0.0.2)
npm run version:patch

# Bump minor version (0.0.1 → 0.1.0)
npm run version:minor

# Bump major version (0.0.1 → 1.0.0)
npm run version:major

# Manual update (uses git info)
npm run version:update
```

### Version Format

- **Main/Master branch**: `1.2.3+abc1234` (semantic + commit hash)
- **Other branches**: `1.2.3-branch.25` (semantic + branch + commit count)
- **Development**: `0.25.1234-dev` (fallback with timestamp)

### Build Process

The version updates automatically during:
- `npm run build` - Updates before building
- `npm run prepare` - Updates when package is prepared

## Next Steps

- Explore more SDK features like tools, context menus, and popovers
- Try integrating with React or Vue
- Add more complex functionality like character sheets or initiative trackers
