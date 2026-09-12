import { useProjectStore } from '@/project/store'
import { TemplateCatalog } from '@/app/TemplateCatalog'

const STEPS = [
  {
    title: '1. 想清楚要解决什么',
    body: '用一句话写下课题，例如「统计举手次数」「给植物拍照记录」。目标越具体越好做。',
  },
  {
    title: '2. 设计界面',
    body: '在「设计器」从左侧拖入按钮、标签、图片等。先做简单布局，再慢慢美化颜色与文字。',
  },
  {
    title: '3. 用积木写逻辑',
    body: '切换到「积木」页：当按钮被点击 → 改变标签文字 / 拍照 / 存 TinyDB。先让预览能跑通。案例可选手动搭建积木。',
  },
  {
    title: '4. 电脑预览',
    body: '右侧「实时预览」可立刻试玩。相机在电脑上会变成「选图」，真机 APK 才调摄像头。',
  },
  {
    title: '5. 导出手机 App',
    body: '点顶栏「导出ZIP」。解压后双击 index.html，用浏览器打开就是手机 App。电脑上会显示手机外框，手机打开则全屏。',
  },
  {
    title: '6. 演示与改进',
    body: '给同学看效果后，再改界面和积木，重新导出一份 ZIP 即可。',
  },
]
export function GuidePanel() {
  const setLeftPanel = useProjectStore((s) => s.setLeftPanel)
  const setEditorTab = useProjectStore((s) => s.setEditorTab)
  const onLoaded = () => {
    setEditorTab('designer')
    setLeftPanel('components')
  }

  return (
    <div className="panel-scroll guide-panel">
      <div className="section-title">学生自主研究 · 六步</div>
      {STEPS.map((s) => (
        <div key={s.title} className="guide-card">
          <div className="guide-card-title">{s.title}</div>
          <div className="guide-card-body">{s.body}</div>
        </div>
      ))}

      <div className="section-title">推荐：简单 + 中等</div>
      <p className="muted" style={{ fontSize: 12, margin: '0 0 10px' }}>
        点「说明」看步骤，再点「加载」。
      </p>
      <TemplateCatalog
        showLevelTabs={false}
        filter={(t) => t.level === '简单' || t.level === '中等'}
        onLoaded={onLoaded}
      />

      <div className="section-title">娱乐案例</div>
      <p className="muted" style={{ fontSize: 12, margin: '0 0 10px' }}>
        派对盒子、占卜秀、迷你街机——放松练手也有意思。
      </p>
      <TemplateCatalog showLevelTabs={false} filter={(t) => t.level === '娱乐'} onLoaded={onLoaded} />

      <div className="section-title">拓展展馆（组件大全）</div>
      <p className="muted" style={{ fontSize: 12, margin: '0 0 10px' }}>
        界面馆 · 趣味厅 · 媒体台 · 数据站 · 真机舱 · 拍照贴图。对照认识全部组件。
      </p>
      <TemplateCatalog showLevelTabs={false} filter={(t) => t.level === '拓展'} onLoaded={onLoaded} />

      <div className="section-title">权限与安全（真机）</div>
      <ul className="guide-list">
        <li>只用课堂需要的权限：拍照、定位会弹系统对话框，请看清再允许。</li>
        <li>不要在作品里填写个人隐私（真实姓名、住址、身份证号）。</li>
        <li>Debug APK 仅用于课堂，不要随意发到公网商店。</li>
      </ul>

      <div className="section-title">安装 APK 提示</div>
      <p className="guide-card-body" style={{ margin: 0 }}>
        安卓：设置 → 安全 → 允许安装未知应用 → 打开老师发的 apk。若无法安装，请老师用同一台手机型号再打一次包。
      </p>
    </div>
  )
}
