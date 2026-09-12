import { useMemo, useState } from 'react'
import { useProjectStore } from '@/project/store'
import {
  TEMPLATE_CATALOG,
  CASE_LEVELS,
  type TemplateKind,
  type CaseCatalogItem,
  type CaseLevel,
} from '@/project/templates'

type LevelFilter = '全部' | CaseLevel

export function TemplateCatalog({
  filter,
  onLoaded,
  showLevelTabs = true,
}: {
  filter?: (t: CaseCatalogItem) => boolean
  onLoaded?: () => void
  showLevelTabs?: boolean
}) {
  const loadTemplate = useProjectStore((s) => s.loadTemplate)
  const [level, setLevel] = useState<LevelFilter>('全部')
  const items = useMemo(() => {
    let list = TEMPLATE_CATALOG
    if (filter) list = list.filter(filter)
    if (showLevelTabs && level !== '全部') list = list.filter((t) => t.level === level)
    return list
  }, [filter, level, showLevelTabs])
  const [withBlocks, setWithBlocks] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(TEMPLATE_CATALOG.map((t) => [t.id, true])),
  )
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const load = (id: TemplateKind) => {
    void loadTemplate(id, { withBlocks: withBlocks[id] !== false })
    onLoaded?.()
  }

  return (
    <div className="template-catalog">
      {showLevelTabs && !filter && (
        <div className="template-level-tabs" role="tablist" aria-label="案例等级">
          {(['全部', ...CASE_LEVELS] as LevelFilter[]).map((lv) => (
            <button
              key={lv}
              type="button"
              role="tab"
              aria-selected={level === lv}
              className={level === lv ? 'active' : ''}
              onClick={() => setLevel(lv)}
            >
              {lv}
            </button>
          ))}
        </div>
      )}
      <div className="template-list">
        {items.map((t) => {
          const useBuiltin = withBlocks[t.id] !== false
          const open = !!expanded[t.id]
          return (
            <div key={t.id} className={`template-row ${open ? 'expanded' : ''}`}>
              <div className="template-row-head">
                <span className={`template-level-pill level-${t.level}`}>{t.level}</span>
                <span className="template-row-title" title={t.intro}>
                  {t.desc}
                </span>
                {t.minutes ? <span className="template-mins">{t.minutes}分</span> : null}
              </div>
              <div className="template-row-actions">
                <button
                  type="button"
                  className={useBuiltin ? 'active' : ''}
                  title="带上案例自带积木"
                  onClick={() => setWithBlocks((s) => ({ ...s, [t.id]: true }))}
                >
                  积木
                </button>
                <button
                  type="button"
                  className={!useBuiltin ? 'active' : ''}
                  title="只加载界面，自己搭积木"
                  onClick={() => setWithBlocks((s) => ({ ...s, [t.id]: false }))}
                >
                  空白
                </button>
                <button
                  type="button"
                  className="template-guide-toggle"
                  onClick={() => setExpanded((s) => ({ ...s, [t.id]: !s[t.id] }))}
                >
                  {open ? '收起' : '说明'}
                </button>
                <button type="button" className="btn tiny template-load-btn" onClick={() => load(t.id)}>
                  加载
                </button>
              </div>
              {open && (
                <div className="template-guide">
                  <p className="template-intro">{t.intro}</p>
                  <div className="template-guide-title">步骤</div>
                  <ol>
                    {t.guide.map((g) => (
                      <li key={g}>{g}</li>
                    ))}
                  </ol>
                  {t.highlights.length > 0 && (
                    <div className="template-tags">
                      {t.highlights.map((h) => (
                        <span key={h} className="template-tag">
                          {h}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
      {items.length === 0 && <p className="muted">该等级暂无案例</p>}
    </div>
  )
}
