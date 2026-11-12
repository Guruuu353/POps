/* ============ views part 1: dashboards, map, patrols, incidents, ranger app ============ */
const incItem=i=>({id:i.id,layer:'incidents',x:i.x,y:i.y,title:i.cat,when:i.date,team:i.ranger+' ('+i.patrol+')',desc:i.desc,status:STAGES[i.stage],follow:i.action+(i.ref!=='None'?'. Referral: '+i.ref:''),loc:i.loc,ref:i.id});
const Photos=({n=3})=>html`<div className="photos">${Array.from({length:n}).map((_,i)=>html`<div key=${i} className="ph"><${Icon} n="camera" s=${18}/><span>Photo ${i+1}</span></div>`)}</div>`;

/* which map content a role may see */
const useMapData=()=>{
 const {role,incidents,assign,bmuId,patrols}=useApp();
 const me=ROLES[role].user;
 const allowed=LAYER_ACCESS[role]||[];
 let tracks=TRACKS;
 if(role==='bmu')tracks=TRACKS.filter(t=>t.bmu===bmuId);
 if(role==='ranger')tracks=TRACKS.filter(t=>PATROLS0.find(p=>p.id===t.id&&p.rangers.includes(me)));
 if(role==='cox')tracks=TRACKS.filter(t=>PATROLS0.find(p=>p.id===t.id&&p.cox===me));
 let items=MAPITEMS.filter(i=>allowed.includes(i.layer));
 if(role==='officer'){const mine=assign.rehema;items=items.filter(i=>i.proj&&mine.includes(i.proj));}
const rec=patrols.filter(p=>p.track&&p.track.length>1&&(role==='admin'||role==='board'||(role==='ranger'&&p.rangers.includes(me)))).map(p=>({id:p.id,status:p.status,bmu:p.bmu,ll:p.track}));
 tracks=[...tracks,...rec];
 const inc=(role==='admin'||role==='board')?incidents:role==='ranger'?incidents.filter(i=>i.ranger===me):[];
 return {allowed,tracks,items:[...items,...inc.map(incItem)]};
};

/* ---------- Live Operations Map ---------- */
const LiveMap=()=>{
 const {role,bmuId}=useApp();
 const {allowed,tracks,items}=useMapData();
 const [layers,setLayers]=useState(allowed);
 useEffect(()=>setLayers(allowed),[role]);
 const [sel,setSel]=useState(null);
 const tog=id=>setLayers(l=>l.includes(id)?l.filter(x=>x!==id):[...l,id]);
 const pick=i=>setSel(i);
 const loc=i=>{if(i.loc==='sensitive'&&role==='board')return 'Restricted. Exact enforcement coordinates are limited to the Super Admin and the reporting ranger.';const [la,lo]=unproj(i.x,i.y);return toDMS(la,'N','S')+' / '+toDMS(lo,'E','W');};
 return html`<div>
 <${PageHead} title="Live Operations Map" sub="Iweni LMMA and surrounding waters. You only see the layers your role allows."/>
 ${allowed.length===0?html`<${Denied} mod="The Live Operations Map" role=${role}/>`:html`
 <div className="mapgrid">
  <div className="mapcol">
   <div className="mapbar"><div className="chips">${LAYERS.map(l=>html`<button key=${l.id} className=${'fchip '+(layers.includes(l.id)?'on':'')+(allowed.includes(l.id)?'':' locked')} disabled=${!allowed.includes(l.id)} onClick=${()=>tog(l.id)} aria-pressed=${layers.includes(l.id)} title=${allowed.includes(l.id)?'':'Not available for this role'}>${!allowed.includes(l.id)&&html`<${Icon} n="lock" s=${12}/>`}${l.label}</button>`)}</div>
   </div>
   <div className="mapbox big"><${OpsMap} layers=${layers} items=${items} tracks=${tracks} sel=${sel&&sel.id} onSel=${pick}/>
    <div className="livebadge"><i/>Live positions update every second (demo)</div></div>
   <div className="mapfoot"><${MapLegend} layers=${layers}/><${OfflineMapBtn} base="sat"/></div>
  </div>
  <aside className="mapside">
   ${sel?html`<${Card} title=${sel.title} right=${html`<button className="iconbtn" aria-label="Clear selection" onClick=${()=>setSel(null)}><${Icon} n="x" s=${16}/></button>`}>
    <${KV} rows=${[['Date and time',sel.when],['Location',loc(sel)],['Assigned team',sel.team],['Description',sel.desc],['Status',html`<${Chip} t=${sel.status}/>`],['Follow-up actions',sel.follow]]}/>
    <h3 className="mini-h">Photographs</h3><${Photos}/></${Card}>`:
   html`<${Card} title="Select a map item"><p className="muted">Click a marker or a track to see its date and time, location, assigned team, description, photographs, status and follow-up actions.</p>
   <h3 className="mini-h">Your access</h3><p className="muted small">${({admin:'Full authorized visibility.',board:'Full oversight. Exact enforcement locations are generalised.',ranger:'Assigned operational information only.',cox:'Patrols and boats you support.',officer:'Assigned project information only.',fisheries:'Permitted all-project and patrol visibility. Incidents are not shown.',bmu:'Permitted patrol and LMMA information for '+bmuName(bmuId)+'.'})[role]}</p></${Card}>`}
  </aside>
 </div>`}
 </div>`;
};

