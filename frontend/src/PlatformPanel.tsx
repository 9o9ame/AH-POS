import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  ApiError, createPlatformAdmin, createPlatformStaff, getPlatformAdmins, getPlatformAudit,
  assignPlatformExistingOwner, listPlatformOwnerCandidates, type PlatformOwnerCandidate,
  getPlatformOverview, getPlatformStaff, type PlatformAdminRecord, type PlatformAuditRecord,
  type PlatformOverview, type PlatformSession, type PlatformStaffRecord,
} from './api';
import { EntityModal, TableSkeleton } from './EntityModal';
import { AppIcon } from './AppIcon';

export function PlatformPanel({session, onSignOut, initialTab='admins', focus='overview'}: {
  session:PlatformSession;onSignOut:()=>void;
  initialTab?:'admins'|'staff'|'audit';focus?:'overview'|'register';
}) {
  const can = (permission:string) => session.permissions.includes(permission);
  const [tab,setTab] = useState<'admins'|'staff'|'audit'>(initialTab);
  const [overview,setOverview] = useState<PlatformOverview|null>(null);
  const [admins,setAdmins] = useState<PlatformAdminRecord[]>([]);
  const [staff,setStaff] = useState<PlatformStaffRecord[]>([]);
  const [audit,setAudit] = useState<PlatformAuditRecord[]>([]);
  const [loading,setLoading] = useState(true);
  const [editor,setEditor] = useState<'admin'|'staff'|'assignOwner'|null>(null);
  const [ownerBusiness,setOwnerBusiness] = useState<PlatformAdminRecord|null>(null);
  const [ownerCandidates,setOwnerCandidates] = useState<PlatformOwnerCandidate[]>([]);
  const [selectedOwnerEmail,setSelectedOwnerEmail] = useState('');
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [success,setSuccess] = useState('');
  const [adminInput,setAdminInput] = useState({
    business_name:'',owner_name:'',owner_email:'',password:'',
  });
  const [staffInput,setStaffInput] = useState({
    name:'',email:'',password:'',role:'Support Operator' as 'Support Operator'|'Admin Manager',
  });
  const load = useCallback(async()=>{
    setLoading(true);
    const requests:Promise<unknown>[]=[
      can('platform.overview.read') ? getPlatformOverview().then(setOverview) : Promise.resolve(),
      can('platform.admins.read') ? getPlatformAdmins().then(setAdmins) : Promise.resolve(),
      can('platform.staff.read') ? getPlatformStaff().then(setStaff) : Promise.resolve(),
      can('platform.audit.read') ? getPlatformAudit().then(setAudit) : Promise.resolve(),
    ];
    const results=await Promise.allSettled(requests);
    setError(results.some(r=>r.status==='rejected')?'Some Platform records could not load. Review permissions and server connection.':'');
    setLoading(false);
  },[session.permissions.join('|')]);
  useEffect(()=>{void load()},[load]);
  async function saveAdmin(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setError('');setSuccess('');setBusy(true);
    try{
      const created=await createPlatformAdmin(adminInput);
      setEditor(null);setAdminInput({business_name:'',owner_name:'',owner_email:'',password:''});
      setSuccess('Admin workspace "'+created.name+'" created with a separate authorized owner.');
      await load();
    }catch(ex){setError(ex instanceof ApiError?ex.message:'Unable to create Admin. Check input and connection.')}
    finally{setBusy(false)}
  }
  async function saveStaff(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setError('');setSuccess('');setBusy(true);
    try{
      const created=await createPlatformStaff(staffInput);
      setEditor(null);setStaffInput({name:'',email:'',password:'',role:'Support Operator'});
      setSuccess('Platform staff account '+created.email+' created with limited role.');
      await load();
    }catch(ex){setError(ex instanceof ApiError?ex.message:'Unable to create Platform staff.')}
    finally{setBusy(false)}
  }
  async function openOwnerAssignment(business:PlatformAdminRecord){
    setOwnerBusiness(business);setOwnerCandidates([]);setSelectedOwnerEmail('');
    setError('');setSuccess('');setBusy(true);
    try{
      const members=await listPlatformOwnerCandidates(business.ulid);
      setOwnerCandidates(members);
      setSelectedOwnerEmail(members.length===1?members[0].email:'');
      setEditor('assignOwner');
    }catch(ex){
      setError(ex instanceof ApiError?ex.message:'Could not load existing business members.');
    }finally{setBusy(false)}
  }
  async function saveOwnerAssignment(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!ownerBusiness || !selectedOwnerEmail)return;
    setBusy(true);setError('');setSuccess('');
    try{
      const result=await assignPlatformExistingOwner(ownerBusiness.ulid,selectedOwnerEmail);
      setEditor(null);setOwnerBusiness(null);
      setSuccess('Admin Owner assigned to '+result.owner_name+' for '+result.name+'.');
      await load();
    }catch(ex){
      setError(ex instanceof ApiError?ex.message:'Could not assign business owner.');
    }finally{setBusy(false)}
  }
  return <div className="platform-console">
    {focus==='overview'&&<header className="platform-hero">
      <div><span className="small-overline">AH POS / CONTROL PLANE</span>
        <h1>Super Admin Platform</h1>
        <p>Manage Admin businesses and platform operators. Tenant transactions are deliberately not available here.</p>
      </div>
      <button type="button" className="platform-signout" onClick={onSignOut}><AppIcon name="logout" size={15}/> Sign out</button>
    </header>}
    {focus==='overview'&&<div className="platform-stat-grid">
      {[{label:'Admin workspaces',value:overview?.admins,icon:'warehouse'},
        {label:'Active Admins',value:overview?.active_admins,icon:'check'},
        {label:'Platform operators',value:overview?.platform_staff,icon:'people'}].map(metric=>
        <div className="platform-stat" key={metric.label}>
          <span><AppIcon name={metric.icon as 'warehouse'|'check'|'people'} size={18}/>{metric.label}</span>
          <strong>{loading?'…':metric.value??'Restricted'}</strong>
        </div>)}
    </div>
    {focus==='overview'&&<div className="platform-tabs" role="tablist" aria-label="Platform management">
      {([{id:'admins',label:'Admin businesses',permission:'platform.admins.read'},
        {id:'staff',label:'Platform staff',permission:'platform.staff.read'},
        {id:'audit',label:'Audit trail',permission:'platform.audit.read'}] as const)
        .filter(t=>can(t.permission)).map(t=><button role="tab" aria-selected={tab===t.id}
          type="button" key={t.id} className={tab===t.id?'selected':''} onClick={()=>setTab(t.id)}>{t.label}</button>)}
    </div>}
    {tab==='admins' && can('platform.admins.read')&&<section className="panel-card">
      <div className="panel-heading"><div><span className="small-overline">BUSINESS ONBOARDING</span><h2>Admin workspaces</h2></div>
        <div className="dense-actions"><span className="count-pill">{admins.length} loaded</span>
          {can('platform.admins.create')&&<button type="button" className="list-create-button" onClick={()=>setEditor('admin')}>+ Create Admin</button>}
        </div></div>
      <div className="table-scroll"><table className="data-table">
        <thead><tr><th>Business</th><th>Admin owner</th><th>Owner email</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
        <tbody>{admins.map(t=><tr key={t.ulid}><td><strong>{t.name}</strong></td>
          <td>{t.owner_name||'No mapped owner'}</td><td>{t.owner_email||'—'}</td><td>{t.status}</td>
          <td>{new Date(t.created_at).toLocaleDateString()}</td><td>
            {!t.owner_email && can('platform.admins.create') && t.status === 'active' &&
              <button type="button" className="btn-ghost" disabled={busy}
                onClick={() => {void openOwnerAssignment(t);}}>Assign Owner</button>}
          </td></tr>)}</tbody></table></div>
      {loading&&<TableSkeleton rows={6} cols={5}/>}
      {!loading&&admins.length===0&&<p className="empty-copy">No Admin workspaces visible.</p>}
      <p className="muted">Legacy local test tenants may show no mapped owner; they are not silently upgraded to Platform-managed Admins.</p>
    </section>}
    {tab==='staff'&&can('platform.staff.read')&&<section className="panel-card">
      <div className="panel-heading"><div><span className="small-overline">PLATFORM OPERATIONS</span><h2>Platform staff</h2></div>
        {can('platform.staff.manage')&&<button type="button" className="list-create-button" onClick={()=>setEditor('staff')}>+ Add Operator</button>}
      </div>
      <div className="table-scroll"><table className="data-table"><thead><tr><th>Name</th><th>Email</th><th>Platform role</th></tr></thead>
        <tbody>{staff.map(u=><tr key={u.email+u.platform_role}><td>{u.name}</td><td>{u.email}</td><td>{u.platform_role}</td></tr>)}</tbody></table></div>
      {loading&&<TableSkeleton rows={5} cols={3}/>}
    </section>}
    {tab==='audit'&&can('platform.audit.read')&&<section className="panel-card">
      <div className="panel-heading"><div><span className="small-overline">CONTROL PLANE ONLY</span><h2>Recent Platform audit events</h2></div></div>
      <div className="table-scroll"><table className="data-table"><thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Target type</th></tr></thead>
        <tbody>{audit.map(event=><tr key={event.ulid}><td>{new Date(event.created_at).toLocaleString()}</td><td>{event.actor_name}</td>
          <td>{event.action}</td><td>{event.target_type}</td></tr>)}</tbody></table></div>
      {loading&&<TableSkeleton rows={5} cols={4}/>}
    </section>}
    {editor==='admin'&&<EntityModal title="Create Admin Business" subtitle="Provision a fully separate tenant and its owner role in one server transaction."
      onClose={()=>setEditor(null)} busy={busy}><form className="platform-form" onSubmit={e=>{void saveAdmin(e)}}>
        <label>Business name<input required maxLength={160} minLength={2} value={adminInput.business_name} onChange={e=>setAdminInput(v=>({...v,business_name:e.target.value}))}/></label>
        <label>Admin owner name<input required maxLength={160} minLength={2} value={adminInput.owner_name} onChange={e=>setAdminInput(v=>({...v,owner_name:e.target.value}))}/></label>
        <label>Admin login email<input required type="email" maxLength={255} autoComplete="off" value={adminInput.owner_email} onChange={e=>setAdminInput(v=>({...v,owner_email:e.target.value}))}/></label>
        <label>Temporary strong password (share securely, change after onboarding)<input required type="password"
          minLength={12} autoComplete="new-password" value={adminInput.password}
          onChange={e=>setAdminInput(v=>({...v,password:e.target.value}))}/></label>
        <p className="muted">At least 12 characters with uppercase/lowercase, number and symbol. No passwords appear in the audit or admin list.</p>
        <button disabled={busy} type="submit" className="list-create-button">{busy?'Creating…':'Create Admin and Workspace'}</button>
      </form></EntityModal>}
    {editor==='staff'&&<EntityModal title="Add Platform Operator" subtitle="Limited platform role. No automatic tenant membership."
      onClose={()=>setEditor(null)} busy={busy}><form className="platform-form" onSubmit={e=>{void saveStaff(e)}}>
        <label>Staff name<input required minLength={2} maxLength={160} value={staffInput.name} onChange={e=>setStaffInput(v=>({...v,name:e.target.value}))}/></label>
        <label>Login email<input required type="email" maxLength={255} value={staffInput.email} onChange={e=>setStaffInput(v=>({...v,email:e.target.value}))}/></label>
        <label>Role<select value={staffInput.role} onChange={e=>setStaffInput(v=>({...v,role:e.target.value as 'Support Operator'|'Admin Manager'}))}>
          <option value="Support Operator">Support Operator · read only</option>
          <option value="Admin Manager">Admin Manager · can onboard Admins</option>
        </select></label>
        <label>Password (12+ complex characters)<input required type="password" minLength={12} autoComplete="new-password"
          value={staffInput.password} onChange={e=>setStaffInput(v=>({...v,password:e.target.value}))}/></label>
        <button disabled={busy} type="submit" className="list-create-button">{busy?'Saving…':'Create Platform Staff'}</button>
      </form></EntityModal>}
    {editor==='assignOwner' && ownerBusiness && <EntityModal title="Assign Admin Owner"
      subtitle={'Choose an existing active member of '+ownerBusiness.name+'. No tenant ID required.'}
      busy={busy} onClose={()=>setEditor(null)}>
      <form className="platform-form" onSubmit={e=>{void saveOwnerAssignment(e)}}>
        <p className="muted">This grants Admin Owner permissions for this business only. It does not give Platform authority.</p>
        <label>Existing business member
          <select required value={selectedOwnerEmail} onChange={e=>setSelectedOwnerEmail(e.target.value)}>
            <option value="">Select existing member</option>
            {ownerCandidates.map(m=><option key={m.email} value={m.email}>{m.name} — {m.email}</option>)}
          </select>
        </label>
        {ownerCandidates.length===0 && <p className="inline-alert">No active members available for this business.</p>}
        <button type="submit" className="list-create-button" disabled={busy||!selectedOwnerEmail}>
          {busy?'Assigning…':'Confirm Admin Owner'}
        </button>
      </form>
    </EntityModal>}
    {error&&<p role="alert" className="inline-alert">{error}</p>}
    {success&&<p role="status" className="inline-success">{success}</p>}
  </div>;
}
