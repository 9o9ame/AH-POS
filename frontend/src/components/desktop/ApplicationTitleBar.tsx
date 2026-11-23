import { useState } from 'react'
import { Search } from 'lucide-react'
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
  onLogout: () => void
  onChangePassword: () => void
  onAccount: () => void
}

export function ApplicationTitleBar({
  session,
  busy,
  onLogout,
  onChangePassword,
  onAccount,
}: ApplicationTitleBarProps) {
  const { openModule } = useWorkspace()
  const [appearanceOpen, setAppearanceOpen] = useState(false)

  return (
    <header className="titlebar">
      <span className="ah-context-selector" title="Tenant context is established by the authenticated membership">
        <small>Business</small><strong>{session.tenant.name}</strong>
      </span>
      <BranchSwitcher session={session} />
      <span className="titlebar-warehouse ah-context-selector" title="Active warehouse from the authenticated session">
        <small>Warehouse</small><strong>{session.warehouse.code} — {session.warehouse.name}</strong>
      </span>
      <button
        type="button"
        className="ah-global-search"
        onClick={() => window.dispatchEvent(new Event('ahpos:focus-navigation-search'))}
        aria-label="Search modules and commands"
      >
        <Search size={16} aria-hidden="true" />
        <span>Search modules and commands</span>
        <kbd>Ctrl K</kbd>
      </button>
      <div className="titlebar-meta titlebar-controls">
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