/* ---------- Dashboards ---------- */
const Attn=({items})=>html`<ul className="attn">${items.map((a,i)=>html`<li key=${i}><span><${Chip} t=${a[0]} tone=${a[1]}/> ${a[2]}</span><button className="link" onClick=${a[3]}>${a[4]}<${Icon} n="chev" s=${14}/></button></li>`)}</ul>`;
const MiniMap=({layers=['zones','patrols','incidents','boats'],h=320})=>{const {go}=useApp();const d=useMapData();return html`<div className="mapbox mini"><${OpsMap} layers=${layers.filter(l=>d.allowed.includes(l))} items=${d.items} tracks=${d.tracks} sel=${null} onSel=${()=>go('live-map')} locked=${true} compact=${true} height=${h}/><button className="btn small floating" onClick=${()=>go('live-map')}>Open full map</button></div>`;};

const DashAdmin=()=>{
 const {role,patrols,incidents,fin,tour,go,audit}=useApp();
 const open=incidents.filter(i=>i.stage<4).length;
 const pend=patrols.filter(p=>p.review==='Pending review').length;
 const appr=fin.filter(f=>f.status==='Submitted').length;
 const cats={};incidents.forEach(i=>cats[i.cat]=(cats[i.cat]||0)+1);
 const catData=Object.entries(cats).sort((a,b)=>b[1]-a[1]).slice(0,5);
 const tourIn=tour.reduce((a,t)=>a+t.recv,0);
 return html`<div>
 <${PageHead} title=${role==='board'?'Governance overview':'Organisation overview'} sub=${role==='board'?'Oversight view for the Board. Operations are managed by the CBO Manager.':'Patte Conservation CBO · Pate Island, Lamu County'}>${role==='admin'&&html`<${Btn} kind="primary" icon="plus" onClick=${()=>go('patrols')}>New patrol</${Btn}>`}</${PageHead}>
 <div className="kpis">
  <${Kpi} label="Patrols this month" value="18" note="+3 vs October" tone="good"/>
  <${Kpi} label="Active patrols now" value=${patrols.filter(p=>p.status==='Active').length} note=${patrols.filter(p=>p.status==='Paused').length+' paused'}/>
  <${Kpi} label="Open incidents" value=${open} note=${incidents.filter(i=>i.stage===0).length+' awaiting review'} tone=${open?'warn':''}/>
  <${Kpi} label="Coral fragments alive" value="1,284" note="94% attachment"/>
  <${Kpi} label="Tourism received" value=${KESk(tourIn)} note="Nov to date"/>
  <${Kpi} label="Awaiting approval" value=${appr} note="finance entries" tone=${appr?'warn':''}/>
 </div>
 <div className="grid2 lead">
  <${Card} title="Live operations" sub="Zones, patrols, incidents and boats" right=${html`<${Btn} kind="ghost small" onClick=${()=>go('live-map')}>Open map</${Btn}>`}><${MiniMap}/></${Card}>
  <${Card} title=${role==='board'?'Needs Board attention':'Needs your attention'}>
   <${Attn} items=${role==='board'?[['Approval','warn','Finance entries FN-2211 and FN-2208',()=>go('finance'),'Review'],['Due soon','warn','Sign grant reporting letter, due 12 Nov',()=>go('bmus'),'Open'],['Open','info','Approve Iweni boundary verification report',()=>go('iweni-lmma'),'Open']]:
   [['Review','warn',pend+' completed patrol'+(pend===1?'':'s')+' waiting for review',()=>go('patrols'),'Review'],['Review','crit','Incident INC-2026-0091 submitted this morning',()=>go('incidents'),'Open'],['Defect','warn','Jahazi Bahari: engine vibration reported',()=>go('boats'),'Open'],['Approval','info',appr+' finance entries with the Board approver',()=>go('finance'),'View']]}/>
  </${Card}>
 </div>
 <div className="grid3">
  <${Card} title="Patrols per week" sub="Last 8 weeks"><${BarChart} data=${[['W38',5],['W39',6],['W40',5],['W41',7],['W42',6],['W43',8],['W44',7],['W45',9]]} hi=${7}/></${Card}>
  <${Card} title="Incidents by category" sub="All recorded incidents"><${HBars} data=${catData} color="var(--coral)"/></${Card}>
  <${Card} title="Recent activity" sub="From the audit trail"><ul className="feed">${audit.slice(0,5).map((a,i)=>html`<li key=${i}><strong>${a[1]}</strong> ${a[2].toLowerCase()}<small>${a[0]} · ${a[3]}</small></li>`)}</ul></${Card}>
 </div></div>`;
};

