/**
 * Spot-check codegen for new fun cases + full coverage/audit.
 */
import { createServer } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const server = await createServer({
  configFile: path.join(root, 'vite.config.ts'),
  root,
  server: { middlewareMode: true },
  appType: 'custom',
})

const checks = {
  tap_frenzy: ['TapBtn', 'celebrate', 'ScoreLabel'],
  rps_duel: ['diceRoll', 'RockBtn', '% 3', 'celebrate'],
  mood_bulb: ["setProp('LightBulb1', 'On'"],
  charge_dash: ["setProp('ProgressBar1', 'Progress'", '>='],
  coin_luck: ['coinFlip'],
  cafeteria_rate: ['RatingBar1', 'celebrate'],
  cheer_board: ['Marquee1'],
  snack_cart: ['Stepper1', 'Spinner1'],
  crosswalk: ['trafficNext'],
  pet_care: ['dbStore', 'FeedBtn'],
  buzzer_race: ['countdownStart', 'BuzzBtn'],
  dice_duel: ['DiceRed', 'diceRoll'],
  password_vault: ['318', 'celebrate'],
  name_picker: ['randomNextInt', 'LEDLabel1'],
  mood_diary: ['noteSave'],
  math_blitz: ["'12'", 'scoreAdd'],
  emoji_chat: ['BubbleL'],
  color_memory: ['ColorPicker1', 'celebrate'],
  reaction_timer: ['stopwatchStart', 'stopwatchPause'],
  share_cheer: ['clipboardCopy', 'shareMessage'],
  neon_clock: ['NightSwitch', 'LEDLabel1'],
}

try {
  const { createTemplate } = await server.ssrLoadModule('/src/project/templates.ts')
  const { getGeneratedCodeFromXml } = await server.ssrLoadModule('/src/blocks/codegen.ts')
  const { CASE_CATALOG } = await server.ssrLoadModule('/src/project/caseCatalog.ts')

  const levels = {}
  for (const c of CASE_CATALOG) levels[c.level] = (levels[c.level] || 0) + 1
  console.log('levels', levels)

  let fail = 0
  for (const [id, frags] of Object.entries(checks)) {
    const code = getGeneratedCodeFromXml(createTemplate(id).screens[0].blocksXml)
    const missing = frags.filter((f) => !code.includes(f))
    if (missing.length || !code.trim()) {
      console.error('FAIL', id, missing, 'code:', code.slice(0, 200))
      fail++
    } else {
      console.log('OK', id)
    }
  }
  process.exitCode = fail ? 1 : 0
} finally {
  await server.close()
}
process.exit(process.exitCode || 0)
