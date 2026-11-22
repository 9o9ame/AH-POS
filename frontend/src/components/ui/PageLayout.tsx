import type { ReactNode } from 'react'
import './PageLayout.css'

export function PageHeader({
  eyebrow,
  title,
  description,
  aside,
}: {
  eyebrow?: string
  title: string
  description?: ReactNode
  aside?: ReactNode
}) {
  return (
    <header className="ui-page-header">
      <div className="ui-page-heading">
        {eyebrow ? <span className="ui-page-eyebrow">{eyebrow}</span> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {aside ? <div className="ui-page-header-aside">{aside}</div> : null}
    </header>
  )
}

export function PageToolbar({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={['ui-page-toolbar', className].filter(Boolean).join(' ')}>{children}</div>
}

export function ContentPanel({
  title,
  description,
  actions,
  className = '',
  children,
}: {
  title: string
  description?: ReactNode
  actions?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <section className={['ui-content-panel', className].filter(Boolean).join(' ')}>
      <header className="ui-content-panel-header">
        <div><h2>{title}</h2>{description ? <p>{description}</p> : null}</div>
        {actions ? <div className="ui-content-panel-actions">{actions}</div> : null}
      </header>
      <div className="ui-content-panel-body">{children}</div>
    </section>
  )
}

export function FormSection({
  title,
  description,
  className = '',
  children,
}: {
  title: string
  description?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <section className={['ui-form-section', className].filter(Boolean).join(' ')}>
      <header><h2>{title}</h2>{description ? <p>{description}</p> : null}</header>
      <div className="ui-form-section-body">{children}</div>
    </section>
  )
}

export function ResponsiveSplitLayout({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={['ui-responsive-split', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  )
}

export function PageActionBar({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={['ui-page-actionbar', className].filter(Boolean).join(' ')}>{children}</div>
}
