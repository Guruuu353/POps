/* ============ field app: the ranger experience (same platform, phone layout) ============ */
const PID='PT-2026-0421';
const FT={
 en:{hello:'Hello',assigned:'Assigned patrol',start:'Start patrol',pause:'Pause',resume:'Resume',obs:'Observation',inc:'Incident',photo:'Photo',complete:'Complete patrol',submit:'Submit',online:'Online',offline:'Offline',synced:'All synced',pending:'pending sync',home:'Home',map:'Map',records:'Records',me:'Me',gpsOn:'GPS is tracking this patrol. Your team can see it.',gpsPaused:'Paused. GPS is not tracking.',save:'Save',cancel:'Cancel',notes:'Notes',category:'Category',desc:'What happened?',persons:'Persons involved (if known)',addPhoto:'Add photo',duration:'Duration',distance:'Distance',back:'Back',noPatrol:'No patrol assigned right now. The Super Admin will assign the next one.',locate:'My location',saveMap:'Save map for offline use',language:'Language',gpsSource:'GPS source',simulated:'Demo route',device:'This phone',install:'Install app',signout:'Sign out',recent:'Recent patrols',status:'Status',type:'Type',newObs:'Record observation',newInc:'Report incident',summary:'Complete patrol',photos:'Photos',crew:'Crew',myRecords:'My records',syncNow:'Sync now',backOnline:'Back online.',waiting:'record waiting to sync.',km:'km'},
 sw:{hello:'Habari',assigned:'Doria uliyopangiwa',start:'Anza doria',pause:'Simama',resume:'Endelea',obs:'Uchunguzi',inc:'Tukio',photo:'Picha',complete:'Maliza doria',submit:'Tuma',online:'Mtandaoni',offline:'Nje ya mtandao',synced:'Yote yametumwa',pending:'inasubiri kutumwa',home:'Nyumbani',map:'Ramani',records:'Rekodi',me:'Mimi',gpsOn:'GPS inafuatilia doria hii. Timu yako inaona.',gpsPaused:'Umesimama. GPS haifuatilii.',save:'Hifadhi',cancel:'Ghairi',notes:'Maelezo',category:'Aina',desc:'Nini kimetokea?',persons:'Watu waliohusika (kama wanajulikana)',addPhoto:'Ongeza picha',duration:'Muda',distance:'Umbali',back:'Rudi',noPatrol:'Hakuna doria uliyopangiwa kwa sasa. Msimamizi atakupangia inayofuata.',locate:'Nilipo',saveMap:'Hifadhi ramani',language:'Lugha',gpsSource:'Chanzo cha GPS',simulated:'Njia ya majaribio',device:'Simu hii',install:'Sakinisha programu',signout:'Toka',recent:'Doria za hivi karibuni',status:'Hali',type:'Aina',newObs:'Andika uchunguzi',newInc:'Ripoti tukio',summary:'Maliza doria',photos:'Picha',crew:'Wafanyakazi',myRecords:'Rekodi zangu',syncNow:'Tuma sasa',backOnline:'Umerudi mtandaoni.',waiting:'rekodi inasubiri kutumwa.',km:'km'}
};
const lsGet=(k,d)=>{try{const v=localStorage.getItem('pops-'+k);return v?JSON.parse(v):d;}catch(e){return d;}};
const lsSet=(k,v)=>{try{localStorage.setItem('pops-'+k,JSON.stringify(v));}catch(e){}};
const SIM_ROUTE=[[820,180],[730,225],[650,300],[570,360],[500,410],[420,445],[340,470],[260,482],[300,540],[400,600],[520,610],[640,560],[740,480]];
const SIM_LEN=(()=>{let t=0;for(let i=1;i<SIM_ROUTE.length;i++)t+=Math.hypot(SIM_ROUTE[i][0]-SIM_ROUTE[i-1][0],SIM_ROUTE[i][1]-SIM_ROUTE[i-1][1]);return t;})();
const hhmm=()=>pad(new Date().getHours())+':'+pad(new Date().getMinutes());

