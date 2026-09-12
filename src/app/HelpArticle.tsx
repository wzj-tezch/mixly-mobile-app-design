import { getMeta } from '@/components/registry'
import {
  EVENT_ZH,
  METHOD_ZH,
  getComponentHelp,
} from '@/components/componentHelp'
import type { ComponentType } from '@/project/types'

export function HelpArticle({ type }: { type: ComponentType }) {
  const meta = getMeta(type)
  const help = getComponentHelp(type)
  return (
    <div className="help-modal-body">
      <p className="help-summary">{help.summary}</p>
      <section>
        <h3>怎么用</h3>
        <ol>
          {help.howTo.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>
      {(meta.fields.length > 0 || meta.events.length > 0 || meta.methods.length > 0) && (
        <section>
          <h3>属性 / 事件 / 方法</h3>
          {meta.fields.length > 0 && (
            <p className="help-line">
              <strong>常用属性：</strong>
              {meta.fields.map((f) => f.label).join('、')}
            </p>
          )}
          {meta.events.length > 0 && (
            <p className="help-line">
              <strong>事件：</strong>
              {meta.events.map((e) => EVENT_ZH[e] ?? e).join('、')}
            </p>
          )}
          {meta.methods.length > 0 && (
            <p className="help-line">
              <strong>方法：</strong>
              {meta.methods.map((m) => METHOD_ZH[m] ?? m).join('、')}
            </p>
          )}
        </section>
      )}
      <section className="help-example">
        <h3>案例：{help.example.title}</h3>
        <ol>
          {help.example.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        {help.example.blocksHint && (
          <p className="help-blocks-hint">积木入口：{help.example.blocksHint}</p>
        )}
      </section>
      {help.tips && help.tips.length > 0 && (
        <section>
          <h3>小提示</h3>
          <ul>
            {help.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
