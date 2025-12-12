import './style.css'
import OBR from '@owlbear-rodeo/sdk'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <h1>My Owlbear Extension</h1>
    <div class="card">
      <button id="notify-btn" type="button">Show Notification</button>
      <button id="scene-btn" type="button">Get Scene Info</button>
      <button id="dice-btn" type="button">Roll Dice</button>
    </div>
    <div id="output" class="output"></div>
  </div>
`

// Initialize the Owlbear Rodeo SDK
OBR.onReady(() => {
  console.log('Extension is ready!')

  // Setup notification button
  const notifyBtn = document.querySelector<HTMLButtonElement>('#notify-btn')!
  notifyBtn.addEventListener('click', () => {
    OBR.notification.show('Hello from my extension!')
  })

  // Setup scene info button
  const sceneBtn = document.querySelector<HTMLButtonElement>('#scene-btn')!
  sceneBtn.addEventListener('click', async () => {
    try {
      const items = await OBR.scene.items.getItems()
      const output = document.querySelector<HTMLDivElement>('#output')!
      output.innerHTML = `<p>Found ${items.length} items on the scene</p>`
    } catch (error) {
      console.error('Error getting scene info:', error)
    }
  })

  // Setup dice roll button
  const diceBtn = document.querySelector<HTMLButtonElement>('#dice-btn')!
  diceBtn.addEventListener('click', () => {
    const roll = Math.floor(Math.random() * 20) + 1
    OBR.notification.show(`You rolled a ${roll}!`)
    const output = document.querySelector<HTMLDivElement>('#output')!
    output.innerHTML = `<p>Last roll: ${roll}</p>`
  })
})
