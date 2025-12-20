import './style.css'
import OBR, { buildShape } from '@owlbear-rodeo/sdk'

// Hex size detection utility
function detectHexSize(hexagon: any): number | null {
  if (!hexagon || hexagon.type !== 'SHAPE' || (hexagon as any).shapeType !== 'HEXAGON') {
    return null
  }

  // Hexagon size is typically stored in width/height
  // For a hexagon, width and height should be equal
  const width = hexagon.width || 0
  const height = hexagon.height || 0

  if (width === 0 && height === 0) {
    return null
  }

  // Hexagon radius is half the width/height
  // But we need the "size" parameter used in calculations
  // For hexagons, size = width / 2
  const detectedSize = Math.max(width, height) / 2

  return detectedSize > 0 ? detectedSize : null
}

// Hex edge-to-edge snapping utilities
function getHexagonNeighbors(centerX: number, centerY: number, hexSize: number) {
  // Hexagon has 6 neighbors at 60-degree intervals
  const neighbors = []
  const radius = hexSize * Math.sqrt(3) // Distance to neighbor centers

  for (let i = 0; i < 6; i++) {
    const angle = (i * 60) * (Math.PI / 180)
    const x = centerX + radius * Math.cos(angle)
    const y = centerY + radius * Math.sin(angle)
    neighbors.push({ x, y, direction: i })
  }

  return neighbors
}

function getAllValidSnapPositions(existingHexagons: any[], hexSize: number) {
  const snapPositions: Array<{ x: number; y: number; distance: number }> = []
  const occupiedPositions = new Set<string>()

  // Mark occupied positions
  for (const hex of existingHexagons) {
    if (!hex.position) continue
    const key = `${Math.round(hex.position.x)},${Math.round(hex.position.y)}`
    occupiedPositions.add(key)
  }

  // Get all neighbor positions
  for (const hex of existingHexagons) {
    if (!hex.position) continue

    const neighbors = getHexagonNeighbors(hex.position.x, hex.position.y, hexSize)

    for (const neighbor of neighbors) {
      const key = `${Math.round(neighbor.x)},${Math.round(neighbor.y)}`
      
      // Skip if position is already occupied
      if (occupiedPositions.has(key)) continue

      // Check if this position is already in our list
      const existing = snapPositions.find(pos => 
        Math.abs(pos.x - neighbor.x) < 1 && Math.abs(pos.y - neighbor.y) < 1
      )

      if (!existing) {
        snapPositions.push({ x: neighbor.x, y: neighbor.y, distance: 0 })
        occupiedPositions.add(key)
      }
    }
  }

  return snapPositions
}

