/* ============ vessel log, engine hours and service alerts ============
   The log follows the paper "Vessel Log" sheet: Date, Departure time, From, To, Arrival time,
   Activity/Comments, Engine hours (one column per engine), Refuel (litres), Name.            */
const TODAY=new Date(2026,10,13);
const MONS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmtD=d=>d.getDate()+' '+MONS[d.getMonth()]+' '+d.getFullYear();
const isoD=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const paperD=iso=>{const a=iso.split('-');return (+a[2])+'-'+(+a[1])+'-'+a[0];};
const toH=t=>{const a=String(t).split(':');return (+a[0])+(+a[1]||0)/60;};
const addMonths=(d,m)=>{const x=new Date(d);x.setMonth(x.getMonth()+m);return x;};
const weekStart=iso=>{const d=new Date(iso+'T12:00:00');d.setDate(d.getDate()-d.getDay());return isoD(d);};
const weekLabel=ws=>{const a=new Date(ws+'T12:00:00'),b=new Date(a);b.setDate(b.getDate()+6);return a.getDate()+' '+MONS[a.getMonth()]+' to '+fmtD(b);};
const r1=n=>Math.round(n*10)/10;

/* status of one engine against its service settings (hours or months, whichever comes first) */
const engSt=e=>{
 const since=r1(e.hrs-e.svcAt),left=r1(e.intervalH-since),due=addMonths(e.svcDate,e.intervalM),days=Math.round((due-TODAY)/864e5);
 let s='ok',why='';
 if(left<=0){s='over';why=since+' of '+e.intervalH+' h since the last service';}
 else if(days<=0){s='over';why='service date passed on '+fmtD(due);}
 else if(left<=e.warnH){s='soon';why='due in '+left+' h ('+since+' of '+e.intervalH+' h since the last service)';}
 else if(days<=e.warnD){s='soon';why='due on '+fmtD(due)+' ('+days+' days)';}
 return {since,left,due,days,s,why,pct:Math.max(0,Math.min(100,Math.round(since/e.intervalH*100)))};
};
const svcAlerts=(fleet,only)=>{const o=[];Object.keys(fleet).forEach(b=>{if(only&&!only.includes(b))return;fleet[b].engines.forEach(e=>{const s=engSt(e);if(s.s!=='ok')o.push({key:b+'|'+e.id+'|'+s.s,boat:b,s:s.s,text:b+', '+e.label+': '+(s.s==='over'?'service overdue, ':'service ')+s.why});});});return o;};
const SVC_CHIP={ok:['Service OK','good'],soon:['Service due soon','warn'],over:['Service overdue','crit']};

