import { useEffect, useState } from 'react'
import { useAuthStore } from '@/auth/session'
import { useProjectStore } from '@/project/store'

export function AuthModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const login = useAuthStore((s) => s.login)
  const register = useAuthStore((s) => s.register)
  const refreshCloudList = useProjectStore((s) => s.refreshCloudList)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setError('')
      setBusy(false)
      setPassword('')
      setPassword2('')
      setShowPw(false)
      setMode('login')
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const submit = () => {
    void (async () => {
      setBusy(true)
      setError('')
      try {
        const name = username.trim()
        if (mode === 'register') {
          if (password !== password2) {
            setError('两次输入的密码不一致')
            setBusy(false)
            return
          }
          await register(name, password)
        } else {
          await login(name, password)
        }
        await refreshCloudList()
        onClose()
      } catch (e) {
        setError(String(e).replace(/^Error:\s*/, ''))
      } finally {
        setBusy(false)
      }
    })()
  }

  return (
    <div className="cloud-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <form
        className="auth-card"
        onSubmit={(e) => {
          e.preventDefault()
          if (!busy) submit()
        }}
      >
        <header className="auth-card-banner">
          <div className="auth-card-brand">
            <span className="auth-card-mark" aria-hidden="true">
              <img src={`${import.meta.env.BASE_URL}mixly.ico`} alt="" />
            </span>
            <div>
              <div className="auth-card-kicker">Mixly 3.0 For 手机app设计</div>
              <h2 id="auth-title">课堂账号</h2>
            </div>
          </div>
          <button type="button" className="auth-card-x" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </header>

        <div className="auth-card-body">
          <nav className="auth-card-tabs" aria-label="登录或注册">
            <button
              type="button"
              className={mode === 'login' ? 'on' : ''}
              onClick={() => {
                setMode('login')
                setError('')
              }}
            >
              登录
            </button>
            <button
              type="button"
              className={mode === 'register' ? 'on' : ''}
              onClick={() => {
                setMode('register')
                setError('')
              }}
            >
              注册账号
            </button>
          </nav>

          <p className="auth-card-lead">
            {mode === 'login'
              ? '使用本课注册的用户名与密码登录。换机房电脑后，可打开自己保存在教师机上的工程。'
              : '请自行设定用户名和密码。建议用户名用学号或姓名拼音，便于教师核对。'}
          </p>

          <label className="auth-field">
            <span>用户名</span>
            <input
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              maxLength={20}
              placeholder="2～20 个字，可用中文、字母、数字"
              spellCheck={false}
            />
          </label>
          <label className="auth-field">
            <span>密码</span>
            <span className="auth-field-row">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                maxLength={64}
                placeholder="至少 4 个字符"
              />
              <button type="button" className="auth-eye" onClick={() => setShowPw((v) => !v)}>
                {showPw ? '隐藏' : '显示'}
              </button>
            </span>
          </label>
          {mode === 'register' && (
            <label className="auth-field">
              <span>确认密码</span>
              <input
                type={showPw ? 'text' : 'password'}
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                autoComplete="new-password"
                maxLength={64}
                placeholder="请再输入一次"
              />
            </label>
          )}

          {error && <div className="auth-card-error">{error}</div>}

          <button type="submit" className="auth-submit" disabled={busy}>
            {busy ? '正在连接课堂服务器…' : mode === 'login' ? '登录' : '注册并登录'}
          </button>
          <button type="button" className="auth-skip" onClick={onClose}>
            暂不登录，先做作品
          </button>
        </div>

        <footer className="auth-card-foot">
          <p>
            全班账号与作品均保存在<strong>本机房教师机</strong>的 Mixly 目录中，不上传 MixIO 或外网。
          </p>
          <p>密码以加密摘要存储，教师机文件中看不到明文密码。</p>
        </footer>
      </form>
    </div>
  )
}
