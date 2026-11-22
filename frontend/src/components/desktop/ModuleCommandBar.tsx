import { useMemo } from 'react'
import { Command, Layers3 } from 'lucide-react'
import { useWorkspace } from '../../features/workspace/WorkspaceProvider'
import { RIBBON_GROUPS, RIBBON_TABS, WORKSPACE_MODULES, type RibbonCommandDef } from '../../features/workspace/modules'
import { RibbonCommand } from './RibbonCommand'

type ModuleCommandBarProps = {
  onCalculator: () => void
  onSoftwareOptions: () => void
  onRecalculateStock: () => void
  onLock: () => void
}

export function ModuleCommandBar({ onCalculator, onSoftwareOptions, onRecalculateStock, onLock }: ModuleCommandBarProps) {
  const { activeModule, openModule } = useWorkspace()
  const context = useMemo(() => {
    const tab = RIBBON_TABS.find((item) => item.id === activeModule.ribbon)
    const group = RIBBON_GROUPS[activeModule.ribbon].find((item) =>
      item.commands.some((command) => command.moduleKey === activeModule.key),
    )
    return { tabLabel: tab?.label ?? 'Workspace', group }
  }, [activeModule])

  const runCommand = (command: RibbonCommandDef) => {
    if (command.action === 'calculator') return onCalculator()
    if (command.action === 'software-options') return onSoftwareOptions()
    if (command.action === 'recalculate-stock') return onRecalculateStock()
    if (command.action === 'lock') return onLock()
    const path = command.path ?? WORKSPACE_MODULES.find((module) => module.key === command.moduleKey)?.path
    if (!path) return
    const module = command.moduleKey ? WORKSPACE_MODULES.find((row) => row.key === command.moduleKey) : undefined
    openModule(path, { newInstance: module?.multiInstance === true })
  }

  return (
    <section className="ah-module-commandbar" aria-label="Contextual module commands">
      <div className="ah-module-context">
        <span className="ah-module-context-icon"><Layers3 size={16} aria-hidden="true" /></span>
        <div>
          <span>{context.tabLabel}{context.group ? ` / ${context.group.caption}` : ''}</span>
          <strong>{activeModule.title}</strong>
        </div>
      </div>
      <div className="ah-module-commands">
        {context.group?.commands.map((command) => (
          <RibbonCommand
            key={`context-${command.id}`}
            {...command}
            active={Boolean(command.moduleKey && command.moduleKey === activeModule.key)}
            onNavigate={(path) => openModule(path)}
            onClick={() => runCommand(command)}
          />
        ))}
        {!context.group ? <span className="ah-module-context-hint"><Command size={14} /> Current module</span> : null}
      </div>
    </section>
  )
}