const DashRead=()=>{
 const {role,bmuId,go,patrols}=useApp();
 const mine=role==='bmu'?patrols.filter(p=>p.bmu===bmuId):patrols;
 const byBmu=BMUS.map(b=>[b.name.replace(' BMU',''),patrols.filter(p=>p.bmu===b.id).length]);
 return html`<div>
 <${PageHead} title=${role==='bmu'?bmuName(bmuId)+' dashboard':'Conservation overview'} sub=${role==='bmu'?'Read-only view of permitted patrol records and LMMA activity.':'Read-only view across all projects and permitted patrol records.'}/>
 <${Notice} tone="info" title="Read-only access">You can view permitted records. You cannot create, edit, delete or approve anything.${role==='fisheries'?' There is no fisheries monitoring or landing-site module in POps.':''}</${Notice}>
 <div className="kpis">
  <${Kpi} label="Patrols on record" value=${mine.length}/><${Kpi} label="Completed this month" value=${mine.filter(p=>p.status==='Completed').length}/>
  <${Kpi} label="LMMA zones" value="2" note="No Take, Gear Restricted"/>${role==='fisheries'&&html`<${Kpi} label="Active projects" value="5"/>`}
 </div>
 <div className="grid2">
  <${Card} title="Iweni LMMA" right=${html`<${Btn} kind="ghost small" onClick=${()=>go('live-map')}>Open map</${Btn}>`}><${MiniMap} layers=${['zones','patrols']} h=${290}/></${Card}>
  ${role==='fisheries'?html`<${Card} title="Project progress"><ul className="plist">${PROJECTS.map(p=>html`<li key=${p.id}><span>${p.name}</span><${Progress} v=${p.progress}/><b>${p.progress}%</b></li>`)}</ul></${Card}>`:
  html`<${Card} title="Patrols by BMU area"><${HBars} data=${byBmu}/><p className="muted small">You see ${bmuName(bmuId)} records only. Shanga Ishakani and Shanga Rubu are always kept separate.</p></${Card}>`}
 </div></div>`;
};

const DashOfficer=()=>{
 const {assign,go,setProjOpen}=useApp();
 const mine=PROJECTS.filter(p=>assign.rehema.includes(p.id));
 return html`<div>
 <${PageHead} title="My project workspaces" sub="You only see projects the Super Admin has assigned to you."/>
 ${mine.length===0?html`<${Notice} tone="warn" title="No projects assigned">Ask the Super Admin to assign you to a project.</${Notice}>`:html`<div className="pcards">${mine.map(p=>html`<button key=${p.id} className="pcard" onClick=${()=>{setProjOpen(p.id);go('projects');}}><span className="pcode">${p.code}</span><h3>${p.name}</h3><p>${p.loc}</p><${Progress} v=${p.progress}/><div className="pmeta"><span>${p.progress}% complete</span><span>Due ${p.due}</span></div></button>`)}</div>`}
 <div className="grid2">
  <${Card} title="My tasks">${mine.length?html`<${Table} cols=${[{h:'Task',k:'t'},{h:'Due',k:'d'},{h:'Status',k:'s',r:r=>html`<${Chip} t=${r.s}/>`}]} rows=${mine.flatMap(p=>p.tasks.filter(t=>t[1]==='Rehema Salim').map((t,i)=>({id:p.id+i,t:t[0],d:t[2],s:t[3]})))}/>`:html`<p className="muted">No tasks.</p>`}</${Card}>
  <${Card} title="Outside your assignment"><p className="muted">${PROJECTS.length-mine.length} other projects exist. Their pages, records, photographs, documents and reports are not accessible to you. The database refuses the request even if a page address is typed in by hand.</p></${Card}>
 </div></div>`;
};

