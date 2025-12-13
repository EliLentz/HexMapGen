import './style.css'
import OBR, { buildShape } from '@owlbear-rodeo/sdk'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="extension-container">
    <h1>🎲 Hex Map Generator</h1>

    <div class="controls-section">
      <h2 class="section-title">Quick Actions</h2>
      <div class="button-grid">
        <button id="notify-btn" type="button">🔔 Show Notification</button>
        <button id="scene-btn" type="button">📊 Scene Info</button>
        <button id="dice-btn" type="button">🎯 Roll Dice</button>
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
})
