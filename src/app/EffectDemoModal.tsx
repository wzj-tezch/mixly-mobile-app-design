import { useEffect, useMemo } from 'react'
import { useProjectStore } from '@/project/store'
import { buildPreviewDocument } from '@/runtime/previewDoc'
import { getScreenRuntimePlan } from '@/blocks/codegen'
import { PhoneFrame } from '@/designer/PhoneFrame'

export function EffectDemoModal({ onClose }: { onClose: () => void }) {
  const project = useProjectStore((s) => s.project)
  const previewKey = useProjectStore((s) => s.previewKey)
  const screen = project.screens.find((x) => x.id === project.activeScreenId) ?? project.screens[0]
  const title = String(screen.props.Title ?? screen.name)

  const srcDoc = useMemo(() => {
    const plan = getScreenRuntimePlan(project, screen)
    const baseHref = new URL(import.meta.env.BASE_URL || './', window.location.href).href
    return buildPreviewDocument(project, screen, plan.code, baseHref, plan.advanced)
  }, [project, screen, previewKey])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="demo-backdrop" role="dialog" aria-modal="true" aria-label="效果演示" onClick={onClose}>
      <div className="demo-card" onClick={(e) => e.stopPropagation()}>
        <header className="demo-head">
          <div>
            <div className="demo-kicker">效果演示</div>
            <h2>{project.name} · {title}</h2>
          </div>
          <button type="button" className="btn tiny" onClick={onClose}>
            关闭
          </button>
        </header>
        <p className="demo-hint">
          {project.advancedMode
            ? '运行当前屏幕的高级脚本，可点击、滑动查看效果（不跑积木）'
            : '运行当前屏幕的积木逻辑，可点击、滑动查看效果'}
        </p>
        <div className="demo-stage">
          <PhoneFrame title={title} variant="preview" className="demo-phone">
            <iframe
              key={`${previewKey}-demo`}
              title="效果演示"
              className="phone-screen preview-frame"
              srcDoc={srcDoc}
              sandbox="allow-scripts allow-modals allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            />
          </PhoneFrame>
        </div>
      </div>
    </div>
  )
}