const DashTourism=()=>{
 const {tour,go}=useApp();
 const out=tour.filter(t=>['Partially paid','Unpaid'].includes(t.status)).reduce((a,t)=>a+t.charge-t.recv,0);
 return html`<div><${PageHead} title="Tourism overview" sub="Visitors, bookings and payments"><${Btn} kind="primary" icon="plus" onClick=${()=>go('tourism')}>Register visitors</${Btn}></${PageHead}>
 <div className="kpis"><${Kpi} label="Visitors, November" value="67" note="+55% vs Nov 2025" tone="good"/><${Kpi} label="Bookings recorded" value=${tour.length}/><${Kpi} label="Outstanding balances" value=${KES(out)} tone="warn" note=${tour.filter(t=>['Partially paid','Unpaid'].includes(t.status)).length+' bookings'}/><${Kpi} label="Sent to Finance" value=${tour.filter(t=>t.recon==='Awaiting reconciliation').length} note="awaiting reconciliation"/></div>
 <div className="grid2"><${Card} title="Visitors per month"><${BarChart} data=${TOUR_MONTHS} hi=${5}/></${Card}>
 <${Card} title="Upcoming arrivals"><${Table} cols=${[{h:'Booking',k:'id',cls:'mono'},{h:'Group',k:'name'},{h:'Arrival',k:'arr'},{h:'Guests',k:'n',cls:'num'}]} rows=${tour.filter(t=>t.status!=='Cancelled').slice(0,4)}/></${Card}></div></div>`;
};

const DashFinance=()=>{
 const {fin,tour,go}=useApp();
 const inc=fin.filter(f=>f.type==='Income').reduce((a,f)=>a+f.amt,0),exp=fin.filter(f=>f.type==='Expense').reduce((a,f)=>a+f.amt,0);
 return html`<div><${PageHead} title="Finance overview" sub="Entry and approval are kept separate"><${Btn} kind="primary" icon="plus" onClick=${()=>go('finance')}>New entry</${Btn}></${PageHead}>
 <div className="kpis"><${Kpi} label="Income recorded" value=${KES(inc)}/><${Kpi} label="Expenditure recorded" value=${KES(exp)}/><${Kpi} label="Awaiting approval" value=${fin.filter(f=>f.status==='Submitted').length} tone="warn" note="with Board approver"/><${Kpi} label="Tourism to reconcile" value=${tour.filter(t=>t.recon==='Awaiting reconciliation').length}/></div>
 <div className="grid2"><${Card} title="Income and expenditure" sub="KES thousands"><${LineChart} labels=${FIN_MONTHS.map(m=>m[0])} series=${[{name:'Income',color:'var(--c1)',v:FIN_MONTHS.map(m=>m[1])},{name:'Expenses',color:'var(--c2)',v:FIN_MONTHS.map(m=>m[2])}]} unit="k"/></${Card}>
 <${Card} title="Budget used by project"><ul className="plist">${PROJECTS.map(p=>html`<li key=${p.id}><span>${p.code}</span><${Progress} v=${Math.round(p.spent/p.budget*100)} tone=${p.spent/p.budget>.8?'warn':''}/><b>${Math.round(p.spent/p.budget*100)}%</b></li>`)}</ul></${Card}></div></div>`;
};