/* ---- sample fleet and log. The Nguru rows are the client's own log entries; engine meters, service and refuel are sample values. ---- */
const FLEET0={};const VLOG0=[];
(()=>{
 const E=(id,label,spec,hrs,svcAt,svcDate,iH,iM,wH,wD)=>({id,label,spec,serial:'S/N to be entered',hrs,svcAt,svcDate,intervalH:iH,intervalM:iM,warnH:wH,warnD:wD});
 const R=(id,date,dep,from,to,arr,note)=>({id,boat:'Nguru',date,dep,from,to,arr,note,m:{},fuel:'',by:'RL'});
 const rows=[R('L1','2026-11-01','11:30','Manda Bay','Tauzi','11:40','Check for collection site corals of opportunity'),R('L2','2026-11-01','12:15','Chongoni','Manda Bay','12:25',''),R('L3','2026-11-01','14:30','Manda Bay','Manda Toto','14:45','Visit rangers camp at Manda Toto'),R('L4','2026-11-01','15:15','Manda Toto','Manda Bay','15:30',''),R('L5','2026-11-02','','','','','Nguru out for maintenance'),R('L6','2026-11-04','','','','','Nguru back in the water'),R('L7','2026-11-05','07:30','Manda Bay','Iweni','08:10','Check on reefstar sites and nursery structures. Make to-do'),R('L8','2026-11-05','09:30','Iweni','Manda Bay','10:00','')];
 let m1=238.4,m2=242.0,s1=0,s2=0;
 rows.forEach(r=>{if(r.dep){const h=toH(r.arr)-toH(r.dep);m1=r1(m1+h);m2=r1(m2+h);r.m={E1:m1,E2:m2};}if(r.id==='L4'){s1=m1;s2=m2;}VLOG0.push(r);});
 const sd=new Date(2026,10,2);
 FLEET0['Nguru']={engines:[E('E1','Engine 1 (port)','Outboard 40 HP',m1,s1,sd,100,6,20,14),E('E2','Engine 2 (starboard)','Outboard 40 HP',m2,s2,sd,100,6,20,14)],
  svc:[{date:sd,eng:'Engine 1 (port)',meter:s1,work:'Full service',cost:null,by:'RL'},{date:sd,eng:'Engine 2 (starboard)',meter:s2,work:'Full service',cost:null,by:'RL'}]};
 FLEET0['MV Mlinzi']={engines:[E('E1','Engine','Outboard 60 HP',512.3,427.5,new Date(2026,9,22),100,6,20,14)],svc:[{date:new Date(2026,9,22),eng:'Engine',meter:427.5,work:'Oil and filter change',cost:4800,by:'Said Famau'}]};
 FLEET0['Jahazi Bahari']={engines:[E('E1','Engine','Outboard 40 HP',301.2,198.0,new Date(2026,7,4),100,6,20,14)],svc:[{date:new Date(2026,7,4),eng:'Engine',meter:198.0,work:'Full service',cost:7200,by:'Famau Said'}]};
 FLEET0['Kipepeo']={engines:[E('E1','Engine','Outboard 15 HP',188.0,120.0,new Date(2026,8,18),100,6,20,14)],svc:[{date:new Date(2026,8,18),eng:'Engine',meter:120.0,work:'Oil change',cost:2600,by:'Unassigned'}]};
 BOATS.unshift({name:'Nguru',reg:'To be entered',engine:'Twin outboards, 40 HP each',cox:'Said Famau',status:'In service',service:'02 Nov 2026',fuel:'—',trip:'Coral restoration sites',defect:'None open',cost:0});
})();

/* ---- the paper log ---- */
const VesselLog=({boat,eng,rows,ws})=>{
 const list=[...rows];while(list.length<10)list.push(null);
 const prev=id=>Math.max(0,...VLOG_ALL.filter(r=>r.boat===boat&&r.date<ws&&r.m&&r.m[id]!=null).map(r=>r.m[id]));
 const run=id=>{const cur=rows.filter(r=>r.m&&r.m[id]!=null).map(r=>r.m[id]);if(!cur.length)return null;const p=prev(id);return p?r1(Math.max(...cur)-p):r1(rows.reduce((a,r)=>a+(r.dep&&r.arr?Math.max(0,toH(r.arr)-toH(r.dep)):0),0));};
 const fuel=rows.reduce((a,r)=>a+(+r.fuel||0),0);
 return html`<div className="paper land" data-doc="vessel"><div className="pp-vh"><b>Vessel Log ${boat.toUpperCase()}</b><span>Week: ${weekLabel(ws)}</span></div>
 <div className="pp-scroll"><table className="pp-t"><thead><tr><th>Date</th><th>Departure time</th><th>From</th><th>To</th><th>Arrival time</th><th>Activity / Comments</th>${eng.map(e=>html`<th key=${e.id}>${eng.length>1?e.label.split(' (')[0]+' hours':'Engine hours'}</th>`)}<th>Refuel (litres)</th><th>Name</th></tr></thead>
 <tbody>${list.map((r,i)=>html`<tr key=${i}>${r?[html`<td key="d">${paperD(r.date)}</td>`,html`<td key="a">${r.dep}</td>`,html`<td key="b">${r.from}</td>`,html`<td key="c">${r.to}</td>`,html`<td key="e">${r.arr}</td>`,html`<td key="f">${r.note}</td>`,...eng.map(e=>html`<td key=${e.id}>${r.m&&r.m[e.id]!=null?r.m[e.id].toFixed(1):''}</td>`),html`<td key="g">${r.fuel}</td>`,html`<td key="h">${r.by}</td>`]:Array.from({length:9+eng.length-1}).map((_,k)=>html`<td key=${k}/>`)}</tr>`)}</tbody>
 <tfoot><tr><td colSpan="6">Hours run this week</td>${eng.map(e=>html`<td key=${e.id}>${run(e.id)==null?'':run(e.id).toFixed(1)}</td>`)}<td>${fuel||''}</td><td/></tr></tfoot></table></div><div className="pp-foot">Generated by POps from the vessel log. Layout follows the paper Vessel Log sheet.</div></div>`;
};
let VLOG_ALL=[];

