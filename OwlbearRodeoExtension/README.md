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

## Next Steps

- Explore more SDK features like tools, context menus, and popovers
- Try integrating with React or Vue
- Add more complex functionality like character sheets or initiative trackers
