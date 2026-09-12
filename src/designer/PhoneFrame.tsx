import type { ReactNode } from 'react'

export function PhoneFrame({
  title,
  variant,
  className,
  children,
}: {
  title: string
  variant: 'design' | 'preview'
  className?: string
  children: ReactNode
}) {
  return (
    <div className={`phone-stack${className ? ` ${className}` : ''}`}>
      <div className={`phone-device phone-${variant}`}>
        <div className="phone-ear" aria-hidden>
          <span className="phone-ear-speaker" />
          <span className="phone-ear-cam" />
        </div>
        <div className="phone-status-bar">
          <span className="phone-time">9:41</span>
          <span className="phone-sys" aria-hidden>
            <span className="phone-sig">
              <i />
              <i />
              <i />
              <i />
            </span>
            <span className="phone-bat" />
          </span>
        </div>
        {children}
        <div className="phone-home" aria-hidden />
      </div>
      <div className="phone-shadow" aria-hidden />
      <div className="phone-caption">{title}</div>
    </div>
  )
}
