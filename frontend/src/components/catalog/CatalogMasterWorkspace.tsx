import { FormEvent, useMemo, useState } from 'react'
import { CheckCircle2, FolderTree, Layers3, Plus, RefreshCw, Ruler, Save, Search, ShieldCheck, Trash2, X } from 'lucide-react'
import { ApiClientError } from '../../api/client'
import { useCatalogMasterEditor } from './useCatalogMasterEditor'
import { PosDataGrid } from '../desktop/PosDataGrid'
import { askConfirm } from '../../feedback/FeedbackProvider'
import { useWorkspace, useWorkspaceHandlers } from '../../features/workspace/WorkspaceProvider'
import './CatalogMasterWorkspace.css'

type MasterKind = 'category' | 'brand' | 'unit'

const DISPLAY = {
  category: { title: 'Categories', singular: 'Category', subtitle: 'Organize products into a clear, searchable catalog.', icon: FolderTree },
  brand: { title: 'Brands', singular: 'Brand', subtitle: 'Maintain the brands and companies in your product catalog.', icon: Layers3 },
  unit: { title: 'Units', singular: 'Unit', subtitle: 'Define measurement units and quantity precision.', icon: Ruler },
} as const

/**
 * Visual workspace only. Mutations, permissions, keyboard shortcuts and row
 * selection remain owned by the existing catalog editor and workspace hooks.
 */