const EngineCard=({e,write,admin,onSvc,onCfg})=>{
 const s=engSt(e);const c=SVC_CHIP[s.s];
 return html`<${Card} title=${e.label} sub=${e.spec+' · '+e.serial} right=${html`<${Chip} t=${c[0]} tone=${c[1]}/>`}>
 <div className="eng-big"><div><b>${e.hrs.toFixed(1)}</b><span>Total run hours (hour meter)</span></div><div><b>${s.since.toFixed(1)}</b><span>Run hours since last service</span></div><div><b>${Math.max(0,s.left).toFixed(1)}</b><span>Hours left until service</span></div></div>
 <div className=${'eng-bar '+c[1]} role="progressbar" aria-valuenow=${s.pct} aria-valuemin="0" aria-valuemax="100" aria-label=${e.label+': '+s.pct+' percent of the service interval used'}><i style=${{width:s.pct+'%'}}/><u title="Alert starts here" style=${{left:Math.max(0,Math.round((1-e.warnH/e.intervalH)*100))+'%'}}/></div>
 <p className="muted small">Service every ${e.intervalH} h or ${e.intervalM} months, whichever comes first. Last service ${fmtD(e.svcDate)} at ${e.svcAt.toFixed(1)} h. Next by date: ${fmtD(s.due)} (${s.days} days). Alert ${e.warnH} h or ${e.warnD} days before.</p>
 ${s.s!=='ok'&&html`<${Notice} tone=${s.s==='over'?'crit':'warn'} title=${s.s==='over'?'Service overdue':'Service due soon'}>${s.why}. The Coxswain and the Super Admin have been alerted.</${Notice}>`}
 <div className="btnrow">${write&&html`<${Btn} kind="small primary" icon="check" onClick=${()=>onSvc(e)}>Record service</${Btn}>`}${admin&&html`<${Btn} kind="small" icon="gear" onClick=${()=>onCfg(e)}>Service settings</${Btn}>`}</div></${Card}>`;
};

