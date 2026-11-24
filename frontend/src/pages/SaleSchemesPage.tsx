import { UiDateRangePicker } from '../components/ui/UiDateRangePicker'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit3, Gift, Plus, RefreshCw, Save, Search, Trash2, X } from 'lucide-react'
import { ApiClientError } from '../api/client'
import { fetchProducts } from '../api/catalog'
import {
  createSaleScheme,
  deactivateSaleScheme,
  fetchSaleSchemes,
  updateSaleScheme,
} from '../api/saleSchemes'
import { PosDataGrid } from '../components/desktop/PosDataGrid'
import { UiSimpleDropdown, UiTableDropdown } from '../components/ui/UiSelect'
import { UiModal } from '../components/ui/UiModal'
import { UI_LAYER } from '../components/ui/uiLayers'
import { useCan } from '../features/auth/useCan'
import { askConfirm } from '../feedback/FeedbackProvider'
import { useWorkspace, useWorkspaceHandlers } from '../features/workspace/WorkspaceProvider'
import type { SaleSchemeApplyMode } from '../types/saleSchemes'
import './SaleSchemesPage.css'
import './TenantDirectoryPages.css'

export function SaleSchemesPage() {
  const queryClient = useQueryClient()
  const { closeActiveTab } = useWorkspace()
  const canCreateDirect = useCan('sale_schemes.create')
  const canEditDirect = useCan('sale_schemes.edit')
  const canDeleteDirect = useCan('sale_schemes.delete')
  const canManage = useCan('sale_schemes.manage')
  const canCreate = canCreateDirect || canManage
  const canEdit = canEditDirect || canManage
  const canDelete = canDeleteDirect || canManage

  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [applyMode, setApplyMode] = useState<SaleSchemeApplyMode>('salesman')
  const [minSaleAmount, setMinSaleAmount] = useState('5000.0000')
  const [rewardProductUlid, setRewardProductUlid] = useState('')
  const [maxRewardQty, setMaxRewardQty] = useState('1.000000')
  const [startsOn, setStartsOn] = useState('')
  const [endsOn, setEndsOn] = useState('')
  const [isStackable, setIsStackable] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const schemesQuery = useQuery({
    queryKey: ['sale-schemes'],
    queryFn: fetchSaleSchemes,
  })
  const productsQuery = useQuery({
    queryKey: ['products', 'scheme-rewards'],
    queryFn: () => fetchProducts({ per_page: 100, page: 1 }),
  })

  const rows = schemesQuery.data ?? []
  const selected = useMemo(
    () => rows.find((row) => row.ulid === selectedKey) ?? null,
    [rows, selectedKey],
  )
  const products = productsQuery.data?.data ?? []
  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase()
    if (!query) return rows

    return rows.filter((row) => {
      const mode = row.apply_mode === 'auto' ? 'auto' : 'salesman'
      const status = row.is_active ? 'active' : 'inactive'
      const rewardProduct = row.reward_product?.name ?? ''

      return [
        row.name,
        mode,
        row.min_sale_amount,
        rewardProduct,
        row.max_reward_qty,
        status,
      ].some((value) => value.toLocaleLowerCase().includes(query))
    })
  }, [rows, searchQuery])

  useEffect(() => {
    if (creating) return
    if (!selected) {
      setName('')
      setApplyMode('salesman')
      setMinSaleAmount('5000.0000')
      setRewardProductUlid('')
      setMaxRewardQty('1.000000')
      setStartsOn('')
      setEndsOn('')
      setIsStackable(false)
      return
    }
    setName(selected.name)
    setApplyMode(selected.apply_mode)
    setMinSaleAmount(selected.min_sale_amount)
    setRewardProductUlid(selected.reward_product?.ulid ?? '')
    setMaxRewardQty(selected.max_reward_qty)
    setStartsOn(selected.starts_on ?? '')
    setEndsOn(selected.ends_on ?? '')
    setIsStackable(selected.is_stackable)
  }, [creating, selected])

  function startNew() {
    if (!canCreate) return
    setCreating(true)
    setSelectedKey(null)
    setName('')
    setApplyMode('salesman')
    setMinSaleAmount('5000.0000')
    setRewardProductUlid('')
    setMaxRewardQty('1.000000')
    setStartsOn('')
    setEndsOn('')
    setIsStackable(false)
    setError(null)
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: name.trim(),
        apply_mode: applyMode,
        min_sale_amount: minSaleAmount,
        reward_product_ulid: rewardProductUlid,
        max_reward_qty: maxRewardQty,
        starts_on: startsOn || null,
        ends_on: endsOn || null,
        is_stackable: isStackable,
        is_active: true,
      }
      if (creating || !selectedKey) {
        return createSaleScheme(payload)
      }
      return updateSaleScheme(selectedKey, payload)
    },
    onSuccess: async (saved) => {
      setCreating(false)
      setSelectedKey(saved.ulid)
      setError(null)
      setModalOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['sale-schemes'] })
    },
  })

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError('Scheme name is required.')
      return
    }
    if (!rewardProductUlid) {
      setError('Select a free reward product.')
      return
    }
    try {
      await saveMutation.mutateAsync()
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to save scheme.')
    }
  }

  useWorkspaceHandlers({
    save: () => {
      if (modalOpen) (document.getElementById('sale-scheme-form') as HTMLFormElement | null)?.requestSubmit()
      else if (canCreate) { startNew(); setModalOpen(true) }
    },
    refresh: () => void schemesQuery.refetch(),
  })

 
  function openCreate() {
    if (!canCreate) return
    startNew()
    setModalOpen(true)
  }

  function openEdit(row: (typeof rows)[number]) {
    if (!canEdit) return
    setCreating(false)
    setSelectedKey(row.ulid)
    setError(null)
    setModalOpen(true)
  }

  async function deactivateSelected() {
    if (!selected?.is_active || !canDelete || !(await askConfirm(`Deactivate ${selected.name}?`))) return
    try {
      await deactivateSaleScheme(selected.ulid)
      await queryClient.invalidateQueries({ queryKey: ['sale-schemes'] })
      setError(null)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to deactivate scheme.')
    }
  }

  return (
    <main className="ah-directory-page" aria-label="Sale schemes directory">
      <section className="ah-directory-card">
        <div className="ah-directory-toolbar">
          <label className="ah-directory-search">
            <Search size={17} aria-hidden="true" />
            <span className="sr-only">Search sale schemes</span>
            <input type="search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search schemes, reward products, amount or status…" />
          </label>
          <span className="ah-directory-summary">{rows.filter(row => row.is_active).length} Active · {rows.filter(row => !row.is_active).length} Inactive</span>
        </div>
        {!modalOpen && error ? <p className="ah-directory-error" role="alert">{error}</p> : null}
        <div className="ah-directory-grid">
          <PosDataGrid
            columns={[
              {key:'name',header:'Scheme',render:(row:(typeof rows)[number])=><span className="ah-directory-name"><Gift size={14}/>{row.name}</span>},
              {key:'mode',header:'Mode',width:125,render:(row:(typeof rows)[number])=>row.apply_mode==='auto'?'Auto':'Salesman'},
              {key:'min',header:'Min sale amount',width:145,render:(row:(typeof rows)[number])=>row.min_sale_amount},
              {key:'reward',header:'Free product',render:(row:(typeof rows)[number])=>row.reward_product?.name ?? '—'},
              {key:'qty',header:'Max free qty',width:115,render:(row:(typeof rows)[number])=>row.max_reward_qty},
              {key:'status',header:'Status',width:110,render:(row:(typeof rows)[number])=>row.is_active?'Active':'Inactive'},
              {key:'actions',header:'Action',width:95,render:(row:(typeof rows)[number])=><button type="button" className="ah-directory-edit" disabled={!canEdit} onClick={()=>openEdit(row)}><Edit3 size={13}/> Edit</button>},
            ]}
            rows={filteredRows}
            rowKey={row=>row.ulid}
            selectedKey={selectedKey}
            onSelect={row=>{setCreating(false);setSelectedKey(row.ulid)}}
            onActivate={openEdit}
            emptyMessage="No matching sale schemes."
            loading={schemesQuery.isLoading}
          />
        </div>
        <footer className="ah-directory-footer">Showing {filteredRows.length} of {rows.length} schemes</footer>
      </section>

      <nav className="ah-directory-fab" aria-label="Sale scheme actions">
        <button type="button" title="Refresh (F8)" aria-label="Refresh schemes" onClick={()=>void schemesQuery.refetch()}><RefreshCw size={18}/></button>
        <button type="button" title="Edit selected" aria-label="Edit selected scheme" disabled={!selected||!canEdit} onClick={()=>{if(selected)openEdit(selected)}}><Edit3 size={18}/></button>
        <button type="button" title="Deactivate selected" aria-label="Deactivate selected scheme" disabled={!selected?.is_active||!canDelete} onClick={()=>void deactivateSelected()}><Trash2 size={18}/></button>
        <button type="button" title="Close" aria-label="Close sale schemes" onClick={closeActiveTab}><X size={18}/></button>
        <button type="button" className="ah-directory-fab-primary" disabled={!canCreate} onClick={openCreate}><Plus size={20}/> Add Scheme</button>
      </nav>

      <UiModal open={modalOpen} title={creating ? 'Add Sale Scheme' : 'Edit Sale Scheme'}
        size="lg" className="ah-directory-modal" onClose={()=>setModalOpen(false)}
        footer={<>
          <button type="button" className="ah-directory-cancel" onClick={()=>setModalOpen(false)}>Cancel</button>
          <button type="submit" form="sale-scheme-form" className="ah-directory-save" disabled={saveMutation.isPending || (creating ? !canCreate : !canEdit)}>
            <Save size={16}/>{saveMutation.isPending?'Saving…':'Save Scheme'} <kbd>F9</kbd>
          </button>
        </>}>
        {error ? <p className="ah-directory-error" role="alert">{error}</p> : null}
        <form id="sale-scheme-form" className="ah-directory-form" onSubmit={event=>void onSubmit(event)}>
          <label><span>Scheme name *</span>
            <input autoFocus required value={name} onChange={e=>setName(e.target.value)} placeholder="Enter scheme name"/>
          </label>
          <label><span>Apply mode *</span>
            <UiSimpleDropdown aria-label="Apply mode" value={applyMode} searchable={false}
              menuZIndex={UI_LAYER.modalDropdown}
              options={[{value:'salesman',label:'Salesman decides (Add / Skip)'},{value:'auto',label:'Auto apply when eligible'}]}
              onChange={value=>setApplyMode(value as SaleSchemeApplyMode)}/>
          </label>
          <label><span>Minimum sale amount *</span>
            <input required inputMode="decimal" value={minSaleAmount} onChange={e=>setMinSaleAmount(e.target.value)}/>
          </label>
          <label><span>Free reward product *</span>
            <UiTableDropdown aria-label="Free product" value={rewardProductUlid}
              placeholder="Select reward product" menuZIndex={UI_LAYER.modalDropdown}
              menuMinWidth={420} menuColumns={[{header:'Product #',width:'120px'},{header:'Product'}]}
              options={products.filter(row=>row.is_active||row.ulid===rewardProductUlid).map(row=>({
                value:row.ulid,label:`${row.product_number} — ${row.name}`,columns:[row.product_number,row.name],
              }))}
              onChange={setRewardProductUlid}/>
          </label>
          <label><span>Maximum free quantity *</span>
            <input required inputMode="decimal" value={maxRewardQty} onChange={e=>setMaxRewardQty(e.target.value)}/>
          </label>
          <div className="ah-directory-form-wide">
            <span className="ah-directory-field-label">Validity period</span>
            <UiDateRangePicker fromInputProps={{className:'desktop-input',type:'date',value:startsOn,onChange:e=>setStartsOn(e.target.value)}}
              toInputProps={{className:'desktop-input',type:'date',value:endsOn,onChange:e=>setEndsOn(e.target.value)}}/>
          </div>
          <label className="ah-directory-check"><input type="checkbox" checked={isStackable} onChange={e=>setIsStackable(e.target.checked)}/>
            <span>Can combine with other schemes</span>
          </label>
        </form>
      </UiModal>
    </main>
  )
}
