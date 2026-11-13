/* ============ app shell ============ */
const VIEWS={overview:Overview,dashboard:Dashboard,'live-map':LiveMap,patrols:Patrols,incidents:Incidents,'iweni-lmma':Lmma,projects:Projects,coral:Coral,staff:Staff,bmus:Bmus,partners:Partners,boats:Boats,tourism:Tourism,finance:Finance,reports:Reports,permissions:Permissions,audit:Audit};
const modFromHash=()=>{const h=(location.hash||'').replace('#','');return MODS.some(m=>m.id===h)?h:(h===''?'overview':'dashboard');};
const useWidth=()=>{const [w,setW]=useState(window.innerWidth);useEffect(()=>{const f=()=>setW(window.innerWidth);window.addEventListener('resize',f);return()=>window.removeEventListener('resize',f);},[]);return w;};

const Logo=({s=34})=>html`<svg width=${s} height=${s} viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="10" fill="var(--brand)"/><path d="M6 24c4-5 7-5 10 0s6 5 9 0 6-5 9 0" fill="none" stroke="var(--on-brand)" strokeWidth="2.6" strokeLinecap="round"/><path d="M6 17c4-5 7-5 10 0s6 5 9 0 6-5 9 0" fill="none" stroke="var(--on-brand)" strokeWidth="2.6" strokeLinecap="round" opacity=".55"/><circle cx="29" cy="11" r="3" fill="var(--on-brand)"/></svg>`;

const Login=({onIn})=>{
 const [sel,setSel]=useState('admin');
 return html`<div className="login"><div className="login-brand"><${Logo} s=${44}/><h1>POps</h1><p className="lead">One platform. All conservation operations.</p><p className="muted2">Patte Conservation CBO · Pate Island, Lamu County, Kenya</p>
 <ul className="ticks light"><li>One login for rangers, officers, finance and the Board</li><li>Each person sees only what their role allows</li><li>Works offline at sea and syncs when signal returns</li></ul></div>
 <form className="login-card" onSubmit=${e=>{e.preventDefault();onIn(sel);}}><h2>Sign in</h2><p className="muted small">Demo build. Pick an account to explore. No real password is checked.</p>
 <div className="field"><label htmlFor="em">Email</label><input id="em" type="email" defaultValue="demo@pops.example" autoComplete="off"/></div>
 <div className="field"><label htmlFor="pw">Password</label><input id="pw" type="password" defaultValue="demo-password"/></div>
 <div className="field"><label htmlFor="ac">Sign in as</label><select id="ac" value=${sel} onChange=${e=>setSel(e.target.value)}>${Object.keys(ROLES).map(k=>html`<option key=${k} value=${k}>${ROLES[k].label} · ${ROLES[k].user}</option>`)}</select></div>
 <button type="submit" className="btn primary full">Sign in</button><p className="muted small">Two-factor sign-in is optional per user in the live system.</p></form></div>`;
};
const Toasts=({toasts})=>html`<div className="toasts" role="status" aria-live="polite">${toasts.map(t=>html`<div key=${t.id} className="toast"><${Icon} n="check" s=${16}/>${t.msg}</div>`)}</div>`;