const useFieldStore=({setPatrols,setIncidents,log,toast})=>{
 const [tab,setTab]=useState('home');const [scr,setScr]=useState('home');
 const [st,setSt]=useState('idle');const [sec,setSec]=useState(0);const [km,setKm]=useState(0);
 const [obs,setObs]=useState([]);const [incs,setIncs]=useState([]);const [photos,setPhotos]=useState([]);
 const [track,setTrack]=useState([]);const [pos,setPos]=useState(null);const [gpsErr,setGpsErr]=useState('');
 const [offline,setOffline]=useState(false);const [queue,setQueue]=useState(()=>lsGet('queue',[]));
 const [lang,setLangS]=useState(()=>lsGet('lang','en'));const [gps,setGps]=useState('sim');
 const last=useRef(null);const simD=useRef(0);
 const setLang=l=>{setLangS(l);lsSet('lang',l);};
 useEffect(()=>lsSet('queue',queue),[queue]);
 useEffect(()=>{const on=()=>setOffline(false),off=()=>setOffline(true);if(window.POPS_PWA){window.addEventListener('online',on);window.addEventListener('offline',off);if(navigator.onLine===false)setOffline(true);}return()=>{window.removeEventListener('online',on);window.removeEventListener('offline',off);};},[]);
 useEffect(()=>{if(st!=='active')return;const i=setInterval(()=>setSec(s=>s+1),1000);return()=>clearInterval(i);},[st]);
 const addPoint=ll=>{const l=last.current;if(l){const d=haversine(l,ll);if(d<1.5)return;setKm(k=>k+d/1000);}last.current=ll;setTrack(t=>[...t,ll]);};
 useEffect(()=>{
  if(st!=='active')return;
  if(gps==='device'&&navigator.geolocation){
   const id=navigator.geolocation.watchPosition(p=>{setGpsErr('');const ll=[p.coords.latitude,p.coords.longitude];setPos({lat:ll[0],lon:ll[1],acc:p.coords.accuracy});addPoint(ll);},e=>setGpsErr(e.message||'GPS not available'),{enableHighAccuracy:true,maximumAge:2000,timeout:20000});
   return()=>navigator.geolocation.clearWatch(id);
  }
  const i=setInterval(()=>{simD.current+=4.1/2.78;const L2=SIM_LEN*2;let d=simD.current%L2;if(d>SIM_LEN)d=L2-d;const xy=along(SIM_ROUTE,d/SIM_LEN);const ll=unproj(xy[0]+(Math.random()-.5)*.6,xy[1]+(Math.random()-.5)*.6);setPos({lat:ll[0],lon:ll[1],acc:6});addPoint(ll);},1000);
  return()=>clearInterval(i);
 },[st,gps]);
 const start=()=>{setSt('active');setScr('patrol');setSec(0);setKm(0);setObs([]);setIncs([]);setPhotos([]);setTrack([]);last.current=null;simD.current=0;setGpsErr('');
  setPatrols(x=>x.map(p=>p.id===PID?{...p,status:'Active',start:hhmm()}:p));log('Started patrol','Patrols',PID);};
 const togglePause=()=>setSt(s=>s==='active'?'paused':'active');
 const addObs=o=>{setObs(x=>[...x,{...o,at:hhmm(),ll:last.current}]);setScr('patrol');toast('Observation saved');};
 const addInc=o=>{setIncs(x=>[...x,{...o,at:hhmm(),ll:last.current}]);setScr('patrol');toast('Incident saved');};
 const addPhoto=f=>{if(!f)return;const url=URL.createObjectURL(f);setPhotos(x=>[...x,{url,at:hhmm(),ll:last.current}]);};
 const complete=()=>{setSt('paused');setScr('done');};
 const finalize=pl=>{
  setPatrols(x=>x.map(p=>p.id===pl.pid?{...p,status:'Completed',review:'Pending review',end:pl.end,obs:pl.obs,inc:pl.incs.length,km:pl.km,track:pl.track}:p));
  setIncidents(x=>[...pl.incs.map((c,k)=>{const n=x.length-7+k;const ll=c.ll||pl.track[pl.track.length-1]||[-2.2131,41.0087];const xy=proj(ll[0],ll[1]);return {id:'INC-2026-'+String(92+n).padStart(4,'0'),date:stamp(),cat:c.c,ranger:'Hamisi Mwinyi',patrol:pl.pid,desc:c.d||'No description',persons:c.p||'None recorded',action:'Reported from the field app',ref:'None',stage:0,x:xy[0],y:xy[1],loc:'sensitive'};}),...x]);
 };
 const submit=()=>{const pl={pid:PID,end:hhmm(),obs:obs.length,incs,km,track,photos:photos.length};
  if(offline){setPatrols(x=>x.map(p=>p.id===PID?{...p,status:'Pending Sync',obs:obs.length,inc:incs.length,km}:p));setQueue(q=>[...q,pl]);toast('Saved on this phone. It will sync when you are back online.');}
  else{finalize(pl);log('Submitted patrol','Patrols',PID);toast('Patrol submitted for review');}
  setSt('idle');setScr('home');setTab('home');};
 const sync=()=>{queue.forEach(finalize);log('Synced offline records','Patrols',queue.length+' record(s)');toast('Synced '+queue.length+' record'+(queue.length>1?'s':'')+'. 0 duplicates.');setQueue([]);};
 const reset=()=>{setPatrols(x=>x.map(p=>p.id===PID?{...p,status:'Planned',review:'—',obs:0,inc:0,km:0,end:'—',track:undefined}:p));setSt('idle');setScr('home');setTab('home');setQueue([]);toast('Demo patrol reset to Planned');};
 const locate=()=>{if(!navigator.geolocation){toast('This device has no GPS');return;}navigator.geolocation.getCurrentPosition(p=>{setPos({lat:p.coords.latitude,lon:p.coords.longitude,acc:p.coords.accuracy});},e=>toast('Location unavailable: '+(e.message||'permission denied')),{enableHighAccuracy:true,timeout:12000});};
 return {tab,setTab,scr,setScr,st,sec,km,obs,incs,photos,track,pos,gpsErr,offline,setOffline,queue,lang,setLang,gps,setGps,start,togglePause,addObs,addInc,addPhoto,complete,submit,sync,reset,locate};
};

