import type { AiProject } from './types'
import type { TemplateKind } from './caseCatalog'
import { CASE_TEMPLATE_REV } from './caseCatalog'

export type { TemplateKind } from './caseCatalog'
export type { CaseLevel, CaseCatalogItem } from './caseCatalog'
export { CASE_CATALOG as TEMPLATE_CATALOG, CASE_LEVELS, ALL_COMPONENT_COVERAGE, CASE_TEMPLATE_REV } from './caseCatalog'

import {
  createNavTemplate,
  createDrawTemplate,
  createQuizTemplate,
  createCameraTemplate,
  createShakeCountTemplate,
  createFileSearchTemplate,
  createCounterTemplate,
} from './cases/classic'
import {
  createTapFrenzyTemplate,
  createRpsDuelTemplate,
  createMoodBulbTemplate,
  createChargeDashTemplate,
  createCoinLuckTemplate,
  createCafeteriaRateTemplate,
  createCheerBoardTemplate,
  createSnackCartTemplate,
  createCrosswalkTemplate,
} from './cases/simple'
import {
  createPetCareTemplate,
  createBuzzerRaceTemplate,
  createDiceDuelTemplate,
  createPasswordVaultTemplate,
  createNamePickerTemplate,
  createMoodDiaryTemplate,
  createMathBlitzTemplate,
  createEmojiChatTemplate,
  createColorMemoryTemplate,
  createReactionTimerTemplate,
  createShareCheerTemplate,
  createNeonClockTemplate,
} from './cases/medium'
import { createJoyBallTemplate } from './cases/hard'
import {
  createStoryBookTemplate,
  createCampusTourTemplate,
  createQuestChainTemplate,
} from './cases/multiScreen'
import {
  createTourUiTemplate,
  createTourFunTemplate,
  createTourMediaTemplate,
  createTourDataTemplate,
  createTourDeviceTemplate,
} from './cases/extendTours'
import {
  createPartyBoxTemplate,
  createFortuneShowTemplate,
  createMiniArcadeTemplate,
} from './cases/fun'

const FACTORIES: Record<TemplateKind, () => AiProject> = {
  tap_frenzy: createTapFrenzyTemplate,
  rps_duel: createRpsDuelTemplate,
  mood_bulb: createMoodBulbTemplate,
  charge_dash: createChargeDashTemplate,
  coin_luck: createCoinLuckTemplate,
  cafeteria_rate: createCafeteriaRateTemplate,
  cheer_board: createCheerBoardTemplate,
  snack_cart: createSnackCartTemplate,
  crosswalk: createCrosswalkTemplate,
  pet_care: createPetCareTemplate,
  buzzer_race: createBuzzerRaceTemplate,
  dice_duel: createDiceDuelTemplate,
  password_vault: createPasswordVaultTemplate,
  name_picker: createNamePickerTemplate,
  mood_diary: createMoodDiaryTemplate,
  math_blitz: createMathBlitzTemplate,
  emoji_chat: createEmojiChatTemplate,
  color_memory: createColorMemoryTemplate,
  reaction_timer: createReactionTimerTemplate,
  share_cheer: createShareCheerTemplate,
  neon_clock: createNeonClockTemplate,
  nav: createNavTemplate,
  quiz: createQuizTemplate,
  draw: createDrawTemplate,
  filesearch: createFileSearchTemplate,
  shake: createShakeCountTemplate,
  joy_ball: createJoyBallTemplate,
  story_book: createStoryBookTemplate,
  campus_tour: createCampusTourTemplate,
  quest_chain: createQuestChainTemplate,
  tour_ui: createTourUiTemplate,
  tour_fun: createTourFunTemplate,
  tour_media: createTourMediaTemplate,
  tour_data: createTourDataTemplate,
  tour_device: createTourDeviceTemplate,
  camera: createCameraTemplate,
  party_box: createPartyBoxTemplate,
  fortune_show: createFortuneShowTemplate,
  mini_arcade: createMiniArcadeTemplate,
}

export function createTemplate(kind: TemplateKind, options?: { withBlocks?: boolean }): AiProject {
  const factory = FACTORIES[kind]
  if (!factory) throw new Error(`Unknown template: ${kind}`)
  const project = factory()
  const stamped: AiProject = {
    ...project,
    sourceTemplate: kind,
    templateRev: CASE_TEMPLATE_REV,
  }
  if (options?.withBlocks === false) {
    return {
      ...stamped,
      name: `${project.name}（自建积木）`,
      screens: project.screens.map((s) => ({ ...s, blocksXml: '' })),
      updatedAt: Date.now(),
    }
  }
  return stamped
}

/** 旧存档案例名 → 种类（无 sourceTemplate 时兜底） */
const LEGACY_NAME_TO_KIND: Partial<Record<string, TemplateKind>> = {
  迷你街机: 'mini_arcade',
  摇杆推球闯关: 'joy_ball',
  派对盒子: 'party_box',
  趣味占卜秀: 'fortune_show',
}

/** 内置案例积木过期时用工厂重生成，保留工程 id */
export function refreshCaseProjectIfStale(p: AiProject): { project: AiProject; refreshed: boolean } {
  const kind = (p.sourceTemplate as TemplateKind | undefined) || LEGACY_NAME_TO_KIND[p.name]
  if (!kind || !FACTORIES[kind]) return { project: p, refreshed: false }
  if ((p.templateRev ?? 0) >= CASE_TEMPLATE_REV) return { project: p, refreshed: false }
  const fresh = createTemplate(kind)
  return {
    project: {
      ...fresh,
      id: p.id,
      updatedAt: Date.now(),
    },
    refreshed: true,
  }
}

export {
  createCounterTemplate,
  createTourUiTemplate,
  createTourFunTemplate,
  createTourMediaTemplate,
  createTourDataTemplate,
  createTourDeviceTemplate,
}