const App=()=>{
 const [inn,setIn]=useState(true);
 const [role,setRoleS]=useState('admin');const [bmuId,setBmuId]=useState('pate');
 const [h,setH]=useState(location.hash);
 const mod=(()=>{const x=h.replace('#','');return MODS.some(m=>m.id===x)?x:(x===''||x==='field'?(role==='admin'?'overview':'dashboard'):'dashboard');})();
 const [settings,setSettings]=useState({bmuDl:true,fishDl:false,piiBmu:false});
 const [assign,setAssign]=useState(ASSIGN0);
 const [patrols,setPatrols]=useState(PATROLS0);const [incidents,setIncidents]=useState(INC0);
 const [fin,setFin]=useState(FIN0);const [tour,setTour]=useState(TOUR0);
 const [audit,setAudit]=useState(AUDIT0);const [vl,setVl]=useState([2,4,11]);
 const [projOpen,setProjOpen]=useState(null);
 const [toasts,setToasts]=useState([]);const [nav,setNav]=useState(false);const [notif,setNotif]=useState(false);const [tip,setTip]=useState(true);
 const [installEv,setInstallEv]=useState(!!window.__pwaPrompt);
 const vw=useWidth();
 const user=role==='bmu'?(BMUS.find(b=>b.id===bmuId)||{}).rep:ROLES[role].user;
 const go=id=>{try{location.hash=id;}catch(e){}setH('#'+id);setNav(false);setNotif(false);window.scrollTo(0,0);};
 const setRole=r=>{setRoleS(r);setProjOpen(null);setNotif(false);if(!ROLES[r].mods[mod])go('dashboard');};
 const can=m=>ROLES[role].mods[m]||null;
 const log=(a,m,r)=>setAudit(x=>[[stamp(),user,a,m,r],...x]);
 const toast=msg=>{const id=Date.now()+Math.random();setToasts(t=>[...t,{id,msg}]);setTimeout(()=>setToasts(t=>t.filter(k=>k.id!==id)),4200);};
 const fs=useFieldStore({setPatrols,setIncidents,log,toast});
 const signOut=()=>{lsSet('queue',[]);setIn(false);};
 useEffect(()=>{const f=()=>setH(location.hash);window.addEventListener('hashchange',f);const p=()=>setInstallEv(!!window.__pwaPrompt);window.addEventListener('pwa-ready',p);return()=>{window.removeEventListener('hashchange',f);window.removeEventListener('pwa-ready',p);};},[]);
 useEffect(()=>{if(h==='#field'&&role!=='ranger')setRoleS('ranger');},[h]);
 useEffect(()=>{if(window.POPS_PWA&&'serviceWorker' in navigator&&/^https?:/.test(location.protocol)){navigator.serviceWorker.register('sw.js').catch(()=>{});}},[]);
 const standalone=!!(window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches)||!!navigator.standalone;
 const pwa=window.POPS_PWA?{canInstall:installEv&&!standalone,standalone,ios:/iphone|ipad|ipod/i.test(navigator.userAgent),install:async()=>{const e=window.__pwaPrompt;if(!e)return;e.prompt();try{await e.userChoice;}catch(x){}window.__pwaPrompt=null;setInstallEv(false);}}:null;
 const ctx={role,setRole,bmuId,user,go,can,log,toast,settings,setSettings,assign,setAssign,patrols,setPatrols,incidents,setIncidents,fin,setFin,tour,setTour,audit,vl,setVl,projOpen,setProjOpen,fs,pwa,signOut};
 const dark=()=>{const a=document.documentElement.getAttribute('data-theme');return a==='dark'||(a!=='light'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);};
 const [,force]=useState(0);
 const theme=()=>{document.documentElement.setAttribute('data-theme',dark()?'light':'dark');force(n=>n+1);};
 if(!inn)return html`<${Login} onIn=${r=>{setRoleS(r);setIn(true);go(r==='admin'?'overview':'dashboard');}}/>`;
 if(role==='ranger'&&(h==='#field'||vw<=720))return html`<${Ctx.Provider} value=${ctx}><${FieldShell}/><${Toasts} toasts=${toasts}/></${Ctx.Provider}>`;
 const View=VIEWS[mod];const m=MODS.find(x=>x.id===mod);
 const groups=[];MODS.forEach(x=>{let g=groups.find(k=>k[0]===x.group);if(!g){g=[x.group,[]];groups.push(g);}g[1].push(x);});
 return html`<${Ctx.Provider} value=${ctx}><div className="app">
 ${nav&&html`<div className="scrim" onClick=${()=>setNav(false)}/>`}
 <aside className=${'side '+(nav?'open':'')} aria-label="Main navigation">
  <div className="brand"><${Logo}/><div><strong>POps</strong><small>Patte Operations Platform</small></div></div>
  <nav>${groups.map(g=>html`<div key=${g[0]} className="ngroup"><h3>${g[0]}</h3>${g[1].map(x=>html`<button key=${x.id} title=${x.label} className=${'nitem '+(mod===x.id?'on ':'')+(can(x.id)?'':'locked')} onClick=${()=>{if(x.id==='projects')setProjOpen(null);go(x.id);}} aria-current=${mod===x.id?'page':null}><${Icon} n=${x.icon} s=${18}/><span>${x.label}</span>${!can(x.id)&&html`<${Icon} n="lock" s=${13}/>`}</button>`)}</div>`)}</nav>
  <div className="sidefoot"><div className="me"><span className="av">${ROLES[role].ini}</span><div><strong>${user}</strong><small>${ROLES[role].label}</small></div></div><button className="nitem" title="Sign out" onClick=${signOut}><${Icon} n="out" s=${18}/><span>Sign out</span></button></div>
 </aside>
 <div className="main">
  <header className="top"><button className="iconbtn menu" aria-label="Open menu" onClick=${()=>setNav(true)}><${Icon} n="menu"/></button>
   <div className="viewas"><label htmlFor="viewas">Demo: view as</label><select id="viewas" value=${role} onChange=${e=>setRole(e.target.value)}>${Object.keys(ROLES).map(k=>html`<option key=${k} value=${k}>${ROLES[k].label}</option>`)}</select>
   ${role==='bmu'&&html`<select aria-label="BMU" value=${bmuId} onChange=${e=>setBmuId(e.target.value)}>${BMUS.map(b=>html`<option key=${b.id} value=${b.id}>${b.name}</option>`)}</select>`}</div>
   <div className="topr">${pwa&&pwa.canInstall&&html`<button className="btn small primary" onClick=${pwa.install}><${Icon} n="download" s=${15}/>Install app</button>`}<span className="chip info demo"><i/>Demo · sample data</span>
   <div className="notifwrap"><button className="iconbtn" aria-label="Notifications" aria-expanded=${notif} onClick=${()=>setNotif(o=>!o)}><${Icon} n="bell"/><b className="dotn">${(NOTES[role]||[]).length}</b></button>${notif&&html`<div className="pop" role="menu"><h4>Notifications</h4><ul>${(NOTES[role]||[]).map(n=>html`<li key=${n}>${n}</li>`)}</ul><small>Alerts follow your permissions.</small></div>`}</div>
   <button className="iconbtn" aria-label="Switch light or dark theme" onClick=${theme}><${Icon} n=${dark()?'sun':'moon'}/></button></div></header>
  ${tip&&mod!=='overview'&&html`<div className="tipbar"><span><strong>Exploring the demo.</strong> Use <em>View as</em> to switch role and watch the menus, data and buttons change. Everything you do is recorded in the Audit Trail.</span><button className="iconbtn" aria-label="Dismiss" onClick=${()=>setTip(false)}><${Icon} n="x" s=${16}/></button></div>`}
  <main id="content">${can(mod)?html`<${View} key=${role+bmuId+mod}/>`:html`<div key=${role+mod}><${PageHead} title=${m.label} sub=${m.fn}/><${Denied} mod=${m.label} role=${role}/></div>`}</main>
  <footer className="foot">POps demo build · All names, figures and locations except the Iweni coordinates are sample data · Fisheries monitoring is intentionally not included</footer>
 </div>
 <${Toasts} toasts=${toasts}/>
 </div></${Ctx.Provider}>`;
};
ReactDOM.createRoot(document.getElementById('root')).render(html`<${App}/>`);