const PhotoPick=({fs,t})=>html`<label className="photobtn"><input type="file" accept="image/*" capture="environment" className="sr" onChange=${e=>{const f=e.target.files&&e.target.files[0];fs.addPhoto(f);e.target.value='';}}/><${Icon} n="camera" s=${22}/>${t('addPhoto')}</label>`;
const Thumbs=({fs})=>fs.photos.length?html`<div className="thumbs">${fs.photos.map((p,i)=>html`<img key=${i} src=${p.url} alt=${'Photo '+(i+1)}/>`)}</div>`:null;
const Seg=({value,onChange,opts,label})=>html`<div className="seg" role="group" aria-label=${label}>${opts.map(o=>html`<button key=${o[0]} className=${value===o[0]?'on':''} aria-pressed=${value===o[0]} onClick=${()=>onChange(o[0])}>${o[1]}</button>`)}</div>`;

const FieldApp=({embedded})=>{
 const {fs,patrols,incidents,setRole,go,user,pwa,signOut}=useApp();
 const t=k=>(FT[fs.lang]||FT.en)[k]||FT.en[k]||k;
 const cur=patrols.find(p=>p.id===PID);
 const mine=patrols.filter(p=>p.rangers.includes('Hamisi Mwinyi'));
 const mineInc=incidents.filter(i=>i.ranger==='Hamisi Mwinyi');
 const [of_,setOf_]=useState({t:'Marine wildlife',n:''});const [inf,setInf]=useState({c:INC_CATS[0],d:'',p:''});
 const tm=`${pad(Math.floor(fs.sec/3600))}:${pad(Math.floor(fs.sec/60)%60)}:${pad(fs.sec%60)}`;
 const pend=fs.queue.length||(cur&&cur.status==='Pending Sync'?1:0);
 const mapData=useMapData();
 let body=null,nav=true;
 if(fs.scr==='patrol'){nav=false;body=html`<div className="fa-patrol">
  <div className="fa-mapbox"><${GeoMap} key="pm" layers=${['zones']} items=${[]} tracks=${[]} compact=${true} showLive=${false} myPos=${fs.pos} myTrack=${fs.track} follow=${true} height="100%"/></div>
  <div className=${'gps '+(fs.st==='active'?'':'off')}><i/>${fs.st==='active'?t('gpsOn'):t('gpsPaused')}${fs.gpsErr&&html` <b>${fs.gpsErr}</b>`}</div>
  <div className="timer">${tm}</div>
  <div className="tstat"><span><b>${fs.km.toFixed(2)}</b>${t('km')}</span><span><b>${fs.obs.length}</b>${t('obs')}</span><span><b>${fs.incs.length}</b>${t('inc')}</span><span><b>${fs.photos.length}</b>${t('photo')}</span></div>
  <div className="bgrid"><button className="big" onClick=${fs.togglePause}><${Icon} n=${fs.st==='active'?'pause':'play'} s=${24}/>${fs.st==='active'?t('pause'):t('resume')}</button><button className="big" onClick=${()=>fs.setScr('obs')}><${Icon} n="eye" s=${24}/>${t('obs')}</button><button className="big warn" onClick=${()=>fs.setScr('inc')}><${Icon} n="incident" s=${24}/>${t('inc')}</button><${PhotoPick} fs=${fs} t=${t}/></div>
  <button className="big stop" onClick=${fs.complete}><${Icon} n="stop" s=${22}/>${t('complete')}</button></div>`;}
 else if(fs.scr==='obs'){nav=false;body=html`<div className="fa-form"><h2>${t('newObs')}</h2><label htmlFor="fo-t">${t('type')}</label><${Sel} id="fo-t" value=${of_.t} onChange=${v=>setOf_(o=>({...o,t:v}))} opts=${['Marine wildlife','Coral condition','Habitat','Boat activity','Other']}/><label htmlFor="fo-n">${t('notes')}</label><textarea id="fo-n" rows="4" value=${of_.n} onChange=${e=>setOf_(o=>({...o,n:e.target.value}))}/><${PhotoPick} fs=${fs} t=${t}/><${Thumbs} fs=${fs}/><p className="small muted">GPS: ${fs.pos?fs.pos.lat.toFixed(5)+', '+fs.pos.lon.toFixed(5):'waiting for position'}</p><div className="bgrid"><button className="big" onClick=${()=>fs.setScr('patrol')}>${t('cancel')}</button><button className="big go" onClick=${()=>{fs.addObs(of_);setOf_({t:'Marine wildlife',n:''});}}>${t('save')}</button></div></div>`;}
 else if(fs.scr==='inc'){nav=false;body=html`<div className="fa-form"><h2>${t('newInc')}</h2><label htmlFor="fi-c">${t('category')}</label><${Sel} id="fi-c" value=${inf.c} onChange=${v=>setInf(o=>({...o,c:v}))} opts=${INC_CATS}/><label htmlFor="fi-d">${t('desc')}</label><textarea id="fi-d" rows="4" value=${inf.d} onChange=${e=>setInf(o=>({...o,d:e.target.value}))}/><label htmlFor="fi-p">${t('persons')}</label><input id="fi-p" value=${inf.p} onChange=${e=>setInf(o=>({...o,p:e.target.value}))}/><${PhotoPick} fs=${fs} t=${t}/><${Thumbs} fs=${fs}/><div className="bgrid"><button className="big" onClick=${()=>fs.setScr('patrol')}>${t('cancel')}</button><button className="big warn" onClick=${()=>{fs.addInc(inf);setInf({c:INC_CATS[0],d:'',p:''});}}>${t('save')}</button></div></div>`;}
 else if(fs.scr==='done'){nav=false;body=html`<div className="fa-form"><h2>${t('summary')}</h2><div className="sumgrid"><span>${t('duration')}<b>${tm}</b></span><span>${t('distance')}<b>${fs.km.toFixed(2)} km</b></span><span>${t('obs')}<b>${fs.obs.length}</b></span><span>${t('inc')}<b>${fs.incs.length}</b></span><span>${t('photos')}<b>${fs.photos.length}</b></span><span>GPS points<b>${fs.track.length}</b></span></div><${Thumbs} fs=${fs}/><p className="small muted">${fs.offline?'You are offline. The patrol is saved on this phone and syncs later without creating duplicates.':'The Super Admin will review the submitted patrol.'}</p><div className="bgrid"><button className="big" onClick=${()=>{fs.setScr('patrol');fs.togglePause();}}>${t('back')}</button><button className="big go" onClick=${fs.submit}>${t('submit')}</button></div></div>`;}
 else if(fs.tab==='home'){body=html`<div className="fa-pad"><h2 className="hi">${t('hello')}, Hamisi</h2><p className="muted small">Marine Ranger · Pate BMU</p>
  ${fs.queue.length>0&&!fs.offline&&html`<div className="banner"><${Icon} n="sync" s=${18}/>${t('backOnline')} ${fs.queue.length} ${t('waiting')}<button className="btn small primary" onClick=${fs.sync}>${t('syncNow')}</button></div>`}
  ${cur&&cur.status==='Planned'?html`<div className="acard"><div className="row"><strong>${cur.id}</strong><${Chip} t=${cur.status}/></div><p className="big-p">${cur.date}, ${cur.start}<br/>${cur.area}</p><p className="small muted">${cur.boat} · ${cur.cox}<br/>${t('crew')}: ${cur.rangers.join(', ')}</p><button className="big go" onClick=${fs.start}><${Icon} n="play" s=${22}/>${t('start')}</button></div>`:html`<div className="acard"><p className="muted">${t('noPatrol')}</p>${cur&&html`<div className="row"><strong>${cur.id}</strong><${Chip} t=${cur.status}/></div>`}</div>`}
  <h3 className="fa-h">${t('recent')}</h3>${mine.filter(p=>p.id!==PID).slice(0,4).map(p=>html`<div key=${p.id} className="arow"><span><b>${p.id}</b><small>${p.date}</small></span><${Chip} t=${p.status}/></div>`)}</div>`;}
 else if(fs.tab==='map'){body=html`<div className="fa-maptab"><div className="fa-mapfull"><${GeoMap} key="fm" layers=${mapData.allowed.filter(l=>['zones','wildlife','habitat','patrols'].includes(l))} items=${mapData.items} tracks=${mapData.tracks} myPos=${fs.pos} myTrack=${fs.track} showLive=${false} height="100%" onSel=${()=>{}}/></div><div className="fa-mapbar"><button className="btn" onClick=${fs.locate}><${Icon} n="target" s=${16}/>${t('locate')}</button><${OfflineMapBtn} base="sat"/></div></div>`;}
 else if(fs.tab==='records'){body=html`<div className="fa-pad"><h2 className="hi">${t('myRecords')}</h2><h3 className="fa-h">Patrols</h3>${mine.map(p=>html`<div key=${p.id} className="arow"><span><b>${p.id}</b><small>${p.date} · ${p.km?p.km.toFixed(1)+' km':'—'}</small></span><${Chip} t=${p.status}/></div>`)}<h3 className="fa-h">Incidents</h3>${mineInc.length?mineInc.map(i=>html`<div key=${i.id} className="arow"><span><b>${i.id}</b><small>${i.cat}</small></span><${Chip} t=${STAGES[i.stage]} tone=${i.stage===0?'warn':'info'}/></div>`):html`<p className="muted small">None yet.</p>`}</div>`;}
 else{body=html`<div className="fa-pad"><div className="me big-me"><span className="av">HM</span><div><strong>Hamisi Mwinyi</strong><small>Marine Ranger · Pate BMU</small></div></div>
  <h3 className="fa-h">${t('language')}</h3><${Seg} label="Language" value=${fs.lang} onChange=${fs.setLang} opts=${[['en','English'],['sw','Kiswahili']]}/>${fs.lang==='sw'&&html`<p className="small muted">Draft Swahili text. To be reviewed with the rangers.</p>`}
  <h3 className="fa-h">${t('gpsSource')}</h3><${Seg} label="GPS source" value=${fs.gps} onChange=${fs.setGps} opts=${[['sim',t('simulated')],['device',t('device')]]}/><p className="small muted">${fs.gps==='device'?"Uses this phone's GPS during a started patrol. If you are far from Pate, the map follows you wherever you are.":'A simulated boat route inside the Iweni LMMA, so the demo works anywhere.'}</p>
  <h3 className="fa-h">Connection</h3><div className="rowx"><${Toggle} id="offt" on=${fs.offline} onChange=${fs.setOffline} label="Simulate no signal"/><label htmlFor="offt">Simulate no signal (demo)</label></div>
  ${pwa&&(pwa.canInstall?html`<button className="big go" onClick=${pwa.install}><${Icon} n="download" s=${22}/>${t('install')}</button>`:pwa.standalone?html`<p className="small muted">Installed on this device.</p>`:pwa.ios?html`<p className="small muted">To install on iPhone: tap Share, then Add to Home Screen.</p>`:null)}
  <button className="btn" onClick=${fs.reset}>Reset demo patrol</button>
  <h3 className="fa-h">Demo</h3><label htmlFor="fa-role" className="small muted">View as another role</label><select id="fa-role" value="ranger" onChange=${e=>{setRole(e.target.value);go('dashboard');}}>${Object.keys(ROLES).map(k=>html`<option key=${k} value=${k}>${ROLES[k].label}</option>`)}</select>
  <button className="btn" onClick=${signOut}><${Icon} n="out" s=${16}/>${t('signout')}</button>
  <p className="small muted">Offline records are cleared from this phone when you sign out or another person signs in.</p></div>`;}
 return html`<div className=${'fa '+(embedded?'emb':'full')}>
  <header className="fa-top"><span className="fa-brand"><${Logo} s=${26}/>POps Field</span><span className="fa-st"><button className=${'netpill '+(fs.offline?'off':'')} onClick=${()=>fs.setOffline(!fs.offline)} aria-label=${fs.offline?'Offline. Tap to go online (demo)':'Online. Tap to go offline (demo)'}><${Icon} n=${fs.offline?'wifioff':'wifi'} s=${14}/>${fs.offline?t('offline'):t('online')}</button><span className=${'syncpill '+(pend?'pend':'ok')}>${pend?(fs.queue.length||1)+' '+t('pending'):t('synced')}</span></span></header>
  <div className="fa-body">${body}</div>
  ${nav&&html`<nav className="fa-nav" aria-label="Field navigation">${[['home','dashboard',t('home')],['map','map',t('map')],['records','reports',t('records')],['me','staff',t('me')]].map(n=>html`<button key=${n[0]} className=${fs.tab===n[0]?'on':''} aria-current=${fs.tab===n[0]?'page':null} onClick=${()=>fs.setTab(n[0])}><${Icon} n=${n[1]} s=${22}/><span>${n[2]}</span></button>`)}</nav>`}
 </div>`;
};
const FieldShell=()=>html`<div className="fieldshell"><${FieldApp}/></div>`;

