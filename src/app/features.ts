/** 本机 Mixly 全开；go3 公网关 APK / 回主页（无本机构建环境）。 */
const host = typeof window === 'undefined' ? '' : window.location.hostname
const onGo3 = host === 'go3.mixly.cn'

export const ENABLE_SHARE = true
export const ENABLE_CLOUD = true
export const ENABLE_APK = !onGo3
export const SHOW_MIXLY_HOME = !onGo3
