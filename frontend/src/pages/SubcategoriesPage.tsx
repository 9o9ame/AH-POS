import { FormEvent, useMemo, useState } from 'react'
import {
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
  Edit3,
  Search,
} from 'lucide-react'
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  createSubcategory,
  deactivateSubcategory,
  fetchCategories,
  fetchSubcategories,
  updateSubcategory,
} from '../api/catalog'
import { ApiClientError } from '../api/client'
import { askConfirm } from '../feedback/FeedbackProvider'
import { PosDataGrid } from '../components/desktop/PosDataGrid'
import { UiSelect } from '../components/ui/UiSelect'
import { UiModal } from '../components/ui/UiModal'
import { UI_LAYER } from '../components/ui/uiLayers'
import { useCan } from '../features/auth/useCan'
import {
  useWorkspace,
  useWorkspaceHandlers,
} from '../features/workspace/WorkspaceProvider'
import type { Subcategory } from '../types/catalog'
import '../components/catalog/CatalogMasterWorkspace.css'
import '../components/catalog/CatalogMasterModal.css'
import '../ahpos-clarity.css'

export function SubcategoriesPage() {
  const queryClient = useQueryClient()
  const { closeActiveTab } = useWorkspace()

  const canManage =
    useCan('categories.manage')

  const canCreate =
    useCan('categories.create') ||
    canManage

  const canEdit =
    useCan('categories.edit') ||
    canManage

  const canDelete =
    useCan('categories.delete') ||
    canManage

  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  })

  const query = useQuery({
    queryKey: ['subcategories'],
    queryFn: () =>
      fetchSubcategories(),
  })

  const rows = useMemo(
    () => query.data ?? [],
    [query.data],
  )

  const [selectedKey, setSelectedKey] =
    useState<string | null>(null)

  const [categoryUlid, setCategoryUlid] =
    useState('')

  const [name, setName] =
    useState('')

  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'archived'>('all')
  const [filterCategory, setFilterCategory] = useState('all')

  const selected =
    rows.find(
      (row) =>
        row.ulid === selectedKey,
    ) ?? null

  const defaultCategoryUlid =
    categories.data?.find(
      (category) =>
        category.is_active,
    )?.ulid ??
    categories.data?.[0]?.ulid ??
    ''

  const filteredRows = useMemo(() => {
    const q = search.trim().toLocaleLowerCase()
    return rows.filter(row => {
      if (filterStatus === 'active' && !row.is_active) return false
      if (filterStatus === 'archived' && row.is_active) return false
      if (filterCategory !== 'all' && (row.category?.ulid ?? row.category_ulid ?? '') !== filterCategory) return false
      return !q || [row.code, row.name, row.category?.name ?? ''].some(s => s.toLocaleLowerCase().includes(q))
    })
  }, [rows, search, filterStatus, filterCategory])

  const canSave =
    selectedKey
      ? canEdit
      : canCreate

  function select(
    row: Subcategory,
  ) {
    setSelectedKey(row.ulid)

    setCategoryUlid(
      row.category?.ulid ??
        row.category_ulid ??
        '',
    )

    setName(row.name)
    setError(null)
  }

  function startNew() {
    setSelectedKey(null)
    setCategoryUlid(
      defaultCategoryUlid,
    )
    setName('')
    setError(null)
  }

  const saveMutation =
    useMutation({
      mutationFn: async () => {
        const payload = {
          category_ulid:
            categoryUlid ||
            defaultCategoryUlid,

          name:
            name.trim(),
        }

        if (selectedKey) {
          return updateSubcategory(
            selectedKey,
            payload,
          )
        }

        return createSubcategory(
          payload,
        )
      },

      onSuccess: async (item) => {
        await queryClient.invalidateQueries({
          queryKey: [
            'subcategories',
          ],
        })

        select(item)
      },
    })

  const deactivateMutation =
    useMutation({
      mutationFn: async () => {
        if (!selectedKey) {
          return null
        }

        return deactivateSubcategory(
          selectedKey,
        )
      },

      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: [
            'subcategories',
          ],
        })
      },
    })

  const activateMutation =
    useMutation({
      mutationFn: async () => {
        if (!selectedKey) {
          return null
        }

        return updateSubcategory(
          selectedKey,
          {
            is_active: true,
          },
        )
      },

      onSuccess: async (item) => {
        await queryClient.invalidateQueries({
          queryKey: [
            'subcategories',
          ],
        })

        if (item) {
          select(item)
        }
      },
    })

  async function onSubmit(
    event: FormEvent,
  ) {
    event.preventDefault()
    setError(null)

    if (
      !(
        categoryUlid ||
        defaultCategoryUlid
      )
    ) {
      setError(
        'Please create or select a category first.',
      )

      return
    }

    try {
      await saveMutation.mutateAsync()
      setModalOpen(false)
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'Unable to save subcategory.',
      )
    }
  }

  useWorkspaceHandlers({
    save: () => {
      if (modalOpen) (document.getElementById('subcategory-form') as HTMLFormElement | null)?.requestSubmit()
      else if (canCreate) { startNew(); setModalOpen(true) }
    },

    refresh: () =>
      void query.refetch(),
  })

  function openNew() { if (!canCreate) return; startNew(); setModalOpen(true) }
  function openEdit(row: Subcategory) { if (!canEdit) return; select(row); setModalOpen(true) }
  async function deactivate() {
    if (!selected || !canDelete || !selected.is_active || !(await askConfirm(`Deactivate ${selected.name}?`))) return
    try { await deactivateMutation.mutateAsync() }
    catch (err) { setError(err instanceof ApiClientError ? err.message : 'Unable to deactivate subcategory.') }
  }
  async function activate() {
    if (!selected || !canEdit || selected.is_active) return
    try { await activateMutation.mutateAsync() }
    catch (err) { setError(err instanceof ApiClientError ? err.message : 'Unable to activate subcategory.') }
  }

  return (
    <main className="ah-master ah-master--list-only" aria-label="Subcategories workspace">
      {!modalOpen && error ? <div className="ah-master__error" role="alert">{error}</div> : null}
      <section className="ah-master__card ah-master__list" aria-label="Subcategories list">
        <div className="ah-master__section-heading"><div><h2>Subcategories directory</h2><p>Search, select or double-click a record to edit</p></div>
          <div className="ah-master__compact-stats"><span>{rows.filter(r => r.is_active).length} Active</span><span>{rows.filter(r => !r.is_active).length} Archived</span></div>
        </div>
        <div className="ah-master__filters">
          <label className="ah-master__search"><Search size={17}/><span className="sr-only">Search subcategories</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search subcategories by category, name or code…"/>
          </label>
          <div className="ah-master__filter ah-master__filter-category">
            <UiSelect value={filterCategory} searchable={true} aria-label="Filter by category"
              options={[{value:'all',label:'All categories'},...(categories.data ?? []).map(item => ({value:item.ulid,label:item.name}))]}
              onChange={setFilterCategory}/>
          </div>
          <div className="ah-master__filter">
            <UiSelect value={filterStatus} searchable={false} aria-label="Record status"
              options={[{value:'all',label:'All statuses'},{value:'active',label:'Active'},{value:'archived',label:'Archived'}]}
              onChange={v=>setFilterStatus(v as typeof filterStatus)}/>
          </div>
        </div>
        <div className="ah-master__grid">
          <PosDataGrid
            columns={[
              {key:'category',header:'Category',render:(row:Subcategory)=>row.category?.name ?? categories.data?.find(c=>c.ulid===row.category_ulid)?.name ?? '—'},
              {key:'code',header:'Code',width:150,render:(row:Subcategory)=>row.code},
              {key:'name',header:'Subcategory',render:(row:Subcategory)=>row.name},
              {key:'status',header:'Status',width:110,render:(row:Subcategory)=>row.is_active?'Active':'Archived'},
              {key:'action',header:'Action',width:90,render:(row:Subcategory)=><button type="button" className="ah-master__row-edit" disabled={!canEdit} onClick={()=>openEdit(row)}><Edit3 size={13}/> Edit</button>},
            ]}
            rows={filteredRows} rowKey={row=>row.ulid} selectedKey={selectedKey}
            onSelect={select} onActivate={openEdit} emptyMessage="No matching subcategories."/>
        </div>
        <footer className="ah-master__list-footer">Showing {filteredRows.length} of {rows.length} records</footer>
      </section>
      <nav className="ah-master__fab" aria-label="Subcategories floating actions">
        <button type="button" title="Refresh" aria-label="Refresh records" onClick={()=>void query.refetch()}><RefreshCw size={19}/></button>
        <button type="button" title="Edit selected" aria-label="Edit selected" disabled={!selected||!canEdit} onClick={()=>{if(selected)openEdit(selected)}}><Edit3 size={19}/></button>
        <button type="button" title="Deactivate selected" aria-label="Deactivate selected" disabled={!selected?.is_active||!canDelete||deactivateMutation.isPending} onClick={()=>void deactivate()}><Trash2 size={19}/></button>
        <button type="button" title="Activate selected" aria-label="Activate selected" disabled={!selected||selected.is_active||!canEdit||activateMutation.isPending} onClick={()=>void activate()}><RefreshCw size={19}/></button>
        <button type="button" title="Close page" aria-label="Close page" onClick={closeActiveTab}><X size={19}/></button>
        <button type="button" className="ah-master__fab-primary" title="Add subcategory" aria-label="Add subcategory" disabled={!canCreate} onClick={openNew}><Plus size={24}/><span>Add Subcategory</span></button>
      </nav>

      <UiModal open={modalOpen} title={selected ? 'Edit Subcategory' : 'Add Subcategory'} size="md" className="ah-master-modal" onClose={()=>setModalOpen(false)}
        footer={<>
          <button type="button" className="ah-master-modal__secondary" onClick={()=>setModalOpen(false)}>Cancel</button>
          <button type="submit" form="subcategory-form" className="ah-master-modal__save" disabled={!canSave||saveMutation.isPending}><Save size={16}/>{saveMutation.isPending?'Saving…':'Save changes'} <kbd>F9</kbd></button>
        </>}>
        {error ? <p className="ah-master__error" role="alert">{error}</p> : null}
        {canCreate || canEdit ? (
          <form id="subcategory-form" className="ah-master-modal__form" onSubmit={e=>void onSubmit(e)}>
            {selected ? <label><span>Code</span><input value={selected.code} readOnly/></label> : null}
            <label><span>Category *</span>
              <UiSelect value={categoryUlid||defaultCategoryUlid} aria-label="Parent category" searchable menuZIndex={UI_LAYER.modalDropdown}
                options={(categories.data??[]).map(category=>({value:category.ulid,label:`${category.code} — ${category.name}`}))}
                onChange={setCategoryUlid}/>
            </label>
            <label><span>Subcategory name *</span><input required autoFocus value={name} onChange={e=>setName(e.target.value)} placeholder="Enter subcategory name"/></label>
          </form>
        ):<p>Read-only access</p>}
      </UiModal>
    </main>
  )
}
