import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ApiError, myTenantDeviceStatus, requestTenantDevice, tenantContext,
  type MyDeviceStatus, type TenantChoice } from './api';
import { AppIcon } from './AppIcon';

export function DevicePendingPanel({tenant,onApproved,onSignOut}:{
  tenant:TenantChoice;onApproved:(verified:TenantChoice)=>void;onSignOut:()=>void;
}) {
  const [status,setStatus]=useState<MyDeviceStatus|null>(null);
  const [label,setLabel]=useState('');
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [error,setError]=useState(false);
  const check=useCallback(async()=>{
    setBusy(true);setError(false);setMessage('');
    try{
      const latest=await myTenantDeviceStatus(tenant.ulid);setStatus(latest);
      if(latest.status==='approved'||!latest.required){
        const verified=await tenantContext(tenant.ulid);
        onApproved(verified);
      } else if(latest.status==='pending'){
        setMessage('Your device request is pending. Ask your Admin to approve it in Administration → Devices.');
      } else if(latest.status==='revoked'||latest.status==='rejected'){
        setMessage('Device '+latest.status+'. You can register a new browser device.');
      }
    }catch(ex){
      setError(true);setMessage(ex instanceof ApiError?ex.message:'Cannot verify device status.');
    }finally{setBusy(false)}
  },[tenant.ulid,onApproved]);
  useEffect(()=>{void check()},[check]);

  async function register(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy(true);setError(false);setMessage('');
    try{
      await requestTenantDevice(tenant.ulid,label.trim());
      setStatus(await myTenantDeviceStatus(tenant.ulid));
      setMessage('Request submitted. Your Admin must approve this device before any business records are accessible.');
    }catch(ex){
      setError(true);setMessage(ex instanceof ApiError?ex.message:'Unable to request device.');
    }finally{setBusy(false)}
  }
  return <section className="device-pending-panel">
    <div className="device-pending-icon"><AppIcon name="shield" size={32}/></div>
    <span className="small-overline">WORKSPACE SECURITY / DEVICE ENROLLMENT</span>
    <h1>Device approval required</h1>
    <p>This staff account belongs to <strong>{tenant.name}</strong>, but this browser installation must be approved by its Admin.</p>
    <div className="device-enrollment-state"><strong>Current device</strong>
      <span className={status?.status==='approved'?'master-state-active':'master-state-inactive'}>
        {status?.status||'Checking…'}</span>
      <small>{status?.device_name||'No registered device on this browser'}</small>
    </div>
    {status?.status!=='pending' && status?.status!=='approved' &&
      <form className="platform-form" onSubmit={e=>{void register(e)}}>
        <label>Device label
          <input required minLength={2} maxLength={100} value={label}
            placeholder="Counter 1 · Front desk laptop" onChange={e=>setLabel(e.target.value)}/>
        </label>
        <button type="submit" className="list-create-button" disabled={busy}>Request Admin approval</button>
      </form>}
    {message&&<p role={error?'alert':'status'} className={error?'inline-alert':'inline-success'}>{message}</p>}
    <div className="device-pending-actions">
      <button type="button" disabled={busy} onClick={()=>{void check()}}>Check approval status</button>
      <button type="button" disabled={busy} onClick={onSignOut}>Sign out</button>
    </div>
    <p className="muted">A device label and diagnostic request IP are logged. Your precise location is not collected. Do not approve unknown devices.</p>
  </section>;
}