function findNearestSnapPosition(mouseX: number, mouseY: number, existingHexagons: any[], hexSize: number) {
  if (existingHexagons.length === 0) {
    // No existing hexagons, place at mouse position
    return { x: mouseX, y: mouseY, distance: 0 }
  }

  let nearestPosition = { x: mouseX, y: mouseY, distance: Infinity }

  // Check all possible snap positions around existing hexagons
  for (const hex of existingHexagons) {
    if (!hex.position) continue

    const neighbors = getHexagonNeighbors(hex.position.x, hex.position.y, hexSize)

    for (const neighbor of neighbors) {
      const distance = Math.sqrt(
        Math.pow(mouseX - neighbor.x, 2) + Math.pow(mouseY - neighbor.y, 2)
      )

      if (distance < nearestPosition.distance) {
        nearestPosition = { x: neighbor.x, y: neighbor.y, distance }
      }
    }
  }

  // If mouse is very close to an existing hexagon position, don't snap (avoid overlap)
  const minDistance = hexSize * 1.5 // Minimum distance to avoid overlap
  for (const hex of existingHexagons) {
    if (!hex.position) continue

    const distanceToExisting = Math.sqrt(
      Math.pow(mouseX - hex.position.x, 2) + Math.pow(mouseY - hex.position.y, 2)
    )

    if (distanceToExisting < minDistance) {
      // Too close to existing hexagon, place at mouse position instead
      return { x: mouseX, y: mouseY, distance: 0 }
    }
  }

  return nearestPosition
}

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="extension-container">
    <h1>🎲 Hex Map Generator</h1>

    <div class="controls-section">
      <h2 class="section-title">Quick Actions</h2>
      <div class="button-grid">
        <button id="notify-btn" type="button">🔔 Show Notification</button>
        <button id="scene-btn" type="button">📊 Scene Info</button>
        <button id="dice-btn" type="button">🎯 Roll Dice</button>
        <button id="html-square-btn" type="button">🎨 HTML Square</button>
        <button id="hex-tool-btn" type="button">⬡ Hex Builder</button>
      </div>
    </div>

    <div class="hex-builder-section" id="hex-builder-section" style="display: none;">
      <h2 class="section-title">Hex Map Builder</h2>
      <div class="hex-controls">
        <div class="hex-size-control">
          <label>Hex Size:</label>
          <span id="hex-size-display">50px</span>
          <button id="set-size-btn" type="button" class="secondary-btn">📏 Set from Selected Hex</button>
        </div>
        <div class="hex-actions">
          <button id="undo-btn" type="button" class="secondary-btn" disabled>↶ Undo (Ctrl+Z)</button>
          <button id="redo-btn" type="button" class="secondary-btn" disabled>↷ Redo (Ctrl+Y)</button>
        </div>
        <div class="hex-status">
          <span id="placement-counter">Placed: 0</span>
        </div>
      </div>
    </div>

    <div class="output-section">
      <h2 class="section-title">Results</h2>
      <div id="output" class="output">
        <p>Ready to interact with your Owlbear Rodeo scene!</p>
      </div>
    </div>
  </div>
