import type { ReactNode } from 'react'
import './auth-showcase.css'

export function AuthLayout({ title, children, notice }: { title: string; children: ReactNode; notice?: ReactNode }) {
  return (
    <div className="auth-layout auth-showcase">
      <div className="auth-showcase-form-side">
        <div className="auth-showcase-ring">
          <div className="auth-showcase-form-card">
            <div className="auth-showcase-heading">
              <div className="auth-brand">AH-POS</div>
              <h1 className="auth-title">{title}</h1>
              <p className="auth-showcase-subtitle">Access your workspace securely</p>
            </div>
            <div className="auth-showcase-form-body">{children}</div>
          </div>
        </div>
      </div>
      {notice ? <div className="auth-showcase-notice" role="status" aria-live="polite">{notice}</div> : null}
      <aside className="auth-showcase-promo" aria-label="AH-POS information">
        <div className="auth-showcase-promo-content">
          <div className="auth-showcase-promo-mark">AH</div>
          <p className="auth-showcase-eyebrow">AH-POS</p>
          <h2>Your business, in command.</h2>
          <p>Operate sales, inventory and finance from your secure AH-POS workspace.</p>
          <div className="auth-showcase-decor" aria-hidden="true"><span /><span /><span /></div>
        </div>
      </aside>
    </div>
  )
}
