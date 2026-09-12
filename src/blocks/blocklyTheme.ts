import * as Blockly from 'blockly'

function createMixlyTheme() {
  try {
    return Blockly.Theme.defineTheme('mixly', {
      name: 'mixly',
      base: Blockly.Themes.Classic,
      componentStyles: {
        workspaceBackgroundColour: '#f7fbfa',
        toolboxBackgroundColour: '#dddddd',
        toolboxForegroundColour: '#000000',
        flyoutBackgroundColour: '#e8e8e8',
        flyoutForegroundColour: '#000000',
        flyoutOpacity: 0.95,
        scrollbarColour: '#c3c1c1',
        scrollbarOpacity: 0.7,
        insertionMarkerColour: '#009688',
        insertionMarkerOpacity: 0.35,
        markerColour: '#009688',
        cursorColour: '#00796b',
        selectedGlowColour: '#26a69a',
        selectedGlowOpacity: 0.35,
      },
    })
  } catch {
    // HMR may re-define; fall back to Classic
    return Blockly.Themes.Classic
  }
}

/** Mixly light teal Blockly theme. */
export const mixlyBlocklyTheme = createMixlyTheme()