const Boats=()=>{
 const {role,can,log,toast,fleet,setFleet,vlog,setVlog}=useApp();
 VLOG_ALL=vlog;
 const me=ROLES[role].user;const pwa=!!window.POPS_PWA;
 const boats=role==='cox'?BOATS.filter(b=>b.cox===me):BOATS;
 const write=can('boats')==='w'||can('boats')==='s';const admin=role==='admin';
 const [boat,setBoat]=useState(boats[0]?boats[0].name:'Nguru');
 const fb=fleet[boat];const eng=fb.engines;
 const mine=vlog.filter(r=>r.boat===boat);
 const weeks=[...new Set(mine.map(r=>weekStart(r.date)))].sort().reverse();
 const [wk,setWk]=useState('');const ws=weeks.includes(wk)?wk:(weeks[0]||weekStart(isoD(TODAY)));
 const rows=mine.filter(r=>weekStart(r.date)===ws).sort((a,b)=>(a.date+a.dep).localeCompare(b.date+b.dep));
 const host=useRef(null);
 const [mk,setMk]=useState(false);const blank=()=>({date:isoD(TODAY),dep:'',from:'',to:'',arr:'',note:'',m:{},fuel:'',by:ROLES[role].ini||'',def:''});const [f,setF]=useState(blank);
 const [sv,setSv]=useState(null);const [svf,setSvf]=useState({date:isoD(TODAY),meter:'',work:'Full service',cost:'',by:me});
 const [cf,setCf]=useState(null);
 const al=svcAlerts(fleet,boats.map(b=>b.name));
 const upd=(b,fn)=>setFleet(x=>({...x,[b]:fn(x[b])}));
 const save=()=>{
  const rm={};let bad=null;
  eng.forEach(e=>{let v=f.m[e.id];if(v===''||v==null){v=(f.dep&&f.arr)?r1(e.hrs+Math.max(0,toH(f.arr)-toH(f.dep))):null;}else{v=+v;if(v<e.hrs)bad=e;}rm[e.id]=v;});
  if(bad){toast(bad.label+': the hour meter cannot be lower than the last reading, '+bad.hrs.toFixed(1)+' h');return;}
  const nf={...fleet,[boat]:{...fb,engines:eng.map(e=>({...e,hrs:rm[e.id]!=null?Math.max(e.hrs,rm[e.id]):e.hrs}))}};
  const before=svcAlerts(fleet).map(a=>a.key);const fresh=svcAlerts(nf).filter(a=>!before.includes(a.key));
  setFleet(nf);setVlog(l=>[...l,{id:'L'+Date.now(),boat,date:f.date,dep:f.dep,from:f.from,to:f.to,arr:f.arr,note:f.note,m:rm,fuel:f.fuel,by:f.by}]);
  log('Added vessel log entry'+(f.def?' and reported a defect':''),'Boats & Equipment',boat+' '+paperD(f.date));
  toast(fresh.length?'Entry saved. Alert sent to the Coxswain and the Super Admin: '+fresh[0].text:'Entry saved in the vessel log for '+boat+(f.def?'. Defect reported to the Super Admin.':''));
  setMk(false);setF(blank());setWk('');
 };
 const doSvc=()=>{const m=+svf.meter||sv.hrs;if(m>sv.hrs+0.05){toast('The meter at service cannot be higher than the current reading, '+sv.hrs.toFixed(1)+' h');return;}
  const d=new Date(svf.date+'T12:00:00');
  upd(boat,b=>({...b,engines:b.engines.map(e=>e.id===sv.id?{...e,svcAt:m,svcDate:d}:e),svc:[{date:d,eng:sv.label,meter:m,work:svf.work,cost:svf.cost?+svf.cost:null,by:svf.by},...b.svc]}));
  log('Recorded engine service ('+svf.work+')','Boats & Equipment',boat+', '+sv.label+' at '+m.toFixed(1)+' h');toast(sv.label+' serviced. Run hours since service reset to '+r1(sv.hrs-m).toFixed(1)+'.');setSv(null);};
 const doCfg=()=>{const v={intervalH:+cf.intervalH,intervalM:+cf.intervalM,warnH:+cf.warnH,warnD:+cf.warnD};if(!(v.intervalH>0)||!(v.intervalM>0)||v.warnH<0||v.warnD<0){toast('Enter numbers above zero for the interval and zero or more for the alerts');return;}
  upd(boat,b=>({...b,engines:b.engines.map(e=>e.id===cf.id?{...e,...v}:e)}));log('Changed engine service settings','Boats & Equipment',boat+', '+cf.label+': every '+v.intervalH+' h or '+v.intervalM+' months, alert '+v.warnH+' h / '+v.warnD+' days before');toast('Service settings saved for '+cf.label);setCf(null);};
 const prt=()=>{printNode(host.current&&host.current.querySelector('.paper'));log('Printed vessel log','Boats & Equipment',boat+' '+weekLabel(ws));};
 const csv=()=>{saveCSV(boat+'-vessel-log.csv',[['Date','Departure','From','To','Arrival','Activity/Comments'].concat(eng.map(e=>e.label+' hours'),['Refuel (litres)','Name'])].concat(mine.map(r=>[paperD(r.date),r.dep,r.from,r.to,r.arr,r.note].concat(eng.map(e=>r.m&&r.m[e.id]!=null?r.m[e.id]:''),[r.fuel,r.by]))));log('Exported vessel log CSV','Boats & Equipment',boat);toast('Vessel log exported');};
 const setM=(id,v)=>setF(o=>({...o,m:{...o.m,[id]:v}}));
 return html`<div><${PageHead} title="Boats & Equipment" sub=${role==='cox'?'Your assigned boats: vessel log, engine hours and service':'Vessel logs, engine hours, service alerts and equipment'}>${write&&html`<${Btn} kind="primary" icon="plus" onClick=${()=>{setF(blank());setMk(true);}}>Add log entry</${Btn}>`}</${PageHead}>
 ${al.length>0&&html`<${Notice} tone=${al.some(a=>a.s==='over')?'crit':'warn'} title=${al.length+' engine service alert'+(al.length>1?'s':'')}>${al.map(a=>a.text).join('. ')}.</${Notice}>`}
 <div className="grid3">${boats.map(b=>{const fe=fleet[b.name];const worst=fe.engines.map(e=>engSt(e).s).sort().includes('over')?'over':fe.engines.some(e=>engSt(e).s==='soon')?'soon':'ok';return html`<${Card} key=${b.name} title=${b.name} right=${html`<${Chip} t=${b.status}/>`}><${KV} rows=${[['Registration',b.reg],['Engines',fe.engines.length+' · '+fe.engines[0].spec],['Coxswain',b.cox],['Total run hours',fe.engines.map(e=>e.hrs.toFixed(1)).join(' / ')+' h'],['Last service',fmtD(fe.svc[0].date)],['Engine service',html`<${Chip} t=${SVC_CHIP[worst][0]} tone=${SVC_CHIP[worst][1]}/>`],['Open defect',b.defect]]}/><div className="btnrow"><${Btn} kind="small" onClick=${()=>{setBoat(b.name);setWk('');}}>${boat===b.name?'Showing below':'Open log and engines'}</${Btn}></div></${Card}>`;})}</div>
 <h2 className="sec-h">${boat}: engines and service</h2>
 <div className=${'grid'+(eng.length>1?'2':'3')}>${eng.map(e=>html`<${EngineCard} key=${e.id} e=${e} write=${write} admin=${admin} onSvc=${x=>{setSv(x);setSvf({date:isoD(TODAY),meter:x.hrs.toFixed(1),work:'Full service',cost:'',by:me});}} onCfg=${x=>setCf({...x})}/>`)}</div>
 <${Card} title="Service history">${html`<${Table} empty="No services recorded." cols=${[{h:'Date',k:'d',r:r=>fmtD(r.date)},{h:'Engine',k:'eng'},{h:'Hour meter',k:'meter',cls:'num',r:r=>r.meter.toFixed(1)},{h:'Work done',k:'work'},{h:'Cost',k:'cost',cls:'num',r:r=>r.cost?KES(r.cost):'—'},{h:'By',k:'by'}]} rows=${fb.svc.map((s,i)=>({...s,id:i}))}/>`}</${Card}>
 <${Card} title=${'Vessel log: '+boat} right=${html`<div className="btnrow"><${Sel} id="wk" aria-label="Week" value=${ws} onChange=${setWk} opts=${(weeks.length?weeks:[ws]).map(w=>[w,'Week of '+weekLabel(w)])}/>${pwa?html`<${Btn} kind="small" icon="download" onClick=${prt}>Print or save as PDF</${Btn}><${Btn} kind="small" icon="download" onClick=${csv}>CSV</${Btn}>`:null}</div>`}>
  ${!pwa&&html`<p className="muted small">Print, PDF and CSV work in the installed app link.</p>`}
  <div className="pp-wrap" ref=${host}><${VesselLog} boat=${boat} eng=${eng} rows=${rows} ws=${ws}/></div></${Card}>
 ${role!=='cox'&&html`<${Card} title="Equipment"><${Table} cols=${[{h:'Item',k:'0',r:r=>r[0]},{h:'Serial / ref',k:'1',cls:'mono',r:r=>r[1]},{h:'Qty',k:'2',cls:'num',r:r=>r[2]},{h:'Condition',k:'3',r:r=>html`<${Chip} t=${r[3]}/>`},{h:'Assigned to',k:'4',r:r=>r[4]},{h:'Issue / return',k:'5',r:r=>r[5]}]} rows=${EQUIP.map((e,i)=>Object.assign([...e],{id:i}))}/></${Card}>`}
 <${Modal} wide=${true} open=${mk} onClose=${()=>setMk(false)} title=${'Add log entry: '+boat}><div className="form">
  <${Field} label="Date" id="vd"><${Inp} id="vd" type="date" value=${f.date} onChange=${v=>setF(o=>({...o,date:v}))}/></${Field}>
  <${Field} label="Departure time" id="vdp"><${Inp} id="vdp" type="time" value=${f.dep} onChange=${v=>setF(o=>({...o,dep:v}))}/></${Field}>
  <${Field} label="From" id="vf"><${Inp} id="vf" value=${f.from} onChange=${v=>setF(o=>({...o,from:v}))}/></${Field}>
  <${Field} label="To" id="vt"><${Inp} id="vt" value=${f.to} onChange=${v=>setF(o=>({...o,to:v}))}/></${Field}>
  <${Field} label="Arrival time" id="va"><${Inp} id="va" type="time" value=${f.arr} onChange=${v=>setF(o=>({...o,arr:v}))}/></${Field}>
  <${Field} label="Name or initials" id="vn"><${Inp} id="vn" value=${f.by} onChange=${v=>setF(o=>({...o,by:v}))}/></${Field}>
  <${Field} label="Activity / Comments" id="vc" wide=${true}><${Inp} id="vc" value=${f.note} onChange=${v=>setF(o=>({...o,note:v}))}/></${Field}>
  ${eng.map(e=>html`<${Field} key=${e.id} label=${(eng.length>1?e.label.split(' (')[0]:'Engine')+' hour meter at arrival (now '+e.hrs.toFixed(1)+')'} id=${'vm'+e.id}><${Inp} id=${'vm'+e.id} type="number" step="0.1" value=${f.m[e.id]||''} onChange=${v=>setM(e.id,v)}/></${Field}>`)}
  <${Field} label="Refuel (litres)" id="vr"><${Inp} id="vr" type="number" value=${f.fuel} onChange=${v=>setF(o=>({...o,fuel:v}))}/></${Field}>
  <${Field} label="Report a defect (optional)" id="vx" wide=${true}><${Inp} id="vx" value=${f.def} onChange=${v=>setF(o=>({...o,def:v}))}/></${Field}>
  <p className="muted small wide">Leave the hour meter empty and POps adds the trip time to the last reading. The log then updates the run hours since service.</p>
  <div className="form-foot wide"><${Btn} kind="primary" onClick=${save}>Save entry</${Btn}></div></div></${Modal}>
 <${Modal} open=${!!sv} onClose=${()=>setSv(null)} title=${sv?'Record service: '+sv.label:''}>${sv&&html`<div className="form">
  <${Field} label="Date of service" id="sd"><${Inp} id="sd" type="date" value=${svf.date} onChange=${v=>setSvf(o=>({...o,date:v}))}/></${Field}>
  <${Field} label="Hour meter at service" id="sm"><${Inp} id="sm" type="number" step="0.1" value=${svf.meter} onChange=${v=>setSvf(o=>({...o,meter:v}))}/></${Field}>
  <${Field} label="Work done" id="sw"><${Sel} id="sw" value=${svf.work} onChange=${v=>setSvf(o=>({...o,work:v}))} opts=${['Full service','Oil and filter change','Impeller and cooling','Fuel system','Gearbox oil','Other']}/></${Field}>
  <${Field} label="Cost (KES)" id="sc"><${Inp} id="sc" type="number" value=${svf.cost} onChange=${v=>setSvf(o=>({...o,cost:v}))}/></${Field}>
  <${Field} label="Done by" id="sb" wide=${true}><${Inp} id="sb" value=${svf.by} onChange=${v=>setSvf(o=>({...o,by:v}))}/></${Field}>
  <p className="muted small wide">Saving resets the run hours since service to zero from the meter reading above.</p>
  <div className="form-foot wide"><${Btn} kind="primary" onClick=${doSvc}>Save service</${Btn}></div></div>`}</${Modal}>
 <${Modal} open=${!!cf} onClose=${()=>setCf(null)} title=${cf?'Service settings: '+boat+', '+cf.label:''}>${cf&&html`<div className="form">
  <${Field} label="Service every (run hours)" id="ci"><${Inp} id="ci" type="number" value=${cf.intervalH} onChange=${v=>setCf(o=>({...o,intervalH:v}))}/></${Field}>
  <${Field} label="or every (months)" id="cm"><${Inp} id="cm" type="number" value=${cf.intervalM} onChange=${v=>setCf(o=>({...o,intervalM:v}))}/></${Field}>
  <${Field} label="Alert when this many hours are left" id="cw"><${Inp} id="cw" type="number" value=${cf.warnH} onChange=${v=>setCf(o=>({...o,warnH:v}))}/></${Field}>
  <${Field} label="Alert when this many days are left" id="cd"><${Inp} id="cd" type="number" value=${cf.warnD} onChange=${v=>setCf(o=>({...o,warnD:v}))}/></${Field}>
  <p className="muted small wide">Service is due at whichever limit comes first. Alerts go to the Coxswain of this boat and the Super Admin, in the bell menu here. In the live build they also go by SMS or email. To try it, set the interval to a few hours above the current reading.</p>
  <div className="form-foot wide"><${Btn} kind="primary" onClick=${doCfg}>Save settings</${Btn}></div></div>`}</${Modal}>
 </div>`;
};
