import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BarChart3,
  CircleHelp,
  FilePenLine,
  Home,
  Search,
  Settings,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '../../features/auth/AuthProvider'
import { useWorkspace } from '../../features/workspace/WorkspaceProvider'
import {
  RIBBON_GROUPS,
  RIBBON_TABS,
  WORKSPACE_MODULES,
  type RibbonCommandDef,
  type RibbonTabId,
} from '../../features/workspace/modules'
import { RibbonCommand } from './RibbonCommand'

const RIBBON_TAB_ICONS: Record<RibbonTabId, LucideIcon> = {
  definition: Home,
  'daily-entries': FilePenLine,
  reports: BarChart3,
  tools: Wrench,
  administration: Settings,
  help: CircleHelp,
}

type RibbonProps = {
  collapsed: boolean
  onToggleCollapse: () => void
  onCalculator: () => void
  onSoftwareOptions: () => void
  onRecalculateStock: () => void
  onLock: () => void
}

export function Ribbon({
  collapsed,
  onToggleCollapse,
  onCalculator,
  onSoftwareOptions,
  onRecalculateStock,
  onLock,
}: RibbonProps) {
  const { ribbonTab, setRibbonTab, openModule, activeModule } = useWorkspace()
  const { session } = useAuth()
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const normalizedQuery = query.trim().toLocaleLowerCase()

  useEffect(() => {
    const focusNavigationSearch = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', focusNavigationSearch)
    return () => window.removeEventListener('keydown', focusNavigationSearch)
  }, [])

  const commandSections = useMemo(() => {
    if (!normalizedQuery) {
      const selected = RIBBON_TABS.find((tab) => tab.id === ribbonTab)
      return selected
        ? [{ tabId: selected.id, tabLabel: selected.label, groups: RIBBON_GROUPS[selected.id] }]
        : []
    }

    return RIBBON_TABS.map((tab) => ({
      tabId: tab.id,
      tabLabel: tab.label,
      groups: RIBBON_GROUPS[tab.id]
        .map((group) => ({
          ...group,
          commands: group.commands.filter((command) =>
            `${command.label} ${group.caption} ${tab.label} ${command.shortcut ?? ''} ${command.menu?.map((item) => item.label).join(' ') ?? ''}`
              .toLocaleLowerCase()
              .includes(normalizedQuery),
          ),
        }))
        .filter((group) => group.commands.length > 0),
    })).filter((section) => section.groups.length > 0)
  }, [normalizedQuery, ribbonTab])

  const openPath = (path: string, newInstance = false) => {
    openModule(path, { newInstance })
  }

  const runCommand = (command: RibbonCommandDef) => {
    if (command.action === 'calculator') {
      onCalculator()
      return
    }
    if (command.action === 'software-options') {
      onSoftwareOptions()
      return
    }
    if (command.action === 'recalculate-stock') {
      onRecalculateStock()
      return
    }
    if (command.action === 'lock') {
      onLock()
      return
    }

    const path = command.path ?? WORKSPACE_MODULES.find((module) => module.key === command.moduleKey)?.path
    if (!path) return
    const module = command.moduleKey
      ? WORKSPACE_MODULES.find((row) => row.key === command.moduleKey)
      : undefined
    openPath(path, module?.multiInstance === true)
  }

  return (
    <aside className="ah-sidebar" data-collapsed={collapsed} aria-label="Application navigation">
      <div className="ah-sidebar-heading">
        <div className="ah-sidebar-brand-mark" aria-hidden="true">AH</div>
        <div className="ah-sidebar-brand-copy">
          <strong>AH-POS</strong>
          <span>Business workspace</span>
        </div>
        <button
          type="button"
          className="ah-sidebar-collapse"
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          aria-expanded={!collapsed}
          onClick={onToggleCollapse}
        >
          <span aria-hidden="true">{collapsed ? '›' : '‹'}</span>
        </button>
      </div>

      <label className="ah-navigation-search">
        <Search size={16} aria-hidden="true" />
        <input
          ref={searchRef}
          type="search"
          aria-label="Search all modules and commands"
          placeholder={collapsed ? '' : 'Search navigation'}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {!collapsed ? <kbd>⌘ K</kbd> : null}
      </label>

      <nav className="ah-navigation-categories" aria-label="Application areas">
        {RIBBON_TABS.map((tab) => {
          const Icon = RIBBON_TAB_ICONS[tab.id]
          const selected = tab.id === ribbonTab && !normalizedQuery
          return (
            <button
              type="button"
              key={tab.id}
              className={selected ? 'is-active' : ''}
              aria-label={tab.label}
              aria-current={selected ? 'page' : undefined}
              title={collapsed ? tab.label : undefined}
              onClick={() => {
                setQuery('')
                setRibbonTab(tab.id)
              }}
            >
              <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="ah-sidebar-divider" />

      <div className="ah-navigation-command-list" aria-label={normalizedQuery ? 'Search results' : 'Modules'}>
        {commandSections.map((section) => (
          <section className="ah-navigation-section" key={section.tabId}>
            {normalizedQuery ? <h2>{section.tabLabel}</h2> : null}
            {section.groups.map((group) => (
              <div className="ah-navigation-group" key={`${section.tabId}-${group.id}`}>
                <h3>{group.caption}</h3>
                <div className="ah-navigation-commands">
                  {group.commands.map((command) => (
                    <RibbonCommand
                      key={`${section.tabId}-${group.id}-${command.id}`}
                      {...command}
                      active={Boolean(command.moduleKey && command.moduleKey === activeModule.key)}
                      onNavigate={(path) => openModule(path)}
                      onClick={() => runCommand(command)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </section>
        ))}
        {!commandSections.length ? (
          <div className="ah-navigation-empty" role="status">No matching commands.</div>
        ) : null}
      </div>

      <footer className="ah-sidebar-footer">
        <span className={`ah-connection-dot${session ? ' is-online' : ''}`} />
        <span>{session?.tenant.name ?? 'Tenant workspace'}</span>
      </footer>
    </aside>
  )
}