/* ranger dashboard on large screens: the field app shown on a phone, next to the story */
const RangerHome=()=>html`<div><${PageHead} title="Ranger field app" sub="The same POps platform on a ranger's Android phone. Open it full-screen on a real phone with the link below.">${html`<a className="btn" href="#field" onClick=${()=>{}}><${Icon} n="phone" s=${16}/>Open full-screen (phone view)</a>`}</${PageHead}>
 <div className="rangerwrap"><div className="phone"><div className="notch"/><div className="screen"><${FieldApp} embedded=${true}/></div></div>
 <div className="ranger-side">
  <${Card} title="Try it end to end"><ol className="howto"><li>Tap <b>Start patrol</b>. The map follows the boat and records the GPS track.</li><li>Add an <b>Observation</b>, an <b>Incident</b> and a <b>Photo</b>. Use a real camera on a phone.</li><li>Open <b>Me</b> and switch on <b>Simulate no signal</b>, then <b>Complete patrol</b> and <b>Submit</b>. It waits on the phone.</li><li>Go back online and tap <b>Sync now</b>.</li><li>Use <i>View as Super Admin</i> to review the patrol, its GPS track on the map, and the incident.</li></ol></${Card}>
  <${Card} title="Built for the field"><ul className="ticks"><li>Large buttons and one task per screen</li><li>English and Kiswahili</li><li>GPS runs only during a started patrol, and the crew is told</li><li>Works offline. Saved map area, forms and photos wait for signal</li><li>Duplicate prevention on sync</li><li>Offline data cleared on sign-out or account switch</li><li>No access to finance, personnel or administration</li></ul></${Card}>
 </div></div></div>`;
