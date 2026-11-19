import {useCallback,useEffect,useState,type FormEvent} from 'react';
import {ApiError,getPlatformSession,platformLogin,platformLogout,transferPlatformIdentity,
  type PlatformSession} from './api';
import {PlatformPanel} from './PlatformPanel';
import {AppIcon} from './AppIcon';

type View='dashboard'|'businesses'|'staff'|'audit'|'security';

export function PlatformApp(){
  const [session,setSession]=useState<PlatformSession|null>(null);
  const [screen,setScreen]=useState<'loading'|'guest'|'ready'>('loading');
  const [email,setEmail]=useState(''),[password,setPassword]=useState('');
  const [error,setError]=useState(''),[busy,setBusy]=useState(false);
  const [view,setView]=useState<View>('dashboard');
  const [transfer,setTransfer]=useState({name:'',email:'',password:'',current_password:''});
  const [success,setSuccess]=useState('');
  const changePath=useCallback((next:View)=>{
    const urls:Record<View,string>={
      dashboard:'/platform',businesses:'/platform/businesses',staff:'/platform/staff',
      audit:'/platform/audit',security:'/platform/security',
    };
    window.history.pushState({},'',urls[next]);
    setView(next);setError('');
  },[]);
  useEffect(()=>{
    const read=()=>{
      const path=window.location.pathname;
      setView(path.startsWith('/platform/businesses')?'businesses':
        path.startsWith('/platform/staff')?'staff':
        path.startsWith('/platform/audit')?'audit':
        path.startsWith('/platform/security')?'security':'dashboard');
    };
    read();window.addEventListener('popstate',read);
    void getPlatformSession().then(p=>{
      if(p){setSession(p);setScreen('ready');}
      else setScreen('guest');
    }).catch(()=>setScreen('guest'));
    return()=>window.removeEventListener('popstate',read);
  },[]);
  async function signIn(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy(true);setError('');
    try{
      await platformLogin(email.trim(),password);
      const verified=await getPlatformSession();
      if(!verified)throw new Error('Platform identity could not be verified');
      setSession(verified);setPassword('');setScreen('ready');changePath('dashboard');
    }catch(ex){setError(ex instanceof ApiError?ex.message:'Unable to authenticate Platform.');}
    finally{setBusy(false);}
  }
  async function signOut(){
    setBusy(true);setError('');
    try{await platformLogout();setSession(null);setScreen('guest');
      window.history.replaceState({},'','/platform/login');}
    catch(ex){setError(ex instanceof ApiError?ex.message:'Platform sign out failed.');}
    finally{setBusy(false)}
  }
  async function separate(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    if(!window.confirm('Move ALL Platform Super Admin permissions to the new dedicated account? The current account keeps only its business membership.'))return;
    setBusy(true);setError('');setSuccess('');
    try{
      const result=await transferPlatformIdentity({...transfer,confirm:true});
      setTransfer({name:'',email:'',password:'',current_password:''});
      setSession(null);setScreen('guest');
      window.history.replaceState({},'','/platform/login');
      setSuccess('Platform authority moved to '+result.email+'. Sign in using your new separate Platform credentials.');
    }catch(ex){setError(ex instanceof ApiError?ex.message:'Identity transfer failed.');}
    finally{setBusy(false)}
  }
  if(screen==='loading')return <main className="platform-splash"><div className="skeleton-cell" style={{width:210,height:22}}/><p>Verifying Platform session…</p></main>;
  if(screen==='guest')return <main className="platform-login-layout">
    <section className="platform-login-brand"><div className="platform-logo">AH<span> POS</span></div>
      <span className="small-overline">VENDOR CONTROL PLANE</span>
      <h1>Platform operations, entirely separate from your stores.</h1>
      <p>Govern Admin businesses, security, platform operators and audit activity from one protected control center.</p>
      <div className="platform-login-features"><span>Separate authentication</span><span>Scoped access control</span><span>Tenant isolation</span></div>
    </section>
    <section className="platform-login-form"><div className="platform-auth-box">
      <div className="platform-auth-mark"><AppIcon name="shield" size={24}/></div>
      <span className="small-overline">SUPER ADMIN & PLATFORM OPERATORS</span>
      <h2>Sign in to Platform</h2><p>Use authorized Platform credentials, not a tenant employee login.</p>
      <form className="platform-form" onSubmit={e=>{void signIn(e)}}>
        <label>Platform email<input required type="email" value={email} autoComplete="username"
          onChange={e=>setEmail(e.target.value)}/></label>
        <label>Password<input required type="password" value={password} autoComplete="current-password"
          onChange={e=>setPassword(e.target.value)}/></label>
        <button type="submit" disabled={busy} className="list-create-button">
          {busy?'Verifying…':'Enter Platform'}
        </button>
      </form>
      {error&&<p role="alert" className="inline-alert">{error}</p>}
      {success&&<p role="status" className="inline-success">{success}</p>}
      <p className="platform-auth-footer">Business accounts log in through the separate AH-POS workspace application.</p>
    </div></section>
  </main>;

  const items:{id:View;label:string;icon:'dashboard'|'warehouse'|'people'|'shield'|'settings'}[]=[
    {id:'dashboard',label:'Overview',icon:'dashboard'},
    {id:'businesses',label:'Admin businesses',icon:'warehouse'},
    {id:'staff',label:'Platform operators',icon:'people'},
    {id:'audit',label:'Audit & compliance',icon:'shield'},
    {id:'security',label:'Platform security',icon:'settings'},
  ];
  const allowedItems=items.filter(i=>
    i.id==='security'||i.id==='dashboard'||
    (i.id==='businesses'&&session?.permissions.includes('platform.admins.read'))||
    (i.id==='staff'&&session?.permissions.includes('platform.staff.read'))||
    (i.id==='audit'&&session?.permissions.includes('platform.audit.read'))
  );
  return <div className="platform-app-frame">
    <aside className="platform-sidebar">
      <div className="platform-sidebar-brand"><div className="platform-logo">AH<span> POS</span></div>
        <span>PLATFORM CONTROL</span></div>
      <div className="platform-sidebar-caption">CONTROL CENTER</div>
      <nav aria-label="Platform management">
        {allowedItems.map(i=><button type="button" key={i.id}
          className={view===i.id?'selected':''} aria-current={view===i.id?'page':undefined}
          onClick={()=>changePath(i.id)}><AppIcon name={i.icon} size={18}/>{i.label}</button>)}
      </nav>
      <div className="platform-sidebar-bottom">
        <div className="platform-account"><span>{session?.name.slice(0,1).toUpperCase()}</span>
          <div><strong>{session?.name}</strong><small>Platform session</small></div></div>
        <button type="button" onClick={()=>{void signOut()}} disabled={busy}>
          <AppIcon name="logout" size={17}/> Sign out
        </button>
      </div>
    </aside>
    <main className="platform-app-main">
      <header className="platform-app-toolbar"><div><span>AH POS / PLATFORM</span>
        <strong>{items.find(i=>i.id===view)?.label}</strong></div>
        <div className="platform-control-indicator"><AppIcon name="shield" size={15}/> Vendor control plane</div>
      </header>
      <div className="platform-main-scroller">
        {view==='security'?<section className="platform-security-page">
          <span className="small-overline">SECURITY / IDENTITY SEPARATION</span>
          <h1>Dedicated Platform Super Admin identity</h1>
          <p>For the initial local setup, the original Ali tenant account was also granted Platform access. Transfer that privilege to a dedicated Platform-only account, without changing Ali's business data or tenant memberships. This is a one-time security handover.</p>
          {session?.permissions.includes('platform.staff.manage')?
          <form className="platform-form" onSubmit={e=>{void separate(e)}}>
            <label>New Platform Super Admin display name<input required minLength={2} maxLength={160}
              value={transfer.name} onChange={e=>setTransfer(v=>({...v,name:e.target.value}))}/></label>
            <label>New dedicated email<input required type="email" autoComplete="off"
              value={transfer.email} onChange={e=>setTransfer(v=>({...v,email:e.target.value}))}/></label>
            <label>New strong password<input required minLength={12} type="password" autoComplete="new-password"
              value={transfer.password} onChange={e=>setTransfer(v=>({...v,password:e.target.value}))}/></label>
            <label>Current Platform password (confirm authority)<input required type="password" autoComplete="current-password"
              value={transfer.current_password} onChange={e=>setTransfer(v=>({...v,current_password:e.target.value}))}/></label>
            <button type="submit" disabled={busy} className="list-create-button">Transfer Platform authority to dedicated identity</button>
          </form>:<p className="inline-alert">Only authorized Platform Super Admin operators may transfer ownership.</p>}
          {error&&<p className="inline-alert" role="alert">{error}</p>}
        </section>:<PlatformPanel session={session!} onSignOut={()=>{void signOut()}}
          initialTab={view==='staff'?'staff':view==='audit'?'audit':'admins'}
          focus={view==='dashboard'?'overview':'register'}/>}
      </div>
    </main>
  </div>;
}
