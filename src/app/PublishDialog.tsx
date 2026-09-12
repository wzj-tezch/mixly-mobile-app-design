import { useState } from 'react'
import type { ShareLinks } from '@/auth/cloudClient'
import { preferredShareUrl } from '@/auth/cloudClient'

export function PublishDialog({
  open,
  shareId,
  links,
  error,
  busy,
  onClose,
  onCopy,
  onUnpublish,
}: {
  open: boolean
  shareId: string | null
  links: ShareLinks | null
  error: string
  busy: boolean
  onClose: () => void
  onCopy: () => void
  onUnpublish: () => void
}) {
  const [copied, setCopied] = useState(false)
  if (!open) return null
  const url = shareId ? preferredShareUrl(shareId, links) : ''
  const isPublic = Boolean(links?.publicUrl)
  const lanUrls = (links?.lanUrls || []).filter((u) => u && u !== url)

  return (
    <div className="cloud-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="pub-title">
      <div className="cloud-modal publish-wide">
        <div className="cloud-modal-head">
          <h2 id="pub-title">发布链接</h2>
          <button type="button" className="cloud-modal-x" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>
        {busy && <p className="cloud-modal-hint">正在生成成品页并开通外网链接…</p>}
        {error && <div className="cloud-modal-error">{error}</div>}
        {shareId && !busy && (
          <>
            <p className="cloud-modal-hint">
              {isPublic
                ? '下面是可点击的外网链接，手机流量也能打开。别人只能玩成品，进不了设计器。Mixly 需保持运行，关掉后链接会失效。'
                : '别人打开只能玩成品，进不了设计器，也不用登录。'}
            </p>
            <div className="cloud-field">
              {isPublic ? '外网链接' : '链接'}
              <a className="cloud-share-url" href={url} target="_blank" rel="noreferrer">
                {url}
              </a>
            </div>
            {!isPublic && links?.tunnelError ? (
              <p className="cloud-modal-hint">
                外网链接未能开通（{links.tunnelError}）。同网同学可用上面的地址；也可先运行 Mixly 目录里的「启动公网链接.bat」。
              </p>
            ) : null}
            {isPublic && lanUrls.length > 0 ? (
              <p className="cloud-modal-hint cloud-share-lan">
                局域网备用：
                {lanUrls.map((u) => (
                  <a key={u} href={u} target="_blank" rel="noreferrer">
                    {u}
                  </a>
                ))}
              </p>
            ) : null}
            <div className="cloud-modal-actions">
              <button
                type="button"
                className="btn"
                onClick={() => {
                  onUnpublish()
                }}
              >
                取消发布
              </button>
              <button
                type="button"
                className="btn primary"
                onClick={() => {
                  onCopy()
                  setCopied(true)
                  window.setTimeout(() => setCopied(false), 1600)
                }}
              >
                {copied ? '已复制' : '复制链接'}
              </button>
            </div>
          </>
        )}
        {!shareId && !busy && !error && <p className="cloud-modal-hint">尚未发布。</p>}
        <div className="cloud-modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
