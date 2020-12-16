const { TouchBar } = require('electron')
const {
	TouchBarButton,
	TouchBarLabel,
	TouchBarSpacer,
	TouchBarSegmentedControl,
  TouchBarScrubber
} = TouchBar

// this selects the title
const titleSelector = '.title.style-scope.ytmusic-player-bar'

// these keys will be used to go backwards, pause and skip songs
const keys = ['k','space','j']

const presskey = (window, key) => {
  window.webContents.sendInputEvent({
    type: "keydown",
    keyCode: key
  })
}

// grab the title using the selector
const getTitle = (win) => {
  return win.webContents.executeJavaScript(
    `document.querySelector('` + titleSelector + `').innerText`
  ).catch(e => {
    console.log(e)
  })
}

module.exports = (win) => {
  // songtitle label
  let songTitle = new TouchBarLabel({label: ''})

  // the song control buttons (keys to press are in the same order)
  const buttons = new TouchBarSegmentedControl({
    mode: 'buttons',
    segments: [
      new TouchBarButton({label: '<'}),
      new TouchBarButton({label: '⏯️'}),
      new TouchBarButton({label: '>'})
    ],
    change: (i) => presskey(win,keys[i])
  })

  // this is the touchbar object, this combines everything with proper layout
  const touchBar = new TouchBar({
    items: [
      new TouchBarScrubber({items: [songTitle], continuous: false}),
      new TouchBarSpacer({size:'flexible'}),
      buttons
    ]
  })

  // if the page title changes, update touchbar and song title
	win.on("page-title-updated", async () => {
		songTitle.label = await getTitle(win)
		win.setTouchBar(touchBar)
	})
}
