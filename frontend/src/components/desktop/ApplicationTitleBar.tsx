import { useState } from 'react'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { APP_NAME } from '../../config/app'
import type { AuthSession } from '../../types/auth'
import { useWorkspace } from '../../features/workspace/WorkspaceProvider'
import { AppearanceMenu } from './AppearanceMenu'
import { BranchSwitcher } from './BranchSwitcher'
import { DesktopChromeControls } from './DesktopChromeControls'
import { UserAccountMenu } from './UserAccountMenu'
import { NotificationBell } from './NotificationBell'

type ApplicationTitleBarProps = {
  session: AuthSession
  busy: boolean
  onHome: () => void
  onLogout: () => void
  onChangePassword: () => void
  onAccount: () => void
  navigationCollapsed: boolean
  onToggleNavigation: () => void
}

export function ApplicationTitleBar({
  session,
  busy,
  onHome,
  onLogout,
  onChangePassword,
  onAccount,
  navigationCollapsed,
  onToggleNavigation,
}: ApplicationTitleBarProps) {
  const { tabs, activeKey, openModule } = useWorkspace()
  const [appearanceOpen, setAppearanceOpen] = useState(false)
  const active = tabs.find((tab) => tab.key === activeKey)

  return (
    <header className="titlebar">
      <button
        type="button"
        className="ah-navigation-toggle"
        aria-label={navigationCollapsed ? 'Expand application navigation' : 'Collapse application navigation'}
        aria-expanded={!navigationCollapsed}
        onClick={onToggleNavigation}
      >
        {navigationCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
      </button>
      <div className="titlebar-brand">
        <button type="button" className="titlebar-logo" onClick={onHome} title="Home">
          {APP_NAME}
        </button>
        <div className="titlebar-meta">
          <span>{session.tenant.name}</span>
          {import.meta.env.DEV ? <span className="titlebar-env">DEV</span> : null}
        </div>
      </div>
      <div className="titlebar-center ah-topbar-context">
        <span className="ah-topbar-kicker">ACTIVE WORKSPACE</span>
        {active?.title ?? 'Home'}
      </div>
      <div className="titlebar-meta titlebar-controls">
        <span className="ah-context-selector" title="Tenant context is established by the authenticated membership">
          <small>Tenant</small><strong>{session.tenant.name}</strong>
        </span>
        <BranchSwitcher session={session} />
        <span className="titlebar-warehouse ah-context-selector" title="Active warehouse from the authenticated session">
          <small>Warehouse</small>
          {session.warehouse.code} — {session.warehouse.name}
        </span>
        <DesktopChromeControls />
        <NotificationBell session={session} onOpenDevices={() => openModule('/administration/devices')} />
        <AppearanceMenu open={appearanceOpen} onOpenChange={setAppearanceOpen} />
        <UserAccountMenu
          session={session}
          busy={busy}
          onLogout={onLogout}
          onChangePassword={onChangePassword}
          onAccount={onAccount}
          onAppearance={() => setAppearanceOpen(true)}
        />
      </div>
    </header>
  )
}