const DashCox=()=>{
 const {go,toast,log}=useApp();
 const items=['Life jackets for all crew','Fire extinguisher charged','VHF radio tested','First aid kit present','Engine oil and fuel level checked','Bilge dry'];
 const [ck,setCk]=useState(items.map((_,i)=>i<3));
 return html`<div><${PageHead} title="Boat operations" sub="Assigned boat and patrol support"/>
 <div className="kpis"><${Kpi} label="Assigned boat" value="MV Mlinzi" note="KMA-LAM-241"/><${Kpi} label="Next patrol" value="12 Nov, 06:00" note="PT-2026-0421"/><${Kpi} label="Fuel today" value="84 L used" note="of 120 L issued"/><${Kpi} label="Open defects" value="0" note="on your boat" tone="good"/></div>
 <div className="grid2"><${Card} title="Pre-trip safety check" sub="MV Mlinzi"><ul className="checks">${items.map((t,i)=>html`<li key=${t}><label><input type="checkbox" checked=${ck[i]} onChange=${()=>setCk(c=>c.map((v,k)=>k===i?!v:v))}/> ${t}</label></li>`)}</ul>
  <${Btn} kind="primary" disabled=${!ck.every(Boolean)} onClick=${()=>{toast('Safety check saved for MV Mlinzi');log('Recorded boat safety check','Boats & Equipment','MV Mlinzi');}}>Save safety check</${Btn}>${!ck.every(Boolean)&&html`<p className="muted small">Tick every item to save.</p>`}</${Card}>
 <${Card} title="Trips and fuel" right=${html`<${Btn} kind="ghost small" onClick=${()=>go('boats')}>Record a trip</${Btn}>`}><p className="muted">Record departure and return times, destination, crew, fuel issued and used, and report engine defects. You cannot see finance, enforcement or personnel records.</p></${Card}></div></div>`;
};

const Dashboard=()=>{const {role}=useApp();
 if(role==='ranger')return html`<${RangerHome}/>`;
 if(role==='cox')return html`<${DashCox}/>`;
 if(role==='officer')return html`<${DashOfficer}/>`;
 if(role==='tourism')return html`<${DashTourism}/>`;
 if(role==='finance')return html`<${DashFinance}/>`;
 if(role==='fisheries'||role==='bmu')return html`<${DashRead}/>`;
 return html`<${DashAdmin}/>`;};