`

// Initialize the Owlbear Rodeo SDK
OBR.onReady(() => {
  console.log('Extension is ready!')

  const output = document.querySelector<HTMLDivElement>('#output')!

  // Setup notification button
  const notifyBtn = document.querySelector<HTMLButtonElement>('#notify-btn')!
  notifyBtn.addEventListener('click', () => {
    OBR.notification.show('🎉 Hello from Hex Map Generator!')
    output.innerHTML = `
      <p>✅ Notification sent!</p>
      <p>Check the top of your Owlbear Rodeo interface.</p>
    `
  })

  // Setup scene info button
  const sceneBtn = document.querySelector<HTMLButtonElement>('#scene-btn')!
  sceneBtn.addEventListener('click', async () => {
    try {
      const items = await OBR.scene.items.getItems()
      output.innerHTML = `
        <p>📊 Scene Analysis Complete</p>
        <p>• Total items: <strong>${items.length}</strong></p>
        <p>• Scene is ${items.length > 0 ? 'active' : 'empty'}</p>
      `
    } catch (error) {
      console.error('Error getting scene info:', error)
      output.innerHTML = `
        <p>❌ Error accessing scene</p>
        <p>Please make sure you're in an active scene.</p>
      `
    }
  })

  // Setup dice roll button
  const diceBtn = document.querySelector<HTMLButtonElement>('#dice-btn')!
  diceBtn.addEventListener('click', () => {
    const roll = Math.floor(Math.random() * 20) + 1
    const result = roll === 20 ? '🎯 Critical Success!' : roll === 1 ? '💥 Critical Failure!' : `Rolled: ${roll}`
    OBR.notification.show(`🎲 ${result}`)
    output.innerHTML = `
      <p>🎲 D20 Roll Result</p>
      <p><strong style="font-size: 1.2em; color: ${roll === 20 ? '#27ae60' : roll === 1 ? '#e74c3c' : '#3498db'}">${roll}</strong></p>
      <p>${roll === 20 ? '🌟 Amazing!' : roll === 1 ? '😞 Ouch!' : 'Nice roll!'}</p>
    `
  })

  // Setup HTML square button
  const htmlSquareBtn = document.querySelector<HTMLButtonElement>('#html-square-btn')!
  let htmlSquare: HTMLDivElement | null = null

  htmlSquareBtn.addEventListener('click', () => {
    const container = document.querySelector('.extension-container')!

    if (htmlSquare) {
      // Remove existing square
      container.removeChild(htmlSquare)
      htmlSquare = null
      htmlSquareBtn.textContent = '🎨 HTML Square'
      output.innerHTML = `
        <p>🎨 HTML Square</p>
        <p>• Square removed from UI</p>
        <p>• Click button again to show it</p>
      `
    } else {
      // Create new HTML square
      htmlSquare = document.createElement('div')
      htmlSquare.className = 'html-square'
      htmlSquare.innerHTML = `
        <div class="square-content">
          <span class="square-text">HTML</span>
          <span class="square-text">SQUARE</span>
        </div>
      `

      // Position it randomly within the container
      const containerRect = container.getBoundingClientRect()
      const squareSize = 80
      const maxX = containerRect.width - squareSize - 40 // Account for padding
      const maxY = containerRect.height - squareSize - 40

      const randomX = Math.random() * Math.max(0, maxX)
      const randomY = Math.random() * Math.max(0, maxY)

      htmlSquare.style.position = 'absolute'
      htmlSquare.style.left = `${randomX}px`
      htmlSquare.style.top = `${randomY}px`
      htmlSquare.style.zIndex = '10'

      container.appendChild(htmlSquare)
      htmlSquareBtn.textContent = '❌ Remove Square'

      output.innerHTML = `
        <p>🎨 HTML Square Created</p>
        <p>• Pure HTML element (not Owlbear item)</p>
        <p>• Position: (${Math.round(randomX)}, ${Math.round(randomY)})</p>
        <p>• Click button again to remove it</p>
      `
    }
  })

  // Track context menu indicator shapes
  let contextIndicatorId: string | null = null

  // Add context menu item for drawing indicator squares
  OBR.contextMenu.create({
    id: 'draw-indicator-square',
    icons: [
      {
        icon: 'https://elilentz.github.io/HexMapGen/icon.svg',
        label: '📐 Draw Indicator',
        filter: {
          every: [
            { key: 'layer', value: 'CHARACTER', operator: '!=' },
            { key: 'layer', value: 'DRAWING', operator: '!=' }
          ]
        }
      }
    ],
    onClick: async (context) => {
      try {
        // Get the selected items
        const selectedItems = context.items

        if (selectedItems.length === 0) {
          OBR.notification.show('❌ No items selected')
          return
        }

        // Get the first selected item
        const selectedItem = selectedItems[0]

        // Calculate position for the indicator (some distance above the item)
        const itemBounds = await OBR.scene.items.getItemBounds([selectedItem.id])
        const indicatorX = itemBounds.center.x
        const indicatorY = itemBounds.min.y - 60 // 60 units above the item

        // Remove existing context indicator
        if (contextIndicatorId) {
          await OBR.scene.items.deleteItems([contextIndicatorId])
        }

        // Create new indicator shape (different style from selection indicator)
        const contextIndicator = buildShape()
          .position({ x: indicatorX, y: indicatorY })
          .shapeType('RECTANGLE')
          .width(30)
          .height(30)
          .fillColor('#4ecdc4')
          .fillOpacity(0.9)
          .strokeColor('#26a69a')
          .strokeWidth(2)
          .strokeOpacity(1)
          .layer('POPOVER')
          .name('Context Menu Indicator')
          .build()

        // Add the shape to the scene
        await OBR.scene.items.addItems([contextIndicator])
        contextIndicatorId = contextIndicator.id

        // Show item name in notification
        const itemName = selectedItem.name || `Item ${selectedItem.id.slice(0, 8)}`
        OBR.notification.show(`📐 Indicator drawn for: ${itemName}`)

        // Update extension output
        output.innerHTML = `
          <p>🖱️ Context Menu Used</p>
          <p>• Indicator drawn above: <strong>${itemName}</strong></p>
          <p>• Position: (${Math.round(indicatorX)}, ${Math.round(indicatorY)})</p>
          <p>• Right-click any asset to draw indicators!</p>
        `
      } catch (error) {
        console.error('Error in context menu:', error)
        OBR.notification.show('❌ Error creating indicator')
      }
    }
  })

  console.log('🎯 Context menu registered: Right-click any asset to draw indicator squares')

  // Hex Map Builder Tool - State Management
  let hexToolActive = false
  let ghostHexagonIds: string[] = [] // Multiple ghosts for grid preview
  let currentHexSize: number = 50 // Configurable hex size
  let placementHistory: Array<{ id: string; position: { x: number; y: number }; size: number }> = []
  let redoHistory: Array<{ id: string; position: { x: number; y: number }; size: number }> = []
  let placementCount = 0

  // Get UI elements
  const hexBuilderSection = document.querySelector<HTMLDivElement>('#hex-builder-section')!
  const hexSizeDisplay = document.querySelector<HTMLSpanElement>('#hex-size-display')!
  const setSizeBtn = document.querySelector<HTMLButtonElement>('#set-size-btn')!
  const undoBtn = document.querySelector<HTMLButtonElement>('#undo-btn')!
  const redoBtn = document.querySelector<HTMLButtonElement>('#redo-btn')!
  const placementCounter = document.querySelector<HTMLSpanElement>('#placement-counter')!

  // Update hex size display
  function updateHexSizeDisplay() {
    hexSizeDisplay.textContent = `${Math.round(currentHexSize)}px`
  }

  // Update undo/redo button states
  function updateHistoryButtons() {
    undoBtn.disabled = placementHistory.length === 0
    redoBtn.disabled = redoHistory.length === 0
  }

  // Update placement counter
  function updatePlacementCounter() {
    placementCounter.textContent = `Placed: ${placementCount}`
  }

  // Initialize displays
  updateHexSizeDisplay()
  updateHistoryButtons()
  updatePlacementCounter()

  // Create the hex builder tool first
  OBR.tool.create({
    id: 'hex-builder-tool',
    icons: [{
      icon: 'https://elilentz.github.io/HexMapGen/icon.svg',
      label: 'Hex Builder'
    }],
    defaultMode: 'hex-placement-mode'
  })

  // Setup "Set Size from Selected Hex" button
  setSizeBtn.addEventListener('click', async () => {
    try {
      const allItems = await OBR.scene.items.getItems()
      const selectedItems = allItems.filter(item => 
        item.visible && item.metadata?.[`${OBR.player.id}/selected`] === true
      )

      if (selectedItems.length === 0) {
        OBR.notification.show('❌ Please select a hexagon first')
        output.innerHTML = `
          <p>📏 Size Detection</p>
          <p>• Select a hexagon on the scene</p>
          <p>• Then click "Set from Selected Hex"</p>
        `
        return
      }

      const selectedHex = selectedItems.find(item => 
        item.type === 'SHAPE' && (item as any).shapeType === 'HEXAGON'
      )

      if (!selectedHex) {
        OBR.notification.show('❌ Selected item is not a hexagon')
        output.innerHTML = `
          <p>📏 Size Detection Failed</p>
          <p>• Please select a hexagon shape</p>
        `
        return
      }

      const detectedSize = detectHexSize(selectedHex)
      if (detectedSize && detectedSize > 0) {
        currentHexSize = detectedSize
        updateHexSizeDisplay()
        OBR.notification.show(`✅ Hex size set to ${Math.round(detectedSize)}px`)
        output.innerHTML = `
          <p>📏 Hex Size Configured</p>
          <p>• Size: <strong>${Math.round(detectedSize)}px</strong></p>
          <p>• All new hexagons will use this size</p>
        `
      } else {
        OBR.notification.show('❌ Could not detect hex size')
      }
    } catch (error) {
      console.error('Error detecting hex size:', error)
      OBR.notification.show('❌ Error detecting hex size')
    }
  })

  // Setup Undo button
  undoBtn.addEventListener('click', async () => {
    if (placementHistory.length === 0) return

    try {
      const lastPlacement = placementHistory.pop()!
      
      // Remove the hexagon
      await OBR.scene.items.deleteItems([lastPlacement.id])
      
      // Add to redo history
      redoHistory.push(lastPlacement)
      
      placementCount = Math.max(0, placementCount - 1)
      updateHistoryButtons()
      updatePlacementCounter()

      OBR.notification.show('↶ Undone')
      output.innerHTML = `
        <p>↶ Undo</p>
        <p>• Removed last hexagon</p>
        <p>• Use Redo to restore it</p>
      `
    } catch (error) {
      console.error('Error undoing:', error)
      OBR.notification.show('❌ Error undoing placement')
    }
  })

  // Setup Redo button
  redoBtn.addEventListener('click', async () => {
    if (redoHistory.length === 0) return

    try {
      const toRedo = redoHistory.pop()!
      
      // Recreate the hexagon
      const hexagon = buildShape()
        .shapeType('HEXAGON')
        .position(toRedo.position)
        .width(toRedo.size * 2)
        .height(toRedo.size * 2)
        .fillColor('#2196F3')
        .fillOpacity(0.8)
        .strokeColor('#0D47A1')
        .strokeWidth(3)
        .strokeOpacity(1)
        .name(`Hex (${Math.round(toRedo.position.x)}, ${Math.round(toRedo.position.y)})`)
        .build()

      await OBR.scene.items.addItems([hexagon])
      
      // Add back to placement history
      placementHistory.push({ id: hexagon.id, position: toRedo.position, size: toRedo.size })
      
      placementCount++
      updateHistoryButtons()
      updatePlacementCounter()

      OBR.notification.show('↷ Redone')
      output.innerHTML = `
        <p>↷ Redo</p>
        <p>• Restored hexagon</p>
      `
    } catch (error) {
      console.error('Error redoing:', error)
      OBR.notification.show('❌ Error redoing placement')
    }
  })

  // Keyboard shortcuts for undo/redo
  document.addEventListener('keydown', async (e) => {
    if ((e.ctrlKey || e.metaKey) && hexToolActive) {
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (placementHistory.length > 0) {
          undoBtn.click()
        }
      } else if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
        e.preventDefault()
        if (redoHistory.length > 0) {
          redoBtn.click()
        }
      }
    }
  })

  // Setup hex tool button
  const hexToolBtn = document.querySelector<HTMLButtonElement>('#hex-tool-btn')!
  hexToolBtn.addEventListener('click', async () => {
    if (hexToolActive) {
      // Deactivate tool
      try {
        await OBR.tool.activateTool('') // Deactivate by activating empty tool
      } catch (error) {
        console.error('Error deactivating tool:', error)
      }
      hexToolActive = false
      hexToolBtn.textContent = '⬡ Hex Builder'
      hexToolBtn.style.background = ''
      hexBuilderSection.style.display = 'none'

      // Remove all ghost hexagons
      if (ghostHexagonIds.length > 0) {
        await OBR.scene.items.deleteItems(ghostHexagonIds)
        ghostHexagonIds = []
      }

      output.innerHTML = `
        <p>⬡ Hex Builder Deactivated</p>
        <p>• Tool mode disabled</p>
        <p>• Click to activate hex placement</p>
      `
    } else {
      // Activate tool
      try {
        await OBR.tool.activateTool('hex-builder-tool')
        hexToolActive = true
        hexToolBtn.textContent = '🟢 Hex Builder Active'
        hexToolBtn.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)'
        hexBuilderSection.style.display = 'block'

        output.innerHTML = `
          <p>⬡ Hex Builder Activated</p>
          <p>• Current hex size: <strong>${Math.round(currentHexSize)}px</strong></p>
          <p>• Move mouse to see grid preview</p>
          <p>• Click to place hexagons</p>
        `
      } catch (error) {
        console.error('Error activating hex tool:', error)
        OBR.notification.show('❌ Error activating hex tool')
      }
    }
  })

  // Track created indicator shapes
  let indicatorShapeId: string | null = null

  // Listen for item selection changes
  OBR.scene.items.onChange(async (items) => {
    try {
      // Find selected items
      const selectedItems = items.filter(item => item.visible && item.metadata?.[`${OBR.player.id}/selected`] === true)

      // Remove existing indicator if no items selected or different item selected
      if (selectedItems.length === 0) {
        if (indicatorShapeId) {
          await OBR.scene.items.deleteItems([indicatorShapeId])
          indicatorShapeId = null
        }
        return
      }

      // Get the first selected item
      const selectedItem = selectedItems[0]

      // Calculate position for the indicator (some distance from right edge of item)
      const itemBounds = await OBR.scene.items.getItemBounds([selectedItem.id])
      const itemRightEdge = itemBounds.max.x
      const indicatorX = itemRightEdge + 50 // 50 units to the right
      const indicatorY = itemBounds.center.y

      // Remove existing indicator
      if (indicatorShapeId) {
        await OBR.scene.items.deleteItems([indicatorShapeId])
      }

      // Create new indicator shape
      const indicatorShape = buildShape()
        .position({ x: indicatorX, y: indicatorY })
        .shapeType('RECTANGLE')
        .width(40)
        .height(40)
        .fillColor('#ff6b6b')
        .fillOpacity(0.8)
        .strokeColor('#ffffff')
        .strokeWidth(3)
        .strokeOpacity(1)
        .layer('POPOVER') // Ensure it's visible above other elements
        .name('Selection Indicator')
        .build()

      // Add the shape to the scene
      await OBR.scene.items.addItems([indicatorShape])
      indicatorShapeId = indicatorShape.id

      // Update extension output
      output.innerHTML = `
        <p>🎯 Item Selected</p>
        <p>• Name: <strong>${selectedItem.name || 'Unnamed Item'}</strong></p>
        <p>• Indicator placed at: (${Math.round(indicatorX)}, ${Math.round(indicatorY)})</p>
        <p>• Click elsewhere to remove indicator</p>
      `

    } catch (error) {
      console.error('Error handling selection:', error)
      // Clean up on error
      if (indicatorShapeId) {
        try {
          await OBR.scene.items.deleteItems([indicatorShapeId])
        } catch (cleanupError) {
          console.error('Error cleaning up:', cleanupError)
        }
        indicatorShapeId = null
      }
    }
  })

  console.log('📐 Selection indicator system active: Click any item to see the red square indicator')

  // Create Hex Builder Tool Mode
  OBR.tool.createMode({
    id: 'hex-placement-mode',
    icons: [{
      icon: 'https://elilentz.github.io/HexMapGen/icon.svg',
      label: 'Hex Placement'
    }],
    onActivate: () => {
      console.log('Hex Builder tool mode activated')
    },
    onDeactivate: async () => {
      console.log('Hex Builder tool mode deactivated')
      // Clean up all ghost hexagons when tool is deactivated
      if (ghostHexagonIds.length > 0) {
        await OBR.scene.items.deleteItems(ghostHexagonIds)
        ghostHexagonIds = []
      }
    },
    onToolMove: async (_context, event) => {
      if (!hexToolActive) return

      try {
        // Get all existing hexagons for edge-to-edge snapping
        const allItems = await OBR.scene.items.getItems()
        const existingHexagons = allItems.filter(item =>
          item.type === 'SHAPE' &&
          (item as any).shapeType === 'HEXAGON' &&
          item.name &&
          item.name.startsWith('Hex') &&
          !item.name.includes('Preview') // Exclude preview ghosts
        )

        // Find nearest snap position
        const snapPosition = findNearestSnapPosition(
          event.pointerPosition.x,
          event.pointerPosition.y,
          existingHexagons,
          currentHexSize
        )

        // Get all valid snap positions for grid preview
        const allSnapPositions = getAllValidSnapPositions(existingHexagons, currentHexSize)
        
        // Limit number of ghosts shown for performance (show up to 20)
        const maxGhosts = 20
        const positionsToShow = allSnapPositions.slice(0, maxGhosts)

        // Remove existing ghosts
        if (ghostHexagonIds.length > 0) {
          await OBR.scene.items.deleteItems(ghostHexagonIds)
          ghostHexagonIds = []
        }

        // Create ghost hexagons for grid preview
        const newGhosts = []
        for (const pos of positionsToShow) {
          const isNearest = Math.abs(pos.x - snapPosition.x) < 1 && Math.abs(pos.y - snapPosition.y) < 1
          
          const ghostHex = buildShape()
            .shapeType('HEXAGON')
            .position({ x: pos.x, y: pos.y })
            .width(currentHexSize * 2)
            .height(currentHexSize * 2)
            .fillColor(isNearest ? '#4CAF50' : '#90EE90')
            .fillOpacity(isNearest ? 0.5 : 0.2)
            .strokeColor(isNearest ? '#4CAF50' : '#90EE90')
            .strokeWidth(isNearest ? 3 : 1)
            .strokeOpacity(isNearest ? 1 : 0.5)
            .name('Hex Preview')
            .build()

          newGhosts.push(ghostHex)
        }

        // If no existing hexagons, show single ghost at mouse position
        if (existingHexagons.length === 0) {
          const singleGhost = buildShape()
            .shapeType('HEXAGON')
            .position({ x: event.pointerPosition.x, y: event.pointerPosition.y })
            .width(currentHexSize * 2)
            .height(currentHexSize * 2)
            .fillColor('#4CAF50')
            .fillOpacity(0.3)
            .strokeColor('#4CAF50')
            .strokeWidth(2)
            .strokeOpacity(0.8)
            .name('Hex Preview')
            .build()
          newGhosts.push(singleGhost)
        }

        if (newGhosts.length > 0) {
          await OBR.scene.items.addItems(newGhosts)
          ghostHexagonIds = newGhosts.map(ghost => ghost.id)
        }

      } catch (error) {
        console.error('Error in hex tool move:', error)
      }
    },
    onToolClick: async (_context, event) => {
      if (!hexToolActive) return

      try {
        // Get all existing hexagons for edge-to-edge snapping
        const allItems = await OBR.scene.items.getItems()
        const existingHexagons = allItems.filter(item =>
          item.type === 'SHAPE' &&
          (item as any).shapeType === 'HEXAGON' &&
          item.name &&
          item.name.startsWith('Hex') &&
          !item.name.includes('Preview') // Exclude preview ghosts
        )

        // Find nearest snap position
        const snapPosition = findNearestSnapPosition(
          event.pointerPosition.x,
          event.pointerPosition.y,
          existingHexagons,
          currentHexSize
        )

        // Remove all ghost hexagons
        if (ghostHexagonIds.length > 0) {
          await OBR.scene.items.deleteItems(ghostHexagonIds)
          ghostHexagonIds = []
        }

        // Create actual hexagon at snap position
        const hexagon = buildShape()
          .shapeType('HEXAGON')
          .position({ x: snapPosition.x, y: snapPosition.y })
          .width(currentHexSize * 2)
          .height(currentHexSize * 2)
          .fillColor('#2196F3')
          .fillOpacity(0.8)
          .strokeColor('#0D47A1')
          .strokeWidth(3)
          .strokeOpacity(1)
          .name(`Hex (${Math.round(snapPosition.x)}, ${Math.round(snapPosition.y)})`)
          .build()

        await OBR.scene.items.addItems([hexagon])

        // Track in placement history
        placementHistory.push({
          id: hexagon.id,
          position: { x: snapPosition.x, y: snapPosition.y },
          size: currentHexSize
        })

        // Clear redo history when new placement is made
        redoHistory = []
        
        placementCount++
        updateHistoryButtons()
        updatePlacementCounter()

        // Update extension output
        output.innerHTML = `
          <p>⬡ Hexagon Placed</p>
          <p>• Snapped to nearest edge</p>
          <p>• Position: (${Math.round(snapPosition.x)}, ${Math.round(snapPosition.y)})</p>
          <p>• Size: ${Math.round(currentHexSize)}px</p>
          <p>• Total placed: ${placementCount}</p>
          <p>• Use Ctrl+Z to undo</p>
        `

      } catch (error) {
        console.error('Error placing hexagon:', error)
        OBR.notification.show('❌ Error placing hexagon')
      }
    }
  })

  console.log('⬡ Hex Builder tool mode created')
})
