import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  ApiError, createTenantStaff, decideTenantDevice, listTenantDevices,
  listTenantRoleTemplates, listTenantStaff, setTenantStaffStatus,
  type TenantChoice, type TenantDevice, type TenantRoleTemplate,
  type TenantStaffRoleName, type TenantStaffRow,
} from './api';
import { AppIcon } from './AppIcon';
import { EntityModal, TableSkeleton } from './EntityModal';

export function StaffSecurityPanel({tenant, initialTab='staff'}:{
  tenant:TenantChoice;initialTab?:'staff'|'devices'|'roles';
}) {
  const [tab,setTab] = useState<'staff'|'devices'|'roles'>(initialTab);
  const [staff,setStaff] = useState<TenantStaffRow[]>([]);
  const [devices,setDevices] = useState<TenantDevice[]>([]);
  const [templates,setTemplates] = useState<TenantRoleTemplate[]>([]);
  const [busy,setBusy] = useState(false);
  const [loading,setLoading] = useState(true);
  const [editor,setEditor] = useState(false);
  const [message,setMessage] = useState('');
  const [error,setError] = useState(false);
  const [form,setForm] = useState({
    name:'',email:'',password:'',role:'Cashier' as TenantStaffRoleName,
  });

  const load=useCallback(async()=>{
    setLoading(true);
    const results=await Promise.allSettled([
      listTenantStaff(tenant.ulid), listTenantDevices(tenant.ulid),
      listTenantRoleTemplates(tenant.ulid),
    ]);
    if(results[0].status==='fulfilled')setStaff(results[0].value);
    if(results[1].status==='fulfilled')setDevices(results[1].value);
    if(results[2].status==='fulfilled')setTemplates(results[2].value);
    if(results.some(x=>x.status==='rejected')){
      setMessage('Some staff/security data unavailable. Admin Owner permissions may be required.');
      setError(true);
    }
    setLoading(false);
  },[tenant.ulid]);
  useEffect(()=>{void load()},[load]);

  async function create(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setMessage('');setError(false);
    try{
      const created=await createTenantStaff(tenant.ulid,form);
      setEditor(false);setForm({name:'',email:'',password:'',role:'Cashier'});
      setMessage('Staff member '+created.name+' created. Device must be approved before tenant access.');
      await load();
    }catch(ex){setError(true);setMessage(ex instanceof ApiError?ex.message:'Staff creation failed.');}
    finally{setBusy(false)}
  }
  async function toggleStatus(row:TenantStaffRow){
    const next=row.status==='active'?'suspended':'active';
    if(!window.confirm((next==='suspended'?'Suspend ':'Reactivate ')+row.name+'?'))return;
    setBusy(true);setError(false);setMessage('');
    try{
      await setTenantStaffStatus(tenant.ulid,row.email,next);
      setMessage(row.name+' '+next+'. Previously approved devices are revoked on suspension.');
      await load();
    }catch(ex){setError(true);setMessage(ex instanceof ApiError?ex.message:'Unable to change staff status.');}
    finally{setBusy(false)}
  }
  async function decide(row:TenantDevice,decision:'approve'|'reject'|'revoke'){
    if(!window.confirm((decision==='approve'?'Approve ':decision==='reject'?'Reject ':'Revoke ')+
      row.device_name+' for '+row.staff_name+'?'))return;
    setBusy(true);setMessage('');setError(false);
    try{
      await decideTenantDevice(tenant.ulid,row.ulid,decision);
      setMessage('Device '+decision+' completed for '+row.staff_name+'.');
      await load();
    }catch(ex){setError(true);setMessage(ex instanceof ApiError?ex.message:'Device decision failed.');}
    finally{setBusy(false)}
  }

  return <div className="staff-security-workspace">
    <div className="security-hero"><div>
      <span className="small-overline">ADMINISTRATION / ACCESS CONTROL</span>
      <h2>Team & Device Security</h2>
      <p>Tenant-owned employee roles and approved browser installations. Platform operators are managed separately.</p>
    </div><span className="status-tag">Workspace · {tenant.name}</span></div>
    <div className="security-stats">
      <div><span>Team members</span><strong>{staff.length}</strong></div>
      <div><span>Pending devices</span><strong>{devices.filter(d=>d.status==='pending').length}</strong></div>
      <div><span>Approved devices</span><strong>{devices.filter(d=>d.status==='approved').length}</strong></div>
    </div>
    <div className="platform-tabs" role="tablist">
      {([{id:'staff',name:'Staff directory'}, {id:'roles',name:'Role templates'},
        {id:'devices',name:'Device approvals'}] as const).map(x=><button key={x.id}
        type="button" role="tab" aria-selected={tab===x.id} className={tab===x.id?'selected':''}
        onClick={()=>setTab(x.id)}>{x.name}</button>)}
    </div>
    {tab==='staff'&&<section className="panel-card">
      <div className="panel-heading"><div><span className="small-overline">ACCESS & SECURITY</span><h2>Users & Staff</h2></div>
        <button className="list-create-button" type="button" onClick={()=>setEditor(true)}>+ Add Staff</button></div>
      <div className="table-scroll"><table className="data-table">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Device policy</th><th>Actions</th></tr></thead>
        <tbody>{staff.map(row=><tr key={row.email}><td>{row.name}</td><td>{row.email}</td>
          <td>{row.role||'Unassigned'}</td><td><span className={row.status==='active'?'master-state-active':'master-state-inactive'}>{row.status}</span></td>
          <td>{row.requires_device_approval?'Approval required':'Legacy/Owner exempt'}</td>
          <td>{row.role!=='Admin Owner'&&<button type="button" disabled={busy} className="btn-ghost"
            onClick={()=>{void toggleStatus(row)}}>{row.status==='active'?'Suspend':'Reactivate'}</button>}</td>
        </tr>)}</tbody></table></div>
      {loading&&<TableSkeleton rows={5} cols={6}/>}
    </section>}
    {tab==='roles'&&<section className="panel-card">
      <div className="panel-heading"><div><span className="small-overline">SERVER-DEFINED PERMISSIONS</span><h2>Staff Role Templates</h2></div></div>
      <div className="role-template-grid">{templates.map(t=><div key={t.name} className="role-template-card">
        <strong>{t.name}</strong><span>{t.permissions.length} allowed actions</span>
        <div>{t.permissions.map(p=><span key={p}>{p}</span>)}</div>
      </div>)}</div>
      <p className="muted">Staff cannot edit or assign their own permissions. Custom role editing and delegated role changes remain future enhancements.</p>
    </section>}
    {tab==='devices'&&<section className="panel-card">
      <div className="panel-heading"><div><span className="small-overline">ADMIN REVIEW REQUIRED</span><h2>Registered Staff Devices</h2></div>
        <span className="count-pill">{devices.length} requests</span></div>
      <div className="table-scroll"><table className="data-table">
        <thead><tr><th>Device</th><th>Staff</th><th>Request IP</th><th>Requested</th><th>Status</th><th>Decision</th></tr></thead>
        <tbody>{devices.map(d=><tr key={d.ulid}><td><strong>{d.device_name}</strong></td>
          <td>{d.staff_name}<small className="device-staff-email">{d.staff_email}</small></td>
          <td>{d.requested_ip||'Not available'}</td>
          <td>{new Date(d.created_at).toLocaleString()}</td>
          <td><span className={d.status==='approved'?'master-state-active':'master-state-inactive'}>{d.status}</span></td>
          <td><div className="dense-actions">{d.status==='pending'&&<>
            <button type="button" disabled={busy} className="btn-ghost" onClick={()=>{void decide(d,'approve')}}>Approve</button>
            <button type="button" disabled={busy} className="btn-ghost" onClick={()=>{void decide(d,'reject')}}>Reject</button>
          </>}{d.status==='approved'&&<button type="button" disabled={busy} className="btn-ghost"
            onClick={()=>{void decide(d,'revoke')}}>Revoke</button>}</div></td>
        </tr>)}</tbody></table></div>
      {loading&&<TableSkeleton rows={5} cols={6}/>}
      {!loading&&devices.length===0&&<p className="empty-copy">No device approvals requested yet.</p>}
      <p className="pos-warning">Request IP is diagnostic only—not accurate GPS proof. A copied browser token is not hardware attestation; stronger hardware-backed device trust is a production gate.</p>
    </section>}
    {editor&&<EntityModal title="Create Staff Account" subtitle="This employee gets a tenant-only role and requires Admin device approval."
      busy={busy} onClose={()=>setEditor(false)}><form className="platform-form" onSubmit={e=>{void create(e)}}>
        <label>Full name<input required minLength={2} maxLength={160} value={form.name} onChange={e=>setForm(v=>({...v,name:e.target.value}))}/></label>
        <label>Work email<input required type="email" value={form.email} onChange={e=>setForm(v=>({...v,email:e.target.value}))}/></label>
        <label>Staff role<select value={form.role} onChange={e=>setForm(v=>({...v,role:e.target.value as TenantStaffRoleName}))}>
          {(['Cashier','Purchaser','Inventory Clerk','Manager'] as const).map(role=><option key={role} value={role}>{role}</option>)}
        </select></label>
        <label>Temporary password (12+ complex characters)
          <input required type="password" autoComplete="new-password" minLength={12}
            value={form.password} onChange={e=>setForm(v=>({...v,password:e.target.value}))}/>
        </label>
        <p className="muted">No new staff device will access business data until this Admin approves its pending request.</p>
        <button type="submit" className="list-create-button" disabled={busy}>{busy?'Creating…':'Create Staff Account'}</button>
      </form></EntityModal>}
    {message&&<p role={error?'alert':'status'} className={error?'inline-alert':'inline-success'}>{message}</p>}
  </div>;
}
