import { type FormEvent, useMemo, useState } from 'react'
import { Edit3, FolderTree, Layers3, Plus, RefreshCw, Ruler, Save, Search, Trash2, X } from 'lucide-react'
import { ApiClientError } from '../../api/client'
import { useCatalogMasterEditor } from './useCatalogMasterEditor'
import { PosDataGrid } from '../desktop/PosDataGrid'
import { UiModal } from '../ui/UiModal'
import { UiSelect } from '../ui/UiSelect'
import { askConfirm } from '../../feedback/FeedbackProvider'
import { useWorkspace, useWorkspaceHandlers } from '../../features/workspace/WorkspaceProvider'
import './CatalogMasterWorkspace.css'
import '../../ahpos-clarity.css'
import './CatalogMasterModal.css'

type MasterKind = 'category' | 'brand' | 'unit'
const DISPLAY = {
  category: { title: 'Categories', singular: 'Category', subtitle: 'Organize and maintain your product categories.', icon: FolderTree },
  brand: { title: 'Brands', singular: 'Brand', subtitle: 'Manage companies and product brands.', icon: Layers3 },
  unit: { title: 'Units', singular: 'Unit', subtitle: 'Manage measurement units and quantity precision.', icon: Ruler },
} as const

/** UI only; catalog APIs, RBAC, tenant context and mutations remain in the shared editor. */
export function CatalogMasterWorkspace({ kind }: { kind: MasterKind }) {
  const editor = useCatalogMasterEditor(kind)
  const { closeActiveTab } = useWorkspace()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | 'active' | 'archived'>('all')
  const [actionError, setActionError] = useState<string | null>(null)
  const info = DISPLAY[kind]
  const formId = `ahpos-${kind}-modal-form`
  const filteredRows = useMemo(() => {
    const q = search.trim().toLocaleLowerCase()
    return editor.rows.filter(row => {
      if (status === 'active' && !row.is_active) return false
      if (status === 'archived' && row.is_active) return false
      return !q || [row.code, row.name, 'symbol' in row ? row.symbol : ''].some(value => value.toLocaleLowerCase().includes(q))
    })
  }, [editor.rows, search, status])

  function beginNew() {
    if (!editor.canCreate) return
    editor.startNew()
    setActionError(null)
    setOpen(true)
  }
  function beginEdit(row: (typeof editor.rows)[number]) {
    if (!editor.canEdit) return
    editor.select(row)
    setActionError(null)
    setOpen(true)
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    editor.setError(null)
    try {
      await editor.save()
      setOpen(false)
    } catch (error) {
      editor.setError(error instanceof ApiClientError ? error.message : error instanceof Error ? error.message : `Unable to save ${kind}.`)
    }
  }
  async function deactivate() {
    if (!editor.selected || !editor.canDelete || !editor.selected.is_active) return
    if (!(await askConfirm(`Deactivate ${editor.selected.name}?`))) return
    try { await editor.deactivate(); setActionError(null) }
    catch (error) { setActionError(error instanceof ApiClientError ? error.message : `Unable to deactivate ${kind}.`) }
  }
  async function activate() {
    if (!editor.selected || !editor.canActivate || editor.selected.is_active) return
    try { await editor.activate(); setActionError(null) }
    catch (error) { setActionError(error instanceof ApiClientError ? error.message : `Unable to activate ${kind}.`) }
  }

  useWorkspaceHandlers({
    save: () => open ? (document.getElementById(formId) as HTMLFormElement | null)?.requestSubmit() : beginNew(),
    refresh: () => void editor.refresh(),
  })

  return (
    <main className="ah-master ah-master--list-only" aria-label={`${info.title} workspace`}>
      {(actionError || (!open && editor.error)) ? <p className="ah-master__error" role="alert">{actionError || editor.error}</p> : null}
      <section className="ah-master__card ah-master__list" aria-label={`${info.title} list`}>
        <div className="ah-master__section-heading">
          <div><h2>{info.title} directory</h2><p>Search, select or double-click a record to edit</p></div>
          <div className="ah-master__compact-stats"><span>{editor.rows.filter(r => r.is_active).length} Active</span><span>{editor.rows.filter(r => !r.is_active).length} Archived</span></div>
        </div>
        <div className="ah-master__filters">
          <label className="ah-master__search"><Search size={17} aria-hidden="true" /><span className="sr-only">Search {info.title}</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${info.title.toLowerCase()} by name, code${kind === 'unit' ? ' or symbol' : ''}…`} />
          </label>
          <div className="ah-master__filter">
            <UiSelect value={status} aria-label="Record status" searchable={false}
              options={[{value:'all',label:'All statuses'},{value:'active',label:'Active'},{value:'archived',label:'Archived'}]}
              onChange={v => setStatus(v as typeof status)} />
          </div>
        </div>
        <div className="ah-master__grid">
          <PosDataGrid
            columns={[
              { key:'code', header:'Code', width:150, render:(row:(typeof editor.rows)[number]) => row.code },
              { key:'name', header: info.singular+' name', render:(row:(typeof editor.rows)[number]) => row.name },
              ...(kind === 'unit' ? [{ key:'symbol', header:'Symbol', width:100, render:(row:(typeof editor.rows)[number]) => 'symbol' in row ? row.symbol : '' }] : []),
              { key:'status', header:'Status', width:105, render:(row:(typeof editor.rows)[number]) => row.is_active ? 'Active' : 'Archived' },
              { key:'action', header:'Action', width:90, render:(row:(typeof editor.rows)[number]) => <button type="button" className="ah-master__row-edit" disabled={!editor.canEdit} onClick={() => beginEdit(row)}><Edit3 size={13}/> Edit</button> },
            ]}
            rows={filteredRows}
            rowKey={row => row.ulid}
            selectedKey={editor.selectedKey}
            onSelect={row => { editor.select(row); setActionError(null) }}
            onActivate={beginEdit}
            emptyMessage="No matching records."
          />
        </div>
        <footer className="ah-master__list-footer">Showing {filteredRows.length} of {editor.rows.length} records</footer>
      </section>

      <nav className="ah-master__fab" aria-label={`${info.title} floating actions`}>
        <button type="button" title="Refresh (F8)" aria-label="Refresh records" onClick={() => void editor.refresh()}><RefreshCw size={19}/></button>
        <button type="button" title="Edit selected" aria-label="Edit selected" disabled={!editor.selected || !editor.canEdit} onClick={() => {if(editor.selected) beginEdit(editor.selected)}}><Edit3 size={19}/></button>
        <button type="button" title="Deactivate selected" aria-label="Deactivate selected" disabled={!editor.selected?.is_active || !editor.canDelete || editor.isDeactivating} onClick={() => void deactivate()}><Trash2 size={19}/></button>
        <button type="button" title="Activate selected" aria-label="Activate selected" disabled={!editor.selected || editor.selected.is_active || !editor.canActivate || editor.isActivating} onClick={() => void activate()}><RefreshCw size={19}/></button>
        <button type="button" title="Close page" aria-label="Close page" onClick={closeActiveTab}><X size={19}/></button>
        <button type="button" className="ah-master__fab-primary" title="Add new record" aria-label={`Add new ${info.singular.toLowerCase()}`} disabled={!editor.canCreate} onClick={beginNew}><Plus size={24}/><span>Add {info.singular}</span></button>
      </nav>

      <UiModal open={open} title={editor.selected ? `Edit ${info.singular}` : `Add ${info.singular}`} size="md" className="ah-master-modal" onClose={() => setOpen(false)}
        footer={<>
          <button className="ah-master-modal__secondary" type="button" onClick={() => setOpen(false)}>Cancel</button>
          <button className="ah-master-modal__save" type="submit" form={formId} disabled={!editor.canSave || editor.isSaving}><Save size={16}/>{editor.isSaving ? 'Saving…' : 'Save changes'} <kbd>F9</kbd></button>
        </>}>
        {editor.error ? <p className="ah-master__error" role="alert">{editor.error}</p> : null}
        <form id={formId} className="ah-master-modal__form" onSubmit={e => void save(e)}>
          {editor.selected ? <label><span>Code</span><input readOnly value={editor.selected.code}/></label> : null}
          <label><span>{info.singular} name *</span><input required autoFocus autoComplete="off" value={editor.name} onChange={e=>editor.setName(e.target.value)} placeholder={`Enter ${kind} name`}/></label>
          {kind === 'unit' ? <>
            <label><span>Symbol *</span><input required value={editor.symbol} onChange={e=>editor.setSymbol(e.target.value)} placeholder="PCS, KG, BOX…"/></label>
            <label className="ah-master-modal__check"><input type="checkbox" checked={editor.allowsDecimal} onChange={e=>editor.setAllowsDecimal(e.target.checked)}/><span>Allow decimal quantities</span></label>
          </> : null}
        </form>
      </UiModal>
    </main>
  )
}
