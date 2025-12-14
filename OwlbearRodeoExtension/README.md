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

## GitHub Pages Deployment

The extension is configured to build directly to the `docs/` folder for GitHub Pages hosting:

### Build for GitHub Pages

```bash
npm run build:pages
```

**Important Path Notes**:
- Uses `manifest_version` (snake_case) as required by Owlbear Rodeo
- Uses full absolute URLs for assets to work across different contexts
- Window size configured in manifest action (`width: 450px, height: 400px`)

This creates the `docs/` folder in your repository root with all built files.

### GitHub Pages Setup

1. **Enable GitHub Pages** in your repository settings
2. **Select source**: "Deploy from a branch"
3. **Branch**: `main` (or your default branch)
4. **Folder**: `/docs`

### Quick Deployment (Recommended)

```bash
# One-command deployment
npm run deploy:pages
git push
```

This automatically builds, commits the docs folder, and prepares for push.

### Alternative: Manual Deployment

```bash
# Build the extension
npm run build:pages

# Commit the docs folder
git add ../docs/
git commit -m "Deploy extension to GitHub Pages"
git push
```

### Access Your Extension

Once deployed, your extension will be available at:
```
https://yourusername.github.io/repository-name/manifest.json
```

Use this URL when installing the extension in Owlbear Rodeo.

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

| Scenario | Version Format | Example | Owlbear Compatible |
|----------|----------------|---------|-------------------|
| **All builds** | `{semantic}` | `1.2.3` | ✅ Yes |
| **Auto-increment** | Patch version increases on every build | `0.0.1 → 0.0.2 → 0.0.3` | ✅ Yes |

**Note**: The patch version automatically increments on every build (dev or production). This ensures each deployment has a unique version number while maintaining semantic versioning compatibility with Owlbear Rodeo.

### Build Process

The version updates automatically during:
- `npm run build` - Updates before building
- `npm run prepare` - Updates when package is prepared

## Features

- 🎲 **Dice Rolling**: Roll D20 with critical success/failure detection
- 📊 **Scene Analysis**: Get information about items on your scene
- 🔔 **Notifications**: Send notifications to players
- 🖱️ **Context Menu**: Right-click any asset to draw indicator squares
- 📐 **Selection Indicators**: Visual square appears when selecting items
- 🎨 **HTML Squares**: Pure HTML elements that appear within the extension UI
- ⬡ **Hex Map Builder**: Interactive tool for creating snapping hexagon grids with live preview
- 🎨 **Modern UI**: Beautiful gradient design with responsive layout

## Hex Map Builder Usage

The hex map builder provides an interactive tool for creating hexagon-based maps:

1. **Activate Tool**: Click the "⬡ Hex Builder" button in the extension
2. **Visual Preview**: Move your mouse on the Owlbear scene to see a green ghost hexagon
3. **Place Hexagons**: Click to place solid blue hexagons that snap to a hexagonal grid
4. **Deactivate**: Click the button again to exit hex placement mode

**Features**:
- **Grid Snapping**: Hexagons automatically align to create perfect hexagonal grids
- **Live Preview**: See where your next hexagon will be placed before clicking
- **Coordinate System**: Each hexagon is labeled with its grid coordinates (q, r)
- **Visual Feedback**: Extension shows placement information and coordinates

## Technical Learning

**APIs Demonstrated**:
- `OBR.contextMenu.create()` - Register context menu items with visual indicators
- `OBR.scene.items.onChange()` - Listen for scene item changes and selections
- `OBR.scene.items.addItems()` - Add shapes and visual elements to the scene
- `OBR.scene.items.deleteItems()` - Remove items from scene
- `OBR.scene.items.getItemBounds()` - Get item dimensions and position for precise placement
- `OBR.tool.create()` - Create custom tools in Owlbear's toolbar
- `OBR.tool.createMode()` - Create custom tool modes with mouse interaction
- `OBR.tool.activateTool()` - Activate/deactivate tools programmatically
- `buildShape()` - Create visual shapes programmatically with full styling control
- **Hex Grid Mathematics** - Convert between pixel and hexagonal coordinates
- **DOM Manipulation** - Create and manage HTML elements within the extension UI
- Tool mode event handlers (onToolMove, onToolClick, onActivate, onDeactivate)
- Shape positioning, layering, and visual properties
- Multiple indicator management and cleanup
- CSS animations and transitions for UI elements

## Next Steps

- Explore more SDK features like tools, context menus, and popovers
- Try integrating with React or Vue for more complex interfaces
- Add more complex functionality like character sheets or initiative trackers
- Customize the color scheme and branding
