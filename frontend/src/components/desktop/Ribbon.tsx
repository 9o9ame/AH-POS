import { useEffect, useMemo, useRef, useState } from 'react'
import { ChartColumnIncreasing, CircleHelp, FolderTree, ReceiptText, Search, Settings, Wrench } from 'lucide-react'
import { APP_NAME } from '../../config/app'
import { useAuth } from '../../features/auth/AuthProvider'
import { useWorkspace } from '../../features/workspace/WorkspaceProvider'
import {
  RIBBON_GROUPS,
  RIBBON_TABS,
  WORKSPACE_MODULES,
  type RibbonCommandDef,
} from '../../features/workspace/modules'
import { RibbonCommand } from './RibbonCommand'

type RibbonProps = {
  collapsed: boolean
  onHome: () => void
  onToggleCollapse: () => void
  onHoverExpand: () => void
  onHoverCollapse: () => void
  onCalculator: () => void
  onSoftwareOptions: () => void
  onRecalculateStock: () => void
  onLock: () => void
}

export function Ribbon({
  collapsed,
  onHome,
  onToggleCollapse,
  onHoverExpand,
  onHoverCollapse,
  onCalculator,
  onSoftwareOptions,
  onRecalculateStock,
  onLock,
}: RibbonProps) {
  const { openModule, activeModule } = useWorkspace()
  const { session } = useAuth()
  const [query, setQuery] = useState('')
  const [hoveredSection, setHoveredSection] = useState<string | null>(null)
  const sectionIcons = { definition: FolderTree, 'daily-entries': ReceiptText, reports: ChartColumnIncreasing, tools: Wrench, administration: Settings, help: CircleHelp }
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

  useEffect(() => {
    const focusNavigationSearch = () => searchRef.current?.focus()
    window.addEventListener('ahpos:focus-navigation-search', focusNavigationSearch)
    return () => window.removeEventListener('ahpos:focus-navigation-search', focusNavigationSearch)
  }, [])

  const commandSections = useMemo(() => {
    return RIBBON_TABS.map((tab) => ({
      tabId: tab.id,
      tabLabel: tab.label,
      groups: RIBBON_GROUPS[tab.id]
        .map((group) => ({
          ...group,
          commands: normalizedQuery
            ? group.commands.filter((command) =>
                `${command.label} ${group.caption} ${tab.label} ${command.shortcut ?? ''} ${command.menu?.map((item) => item.label).join(' ') ?? ''}`
                  .toLocaleLowerCase()
                  .includes(normalizedQuery),
              )
            : group.commands,
        }))
        .filter((group) => group.commands.length > 0),
    })).filter((section) => section.groups.length > 0)
  }, [normalizedQuery])

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
    <aside className="ah-sidebar ah-sidebar--hover" data-collapsed={collapsed} aria-label="Application navigation"
      onPointerEnter={event => { if (event.pointerType !== "touch") onHoverExpand() }}
      onPointerLeave={event => { if (event.pointerType !== "touch") { setHoveredSection(null); onHoverCollapse() } }}
      onFocusCapture={onHoverExpand}
      onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) { setHoveredSection(null); onHoverCollapse() } }}
      onKeyDown={event => { if (event.key === "Escape" && !event.defaultPrevented) { setHoveredSection(null); onHoverCollapse() } }}>
      <div className="ah-sidebar-heading">
        <button type="button" className="ah-sidebar-home" onClick={onHome} aria-label="AH-POS home">
          <span className="ah-sidebar-brand-mark" aria-hidden="true">A</span>
          <span className="ah-sidebar-brand-copy">
            <strong>{APP_NAME}</strong>
            <span>Tenant Workspace</span>
          </span>
        </button>
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

      <div className="ah-navigation-command-list" aria-label={normalizedQuery ? 'Search results' : 'Modules'}>
        {commandSections.map((section) => {
          const SectionIcon = sectionIcons[section.tabId]
          const expanded = Boolean(normalizedQuery) || hoveredSection === section.tabId
          return (
            <section className={`ah-navigation-section ah-navigation-dropdown${expanded ? ' is-expanded' : ''}`} key={section.tabId}
              onPointerEnter={event => { if (event.pointerType !== 'touch') setHoveredSection(section.tabId) }}
              onPointerLeave={event => { if (event.pointerType !== 'touch') setHoveredSection(current => current === section.tabId ? null : current) }}
              onFocusCapture={() => setHoveredSection(section.tabId)}
              onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setHoveredSection(current => current === section.tabId ? null : current) }}>
              <button type="button" className="ah-navigation-section-trigger" aria-expanded={expanded}
                aria-label={section.tabLabel} aria-controls={`ah-nav-section-${section.tabId}`}
                onClick={() => { onHoverExpand(); setHoveredSection(current => current === section.tabId ? null : section.tabId) }}>
                <SectionIcon size={18} aria-hidden="true" />
                <span>{section.tabLabel}</span>
                <span className="ah-navigation-chevron" aria-hidden="true">⌄</span>
              </button>
              <div className="ah-navigation-section-content" id={`ah-nav-section-${section.tabId}`}
                aria-hidden={!expanded} inert={!expanded}>
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
              </div>
            </section>
          )
        })}
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