/* ---------- Patrols ---------- */
const PatrolForm=({onClose})=>{
 const {patrols,setPatrols,log,toast}=useApp();
 const [f,setF]=useState({area:'Iweni LMMA, northern zone',date:'2026-11-13',start:'06:00',leader:'Hamisi Mwinyi',boat:'MV Mlinzi',cox:'Said Famau',bmu:'pate'});
 const s=k=>v=>setF(o=>({...o,[k]:v}));
 const save=()=>{const id='PT-2026-'+String(422+patrols.length-9).padStart(4,'0');const d=new Date(f.date+'T12:00:00');const p={id,date:`${pad(d.getDate())} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]} ${d.getFullYear()}`,start:f.start,end:'—',leader:f.leader,rangers:[f.leader],boat:f.boat,cox:f.cox,area:f.area,bmu:f.bmu,status:'Planned',review:'—',obs:0,inc:0,km:0,equip:[],action:'—'};setPatrols(x=>[p,...x]);log('Created patrol','Patrols',id);toast(`Patrol ${id} created. ${f.leader} has been notified.`);onClose();};
 return html`<div className="form"><${Field} label="Patrol area" id="pa"><${Sel} id="pa" value=${f.area} onChange=${s('area')} opts=${['Iweni LMMA, northern zone','Iweni LMMA, central zone','Iweni LMMA, southern zone','Shanga Ishakani coast','Shanga Rubu reef edge','Pate south shore']}/></${Field}>
 <${Field} label="BMU area" id="pb"><${Sel} id="pb" value=${f.bmu} onChange=${s('bmu')} opts=${BMUS.map(b=>[b.id,b.name])}/></${Field}>
 <${Field} label="Date" id="pd"><${Inp} id="pd" type="date" value=${f.date} onChange=${s('date')}/></${Field}>
 <${Field} label="Start time" id="pt"><${Inp} id="pt" type="time" value=${f.start} onChange=${s('start')}/></${Field}>
 <${Field} label="Patrol leader" id="pl"><${Sel} id="pl" value=${f.leader} onChange=${s('leader')} opts=${['Hamisi Mwinyi','Kassim Bwana','Mwanahawa Ali','Abdalla Kombo']}/></${Field}>
 <${Field} label="Boat" id="pbt"><${Sel} id="pbt" value=${f.boat} onChange=${s('boat')} opts=${['MV Mlinzi','Jahazi Bahari']}/></${Field}>
 <${Field} label="Coxswain" id="pc"><${Sel} id="pc" value=${f.cox} onChange=${s('cox')} opts=${['Said Famau','Famau Said']}/></${Field}>
 <div className="form-foot wide"><${Btn} onClick=${onClose}>Cancel</${Btn}><${Btn} kind="primary" onClick=${save}>Create and assign</${Btn}></div></div>`;
};
const Patrols=()=>{
 const {role,patrols,setPatrols,bmuId,log,toast,can}=useApp();
 const me=ROLES[role].user;
 const [q,setQ]=useState('');const [st,setSt]=useState('All');const [open,setOpen]=useState(null);const [mk,setMk]=useState(false);
 let list=patrols;
 if(role==='bmu')list=list.filter(p=>p.bmu===bmuId);
 if(role==='ranger')list=list.filter(p=>p.rangers.includes(me));
 if(role==='cox')list=list.filter(p=>p.cox===me);
 list=list.filter(p=>(st==='All'||p.status===st)&&(p.id+p.leader+p.area).toLowerCase().includes(q.toLowerCase()));
 const cur=open&&patrols.find(p=>p.id===open);
 const write=can('patrols')==='w';
 const review=()=>{setPatrols(x=>x.map(p=>p.id===cur.id?{...p,review:'Reviewed'}:p));log('Reviewed patrol','Patrols',cur.id);toast('Patrol '+cur.id+' marked as reviewed');};
 return html`<div><${PageHead} title="Patrols & Field Activities" sub=${role==='bmu'?'Permitted patrol records for '+bmuName(bmuId):role==='ranger'?'Your assigned patrols. Record new patrols from the mobile app on your Dashboard.':'Planned, active and completed ranger patrols'}>${write&&html`<${Btn} kind="primary" icon="plus" onClick=${()=>setMk(true)}>Create patrol</${Btn}>`}</${PageHead}>
 ${!write&&html`<${Notice} tone="info" title="Read-only">${role==='ranger'?'Patrol records are created from the field app.':'You can view these records but not change them.'}</${Notice}>`}
 <${Card}><div className="toolbar"><div className="search"><${Icon} n="search" s=${16}/><input aria-label="Search patrols" placeholder="Search reference, leader or area" value=${q} onChange=${e=>setQ(e.target.value)}/></div>
 <div className="chips">${['All','Planned','Active','Paused','Completed','Overdue','Pending Sync'].map(s=>html`<button key=${s} className=${'fchip '+(st===s?'on':'')} onClick=${()=>setSt(s)}>${s}</button>`)}</div></div>
 <${Table} sel=${open} onRow=${r=>setOpen(r.id)} cols=${[{h:'Reference',k:'id',cls:'mono'},{h:'Date',k:'date'},{h:'Patrol leader',k:'leader'},{h:'Area',k:'area'},{h:'Boat',k:'boat'},{h:'Km',k:'km',cls:'num',r:r=>r.km?r.km.toFixed(1):'—'},{h:'Status',k:'status',r:r=>html`<${Chip} t=${r.status}/>`},{h:'Review',k:'review',r:r=>r.review==='—'?'—':html`<${Chip} t=${r.review}/>`}]} rows=${list}/></${Card}>
 <${Drawer} open=${!!cur} onClose=${()=>setOpen(null)} title=${cur?cur.id:''} sub=${cur?cur.area:''} foot=${cur&&write&&cur.review==='Pending review'?html`<${Btn} kind="primary" icon="check" onClick=${review}>Mark as reviewed</${Btn}>`:null}>
 ${cur&&html`<${KV} rows=${[['Status',html`<${Chip} t=${cur.status}/>`],['Patrol date',cur.date],['Start / end time',cur.start+' / '+cur.end],['Patrol leader',cur.leader],['Participating rangers',cur.rangers.join(', ')],['Boat',cur.boat],['Coxswain',cur.cox],['BMU area',bmuName(cur.bmu)],['Observations recorded',cur.obs],['Incidents reported',cur.inc],['Distance',cur.km?cur.km.toFixed(1)+' km':'—'],['Equipment used',cur.equip.length?cur.equip.join(', '):'—'],['Action taken',cur.action],['Review status',cur.review]]}/>
 <h3 className="mini-h">GPS track</h3>${(()=>{const t=cur.track&&cur.track.length>1?[{id:cur.id,status:cur.status,ll:cur.track}]:TRACKS.filter(t=>t.id===cur.id);return t.length?html`<div className="mapbox"><${OpsMap} key=${cur.id} layers=${['zones','patrols']} items=${[]} tracks=${t} sel=${null} fit="tracks" compact=${true} height=${260}/></div>`:html`<p className="muted small">${cur.status==='Planned'||cur.status==='Overdue'?'No track yet. GPS tracking only runs during an assigned and started patrol.':'No track stored for this demo patrol.'}</p>`;})()}
 <h3 className="mini-h">Photographs</h3>${cur.obs?html`<${Photos}/>`:html`<p className="muted small">None yet.</p>`}`}
 </${Drawer}>
 <${Modal} open=${mk} onClose=${()=>setMk(false)} title="Create and assign a patrol"><${PatrolForm} onClose=${()=>setMk(false)}/></${Modal}></div>`;
};

