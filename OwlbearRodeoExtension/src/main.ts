import './style.css'
import OBR, { buildShape } from '@owlbear-rodeo/sdk'

// Hex grid utilities
function hexToPixel(q: number, r: number, size: number) {
  const x = size * (3/2 * q)
  const y = size * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r)
  return { x, y }
}

function pixelToHex(x: number, y: number, size: number) {
  const q = (2/3 * x) / size
  const r = (-1/3 * x + Math.sqrt(3)/3 * y) / size
  return hexRound(q, r)
}

function hexRound(q: number, r: number) {
  const s = -q - r
  let rq = Math.round(q)
  let rr = Math.round(r)
  let rs = Math.round(s)

  const qDiff = Math.abs(rq - q)
  const rDiff = Math.abs(rr - r)
  const sDiff = Math.abs(rs - s)

  if (qDiff > rDiff && qDiff > sDiff) {
    rq = -rr - rs
  } else if (rDiff > sDiff) {
    rr = -rq - rs
  }

  return { q: rq, r: rr }
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

  // Hex Map Builder Tool
  let hexToolActive = false
  let ghostHexagonId: string | null = null
  const hexSize = 50 // Size of each hexagon

  // Create the hex builder tool first
  OBR.tool.create({
    id: 'hex-builder-tool',
    icons: [{
      icon: 'https://elilentz.github.io/HexMapGen/icon.svg',
      label: 'Hex Builder'
    }],
    defaultMode: 'hex-placement-mode'
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

      // Remove ghost hexagon
      if (ghostHexagonId) {
        OBR.scene.items.deleteItems([ghostHexagonId])
        ghostHexagonId = null
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

        output.innerHTML = `
          <p>⬡ Hex Builder Activated</p>
          <p>• Tool mode active</p>
          <p>• Move mouse to see ghost hexagon</p>
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
    onDeactivate: () => {
      console.log('Hex Builder tool mode deactivated')
      // Clean up ghost hexagon when tool is deactivated
      if (ghostHexagonId) {
        OBR.scene.items.deleteItems([ghostHexagonId])
        ghostHexagonId = null
      }
    },
    onToolMove: async (_context, event) => {
      if (!hexToolActive) return

      try {
        // Convert mouse position to hex coordinates
        const hexCoords = pixelToHex(event.pointerPosition.x, event.pointerPosition.y, hexSize)
        const pixelPos = hexToPixel(hexCoords.q, hexCoords.r, hexSize)

        // Remove existing ghost
        if (ghostHexagonId) {
          await OBR.scene.items.deleteItems([ghostHexagonId])
        }

        // Create ghost hexagon (preview)
        const ghostHex = buildShape()
          .shapeType('HEXAGON')
          .position({ x: pixelPos.x, y: pixelPos.y })
          .width(hexSize * 2)
          .height(hexSize * 2)
          .fillColor('#4CAF50')
          .fillOpacity(0.3)
          .strokeColor('#4CAF50')
          .strokeWidth(2)
          .strokeOpacity(0.8)
          .name('Hex Preview')
          .build()

        await OBR.scene.items.addItems([ghostHex])
        ghostHexagonId = ghostHex.id

      } catch (error) {
        console.error('Error in hex tool move:', error)
      }
    },
    onToolClick: async (_context, event) => {
      if (!hexToolActive) return

      try {
        // Convert mouse position to hex coordinates and place hexagon
        const hexCoords = pixelToHex(event.pointerPosition.x, event.pointerPosition.y, hexSize)
        const pixelPos = hexToPixel(hexCoords.q, hexCoords.r, hexSize)

        // Remove ghost hexagon
        if (ghostHexagonId) {
          await OBR.scene.items.deleteItems([ghostHexagonId])
          ghostHexagonId = null
        }

        // Create actual hexagon
        const hexagon = buildShape()
          .shapeType('HEXAGON')
          .position({ x: pixelPos.x, y: pixelPos.y })
          .width(hexSize * 2)
          .height(hexSize * 2)
          .fillColor('#2196F3')
          .fillOpacity(0.8)
          .strokeColor('#0D47A1')
          .strokeWidth(3)
          .strokeOpacity(1)
          .name(`Hex (${hexCoords.q}, ${hexCoords.r})`)
          .build()

        await OBR.scene.items.addItems([hexagon])

        // Update extension output
        output.innerHTML = `
          <p>⬡ Hexagon Placed</p>
          <p>• Grid position: (${hexCoords.q}, ${hexCoords.r})</p>
          <p>• World position: (${Math.round(pixelPos.x)}, ${Math.round(pixelPos.y)})</p>
          <p>• Move mouse for next placement</p>
        `

        // Create new ghost at same position
        const newGhostHex = buildShape()
          .shapeType('HEXAGON')
          .position({ x: pixelPos.x, y: pixelPos.y })
          .width(hexSize * 2)
          .height(hexSize * 2)
          .fillColor('#4CAF50')
          .fillOpacity(0.3)
          .strokeColor('#4CAF50')
          .strokeWidth(2)
          .strokeOpacity(0.8)
          .name('Hex Preview')
          .build()

        await OBR.scene.items.addItems([newGhostHex])
        ghostHexagonId = newGhostHex.id

      } catch (error) {
        console.error('Error placing hexagon:', error)
        OBR.notification.show('❌ Error placing hexagon')
      }
    }
  })

  console.log('⬡ Hex Builder tool mode created')
})
