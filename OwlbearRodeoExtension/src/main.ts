import './style.css'
import OBR from '@owlbear-rodeo/sdk'

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

  // Add context menu item for showing item names
  OBR.contextMenu.create({
    id: 'show-item-name',
    icons: [
      {
        icon: 'https://elilentz.github.io/HexMapGen/icon.svg',
        label: '📝 Show Item Name',
        filter: {
          every: [{ key: 'layer', value: 'CHARACTER', operator: '!=' }, { key: 'layer', value: 'DRAWING', operator: '!=' }]
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

        // Show names of all selected items
        const itemNames = selectedItems.map(item => item.name || `Item ${item.id.slice(0, 8)}`).join(', ')
        OBR.notification.show(`📝 Items: ${itemNames}`)

        // Also update the extension output
        output.innerHTML = `
          <p>🖱️ Context Menu Used</p>
          <p>• Items selected: <strong>${selectedItems.length}</strong></p>
          <p>• Names: <em>${itemNames}</em></p>
          <p>• Right-click any asset to see this menu!</p>
        `
      } catch (error) {
        console.error('Error in context menu:', error)
        OBR.notification.show('❌ Error accessing item information')
      }
    }
  })

  console.log('🎯 Context menu registered: Right-click character tokens to see "Show Item Name"')
})