/* ---------- Incidents ---------- */
const Incidents=()=>{
 const {role,incidents,setIncidents,log,toast,can}=useApp();
 const me=ROLES[role].user;
 const [open,setOpen]=useState(null);const [cat,setCat]=useState('All');
 let list=incidents;if(role==='ranger')list=list.filter(i=>i.ranger===me);
 list=list.filter(i=>cat==='All'||i.cat===cat);
 const cur=open&&incidents.find(i=>i.id===open);
 const write=can('incidents')==='w';
 const adv=()=>{const n=Math.min(4,cur.stage+1);setIncidents(x=>x.map(i=>i.id===cur.id?{...i,stage:n}:i));log('Moved incident to '+STAGES[n],'Events & Incidents',cur.id);toast(cur.id+' is now: '+STAGES[n]);};
 return html`<div><${PageHead} title="Events & Incidents" sub="Report, review, refer, monitor and close"/>
 <${Notice} tone="info" title="Records only">POps records and tracks incidents. It does not give enforcement powers. Referrals go to KWS, KFS, the Fisheries Department, Police and other authorities.</${Notice}>
 <${Card}><div className="toolbar"><div className="chips"><select aria-label="Filter by category" value=${cat} onChange=${e=>setCat(e.target.value)}><option>All</option>${INC_CATS.map(c=>html`<option key=${c}>${c}</option>`)}</select></div></div>
 <${Table} sel=${open} onRow=${r=>setOpen(r.id)} cols=${[{h:'Reference',k:'id',cls:'mono'},{h:'Date and time',k:'date'},{h:'Category',k:'cat'},{h:'Reported by',k:'ranger'},{h:'Referral',k:'ref'},{h:'Stage',k:'stage',r:r=>html`<${Chip} t=${STAGES[r.stage]} tone=${r.stage===0?'warn':r.stage===4?'neutral':'info'}/>`}]} rows=${list}/></${Card}>
 <${Drawer} open=${!!cur} onClose=${()=>setOpen(null)} title=${cur?cur.id:''} sub=${cur?cur.cat:''} foot=${cur&&write&&cur.stage<4?html`<${Btn} kind="primary" onClick=${adv}>${['Start review','Record referral','Start monitoring','Close case'][cur.stage]}</${Btn}>`:null}>
 ${cur&&html`<div className="stepper">${STAGES.map((s,i)=>html`<div key=${s} className=${'step '+(i<cur.stage?'done':i===cur.stage?'now':'')}><i>${i<cur.stage?html`<${Icon} n="check" s=${12} sw=${3}/>`:i+1}</i><span>${s}</span></div>`)}</div>
 <${KV} rows=${[['Date and time',cur.date],['Patrol',cur.patrol],['Reporting ranger',cur.ranger],['Description',cur.desc],['Persons involved',cur.persons],['Action taken',cur.action],['Referral authority',cur.ref],['GPS location',role==='board'&&cur.loc==='sensitive'?'Restricted':toDMS(unproj(cur.x,cur.y)[0],'N','S')+' / '+toDMS(unproj(cur.x,cur.y)[1],'E','W')]]}/>
 <h3 className="mini-h">Evidence</h3><${Photos} n=${2}/>`}</${Drawer}></div>`;
};