export function CatalogMasterWorkspace({ kind }: { kind: MasterKind }) {
  const editor = useCatalogMasterEditor(kind)
  const { closeActiveTab } = useWorkspace()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | 'active' | 'archived'>('all')
  const info = DISPLAY[kind]
  const Icon = info.icon
  const formId = `ahpos-${kind}-form`

  const filteredRows = useMemo(() => {
    const q = search.trim().toLocaleLowerCase()
    return editor.rows.filter((row) => {
      if (status === 'active' && !row.is_active) return false
      if (status === 'archived' && row.is_active) return false
      return !q || [row.code, row.name, 'symbol' in row ? row.symbol : ''].some(
        (value) => value.toLocaleLowerCase().includes(q),
      )
    })
  }, [editor.rows, search, status])

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    editor.setError(null)
    try {
      await editor.save()
    } catch (error) {
      editor.setError(error instanceof ApiClientError ? error.message : error instanceof Error ? error.message : `Unable to save ${kind}.`)
    }
  }

  async function deactivate() {
    if (!editor.selected || !(await askConfirm(`Deactivate ${editor.selected.name}?`))) return
    try { await editor.deactivate() }
    catch (error) {
      editor.setError(error instanceof ApiClientError ? error.message : `Unable to deactivate ${kind}.`)
    }
  }

  async function activate() {
    try { await editor.activate() }
    catch (error) {
      editor.setError(error instanceof ApiClientError ? error.message : `Unable to activate ${kind}.`)
    }
  }

  useWorkspaceHandlers({
    save: () => (document.getElementById(formId) as HTMLFormElement | null)?.requestSubmit(),
    refresh: () => void editor.refresh(),
  })

  return (
    <main className="ah-master" aria-label={`${info.title} workspace`}>
      <header className="ah-master__header">
        <div className="ah-master__heading">
          <span className="ah-master__hero-icon"><Icon size={25} aria-hidden="true" /></span>
          <div>
            <span className="ah-master__eyebrow">DEFINITION / MASTER DATA</span>
            <h1>{info.title}</h1>
            <p>{info.subtitle}</p>
          </div>
        </div>
        <div className="ah-master__actions">
          <button type="button" onClick={editor.startNew} disabled={!editor.canCreate}><Plus size={16}/> New</button>
          <button type="submit" form={formId} className="ah-master__primary" disabled={!editor.canSave || editor.isSaving}><Save size={16}/> {editor.isSaving ? 'Saving…' : 'Save'} <kbd>F9</kbd></button>
          <button type="button" onClick={() => void editor.refresh()}><RefreshCw size={16}/> Refresh <kbd>F8</kbd></button>
          <button type="button" onClick={closeActiveTab}><X size={16}/> Close</button>
        </div>
      </header>

      {editor.error ? <div className="ah-master__error" role="alert">{editor.error}</div> : null}

      <div className="ah-master__stats" aria-label="Record counts">
        <div><span>Total {info.title}</span><strong>{editor.rows.length}</strong></div>
        <div><span>Active</span><strong>{editor.rows.filter((r) => r.is_active).length}</strong></div>
        <div><span>Archived</span><strong>{editor.rows.filter((r) => !r.is_active).length}</strong></div>
      </div>

      <div className="ah-master__layout">
        <section className="ah-master__card ah-master__list" aria-label={`${info.title} list`}>
          <div className="ah-master__section-heading">
            <div><h2>{info.title} list</h2><p>Select a record to edit its details</p></div>
            <span className="ah-master__count">{filteredRows.length} records</span>
          </div>
          <div className="ah-master__filters">
            <label className="ah-master__search">
              <Search size={17} aria-hidden="true"/>
              <span className="sr-only">Search {info.title.toLowerCase()}</span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${info.title.toLowerCase()} by name, code${kind === 'unit' ? ' or symbol' : ''}…`}/>
            </label>
            <label className="ah-master__filter">
              <span className="sr-only">Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </label>
          </div>
          <div className="ah-master__grid">
            <PosDataGrid
              columns={[
                { key: 'code', header: 'Code', width: 130, render: (row) => row.code },
                { key: 'name', header: info.singular + ' name', render: (row) => row.name },
                ...(kind === 'unit' ? [{ key: 'symbol', header: 'Symbol', width: 94, render: (row: (typeof editor.rows)[number]) => 'symbol' in row ? row.symbol : '' }] : []),
                { key: 'status', header: 'Status', width: 104, render: (row) => row.is_active ? 'Active' : 'Archived' },
              ]}
              rows={filteredRows}
              rowKey={(row) => row.ulid}
              selectedKey={editor.selectedKey}
              onSelect={editor.select}
              emptyMessage="No matching records."
            />
          </div>
          <div className="ah-master__list-footer">Showing {filteredRows.length} of {editor.rows.length} records</div>
        </section>

        <section className="ah-master__card ah-master__editor" aria-label={`${info.singular} editor`}>
          <div className="ah-master__section-heading">
            <div><h2>{editor.selected ? `Edit ${info.singular}` : `New ${info.singular}`}</h2><p>{editor.selected ? editor.selected.code : 'Create a new master record'}</p></div>
            <span className={`ah-master__pill ${editor.selected && !editor.selected.is_active ? 'is-archived' : ''}`}>
              <CheckCircle2 size={14}/>{editor.selected ? editor.selected.is_active ? 'Active' : 'Archived' : 'New'}
            </span>
          </div>
          {editor.canCreate || editor.canEdit ? (
            <form id={formId} className="ah-master__form" onSubmit={(e) => void save(e)}>
              <div className="ah-master__illustration"><Icon size={34} /><span>{info.singular} details</span></div>
              {editor.selected ? (
                <label><span>Code</span><input readOnly value={editor.selected.code} aria-label="Record code" /></label>
              ) : null}
              <label>
                <span>{info.singular} Name <b>*</b></span>
                <input required autoComplete="off" value={editor.name} onChange={(e) => editor.setName(e.target.value)} placeholder={`Enter ${kind} name`} />
              </label>
              {kind === 'unit' ? (
                <>
                  <label><span>Symbol <b>*</b></span><input required value={editor.symbol} onChange={(e) => editor.setSymbol(e.target.value)} placeholder="e.g. PCS, KG" /></label>
                  <label className="ah-master__toggle"><input type="checkbox" checked={editor.allowsDecimal} onChange={(e) => editor.setAllowsDecimal(e.target.checked)}/><span>Allow decimal quantities</span></label>
                </>
              ) : null}
              <div className="ah-master__note"><ShieldCheck size={18}/><span>{editor.selected ? 'Changes will use existing catalog validation and permission checks.' : 'Codes are assigned by the existing catalog service when you save.'}</span></div>
              <div className="ah-master__editor-actions">
                <button type="submit" className="ah-master__primary" disabled={!editor.canSave || editor.isSaving}><Save size={16}/> Save {info.singular}</button>
                <button type="button" onClick={editor.startNew} disabled={!editor.canCreate}><Plus size={16}/> Save & New is available after saving</button>
              </div>
            </form>
          ) : <p className="ah-master__readonly">You have read-only access to these records.</p>}
          <div className="ah-master__danger-actions">
            <button type="button" disabled={!editor.canDelete || !editor.selected?.is_active || editor.isDeactivating} onClick={() => void deactivate()}><Trash2 size={16}/> Deactivate selected</button>
            <button type="button" disabled={!editor.canActivate || !editor.selected || editor.selected.is_active || editor.isActivating} onClick={() => void activate()}><RefreshCw size={16}/> Activate selected</button>
          </div>
        </section>
      </div>
    </main>
  )
}
