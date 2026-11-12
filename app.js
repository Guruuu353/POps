/* ============ POps demo data (all names and figures are sample data) ============ */
const {useState,useEffect,useMemo,useRef,useCallback,createContext,useContext}=React;
const html=htm.bind(React.createElement);
const Ctx=createContext(null);
const useApp=()=>useContext(Ctx);

const KES=n=>'KES '+Math.round(n).toLocaleString('en-US');
const KESk=n=>n>=1e6?'KES '+(n/1e6).toFixed(2)+'M':n>=1e4?'KES '+(n/1e3).toFixed(1)+'k':KES(n);
const pad=n=>String(n).padStart(2,'0');
const stamp=(d=new Date())=>`${pad(d.getDate())} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;

/* ---------- Iweni LMMA coordinates, exactly as supplied by the client ---------- */
const LMMA_PTS=[
 {n:1,lat:`02°12'37.94" S`,lon:`41°01'11.55" E`},
 {n:2,lat:`02°12'54.28" S`,lon:`41°01'18.63" E`,ref:true},
 {n:3,lat:`02°13'06.64" S`,lon:`41°00'54.3" E`},
 {n:4,lat:`02°13'14.3" S`,lon:`41°00'42.5" E`,ref:true},
 {n:5,lat:`02°13'02.9" S`,lon:`41°00'29.6" E`},
 {n:6,lat:`02°12'49.5" S`,lon:`41°00'02.28" E`},
 {n:7,lat:`02°12'44.42" S`,lon:`41°00'03.12" E`},
 {n:8,lat:`02°12'47.06" S`,lon:`41°00'16.08" E`},
 {n:9,lat:`02°12'48.5" S`,lon:`41°00'33.9" E`},
 {n:10,lat:`02°12'45.8" S`,lon:`41°00'49.5" E`},
 {n:11,lat:`02°12'32.8" S`,lon:`41°00'02" E`,ref:true},
 {n:12,lat:`02°12'14.5" S`,lon:`41°00'57.2" E`}
];
const parseDMS=s=>{const m=s.match(/(\d+)°(\d+)'([\d.]+)"\s*([NSEW])/);const v=+m[1]+(+m[2])/60+(+m[3])/3600;return (m[4]==='S'||m[4]==='W')?-v:v;};
LMMA_PTS.forEach(p=>{p.la=parseDMS(p.lat);p.lo=parseDMS(p.lon);});

/* ---------- map projection (equirectangular, 40000 px per degree) ---------- */
const MAP={W:960,H:800,lon0:40.999,lat0:-2.2015,k:40000};
const proj=(la,lo)=>[(lo-MAP.lon0)*MAP.k,(MAP.lat0-la)*MAP.k];
const unproj=(x,y)=>[MAP.lat0-y/MAP.k,MAP.lon0+x/MAP.k];
const toDMS=(v,pos,neg)=>{const h=v<0?neg:pos;v=Math.abs(v);const d=Math.floor(v);const m=Math.floor((v-d)*60);const s=((v-d)*60-m)*60;return `${pad(d)}°${pad(m)}'${s.toFixed(1)}" ${h}`;};
LMMA_PTS.forEach(p=>{[p.x,p.y]=proj(p.la,p.lo);});
const hull=pts=>{const P=[...pts].sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);const lo=[];for(const p of P){while(lo.length>=2&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p);}const up=[];for(const p of P.reverse()){while(up.length>=2&&cr(up[up.length-2],up[up.length-1],p)<=0)up.pop();up.push(p);}up.pop();lo.pop();return lo.concat(up);};
const OUTER=hull(LMMA_PTS.map(p=>[p.x,p.y]));
const CORE=hull(LMMA_PTS.filter(p=>[5,6,7,8,9,10].includes(p.n)).map(p=>[p.x,p.y]));

/* ---------- roles & permissions (w = create/edit, s = own or assigned records, r = read only) ---------- */
const MODS=[
 {id:'overview',label:'Solution Overview',icon:'info',group:'Start here',fn:'Walkthrough, gaps, risks and delivery plan'},
 {id:'dashboard',label:'Dashboard',icon:'dashboard',group:'Overview',fn:'Organizational and role-specific overview'},
 {id:'live-map',label:'Live Operations Map',icon:'map',group:'Operations',fn:'Maps, patrols, incidents and conservation locations'},
 {id:'patrols',label:'Patrols & Field Activities',icon:'patrol',group:'Operations',fn:'Ranger patrol operations and field records'},
 {id:'incidents',label:'Events & Incidents',icon:'incident',group:'Operations',fn:'Incident reporting and follow-up'},
 {id:'iweni-lmma',label:'Iweni LMMA Management',icon:'lmma',group:'Conservation',fn:'LMMA boundaries, zones and activities'},
 {id:'projects',label:'Conservation Projects',icon:'projects',group:'Conservation',fn:'Project workspaces and progress'},
 {id:'coral',label:'Coral Restoration',icon:'coral',group:'Conservation',fn:'Restoration and reef monitoring'},
 {id:'staff',label:'Staff & Users',icon:'staff',group:'Organisation',fn:'Staff records and user management'},
 {id:'bmus',label:'BMUs & Governance',icon:'bmus',group:'Organisation',fn:'BMU and Board records'},
 {id:'partners',label:'Stakeholders & Partners',icon:'partners',group:'Organisation',fn:'Partner management'},
 {id:'boats',label:'Boats & Equipment',icon:'boat',group:'Organisation',fn:'Assets, boats and maintenance'},
 {id:'tourism',label:'Tourism Management',icon:'tourism',group:'Income',fn:'Visitors, activities and payments'},
 {id:'finance',label:'Finance & Donations',icon:'finance',group:'Income',fn:'Income, expenditure and donations'},
 {id:'reports',label:'Reports & Documents',icon:'reports',group:'Insight',fn:'Reporting and document archive'},
 {id:'permissions',label:'Settings & Permissions',icon:'settings',group:'Admin',fn:'Roles and system settings'},
 {id:'audit',label:'Audit Trail',icon:'audit',group:'Admin',fn:'Activity and access history'}
];
const ROLES={
 admin:{label:'Super Admin',sub:'CBO Manager / LMMA Manager',user:'Fatuma Bakari',ini:'FB',
  mods:{overview:'r',dashboard:'w','live-map':'w',patrols:'w',incidents:'w','iweni-lmma':'w',projects:'w',coral:'w',staff:'w',bmus:'w',partners:'w',boats:'w',tourism:'w',finance:'w',reports:'w',permissions:'w',audit:'r'}},
 board:{label:'Board Chairperson',sub:'Governance and oversight',user:'Ali Shee',ini:'AS',approver:true,
  mods:{overview:'r',dashboard:'r','live-map':'r',incidents:'r','iweni-lmma':'r',projects:'r',bmus:'r',partners:'r',finance:'r',reports:'r'}},
 ranger:{label:'Marine Ranger',sub:'Field operations',user:'Hamisi Mwinyi',ini:'HM',
  mods:{overview:'r',dashboard:'s','live-map':'s',patrols:'s',incidents:'s'}},
 cox:{label:'Coxswain',sub:'Boat operations',user:'Said Famau',ini:'SF',
  mods:{overview:'r',dashboard:'s','live-map':'r',patrols:'r',boats:'s'}},
 officer:{label:'Conservation Officer',sub:'Project-based access',user:'Rehema Salim',ini:'RS',
  mods:{overview:'r',dashboard:'s','live-map':'s',projects:'s',coral:'s',reports:'s'}},
 fisheries:{label:'Fisheries Officer',sub:'Read-only access',user:'Bakari Mzee',ini:'BM',
  mods:{overview:'r',dashboard:'r','live-map':'r',patrols:'r','iweni-lmma':'r',projects:'r',coral:'r',reports:'r'}},
 bmu:{label:'BMU Representative',sub:'Restricted read-only access',user:'Mwanaisha Juma',ini:'MJ',
  mods:{overview:'r',dashboard:'r','live-map':'r',patrols:'r','iweni-lmma':'r',reports:'r'}},
 tourism:{label:'Tourism Officer',sub:'Tourism Management',user:'Salma Abdalla',ini:'SA',
  mods:{overview:'r',dashboard:'s',tourism:'w',reports:'s'}},
 finance:{label:'Finance Officer',sub:'Assigned financial functions',user:'Nuru Hassan',ini:'NH',
  mods:{overview:'r',dashboard:'s',finance:'w',reports:'s'}}
};
const BMUS=[{id:'pate',name:'Pate BMU',rep:'Mwanaisha Juma'},{id:'ishakani',name:'Shanga Ishakani BMU',rep:'Omar Bwanamaka'},{id:'rubu',name:'Shanga Rubu BMU',rep:'Zuhura Athman'}];
const bmuName=id=>(BMUS.find(b=>b.id===id)||{}).name||'';

/* ---------- projects ---------- */
const PROJECTS=[
 {id:'p1',name:'Coral Restoration Project',code:'CRP',lead:'Rehema Salim',progress:62,budget:1850000,spent:1020000,loc:'Iweni LMMA reef flats',due:'30 Jun 2027',
  obj:['Establish two coral nurseries inside the Iweni LMMA','Transplant 4,000 coral fragments by mid 2027','Monitor survival and bleaching every month'],
  tasks:[['Nursery frame maintenance','Rehema Salim','14 Nov 2026','In progress'],['Transplant batch 6','Rehema Salim','28 Nov 2026','Planned'],['Monthly reef monitoring','Hamisi Mwinyi','05 Dec 2026','Planned'],['Fragment tagging audit','Rehema Salim','31 Oct 2026','Done']],
  miles:[['Nursery sites approved','Done','Aug 2026'],['2,000 fragments transplanted','Done','Oct 2026'],['4,000 fragments transplanted','On track','Jun 2027']],
  updates:['Batch 5 transplanted at Kijiweni Reef Nursery. 312 fragments, 94% attached after 7 days.','Minor bleaching recorded at monitoring point M2. Re-check scheduled.'],
  docs:['Restoration protocol v2.pdf','Site survey Aug 2026.pdf','Fragment log Oct 2026.xlsx']},
 {id:'p2',name:'Mangrove Conservation Project',code:'MCP',lead:'Juma Athman',progress:48,budget:1200000,spent:540000,loc:'Pate Island north shore',due:'31 Mar 2027',
  obj:['Plant 15,000 mangrove propagules','Protect 12 hectares from cutting','Train 40 community monitors'],
  tasks:[['Propagule collection','Juma Athman','12 Nov 2026','In progress'],['Planting day, Pate BMU','Juma Athman','21 Nov 2026','Planned'],['Survival count plot 3','Juma Athman','02 Dec 2026','Planned']],
  miles:[['Nursery established','Done','Jul 2026'],['7,000 propagules planted','On track','Dec 2026']],
  updates:['6,420 propagules planted to date. Survival in plot 1 at 71%.'],docs:['Planting plan 2026.pdf','Plot map.pdf']},
 {id:'p3',name:'Environmental Education Project',code:'EEP',lead:'Juma Athman',progress:71,budget:640000,spent:390000,loc:'Pate, Shanga Ishakani, Shanga Rubu schools',due:'15 Dec 2026',
  obj:['Deliver 30 school sessions','Reach 900 learners','Run 3 community clean-up talks'],
  tasks:[['School session, Shanga Rubu','Juma Athman','18 Nov 2026','Planned'],['Teacher pack printing','Juma Athman','10 Nov 2026','Done']],
  miles:[['20 sessions delivered','Done','Oct 2026'],['30 sessions delivered','On track','Dec 2026']],
  updates:['23 sessions delivered. 612 learners reached.'],docs:['Session plan.pdf','Attendance Oct.xlsx']},
 {id:'p4',name:'Marine and Beach Cleanup Project',code:'MBC',lead:'Zawadi Omar',progress:55,budget:420000,spent:210000,loc:'Pate and Shanga beaches',due:'28 Feb 2027',
  obj:['Hold 12 monthly cleanups','Record weights by waste type','Engage 150 volunteers'],
  tasks:[['Cleanup, Shanga Ishakani beach','Zawadi Omar','15 Nov 2026','Planned'],['Waste weighing form review','Zawadi Omar','09 Nov 2026','Done']],
  miles:[['6 cleanups held','Done','Oct 2026'],['12 cleanups held','On track','Feb 2027']],
  updates:['October cleanup collected 214 kg, 61% plastics.'],docs:['Cleanup log.xlsx']},
 {id:'p5',name:'Ecotourism Development Project',code:'EDP',lead:'Zawadi Omar',progress:34,budget:980000,spent:260000,loc:'Pate Island and Iweni LMMA',due:'31 Aug 2027',
  obj:['Design 4 guided marine tours','Train 10 community guides','Agree visitor code of conduct with BMUs'],
  tasks:[['Guide training module 2','Zawadi Omar','20 Nov 2026','Planned'],['Tour route survey','Zawadi Omar','06 Nov 2026','In progress']],
  miles:[['Tour concepts drafted','Done','Sep 2026'],['Guides certified','Planned','Mar 2027']],
  updates:['Route survey for snorkelling tour completed with Shanga Rubu BMU.'],docs:['Tour concepts.pdf']}
];
const OFFICERS=[{id:'rehema',name:'Rehema Salim'},{id:'juma',name:'Juma Athman'},{id:'zawadi',name:'Zawadi Omar'}];
const ASSIGN0={rehema:['p1'],juma:['p2','p3'],zawadi:['p4','p5']};

/* ---------- patrols ---------- */
const PATROLS0=[
 {id:'PT-2026-0421',date:'12 Nov 2026',start:'06:00',end:'—',leader:'Hamisi Mwinyi',rangers:['Hamisi Mwinyi','Abdalla Kombo'],boat:'MV Mlinzi',cox:'Said Famau',area:'Iweni LMMA, northern zone',bmu:'pate',status:'Planned',review:'—',obs:0,inc:0,km:0,equip:['GPS handheld','Life jackets x4','First aid kit'],action:'—'},
 {id:'PT-2026-0418',date:'11 Nov 2026',start:'07:10',end:'—',leader:'Hamisi Mwinyi',rangers:['Hamisi Mwinyi','Kassim Bwana'],boat:'MV Mlinzi',cox:'Said Famau',area:'Iweni LMMA, central zone',bmu:'pate',status:'Active',review:'—',obs:4,inc:1,km:6.8,equip:['GPS handheld','Binoculars','Camera'],action:'Monitoring in progress'},
 {id:'PT-2026-0419',date:'11 Nov 2026',start:'06:30',end:'—',leader:'Mwanahawa Ali',rangers:['Mwanahawa Ali','Juma Mkuu'],boat:'Jahazi Bahari',cox:'Famau Said',area:'Shanga Ishakani coast',bmu:'ishakani',status:'Paused',review:'—',obs:2,inc:0,km:3.1,equip:['GPS handheld','Radio'],action:'Paused for engine check'},
 {id:'PT-2026-0417',date:'11 Nov 2026',start:'05:45',end:'09:20',leader:'Kassim Bwana',rangers:['Kassim Bwana','Abdalla Kombo'],boat:'MV Mlinzi',cox:'Said Famau',area:'Shanga Rubu reef edge',bmu:'rubu',status:'Pending Sync',review:'—',obs:6,inc:1,km:9.4,equip:['GPS handheld','Camera'],action:'Awaiting connection to sync'},
 {id:'PT-2026-0416',date:'10 Nov 2026',start:'06:00',end:'10:05',leader:'Hamisi Mwinyi',rangers:['Hamisi Mwinyi','Abdalla Kombo'],boat:'MV Mlinzi',cox:'Said Famau',area:'Iweni LMMA, southern zone',bmu:'pate',status:'Completed',review:'Pending review',obs:7,inc:2,km:11.2,equip:['GPS handheld','Binoculars','Camera'],action:'Two incidents reported'},
 {id:'PT-2026-0415',date:'09 Nov 2026',start:'06:15',end:'09:40',leader:'Mwanahawa Ali',rangers:['Mwanahawa Ali','Juma Mkuu'],boat:'Jahazi Bahari',cox:'Famau Said',area:'Shanga Ishakani coast',bmu:'ishakani',status:'Completed',review:'Reviewed',obs:5,inc:0,km:8.6,equip:['GPS handheld'],action:'None required'},
 {id:'PT-2026-0414',date:'08 Nov 2026',start:'06:00',end:'—',leader:'Kassim Bwana',rangers:['Kassim Bwana'],boat:'MV Mlinzi',cox:'Said Famau',area:'Shanga Rubu reef edge',bmu:'rubu',status:'Overdue',review:'—',obs:0,inc:0,km:0,equip:[],action:'Not started. Leader contacted.'},
 {id:'PT-2026-0412',date:'07 Nov 2026',start:'06:20',end:'10:30',leader:'Hamisi Mwinyi',rangers:['Hamisi Mwinyi','Kassim Bwana'],boat:'MV Mlinzi',cox:'Said Famau',area:'Iweni LMMA, central zone',bmu:'pate',status:'Completed',review:'Reviewed',obs:8,inc:1,km:12.5,equip:['GPS handheld','Camera','Binoculars'],action:'Referred to KWS'},
 {id:'PT-2026-0409',date:'05 Nov 2026',start:'06:10',end:'09:55',leader:'Mwanahawa Ali',rangers:['Mwanahawa Ali','Juma Mkuu'],boat:'Jahazi Bahari',cox:'Famau Said',area:'Pate south shore',bmu:'pate',status:'Completed',review:'Reviewed',obs:4,inc:0,km:7.9,equip:['GPS handheld'],action:'None required'}
];

/* ---------- incidents (stage 0 Submitted .. 4 Closed) ---------- */
const STAGES=['Submitted','Under review','Referred','Monitoring','Closed'];
const INC_CATS=['Suspected illegal fishing','Spearguns and restricted fishing gear','LMMA violations','No Take Zone violations','Illegal logging observations','Marine wildlife incidents','Coral damage','Coral bleaching','Pollution','Habitat destruction','Other conservation incidents'];
const INC0=[
 {id:'INC-2026-0091',date:'11 Nov 2026, 08:42',cat:'Suspected illegal fishing',ranger:'Hamisi Mwinyi',patrol:'PT-2026-0418',desc:'Two unregistered dhows seen working a net line inside the Gear Restricted Zone.',persons:'Occupants not identified',action:'Photographs taken, boats observed from distance',ref:'Fisheries Department',stage:1,x:480,y:520,loc:'sensitive'},
 {id:'INC-2026-0090',date:'11 Nov 2026, 08:05',cat:'Coral bleaching',ranger:'Kassim Bwana',patrol:'PT-2026-0417',desc:'Bleaching on about 15% of colonies at monitoring point M2.',persons:'None',action:'Photos and depth recorded',ref:'None',stage:0,x:640,y:470,loc:'open'},
 {id:'INC-2026-0088',date:'10 Nov 2026, 09:12',cat:'Spearguns and restricted fishing gear',ranger:'Hamisi Mwinyi',patrol:'PT-2026-0416',desc:'Speargun recovered near the southern reef edge. No persons present.',persons:'None',action:'Item retained and logged',ref:'Kenya Fisheries Service',stage:2,x:230,y:470,loc:'sensitive'},
 {id:'INC-2026-0087',date:'10 Nov 2026, 07:40',cat:'No Take Zone violations',ranger:'Hamisi Mwinyi',patrol:'PT-2026-0416',desc:'Small boat anchored on the reef inside the No Take Zone.',persons:'Two men, boat KMA-LAM-212',action:'Warned verbally, boat left the zone',ref:'KWS',stage:3,x:350,y:560,loc:'sensitive'},
 {id:'INC-2026-0084',date:'07 Nov 2026, 08:55',cat:'Marine wildlife incidents',ranger:'Hamisi Mwinyi',patrol:'PT-2026-0412',desc:'Green turtle caught in discarded net, released by crew.',persons:'None',action:'Turtle released alive, net removed',ref:'KWS',stage:4,x:760,y:400,loc:'open'},
 {id:'INC-2026-0079',date:'03 Nov 2026, 10:20',cat:'Pollution',ranger:'Mwanahawa Ali',patrol:'PT-2026-0409',desc:'Plastic waste accumulation along Pate south shore.',persons:'None',action:'Added to cleanup schedule',ref:'None',stage:3,x:150,y:650,loc:'open'},
 {id:'INC-2026-0074',date:'30 Oct 2026, 11:05',cat:'Illegal logging observations',ranger:'Kassim Bwana',patrol:'PT-2026-0398',desc:'Fresh mangrove stumps near the northern channel.',persons:'Unknown',action:'GPS location recorded',ref:'KFS',stage:2,x:700,y:110,loc:'sensitive'}
];

/* ---------- map items ---------- */
const TRACKS=[
 {id:'PT-2026-0418',status:'Active',bmu:'pate',pts:[[820,180],[730,225],[650,300],[570,360],[500,410],[420,445],[340,470],[260,482]]},
 {id:'PT-2026-0416',status:'Completed',bmu:'pate',pts:[[880,690],[790,650],[700,610],[610,600],[520,640],[430,690],[360,730]]},
 {id:'PT-2026-0409',status:'Completed',bmu:'pate',pts:[[100,560],[170,620],[260,680],[360,745],[450,705]]},
 {id:'PT-2026-0417',status:'Pending Sync',bmu:'rubu',pts:[[900,420],[840,470],[780,520],[720,560],[690,610]]}
];
const MAPITEMS=[
 {id:'m-r1',layer:'restoration',x:330,y:600,title:'Kijiweni Reef Nursery',when:'Last visit 09 Nov 2026',team:'Rehema Salim, Hamisi Mwinyi',desc:'Coral nursery frames with 1,240 attached fragments.',status:'Active',follow:'Monthly survival check due 05 Dec',proj:'p1'},
 {id:'m-r2',layer:'restoration',x:560,y:545,title:'Iweni Patch Reef Site',when:'Last visit 02 Nov 2026',team:'Rehema Salim',desc:'Transplant batch 5 area. 312 fragments.',status:'Active',follow:'Batch 6 planned 28 Nov',proj:'p1'},
 {id:'m-h1',layer:'habitat',x:420,y:565,title:'Reef monitoring point M1',when:'02 Nov 2026',team:'Hamisi Mwinyi',desc:'Live coral cover 46%. No bleaching.',status:'Healthy',follow:'Next survey Dec',proj:'p1'},
 {id:'m-h2',layer:'habitat',x:640,y:470,title:'Reef monitoring point M2',when:'11 Nov 2026',team:'Kassim Bwana',desc:'Bleaching on about 15% of colonies.',status:'Watch',follow:'Re-check within 14 days',proj:'p1'},
 {id:'m-w1',layer:'wildlife',x:760,y:400,title:'Green turtle sighting',when:'07 Nov 2026, 08:55',team:'Hamisi Mwinyi, Kassim Bwana',desc:'Adult turtle freed from discarded net.',status:'Resolved',follow:'None'},
 {id:'m-w2',layer:'wildlife',x:300,y:380,title:'Dolphin pod',when:'10 Nov 2026, 08:20',team:'Hamisi Mwinyi',desc:'Pod of about 8 bottlenose dolphins moving north.',status:'Logged',follow:'None'},
 {id:'m-c1',layer:'projects',x:640,y:80,title:'Mangrove planting, Pate BMU',when:'21 Nov 2026',team:'Juma Athman and BMU volunteers',desc:'Community planting day for 1,200 propagules.',status:'Planned',follow:'Confirm 60 volunteers',proj:'p2'},
 {id:'m-c2',layer:'projects',x:880,y:120,title:'Beach cleanup, Shanga Ishakani',when:'15 Nov 2026',team:'Zawadi Omar and volunteers',desc:'Monthly cleanup with waste weighing.',status:'Planned',follow:'Collect bags from store',proj:'p4'},
 {id:'m-b2',layer:'boats',x:820,y:130,title:'Jahazi Bahari',when:'Tracking enabled, moored',team:'Famau Said',desc:'Dhow moored at Pate jetty after patrol PT-2026-0415.',status:'Moored',follow:'Engine check due'}
];
const LAYERS=[
 {id:'patrols',label:'Patrols',shape:'line',color:'var(--c1)'},
 {id:'incidents',label:'Incidents',shape:'tri',color:'var(--coral)'},
 {id:'restoration',label:'Restoration',shape:'dia',color:'var(--good)'},
 {id:'zones',label:'LMMA zones',shape:'zone',color:'var(--zone-gear)'},
 {id:'boats',label:'Boats',shape:'sq',color:'var(--info)'},
 {id:'wildlife',label:'Marine wildlife',shape:'circ',color:'var(--c4)'},
 {id:'habitat',label:'Habitat observations',shape:'hex',color:'var(--warn)'},
 {id:'projects',label:'Conservation projects',shape:'flag',color:'var(--brand)'}
];
const LAYER_ACCESS={
 admin:['patrols','incidents','restoration','zones','boats','wildlife','habitat','projects'],
 board:['patrols','incidents','restoration','zones','boats','wildlife','habitat','projects'],
 ranger:['patrols','incidents','zones','wildlife','habitat','boats'],
 cox:['patrols','zones','boats'],
 officer:['restoration','zones','wildlife','habitat','projects'],
 fisheries:['patrols','zones','restoration','wildlife','habitat','projects'],
 bmu:['patrols','zones','projects'],
 tourism:[],finance:[]
};

/* ---------- tourism ---------- */
const TOUR0=[
 {id:'BK-1042',name:'Wanjiru family',cat:'Domestic',nat:'Kenya',n:4,act:'Snorkelling',dest:'Iweni LMMA',bmu:'pate',arr:'14 Nov 2026',guide:'Omar Bwanamaka',charge:12000,recv:12000,method:'M-Pesa',status:'Paid',receipt:'RC-3381',tx:'SKL4F9Q2',contact:'+254 7•• ••• 418',rec:'Salma Abdalla',recon:'Awaiting reconciliation'},
 {id:'BK-1041',name:'Nordic Dive Club',cat:'International',nat:'Sweden',n:8,act:'Coral reef visit',dest:'Iweni LMMA',bmu:'pate',arr:'12 Nov 2026',guide:'Kassim Famau',charge:96000,recv:48000,method:'Bank',status:'Partially paid',receipt:'RC-3379',tx:'BNK-77120',contact:'+46 •• ••• 214',rec:'Salma Abdalla',recon:'Awaiting reconciliation'},
 {id:'BK-1039',name:'Lamu Primary School trip',cat:'Local',nat:'Kenya',n:32,act:'Marine conservation tour',dest:'Shanga Rubu',bmu:'rubu',arr:'10 Nov 2026',guide:'Zuhura Athman',charge:9600,recv:9600,method:'Cash',status:'Paid',receipt:'RC-3374',tx:'CASH',contact:'+254 7•• ••• 902',rec:'Salma Abdalla',recon:'Reconciled'},
 {id:'BK-1038',name:'Hassan and Co.',cat:'Domestic',nat:'Kenya',n:6,act:'Boat trip',dest:'Pate Island',bmu:'pate',arr:'09 Nov 2026',guide:'Omar Bwanamaka',charge:18000,recv:0,method:'M-Pesa',status:'Unpaid',receipt:'—',tx:'—',contact:'+254 7•• ••• 177',rec:'Salma Abdalla',recon:'Not applicable'},
 {id:'BK-1036',name:'M. Schneider',cat:'International',nat:'Germany',n:2,act:'Cultural tour',dest:'Shanga Ishakani',bmu:'ishakani',arr:'07 Nov 2026',guide:'Kassim Famau',charge:7000,recv:7000,method:'M-Pesa',status:'Paid',receipt:'RC-3366',tx:'SKK1M0A8',contact:'+49 ••• ••• 531',rec:'Salma Abdalla',recon:'Reconciled'},
 {id:'BK-1034',name:'Coastal Walkers (group)',cat:'Domestic',nat:'Kenya',n:12,act:'Island visit',dest:'Pate Island',bmu:'pate',arr:'05 Nov 2026',guide:'Zuhura Athman',charge:24000,recv:24000,method:'Bank',status:'Paid',receipt:'RC-3360',tx:'BNK-76902',contact:'+254 7•• ••• 640',rec:'Salma Abdalla',recon:'Reconciled'},
 {id:'BK-1033',name:'R. Okafor',cat:'International',nat:'Nigeria',n:1,act:'Snorkelling',dest:'Iweni LMMA',bmu:'pate',arr:'04 Nov 2026',guide:'Omar Bwanamaka',charge:3000,recv:0,method:'Other',status:'Cancelled',receipt:'—',tx:'—',contact:'+234 ••• ••• 788',rec:'Salma Abdalla',recon:'Not applicable'},
 {id:'BK-1031',name:'Mwangi couple',cat:'Domestic',nat:'Kenya',n:2,act:'Ecotourism activity',dest:'Shanga Rubu',bmu:'rubu',arr:'02 Nov 2026',guide:'Zuhura Athman',charge:6000,recv:6000,method:'M-Pesa',status:'Refunded',receipt:'RC-3352',tx:'SKB7P3L1',contact:'+254 7•• ••• 233',rec:'Salma Abdalla',recon:'Reconciled'}
];
const TOUR_MONTHS=[['Jun',41],['Jul',58],['Aug',96],['Sep',74],['Oct',112],['Nov',67]];

/* ---------- finance ---------- */
const FIN0=[
 {id:'FN-2211',date:'10 Nov 2026',type:'Income',cat:'Tourism income',desc:'Tourism receipts week 45',amt:78000,ref:'TR-W45',receipt:'RC-3381 to RC-3374',status:'Submitted',by:'Nuru Hassan'},
 {id:'FN-2210',date:'09 Nov 2026',type:'Expense',cat:'Fuel',desc:'Fuel for MV Mlinzi, 120 L',amt:21600,ref:'FUEL-0911',receipt:'FS-8120',status:'Approved',by:'Nuru Hassan'},
 {id:'FN-2209',date:'08 Nov 2026',type:'Income',cat:'Grants',desc:'Grant instalment 3, Coral Restoration',amt:450000,ref:'BNK-77310',receipt:'GR-0044',status:'Reconciled',by:'Nuru Hassan'},
 {id:'FN-2208',date:'06 Nov 2026',type:'Expense',cat:'Boat maintenance',desc:'Outboard service, Jahazi Bahari',amt:34500,ref:'MPESA-SK77',receipt:'WS-221',status:'Submitted',by:'Nuru Hassan'},
 {id:'FN-2207',date:'05 Nov 2026',type:'Expense',cat:'Staff expenses',desc:'Ranger field allowances, October',amt:96000,ref:'PAY-1011',receipt:'PL-1011',status:'Approved',by:'Nuru Hassan'},
 {id:'FN-2206',date:'03 Nov 2026',type:'Income',cat:'Donations',desc:'Monthly donor contribution',amt:25000,ref:'SKQ9D3',receipt:'DN-0310',status:'Reconciled',by:'Nuru Hassan'},
 {id:'FN-2205',date:'02 Nov 2026',type:'Expense',cat:'Project expenses',desc:'Nursery frames and cable ties',amt:58200,ref:'MPESA-SK12',receipt:'PX-415',status:'Draft',by:'Nuru Hassan'},
 {id:'FN-2204',date:'31 Oct 2026',type:'Income',cat:'Conservation fees',desc:'LMMA access fees, October',amt:36000,ref:'CF-1031',receipt:'CF-1031',status:'Reconciled',by:'Nuru Hassan'}
];
const DONORS=[
 {name:'Coastal Giving Foundation (sample)',kind:'Recurring',amt:25000,status:'Paid',receipt:'DN-0310',last:'03 Nov 2026'},
 {name:'Anonymous donor',kind:'One-time',amt:10000,status:'Paid',receipt:'DN-0305',last:'28 Oct 2026'},
 {name:'Island Friends Circle',kind:'Recurring',amt:5000,status:'Pending',receipt:'—',last:'01 Nov 2026'},
 {name:'Marine Trust (sample)',kind:'One-time',amt:150000,status:'Paid',receipt:'DN-0291',last:'12 Oct 2026'}
];
const FIN_MONTHS=[['Jun',210,168],['Jul',260,214],['Aug',330,275],['Sep',298,240],['Oct',402,318],['Nov',589,211]];

/* ---------- staff, boats, equipment, board, partners ---------- */
const STAFF=[
 {no:'PCC-001',name:'Fatuma Bakari',title:'CBO Manager / LMMA Manager',dept:'Management',role:'Super Admin',bmu:'—',proj:'All',status:'Active',start:'Jan 2022'},
 {no:'PCC-004',name:'Hamisi Mwinyi',title:'Marine Ranger (Patrol leader)',dept:'Field operations',role:'Marine Ranger',bmu:'Pate BMU',proj:'Coral Restoration',status:'Active',start:'Mar 2022'},
 {no:'PCC-006',name:'Kassim Bwana',title:'Marine Ranger',dept:'Field operations',role:'Marine Ranger',bmu:'Shanga Rubu BMU',proj:'—',status:'Active',start:'Jun 2022'},
 {no:'PCC-007',name:'Mwanahawa Ali',title:'Marine Ranger (Patrol leader)',dept:'Field operations',role:'Marine Ranger',bmu:'Shanga Ishakani BMU',proj:'—',status:'Active',start:'Jun 2022'},
 {no:'PCC-009',name:'Said Famau',title:'Coxswain',dept:'Boat operations',role:'Coxswain',bmu:'Pate BMU',proj:'—',status:'Active',start:'Feb 2023'},
 {no:'PCC-011',name:'Rehema Salim',title:'Conservation Officer',dept:'Projects',role:'Conservation Officer',bmu:'Pate BMU',proj:'Coral Restoration',status:'Active',start:'Aug 2023'},
 {no:'PCC-012',name:'Juma Athman',title:'Conservation Officer',dept:'Projects',role:'Conservation Officer',bmu:'Shanga Ishakani BMU',proj:'Mangrove; Education',status:'Active',start:'Aug 2023'},
 {no:'PCC-013',name:'Zawadi Omar',title:'Conservation Officer',dept:'Projects',role:'Conservation Officer',bmu:'Shanga Rubu BMU',proj:'Cleanup; Ecotourism',status:'Active',start:'Sep 2023'},
 {no:'PCC-015',name:'Salma Abdalla',title:'Tourism Officer',dept:'Tourism',role:'Tourism Officer',bmu:'Pate BMU',proj:'Ecotourism',status:'Active',start:'Jan 2024'},
 {no:'PCC-016',name:'Nuru Hassan',title:'Finance Officer',dept:'Finance',role:'Finance Officer',bmu:'—',proj:'—',status:'Active',start:'Jan 2024'},
 {no:'PCC-018',name:'Bakari Mzee',title:'Fisheries Officer (read-only)',dept:'Partners liaison',role:'Fisheries Officer',bmu:'Shanga Ishakani BMU',proj:'—',status:'Active',start:'Mar 2024'},
 {no:'PCC-021',name:'Abdalla Kombo',title:'Marine Ranger',dept:'Field operations',role:'Marine Ranger',bmu:'Pate BMU',proj:'—',status:'On leave',start:'Oct 2024'}
];
const BOATS=[
 {name:'MV Mlinzi',reg:'KMA-LAM-241',engine:'Outboard 60 HP, serial YM-60-3318',cox:'Said Famau',status:'In service',service:'22 Oct 2026',fuel:'120 L issued, 84 L used',trip:'Patrol, Iweni LMMA',defect:'None open',cost:41200},
 {name:'Jahazi Bahari',reg:'KMA-LAM-198',engine:'Outboard 40 HP, serial YM-40-2207',cox:'Famau Said',status:'In service',service:'06 Nov 2026',fuel:'60 L issued, 38 L used',trip:'Patrol, Shanga Ishakani',defect:'Engine vibration, reported 11 Nov',cost:34500},
 {name:'Kipepeo',reg:'KMA-LAM-305',engine:'Outboard 15 HP, serial HD-15-9042',cox:'Unassigned',status:'Under repair',service:'18 Sep 2026',fuel:'—',trip:'—',defect:'Propeller shaft seal',cost:12800}
];
const EQUIP=[
 ['GPS handheld','GP-014','6','Good','Ranger team','Issued 01 Nov'],
 ['Life jackets','LJ-001 to 012','12','Good','MV Mlinzi','Issued 01 Nov'],
 ['Binoculars','BN-004','3','Fair','Hamisi Mwinyi','Issued 07 Nov'],
 ['Underwater camera','UC-002','1','Good','Rehema Salim','Issued 02 Nov'],
 ['Dive set (BCD, regulator)','DV-006','2','Needs service','Store','Returned 28 Oct'],
 ['VHF radio','VH-003','4','Good','Boats','Issued 01 Nov']
];
const BOARD=[['Ali Shee','Chairperson'],['Rukia Mohamed','Vice Chairperson'],['Hadija Said','Secretary'],['Mohamed Bakari','Treasurer'],['Mwanaisha Juma','Member, Pate BMU'],['Omar Bwanamaka','Member, Shanga Ishakani BMU'],['Zuhura Athman','Member, Shanga Rubu BMU']];
const MEETINGS=[
 ['06 Nov 2026','Board meeting','Approved FY2027 workplan outline. Noted tourism income growth.'],
 ['02 Oct 2026','Board meeting','Approved Coral Restoration budget revision.'],
 ['18 Sep 2026','Joint BMU forum','Agreed visitor code of conduct draft.']
];
const ACTIONS_BOARD=[['Approve Iweni boundary verification report','30 Nov 2026','Open'],['Review ecotourism pricing','15 Dec 2026','Open'],['Sign grant reporting letter','12 Nov 2026','Due soon']];
const PARTNERS=[
 {name:'Kenya Wildlife Service (KWS)',type:'Government agency',contact:'Lamu field office',shared:['Incident referrals','Patrol summaries'],eng:'Incident INC-2026-0087 referred 10 Nov 2026'},
 {name:'Kenya Forest Service (KFS)',type:'Government agency',contact:'Lamu forest station',shared:['Mangrove incident referrals'],eng:'Incident INC-2026-0074 referred 30 Oct 2026'},
 {name:'Kenya Fisheries Service',type:'Government agency',contact:'Lamu fisheries office',shared:['Gear incident referrals'],eng:'Incident INC-2026-0088 referred 10 Nov 2026'},
 {name:'Research Institute (sample)',type:'Research institution',contact:'Marine ecology team',shared:['Coral monitoring summary'],eng:'Reef survey meeting 22 Oct 2026'},
 {name:'Coastal Giving Foundation (sample)',type:'Donor',contact:'Programme officer',shared:['Quarterly impact report'],eng:'Report sent 05 Oct 2026'},
 {name:'Lamu County Government (sample)',type:'Government agency',contact:'Environment department',shared:[],eng:'Introductory meeting 14 Sep 2026'}
];

/* ---------- reports ---------- */
const REPORTS=[
 {id:'RPT-PAT-2026-10',name:'Patrol report, October 2026',type:'Patrol',bmu:'all',date:'01 Nov 2026',roles:['admin','board','fisheries','bmu','officer']},
 {id:'RPT-INC-2026-10',name:'Incident report, October 2026',type:'Incident',bmu:'all',date:'01 Nov 2026',roles:['admin','board']},
 {id:'RPT-LMA-2026-Q3',name:'Iweni LMMA quarterly report, Q3 2026',type:'LMMA',bmu:'all',date:'12 Oct 2026',roles:['admin','board','fisheries','bmu']},
 {id:'RPT-CRL-2026-10',name:'Coral restoration monitoring, October 2026',type:'Coral restoration',bmu:'all',date:'03 Nov 2026',roles:['admin','board','fisheries','officer']},
 {id:'RPT-PRJ-2026-Q3',name:'Project progress report, Q3 2026',type:'Project',bmu:'all',date:'10 Oct 2026',roles:['admin','board','fisheries','officer']},
 {id:'RPT-TOU-2026-10',name:'Tourism report, October 2026',type:'Tourism',bmu:'all',date:'02 Nov 2026',roles:['admin','board','tourism','finance']},
 {id:'RPT-BOA-2026-10',name:'Boat and equipment report, October 2026',type:'Boat and equipment',bmu:'all',date:'02 Nov 2026',roles:['admin','cox']},
 {id:'RPT-FIN-2026-10',name:'Financial report, October 2026',type:'Finance',bmu:'all',date:'04 Nov 2026',roles:['admin','board','finance']},
 {id:'RPT-DON-2026-Q3',name:'Donation report, Q3 2026',type:'Donation',bmu:'all',date:'09 Oct 2026',roles:['admin','board','finance']},
 {id:'RPT-BMU-2026-10',name:'BMU activity report, October 2026',type:'BMU',bmu:'all',date:'03 Nov 2026',roles:['admin','board','bmu']},
 {id:'RPT-GOV-2026-11',name:'Governance and Board report, November 2026',type:'Governance',bmu:'all',date:'07 Nov 2026',roles:['admin','board']},
 {id:'RPT-STF-2026-10',name:'Staff attendance report, October 2026',type:'Staff attendance',bmu:'all',date:'02 Nov 2026',roles:['admin']}
];
const DOCS=['Iweni LMMA management plan v3.pdf','Visitor code of conduct (draft).pdf','Patrol standard operating procedure.pdf','Grant agreement, Coral Restoration.pdf','Board minutes 06 Nov 2026.pdf'];

/* ---------- notifications and audit seed ---------- */
const NOTES={
 admin:['3 patrol reviews waiting','Incident INC-2026-0091 needs review','Defect reported: Jahazi Bahari engine','2 finance entries awaiting Board approval'],
 board:['Finance entries FN-2211 and FN-2208 need your approval','Grant reporting letter due 12 Nov'],
 ranger:['Patrol PT-2026-0421 assigned for 12 Nov, 06:00','1 record pending sync'],
 cox:['Pre-trip safety check due for MV Mlinzi','Engine defect reported on Jahazi Bahari'],
 officer:['Task due: Nursery frame maintenance, 14 Nov','Reef monitoring point M2 needs a re-check'],
 fisheries:['New report available: Patrol report, October 2026'],
 bmu:['New report available: Iweni LMMA quarterly report'],
 tourism:['Booking BK-1041 balance outstanding','Visitor group arrives 12 Nov'],
 finance:['Tourism receipts week 45 awaiting reconciliation','FN-2205 is still a draft']
};
const AUDIT0=[
 ['11 Nov 2026, 09:14','Fatuma Bakari','Reviewed incident','Events & Incidents','INC-2026-0087'],
 ['11 Nov 2026, 08:50','Hamisi Mwinyi','Submitted incident','Events & Incidents','INC-2026-0091'],
 ['11 Nov 2026, 07:10','Hamisi Mwinyi','Started patrol','Patrols','PT-2026-0418'],
 ['10 Nov 2026, 16:32','Nuru Hassan','Submitted finance entry','Finance','FN-2211'],
 ['10 Nov 2026, 15:02','Fatuma Bakari','Assigned officer to project','Settings & Permissions','Zawadi Omar to Ecotourism Development'],
 ['10 Nov 2026, 11:20','Salma Abdalla','Recorded payment','Tourism','BK-1041'],
 ['09 Nov 2026, 17:45','Fatuma Bakari','Toggled report download: Fisheries Officer = OFF','Settings & Permissions','SET-FISH-DL'],
 ['09 Nov 2026, 12:08','Mohamed Bakari','Approved finance entry','Finance','FN-2210'],
 ['08 Nov 2026, 10:30','Bakari Mzee','Report download','Reports','RPT-PAT-2026-10'],
 ['07 Nov 2026, 14:00','Fatuma Bakari','Shared document with partner','Stakeholders','KWS: Patrol summaries']
];
/* ============ shared UI components ============ */
const ICONS={
 dashboard:['M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z'],
 map:['M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z','M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z'],
 patrol:['M3 17c3-1 4-5 7-5s4 4 7 4 3-2 4-3','M5 7a2 2 0 1 0 0-.01','M19 7a2 2 0 1 0 0-.01','M7 7h10'],
 incident:['M12 3l10 18H2z','M12 10v5','M12 18v.01'],
 lmma:['M4 8l6-4 8 3 3 8-6 6-8-2z','M9 10l4 1 2 4'],
 projects:['M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'],
 coral:['M12 21v-7','M12 14c-3 0-5-2-5-5','M12 14c3 0 5-2 5-5','M7 9V5','M17 9V4','M12 14V8'],
 staff:['M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z','M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6','M16 4.5a3 3 0 0 1 0 6','M18 14c2.2.6 3.5 2.6 3.5 5'],
 bmus:['M4 20V9l8-5 8 5v11','M9 20v-6h6v6'],
 partners:['M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1','M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1'],
 boat:['M3 15l2 5h14l2-5z','M12 4v11','M12 5l6 8h-6','M12 7l-4 6h4'],
 tourism:['M12 3v2','M12 19v2','M3 12h2','M19 12h2','M5.6 5.6L7 7','M17 17l1.4 1.4','M5.6 18.4L7 17','M17 7l1.4-1.4','M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
 finance:['M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z','M14.5 9.5c-.5-.8-1.4-1.2-2.5-1.2-1.4 0-2.5.7-2.5 1.800 0 2.700 5 1.300 5 3.900 0 1.100-1.100 1.900-2.600 1.900-1.200 0-2.100-.5-2.600-1.300','M12 6.800v1.500','M12 15.700v1.500'],
 reports:['M6 3h8l4 4v14H6z','M14 3v4h4','M9 12h6','M9 16h6'],
 settings:['M4 7h9','M17 7h3','M4 17h3','M11 17h9','M15 5v4','M9 15v4'],
 audit:['M12 3l8 3v6c0 4.500-3.400 8-8 9-4.600-1-8-4.500-8-9V6z','M9 12l2 2 4-4'],
 bell:['M6 17V11a6 6 0 0 1 12 0v6l1.500 2h-15z','M10 21a2 2 0 0 0 4 0'],
 search:['M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z','M20 20l-4-4'],
 menu:['M4 7h16','M4 12h16','M4 17h16'],
 lock:['M6 11h12v9H6z','M8 11V8a4 4 0 0 1 8 0v3'],
 check:['M5 12.500l4.500 4.500L19 7'],
 x:['M6 6l12 12','M18 6L6 18'],
 wifi:['M2.500 9a14 14 0 0 1 19 0','M5.500 12.500a9.500 9.500 0 0 1 13 0','M8.800 16a5 5 0 0 1 6.400 0','M12 19.500v.01'],
 wifioff:['M3 3l18 18','M2.500 9a14 14 0 0 1 5-3','M16.500 6.500A14 14 0 0 1 21.500 9','M8.800 16a5 5 0 0 1 6.400 0','M12 19.500v.01'],
 plus:['M12 5v14','M5 12h14'],
 download:['M12 4v11','M7 11l5 5 5-5','M5 20h14'],
 camera:['M4 8h3l2-3h6l2 3h3v11H4z','M12 17a3.500 3.500 0 1 0 0-7 3.500 3.500 0 0 0 0 7z'],
 play:['M7 4l13 8-13 8z'],
 pause:['M7 4h3.500v16H7z','M13.500 4H17v16h-3.500z'],
 stop:['M6 6h12v12H6z'],
 chev:['M9 6l6 6-6 6'],
 eye:['M2 12s3.500-7 10-7 10 7 10 7-3.500 7-10 7S2 12 2 12z','M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'],
 sun:['M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z','M12 2v2','M12 20v2','M2 12h2','M20 12h2'],
 moon:['M20 14.500A8 8 0 0 1 9.500 4 8 8 0 1 0 20 14.500z'],
 pin:['M12 21s-6-5-6-10a6 6 0 0 1 12 0c0 5-6 10-6 10z'],
 sync:['M20 11a8 8 0 0 0-14.500-3.500L4 9','M4 4v5h5','M4 13a8 8 0 0 0 14.500 3.500L20 15','M20 20v-5h-5'],
 out:['M10 4H5v16h5','M15 8l4 4-4 4','M19 12H9'],
 shield:['M12 3l8 3v6c0 4.500-3.400 8-8 9-4.600-1-8-4.500-8-9V6z'],
 globe:['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z','M3 12h18','M12 3c2.500 2.500 3.800 5.500 3.800 9s-1.300 6.500-3.800 9c-2.500-2.500-3.800-5.500-3.800-9S9.500 5.500 12 3z'],
 phone:['M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z','M11 18h2'],
 route:['M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z','M18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4z','M8 17h6a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h6'],
 target:['M12 15.500a3.500 3.500 0 1 0 0-7 3.500 3.500 0 0 0 0 7z','M12 2v3','M12 19v3','M2 12h3','M19 12h3'],
 info:['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z','M12 11v5','M12 8v.01'],
 plusc:['M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z','M12 9v6','M9 12h6']
};
const Icon=({n,s=18,sw=1.8})=>html`<svg width=${s} height=${s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth=${sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="ico">${(ICONS[n]||[]).map((d,i)=>html`<path key=${i} d=${d}/>`)}</svg>`;

const TONE={Planned:'info',Active:'good',Paused:'warn',Completed:'neutral','Pending Sync':'warn',Overdue:'crit',Reviewed:'good','Pending review':'warn',
 Paid:'good','Partially paid':'warn',Unpaid:'crit',Refunded:'neutral',Cancelled:'neutral',Draft:'neutral',Submitted:'info',Approved:'good',Reconciled:'good',
 Income:'good',Expense:'neutral','In progress':'info',Done:'good','On track':'good',Open:'info','Due soon':'warn','In service':'good','Under repair':'crit',Good:'good',Fair:'warn','Needs service':'crit',
 Healthy:'good',Watch:'warn',Resolved:'neutral',Logged:'neutral',Moored:'neutral','On leave':'warn',Pending:'warn','Awaiting reconciliation':'warn','Not applicable':'neutral',
 Verified:'good','Awaiting verification':'warn'};
const Chip=({t,tone,dot=true})=>html`<span className=${'chip '+(tone||TONE[t]||'neutral')}>${dot&&html`<i/>`}${t}</span>`;

const PageHead=({title,sub,children})=>html`<div className="pagehead"><div><h1>${title}</h1>${sub&&html`<p>${sub}</p>`}</div><div className="pagehead-actions">${children}</div></div>`;
const Card=({title,sub,right,children,className=''})=>html`<section className=${'card '+className}>${(title||right)&&html`<header className="card-h"><div><h2>${title}</h2>${sub&&html`<p>${sub}</p>`}</div>${right}</header>`}<div className="card-b">${children}</div></section>`;
const Kpi=({label,value,note,tone})=>html`<div className="kpi"><span className="kpi-l">${label}</span><strong className="kpi-v">${value}</strong>${note&&html`<span className=${'kpi-n '+(tone||'')}>${note}</span>`}</div>`;
const Btn=({children,onClick,kind='',icon,disabled,title,type='button',id})=>html`<button id=${id} type=${type} className=${'btn '+kind} onClick=${onClick} disabled=${disabled} title=${title}>${icon&&html`<${Icon} n=${icon} s=${16}/>`}${children}</button>`;
const Toggle=({on,onChange,label,id})=>html`<button id=${id} type="button" role="switch" aria-checked=${on} aria-label=${label} className=${'toggle '+(on?'on':'')} onClick=${()=>onChange(!on)}><i/><span>${on?'ON':'OFF'}</span></button>`;
const Notice=({tone='info',title,children})=>html`<div className=${'notice '+tone}><strong>${title}</strong><span>${children}</span></div>`;
const Progress=({v,tone})=>html`<div className="prog" role="progressbar" aria-valuenow=${v} aria-valuemin="0" aria-valuemax="100"><i className=${tone||''} style=${{width:v+'%'}}/></div>`;
const Tabs=({tabs,value,onChange})=>html`<div className="tabs" role="tablist">${tabs.map(t=>html`<button key=${t[0]} role="tab" aria-selected=${value===t[0]} className=${value===t[0]?'on':''} onClick=${()=>onChange(t[0])}>${t[1]}</button>`)}</div>`;
const Field=({label,id,children,wide})=>html`<div className=${'field '+(wide?'wide':'')}><label htmlFor=${id}>${label}</label>${children}</div>`;
const Sel=({id,value,onChange,opts})=>html`<select id=${id} value=${value} onChange=${e=>onChange(e.target.value)}>${opts.map(o=>Array.isArray(o)?html`<option key=${o[0]} value=${o[0]}>${o[1]}</option>`:html`<option key=${o} value=${o}>${o}</option>`)}</select>`;
const Inp=({id,value,onChange,type='text',placeholder})=>html`<input id=${id} type=${type} value=${value} placeholder=${placeholder} onChange=${e=>onChange(e.target.value)}/>`;

const Table=({cols,rows,onRow,empty='No records to show.',sel})=>html`<div className="tscroll"><table className="tbl"><thead><tr>${cols.map(c=>html`<th key=${c.k} className=${c.cls||''}>${c.h}</th>`)}</tr></thead><tbody>${rows.length?rows.map((r,i)=>html`<tr key=${r.id||r.no||i} className=${(onRow?'click ':'')+(sel&&sel===r.id?'sel':'')} onClick=${onRow?()=>onRow(r):null} tabIndex=${onRow?0:null} onKeyDown=${onRow?e=>{if(e.key==='Enter')onRow(r);}:null}>${cols.map(c=>html`<td key=${c.k} className=${c.cls||''}>${c.r?c.r(r):r[c.k]}</td>`)}</tr>`):html`<tr><td colSpan=${cols.length} className="empty">${empty}</td></tr>`}</tbody></table></div>`;

const Drawer=({open,onClose,title,sub,children,foot})=>{
 useEffect(()=>{if(!open)return;const f=e=>{if(e.key==='Escape')onClose();};window.addEventListener('keydown',f);return()=>window.removeEventListener('keydown',f);},[open]);
 if(!open)return null;
 return html`<div className="overlay" onClick=${onClose}><aside className="drawer" role="dialog" aria-modal="true" aria-label=${title} onClick=${e=>e.stopPropagation()}><header><div><h2>${title}</h2>${sub&&html`<p>${sub}</p>`}</div><button className="iconbtn" onClick=${onClose} aria-label="Close"><${Icon} n="x"/></button></header><div className="drawer-b">${children}</div>${foot&&html`<footer>${foot}</footer>`}</aside></div>`;
};
const Modal=({open,onClose,title,children,foot})=>{
 useEffect(()=>{if(!open)return;const f=e=>{if(e.key==='Escape')onClose();};window.addEventListener('keydown',f);return()=>window.removeEventListener('keydown',f);},[open]);
 if(!open)return null;
 return html`<div className="overlay center" onClick=${onClose}><div className="modal" role="dialog" aria-modal="true" aria-label=${title} onClick=${e=>e.stopPropagation()}><header><h2>${title}</h2><button className="iconbtn" onClick=${onClose} aria-label="Close"><${Icon} n="x"/></button></header><div className="modal-b">${children}</div>${foot&&html`<footer>${foot}</footer>`}</div></div>`;
};
const KV=({rows})=>html`<dl className="kv">${rows.map(r=>html`<div key=${r[0]}><dt>${r[0]}</dt><dd>${r[1]}</dd></div>`)}</dl>`;

const Denied=({mod,role,why})=>{const proj=why==='project';const lines=proj?['GET /api/projects/p2/records','→ 403 Forbidden','  policy: project_isolation (row-level security)','  user: '+ROLES[role].user+' · assigned projects: 1 of 5']:['GET /api/'+mod.toLowerCase().replace(/[^a-z]+/g,'-')+'/records','→ 403 Forbidden','  policy: role_permissions','  user: '+ROLES[role].user+' · role: '+ROLES[role].label];
 return html`<div className="denied"><div className="denied-ic"><${Icon} n="lock" s=${28}/></div><h2>${proj?'You are not assigned to '+mod:mod+' is not part of the '+ROLES[role].label+' role'}</h2><p>${proj?'Only the Super Admin can assign officers to projects. Pages, records, photographs, documents and reports of other projects stay closed.':'This view is hidden for this role.'} The request would also be refused by the server. In the real build every record is checked in the API and the database, so changing the page address or calling the API directly returns the same <code>403 Forbidden</code>.</p><pre className="code">${lines.join('\n')}</pre></div>`;};

/* ---------- charts ---------- */
const BarChart=({data,color='var(--c1)',unit='',h=190,hi})=>{
 const [tip,setTip]=useState(null);
 const W=520,H=h,L=34,B=24,T=10,R=8;const max=Math.max(...data.map(d=>d[1]))*1.15||1;const step=Math.pow(10,Math.floor(Math.log10(max)));const ticks=[0,1,2,3,4].map(i=>Math.round(max/4*i/step)*step);
 const bw=(W-L-R)/data.length;
 return html`<div className="chart"><svg viewBox=${`0 0 ${W} ${H}`} role="img" aria-label="Bar chart" onMouseLeave=${()=>setTip(null)}>
 ${ticks.map(t=>html`<g key=${t}><line x1=${L} x2=${W-R} y1=${H-B-(H-B-T)*t/max} y2=${H-B-(H-B-T)*t/max} className="grid"/><text x=${L-6} y=${H-B-(H-B-T)*t/max+4} textAnchor="end" className="axis">${t}</text></g>`)}
 ${data.map((d,i)=>{const bh=(H-B-T)*d[1]/max;const x=L+i*bw+bw*.2;const w=bw*.6;return html`<g key=${d[0]} onMouseEnter=${()=>setTip(i)}><rect x=${L+i*bw} y=${T} width=${bw} height=${H-B-T} fill="transparent"/><path d=${`M${x},${H-B} V${H-B-bh+4} a4,4 0 0 1 4,-4 h${w-8} a4,4 0 0 1 4,4 V${H-B} Z`} fill=${hi===i?'var(--c2)':color} opacity=${tip===null||tip===i?1:.55}/><text x=${x+w/2} y=${H-7} textAnchor="middle" className="axis">${d[0]}</text></g>`;})}
 ${tip!==null&&html`<g><rect x=${Math.min(L+tip*bw+bw/2-44,W-96)} y=${6} width="88" height="22" rx="5" className="tipbox"/><text x=${Math.min(L+tip*bw+bw/2-44,W-96)+44} y=${21} textAnchor="middle" className="tiptext">${data[tip][0]}: ${data[tip][1]}${unit}</text></g>`}
 </svg></div>`;
};
const LineChart=({labels,series,unit='',h=210,yMin=0,yMax})=>{
 const [ix,setIx]=useState(null);
 const W=520,H=h,L=36,B=26,T=14,R=64;const mx=yMax||Math.max(...series.flatMap(s=>s.v))*1.1;
 const X=i=>L+(W-L-R)*i/(labels.length-1);const Y=v=>H-B-(H-B-T)*(v-yMin)/(mx-yMin);
 const ticks=[0,1,2,3,4].map(i=>Math.round(yMin+(mx-yMin)*i/4));
 const mv=e=>{const r=e.currentTarget.getBoundingClientRect();const px=(e.clientX-r.left)/r.width*W;const i=Math.round((px-L)/((W-L-R)/(labels.length-1)));setIx(Math.max(0,Math.min(labels.length-1,i)));};
 return html`<div className="chart"><div className="legend">${series.map(s=>html`<span key=${s.name}><i style=${{background:s.color}}/>${s.name}</span>`)}</div>
 <svg viewBox=${`0 0 ${W} ${H}`} role="img" aria-label="Line chart" onMouseMove=${mv} onMouseLeave=${()=>setIx(null)}>
 ${ticks.map(t=>html`<g key=${t}><line x1=${L} x2=${W-R} y1=${Y(t)} y2=${Y(t)} className="grid"/><text x=${L-6} y=${Y(t)+4} textAnchor="end" className="axis">${t}${unit}</text></g>`)}
 ${labels.map((l,i)=>html`<text key=${l} x=${X(i)} y=${H-8} textAnchor="middle" className="axis">${l}</text>`)}
 ${ix!==null&&html`<line x1=${X(ix)} x2=${X(ix)} y1=${T} y2=${H-B} className="cross"/>`}
 ${series.map(s=>html`<g key=${s.name}><polyline points=${s.v.map((v,i)=>`${X(i)},${Y(v)}`).join(' ')} fill="none" stroke=${s.color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round"/>
 ${s.v.map((v,i)=>(i===s.v.length-1||ix===i)&&html`<circle key=${i} cx=${X(i)} cy=${Y(v)} r="4.5" fill=${s.color} stroke="var(--surface)" strokeWidth="2"/>`)}
 <text x=${X(s.v.length-1)+9} y=${Y(s.v[s.v.length-1])+4} className="endlabel">${s.name.split(' ')[0]} ${s.v[s.v.length-1]}${unit}</text></g>`)}
 ${ix!==null&&html`<g><rect x=${Math.min(X(ix)+8,W-R-120)} y=${T} width="118" height=${18+series.length*16} rx="5" className="tipbox"/><text x=${Math.min(X(ix)+8,W-R-120)+8} y=${T+14} className="tiptext" fontWeight="600">${labels[ix]}</text>${series.map((s,k)=>html`<text key=${s.name} x=${Math.min(X(ix)+8,W-R-120)+8} y=${T+30+k*16} className="tiptext">${s.name.split(' ')[0]}: ${s.v[ix]}${unit}</text>`)}</g>`}
 </svg></div>`;
};
const HBars=({data,color='var(--c1)',fmt=v=>v})=>{const mx=Math.max(...data.map(d=>d[1]))||1;return html`<ul className="hbars">${data.map(d=>html`<li key=${d[0]}><span className="hb-l">${d[0]}</span><span className="hb-t"><i style=${{width:(d[1]/mx*100)+'%',background:color}}/></span><span className="hb-v">${fmt(d[1])}</span></li>`)}</ul>`;};

/* ---------- Iweni map ---------- */
const poly=pts=>pts.map(p=>p.join(',')).join(' ');
const Marker=({layer,x,y,sel,onClick,label,dim})=>{
 const L=LAYERS.find(l=>l.id===layer);const c=L.color;const s=sel?1.35:1;
 const g=(shape=>{switch(shape){
  case 'tri':return html`<path d="M0,-11 L10,8 L-10,8 Z" fill=${c}/>`;
  case 'dia':return html`<path d="M0,-11 L10,0 L0,11 L-10,0 Z" fill=${c}/>`;
  case 'sq':return html`<rect x="-8" y="-8" width="16" height="16" rx="2" fill=${c}/>`;
  case 'hex':return html`<path d="M-5,-9 L5,-9 L10,0 L5,9 L-5,9 L-10,0 Z" fill=${c}/>`;
  case 'flag':return html`<path d="M-6,10 V-10 L9,-5 L-6,0" fill=${c}/>`;
  default:return html`<circle r="8" fill=${c}/>`;}})(L.shape);
 return html`<g className="mk" transform=${`translate(${x},${y}) scale(${s})`} onClick=${onClick} opacity=${dim?.35:1} tabIndex="0" role="button" aria-label=${label} onKeyDown=${e=>{if(e.key==='Enter')onClick();}}><circle r="17" fill="transparent"/><g stroke="var(--surface)" strokeWidth="2.5" strokeLinejoin="round">${g}</g>${sel&&html`<circle r="19" fill="none" stroke="var(--ink)" strokeWidth="2" strokeDasharray="4 3"/>`}<title>${label}</title></g>`;
};
const along=(pts,t)=>{const seg=[];let tot=0;for(let i=1;i<pts.length;i++){const d=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);seg.push(d);tot+=d;}let r=t*tot;for(let i=0;i<seg.length;i++){if(r<=seg[i]){const f=r/seg[i];return[pts[i][0]+(pts[i+1][0]-pts[i][0])*f,pts[i][1]+(pts[i+1][1]-pts[i][1])*f];}r-=seg[i];}return pts[pts.length-1];};
const useLive=(enabled=true)=>{const [t,setT]=useState(.45);useEffect(()=>{if(!enabled)return;const i=setInterval(()=>setT(v=>v>=.98?.45:v+.012),1100);return()=>clearInterval(i);},[enabled]);return t;};

const MapLegend=({layers})=>html`<ul className="mlegend">${LAYERS.filter(l=>layers.includes(l.id)).map(l=>html`<li key=${l.id}><svg width="16" height="16" viewBox="-12 -12 24 24"><g stroke="var(--surface)" strokeWidth="1.5">${l.shape==='line'?html`<path d="M-10,0 H10" stroke=${l.color} strokeWidth="4"/>`:l.shape==='zone'?html`<rect x="-9" y="-9" width="18" height="18" fill=${l.color} fillOpacity=".4" stroke=${l.color} strokeWidth="2"/>`:l.shape==='tri'?html`<path d="M0,-10 L10,8 L-10,8 Z" fill=${l.color}/>`:l.shape==='dia'?html`<path d="M0,-10 L10,0 L0,10 L-10,0 Z" fill=${l.color}/>`:l.shape==='sq'?html`<rect x="-8" y="-8" width="16" height="16" fill=${l.color}/>`:l.shape==='hex'?html`<path d="M-5,-9 L5,-9 L10,0 L5,9 L-5,9 L-10,0 Z" fill=${l.color}/>`:l.shape==='flag'?html`<path d="M-6,10 V-10 L9,-5 L-6,0" fill=${l.color}/>`:html`<circle r="8" fill=${l.color}/>`}</g></svg>${l.label}</li>`)}</ul>`;
/* ============ real-map engine: Web Mercator slippy map with vector overlays ============ */
/* Tile sources are public servers for the demo. A live deployment should use a licensed provider or its own tile server (see README). */
const TILES={
 sat:{label:'Satellite',url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',max:18,attr:'Imagery © Esri, Maxar, Earthstar Geographics'},
 osm:{label:'Streets',url:'https://tile.openstreetmap.org/{z}/{x}/{y}.png',max:19,attr:'© OpenStreetMap contributors'}
};
const TILE_CACHE='pops-tiles-v1';
const tileUrl=(b,z,x,y)=>TILES[b].url.replace('{z}',z).replace('{x}',x).replace('{y}',y);
const WORLD=z=>256*Math.pow(2,z);
const mx=(lon,z)=>(lon+180)/360*WORLD(z);
const my=(lat,z)=>{const s=Math.sin(lat*Math.PI/180);return (0.5-Math.log((1+s)/(1-s))/(4*Math.PI))*WORLD(z);};
const lonOf=(x,z)=>x/WORLD(z)*360-180;
const latOf=(y,z)=>{const n=Math.PI-2*Math.PI*y/WORLD(z);return 180/Math.PI*Math.atan(0.5*(Math.exp(n)-Math.exp(-n)));};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ZMIN=11,ZMAX=19;
const bbOf=ll=>({n:Math.max(...ll.map(p=>p[0])),s:Math.min(...ll.map(p=>p[0])),w:Math.min(...ll.map(p=>p[1])),e:Math.max(...ll.map(p=>p[1]))});
const fitView=(bb,w,h,pad=36)=>{const dx=mx(bb.e,0)-mx(bb.w,0)||1e-6,dy=my(bb.s,0)-my(bb.n,0)||1e-6;const z=clamp(Math.min(Math.log2(Math.max(40,w-2*pad)/dx),Math.log2(Math.max(40,h-2*pad)/dy)),ZMIN,17.5);return {z,lon:(bb.w+bb.e)/2,lat:latOf((my(bb.n,z)+my(bb.s,z))/2,z)};};
const haversine=(a,b)=>{const R=6371000,r=Math.PI/180,dLa=(b[0]-a[0])*r,dLo=(b[1]-a[1])*r,q=Math.sin(dLa/2)**2+Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin(dLo/2)**2;return 2*R*Math.asin(Math.sqrt(q));};
const LMMA_LL=LMMA_PTS.map(p=>[p.la,p.lo]);
const LMMA_BB=bbOf(LMMA_LL);
const OUTER_LL=OUTER.map(p=>unproj(p[0],p[1]));
const CORE_LL=CORE.map(p=>unproj(p[0],p[1]));
const niceDeg=[2,1,.5,.2,.1,.05,.02,.01,.005,.002,.001,.0005,.0002,.0001];

/* save the area around the LMMA for offline use (the service worker answers tile requests from this cache) */
const tilesForArea=(base,z0=12,z1=16,margin=.006)=>{const out=[];for(let z=z0;z<=z1;z++){const n=Math.pow(2,z);const xa=Math.floor(mx(LMMA_BB.w-margin,z)/256),xb=Math.floor(mx(LMMA_BB.e+margin,z)/256),ya=Math.floor(my(LMMA_BB.n+margin,z)/256),yb=Math.floor(my(LMMA_BB.s-margin,z)/256);for(let x=xa;x<=xb;x++)for(let y=ya;y<=yb;y++)if(y>=0&&y<n)out.push(tileUrl(base,z,((x%n)+n)%n,y));}return out;};
const OfflineMapBtn=({base,compact})=>{
 const [st,setSt]=useState({n:0,t:0,run:false,done:false,err:''});
 const ok=typeof caches!=='undefined'&&/^https?:/.test(location.protocol);
 const run=async()=>{
  const urls=tilesForArea(base);setSt({n:0,t:urls.length,run:true,done:false,err:''});
  try{const c=await caches.open(TILE_CACHE);let n=0,bad=0,i=0;
   const work=async()=>{while(i<urls.length){const u=urls[i++];try{if(!(await c.match(u))){const r=await fetch(u,{mode:'cors'});if(r.ok)await c.put(u,r);else bad++;}}catch(e){bad++;}n++;setSt(s=>({...s,n}));}};
   await Promise.all([work(),work(),work(),work(),work(),work()]);
   setSt({n:urls.length,t:urls.length,run:false,done:bad<urls.length,err:bad===urls.length?'Could not reach the map server. Check the connection and try again.':bad?bad+' tiles were skipped':''});
  }catch(e){setSt(s=>({...s,run:false,err:'Offline storage is not available here.'}));}
 };
 return html`<div className=${'offmap '+(compact?'compact':'')}><button className="btn small" disabled=${!ok||st.run} onClick=${run} title=${ok?'':'Available when the app is opened from its web address'}><${Icon} n="download" s=${15}/>${st.run?'Saving '+st.n+' / '+st.t:st.done?'Map saved for offline use':'Save map for offline use'}</button>${(st.done||st.err)&&html`<small>${st.done?st.t+' tiles saved. '+st.err:st.err}</small>`}${!ok&&html`<small>Works in the installed app.</small>`}</div>`;
};

const GeoMap=({layers=['zones','patrols'],items=[],tracks=[],sel,onSel,points=[],showPts,fit='lmma',locked,compact,height,myPos,myTrack,showLive=true,follow})=>{
 const box=useRef(null);const [size,setSize]=useState({w:0,h:0});const [view,setView]=useState(null);const vref=useRef(null);
 const [base,setBaseS]=useState(()=>{try{return localStorage.getItem('pops-base')||'sat';}catch(e){return 'sat';}});
 const setBase=b=>{setBaseS(b);setTl({ok:0,bad:0});try{localStorage.setItem('pops-base',b);}catch(e){}};
 const [tl,setTl]=useState({ok:0,bad:0});const [hint,setHint]=useState(false);
 const on=id=>layers.includes(id);
 const live=useLive(showLive&&on('boats'));
 const setV=v=>{vref.current=v;setView(v);};
 /* measure */
 useEffect(()=>{const el=box.current;if(!el)return;const m=()=>{const r=el.getBoundingClientRect();setSize(s=>(Math.abs(s.w-r.width)>1||Math.abs(s.h-r.height)>1)?{w:r.width,h:r.height}:s);};m();let ro;if(window.ResizeObserver){ro=new ResizeObserver(m);ro.observe(el);}window.addEventListener('resize',m);return()=>{if(ro)ro.disconnect();window.removeEventListener('resize',m);};},[]);
 /* first fit */
 const trackLL=tr=>tr.ll||tr.pts.map(p=>unproj(p[0],p[1]));
 useEffect(()=>{if(!size.w||vref.current)return;let bb=LMMA_BB;if(fit==='tracks'&&tracks.length){bb=bbOf(tracks.flatMap(trackLL));}setV(fitView(bb,size.w,size.h,fit==='tracks'?28:40));},[size.w,size.h]);
 /* fly to selection */
 useEffect(()=>{if(!sel||!vref.current)return;const it=items.find(i=>i.id===sel)||(sel.startsWith&&sel.startsWith('pt-')&&points.find(p=>'pt-'+p.n===sel));if(!it)return;const [la,lo]=it.pt?[it.pt.la,it.pt.lo]:unproj(it.x,it.y);setV({lat:la,lon:lo,z:Math.max(vref.current.z,16)});},[sel]);
 useEffect(()=>{if(!follow||!myPos||!vref.current)return;const v=vref.current;setV({...v,lat:myPos.lat,lon:myPos.lon,z:v.z<15.5?16:v.z});},[follow,myPos&&myPos.lat,myPos&&myPos.lon]);
 const refit=()=>setV(fitView(LMMA_BB,size.w,size.h,40));
 const pan=(dx,dy)=>{const v=vref.current;if(!v)return;setV({...v,lon:lonOf(mx(v.lon,v.z)-dx,v.z),lat:latOf(my(v.lat,v.z)-dy,v.z)});};
 const zoomAt=(nz,px,py)=>{const v=vref.current;if(!v)return;nz=clamp(nz,ZMIN,ZMAX);const ox=px-size.w/2,oy=py-size.h/2;const lon=lonOf(mx(v.lon,v.z)+ox,v.z),lat=latOf(my(v.lat,v.z)+oy,v.z);setV({z:nz,lon:lonOf(mx(lon,nz)-ox,nz),lat:latOf(my(lat,nz)-oy,nz)});};
 /* gestures */
 const ptrs=useRef(new Map());
 const rel=e=>{const r=box.current.getBoundingClientRect();return [e.clientX-r.left,e.clientY-r.top];};
 const down=e=>{if(locked||e.button>0)return;ptrs.current.set(e.pointerId,{x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,moved:false});};
 const move=e=>{const p=ptrs.current.get(e.pointerId);if(!p)return;const nx=e.clientX,ny=e.clientY;
  if(ptrs.current.size===1){if(!p.moved&&Math.hypot(nx-p.sx,ny-p.sy)>5){p.moved=true;try{box.current.setPointerCapture(e.pointerId);}catch(x){}}if(p.moved)pan(nx-p.x,ny-p.y);}
  else if(ptrs.current.size===2){const other=[...ptrs.current.entries()].find(k=>k[0]!==e.pointerId)[1];const d0=Math.hypot(p.x-other.x,p.y-other.y),d1=Math.hypot(nx-other.x,ny-other.y);const r=box.current.getBoundingClientRect();const mxp=(nx+other.x)/2-r.left,myp=(ny+other.y)/2-r.top;p.moved=true;if(d0>0&&vref.current)zoomAt(vref.current.z+Math.log2(d1/d0),mxp,myp);pan((nx-p.x)/2,(ny-p.y)/2);}
  p.x=nx;p.y=ny;};
 const up=e=>{ptrs.current.delete(e.pointerId);};
 useEffect(()=>{const el=box.current;if(!el||locked)return;const w=e=>{if(!(e.ctrlKey||e.metaKey)){setHint(true);clearTimeout(w.t);w.t=setTimeout(()=>setHint(false),1400);return;}e.preventDefault();const r=el.getBoundingClientRect();zoomAt((vref.current?vref.current.z:12)-e.deltaY*(e.deltaMode?.05:.01),e.clientX-r.left,e.clientY-r.top);};el.addEventListener('wheel',w,{passive:false});return()=>el.removeEventListener('wheel',w);},[size.w,size.h,locked]);
 const key=e=>{if(locked||!vref.current)return;const s=80;if(e.key==='ArrowLeft')pan(s,0);else if(e.key==='ArrowRight')pan(-s,0);else if(e.key==='ArrowUp')pan(0,s);else if(e.key==='ArrowDown')pan(0,-s);else if(e.key==='+'||e.key==='=')zoomAt(vref.current.z+1,size.w/2,size.h/2);else if(e.key==='-')zoomAt(vref.current.z-1,size.w/2,size.h/2);else return;e.preventDefault();};
 /* draw */
 let body=null;
 if(view&&size.w){
  const z=view.z,cxw=mx(view.lon,z),cyw=my(view.lat,z);
  const S=(la,lo)=>[mx(lo,z)-cxw+size.w/2,my(la,z)-cyw+size.h/2];
  const P=ll=>ll.map(p=>S(p[0],p[1]).map(v=>v.toFixed(1)).join(',')).join(' ');
  const tz=Math.min(Math.round(z),TILES[base].max),sc=Math.pow(2,z-tz),n=Math.pow(2,tz),tcx=mx(view.lon,tz),tcy=my(view.lat,tz);
  const x0=Math.floor((tcx-size.w/2/sc)/256),x1=Math.floor((tcx+size.w/2/sc)/256),y0=Math.floor((tcy-size.h/2/sc)/256),y1=Math.floor((tcy+size.h/2/sc)/256);
  const tl2=[];for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++){if(y<0||y>=n)continue;const wx=((x%n)+n)%n;tl2.push(html`<img key=${base+tz+'/'+x+'/'+y} className="gm-tile" alt="" draggable="false" src=${tileUrl(base,tz,wx,y)} style=${{left:(x*256-tcx)*sc+size.w/2,top:(y*256-tcy)*sc+size.h/2,width:256*sc+.6,height:256*sc+.6}} onLoad=${()=>setTl(t=>({...t,ok:t.ok+1}))} onError=${e=>{e.target.style.visibility='hidden';setTl(t=>({...t,bad:t.bad+1}));}}/>`);}
  /* graticule */
  const degPx=WORLD(z)/360;const stepUse=niceDeg.filter(d=>d*degPx>=110).pop()||niceDeg[niceDeg.length-1];
  const west=lonOf(cxw-size.w/2,z),east=lonOf(cxw+size.w/2,z),north=latOf(cyw-size.h/2,z),south=latOf(cyw+size.h/2,z);
  const gl=[];for(let l=Math.ceil(west/stepUse)*stepUse;l<=east;l+=stepUse){const x=S(0,l)[0];gl.push(html`<g key=${'lo'+l.toFixed(5)}><line x1=${x} x2=${x} y1="0" y2=${size.h} className="gm-grat"/><text x=${x+4} y=${size.h-8} className="gm-gl">${toDMS(l,'E','W').replace(/\.\d/,'')}</text></g>`);}
  for(let l=Math.ceil(south/stepUse)*stepUse;l<=north;l+=stepUse){const y=S(l,0)[1];gl.push(html`<g key=${'la'+l.toFixed(5)}><line x1="0" x2=${size.w} y1=${y} y2=${y} className="gm-grat"/><text x="6" y=${y-4} className="gm-gl">${toDMS(l,'N','S').replace(/\.\d/,'')}</text></g>`);}
  const ctr=ll=>{const s=ll.map(p=>S(p[0],p[1]));return [s.reduce((a,p)=>a+p[0],0)/s.length,s.reduce((a,p)=>a+p[1],0)/s.length];};
  const live0=TRACKS[0];const bp=along(live0.pts,live);const [bla,blo]=unproj(bp[0],bp[1]);
  const boats=showLive?[{id:'b-live',x:bp[0],y:bp[1],title:'MV Mlinzi',when:'Live position, updating',team:'Hamisi Mwinyi, Kassim Bwana. Coxswain Said Famau',desc:'Patrol PT-2026-0418 in progress, central zone.',status:'Active',follow:'None'}]:[];
  const tsel=t=>{const f=t.ll?proj(t.ll[0][0],t.ll[0][1]):t.pts[0];return {id:'t-'+t.id,layer:'patrols',title:'GPS track '+t.id,when:t.status,team:'See patrol record',desc:'Recorded GPS track for patrol '+t.id+'.',status:t.status,follow:'Open the patrol record for details',x:f[0],y:f[1]};};
  const mk=(it,layer)=>{const [la,lo]=unproj(it.x,it.y);const [sx,sy]=S(la,lo);if(sx<-30||sy<-30||sx>size.w+30||sy>size.h+30)return null;return html`<${Marker} key=${it.id} layer=${layer} x=${sx} y=${sy} sel=${sel===it.id} label=${it.title} onClick=${()=>onSel&&onSel(it)}/>`;};
  const mpp=40075016.686*Math.cos(view.lat*Math.PI/180)/WORLD(z);const nice=[10,20,50,100,200,500,1000,2000,5000,10000].filter(m=>m/mpp<=130).pop()||10;
  const noTiles=tl.ok===0&&tl.bad>=3;
  body=html`<div className="gm-tiles">${tl2}</div>
  <svg className="gm-svg" width=${size.w} height=${size.h} viewBox=${`0 0 ${size.w} ${size.h}`} role="img" aria-label="Iweni LMMA operations map">
   <defs><pattern id=${'ntz'+(compact?'c':'m')} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="10" stroke="var(--zone-ntz)" strokeWidth="3" opacity=".7"/></pattern></defs>
   ${gl}
   ${on('zones')&&html`<g><polygon points=${P(OUTER_LL)} className="gm-gear" strokeLinejoin="round"/><polygon points=${P(CORE_LL)} fill=${`url(#ntz${compact?'c':'m'})`} className="gm-ntz" strokeLinejoin="round"/>
    ${!compact&&html`<text x=${ctr(OUTER_LL)[0]-100} y=${ctr(OUTER_LL)[1]-80} className="zlabel gear">GEAR RESTRICTED ZONE</text><text x=${ctr(CORE_LL)[0]-56} y=${ctr(CORE_LL)[1]+6} className="zlabel ntz">NO TAKE ZONE</text>`}</g>`}
   ${on('patrols')&&tracks.map(t=>html`<polyline key=${t.id} points=${P(trackLL(t))} fill="none" className=${'gm-track '+(t.status==='Active'?'act':t.status==='Completed'?'':'dash')} onClick=${()=>onSel&&onSel(tsel(t))}><title>${t.id} (${t.status})</title></polyline>`)}
   ${myTrack&&myTrack.length>1&&html`<polyline points=${P(myTrack)} fill="none" className="gm-mine"/>`}
   ${showPts&&points.map(p=>{const [sx,sy]=S(p.la,p.lo);return html`<g key=${p.n} transform=${`translate(${sx},${sy})`} onClick=${()=>onSel&&onSel({id:'pt-'+p.n,layer:'zones',pt:p,x:p.x,y:p.y})} style=${{cursor:'pointer'}}><circle r=${sel==='pt-'+p.n?15:11} fill=${p.ref?'var(--good)':'var(--ink)'} stroke="#fff" strokeWidth="3"/><text y="4" textAnchor="middle" className="ptn">${p.n}</text><title>Point ${p.n}: ${p.lat} / ${p.lon}${p.ref?' (verified reference)':''}</title></g>`;})}
   ${on('incidents')&&items.filter(i=>i.layer==='incidents').map(i=>mk(i,'incidents'))}
   ${MAPITEMS.filter(i=>on(i.layer)&&items.some(k=>k.id===i.id)).map(i=>mk(i,i.layer))}
   ${on('boats')&&boats.map(b=>{const [sx,sy]=S(bla,blo);return html`<${Marker} key=${b.id} layer="boats" x=${sx} y=${sy} sel=${sel===b.id} label=${b.title+' (live)'} onClick=${()=>onSel&&onSel({...b,layer:'boats'})}/>`;})}
   ${myPos&&(()=>{const [sx,sy]=S(myPos.lat,myPos.lon);const r=Math.max(8,(myPos.acc||10)/mpp);return html`<g transform=${`translate(${sx},${sy})`}><circle r=${Math.min(r,90)} className="gm-acc"/><circle r="9" fill="#2A78D6" stroke="#fff" strokeWidth="3"/></g>`;})()}
  </svg>
  <div className="gm-attr">${TILES[base].attr}</div>
  <div className="gm-scale"><i style=${{width:nice/mpp}}/><span>${nice>=1000?nice/1000+' km':nice+' m'}</span></div>
  ${noTiles&&html`<div className="gm-note">Basemap tiles not available here. Showing the vector chart, which also works offline.</div>`}
  ${hint&&html`<div className="gm-hint">Hold Ctrl and scroll to zoom the map</div>`}
  ${!locked&&html`<div className="gm-ctl"><button aria-label="Zoom in" onClick=${()=>zoomAt(view.z+1,size.w/2,size.h/2)}>+</button><button aria-label="Zoom out" onClick=${()=>zoomAt(view.z-1,size.w/2,size.h/2)}>−</button><button aria-label="Fit to Iweni LMMA" title="Fit to Iweni LMMA" onClick=${refit}><${Icon} n="lmma" s=${16}/></button></div>`}
  ${!compact&&html`<div className="gm-base" role="group" aria-label="Basemap">${Object.keys(TILES).map(k=>html`<button key=${k} className=${base===k?'on':''} aria-pressed=${base===k} onClick=${()=>setBase(k)}>${TILES[k].label}</button>`)}</div>`}`;
 }
 return html`<div ref=${box} className=${'geomap '+(compact?'compact ':'')+(locked?'locked ':'')+(base==='sat'?'sat':'osm')} style=${height?{height}:null} tabIndex=${locked?-1:0} onPointerDown=${down} onPointerMove=${move} onPointerUp=${up} onPointerCancel=${up} onKeyDown=${key} onDoubleClick=${e=>{if(!locked&&vref.current){const [px,py]=rel(e);zoomAt(vref.current.z+1,px,py);}}}>${body}</div>`;
};
const OpsMap=GeoMap;
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

/* ============ views part 2: conservation, organisation, income, admin ============ */

/* ---------- Iweni LMMA ---------- */
const Lmma=()=>{
 const {can,vl,setVl,log,toast,go,patrols,incidents}=useApp();
 const [tab,setTab]=useState('map');const [sel,setSel]=useState(null);
 const write=can('iweni-lmma')==='w';
 const verify=n=>{setVl(v=>v.includes(n)?v.filter(x=>x!==n):[...v,n]);log((vl.includes(n)?'Removed verification of':'Verified')+' boundary point','Iweni LMMA Management','Point '+n);toast('Point '+n+(vl.includes(n)?' set back to awaiting verification':' marked as verified'));};
 const pt=sel&&sel.pt;
 return html`<div><${PageHead} title="Iweni LMMA Management" sub="Boundary mapping, conservation zones and community activities"/>
 <${Notice} tone="warn" title="Boundary not yet cleared for operational use">${vl.length} of 12 supplied points are verified. Every boundary change is versioned so historical positions are never lost.</${Notice}>
 <${Tabs} value=${tab} onChange=${setTab} tabs=${[['map','Boundary map'],['coords','Coordinates'],['activity','Activities'],['history','Versions']]}/>
 ${tab==='map'&&html`<div className="mapgrid"><div className="mapcol"><div className="mapbox"><${OpsMap} layers=${['zones','patrols']} items=${[]} tracks=${[]} points=${LMMA_PTS} showPts=${true} sel=${sel&&sel.id} onSel=${setSel} zoom=${1}/></div>
  <ul className="mlegend"><li><span className="dotv"/>Verified reference point</li><li><span className="dotd"/>Supplied point, awaiting verification</li><li><span className="sw gear"/>Gear Restricted Zone (illustrative)</li><li><span className="sw ntz"/>No Take Zone (illustrative)</li></ul></div>
  <aside className="mapside"><${Card} title=${pt?'Boundary point '+pt.n:'Boundary points'}>${pt?html`<${KV} rows=${[['Latitude',html`<span className="mono">${pt.lat}</span>`],['Longitude',html`<span className="mono">${pt.lon}</span>`],['Decimal degrees',html`<span className="mono">${pt.la.toFixed(6)}, ${pt.lo.toFixed(6)}</span>`],['Status',html`<${Chip} t=${vl.includes(pt.n)?'Verified':'Awaiting verification'}/>`]]}/>${write&&html`<${Btn} kind=${vl.includes(pt.n)?'':'primary'} onClick=${()=>verify(pt.n)}>${vl.includes(pt.n)?'Remove verification':'Mark as verified'}</${Btn}>`}`:html`<p className="muted">Select a numbered point to see its coordinates and verification status. The outline is drawn from the 12 points supplied by Patte Conservation. Zone shapes are placeholders until verified zone polygons are loaded.</p>`}</${Card}></aside></div>`}
 ${tab==='coords'&&html`<${Card} title="Boundary and zone coordinates" sub="As supplied. Latitude south, longitude east."><${Table} cols=${[{h:'No.',k:'n',cls:'num'},{h:'Latitude',k:'lat',cls:'mono'},{h:'Longitude',k:'lon',cls:'mono'},{h:'Decimal degrees',k:'d',cls:'mono',r:r=>r.la.toFixed(5)+', '+r.lo.toFixed(5)},{h:'Status',k:'s',r:r=>html`<${Chip} t=${vl.includes(r.n)?'Verified':'Awaiting verification'}/>`},{h:'',k:'a',r:r=>write?html`<button className="link" onClick=${()=>verify(r.n)}>${vl.includes(r.n)?'Unverify':'Verify'}</button>`:''}]} rows=${LMMA_PTS.map(p=>({...p,id:'p'+p.n}))}/></${Card}>`}
 ${tab==='activity'&&html`<div className="grid2"><${Card} title="Activity inside the LMMA"><${Table} cols=${[{h:'Activity',k:'a'},{h:'Latest',k:'l'},{h:'Records',k:'n',cls:'num'}]} rows=${[{id:1,a:'Ranger patrols',l:'11 Nov 2026',n:patrols.filter(p=>p.area.includes('Iweni')).length},{id:2,a:'Suspected violations',l:'11 Nov 2026',n:incidents.filter(i=>['Suspected illegal fishing','No Take Zone violations','LMMA violations','Spearguns and restricted fishing gear'].includes(i.cat)).length},{id:3,a:'Coral restoration visits',l:'09 Nov 2026',n:6},{id:4,a:'Reef monitoring surveys',l:'02 Nov 2026',n:4},{id:5,a:'Wildlife and bleaching observations',l:'11 Nov 2026',n:9},{id:6,a:'Community conservation activities',l:'21 Nov 2026 (planned)',n:3}]}/></${Card}>
  <${Card} title="Annual report" sub="LMMA activity summary"><p className="muted">The annual LMMA report draws on patrols, violations, reef monitoring, restoration, wildlife and bleaching observations, habitat damage and community activities.</p><${Btn} onClick=${()=>go('reports')}>Open Reports & Documents</${Btn}></${Card}></div>`}
 ${tab==='history'&&html`<${Card} title="Boundary versions" sub="History is kept, never overwritten"><${Table} cols=${[{h:'Version',k:'v'},{h:'Date',k:'d'},{h:'Source',k:'s'},{h:'Points',k:'p',cls:'num'},{h:'Status',k:'st',r:r=>html`<${Chip} t=${r.st} tone=${r.st==='Draft'?'warn':'neutral'}/>`}]} rows=${[{id:1,v:'v1',d:'11 Nov 2026',s:'Coordinate table supplied by Patte Conservation',p:12,st:'Draft'}]}/><p className="muted small">When a surveyed boundary is approved it becomes v2. Both versions stay on record.</p></${Card}>`}
 </div>`;
};

/* ---------- Projects ---------- */
const Projects=()=>{
 const {role,assign,projOpen,setProjOpen}=useApp();
 const [tab,setTab]=useState('ov');
 const officer=role==='officer';
 const okP=p=>!officer||assign.rehema.includes(p.id);
 const cur=projOpen&&PROJECTS.find(p=>p.id===projOpen);
 const budgetOk=role==='admin'||role==='board'||officer;
 if(cur&&!okP(cur))return html`<div><${PageHead} title=${cur.name}/><${Denied} mod=${cur.name} role=${role} why="project"/><${Btn} onClick=${()=>setProjOpen(null)}>Back to my projects</${Btn}></div>`;
 if(!cur)return html`<div><${PageHead} title="Conservation Projects" sub=${officer?'Your assigned workspaces. Other projects are locked.':'Every project has its own workspace'}/>
  <div className="pcards">${PROJECTS.map(p=>okP(p)?html`<button key=${p.id} className="pcard" onClick=${()=>{setProjOpen(p.id);setTab('ov');}}><span className="pcode">${p.code}</span><h3>${p.name}</h3><p>${p.loc}</p><${Progress} v=${p.progress}/><div className="pmeta"><span>${p.progress}% complete</span><span>Lead: ${p.lead}</span></div></button>`:
  html`<button key=${p.id} className="pcard locked" onClick=${()=>setProjOpen(p.id)}><span className="pcode"><${Icon} n="lock" s=${12}/> ${p.code}</span><h3>${p.name}</h3><p>Not assigned to you</p></button>`)}</div></div>`;
 const fd=MAPITEMS.filter(i=>i.proj===cur.id);
 return html`<div><${PageHead} title=${cur.name} sub=${cur.loc+' · Due '+cur.due}><${Btn} onClick=${()=>setProjOpen(null)}>All projects</${Btn}></${PageHead}>
 <${Tabs} value=${tab} onChange=${setTab} tabs=${[['ov','Overview'],['wp','Workplan & tasks'],['team','Team'],['field','Field data'],['docs','Documents'],['bud','Budget'],['upd','Updates & history']]}/>
 ${tab==='ov'&&html`<div className="grid2"><${Card} title="Objectives"><ul className="ticks">${cur.obj.map(o=>html`<li key=${o}>${o}</li>`)}</ul><h3 className="mini-h">Progress</h3><${Progress} v=${cur.progress}/><p className="muted small">${cur.progress}% of the workplan complete</p></${Card}><${Card} title="Milestones"><${Table} cols=${[{h:'Milestone',k:'0',r:r=>r[0]},{h:'Status',k:'1',r:r=>html`<${Chip} t=${r[1]}/>`},{h:'When',k:'2',r:r=>r[2]}]} rows=${cur.miles.map((m,i)=>Object.assign(m,{id:i}))}/></${Card}></div>`}
 ${tab==='wp'&&html`<${Card} title="Activities and tasks"><${Table} cols=${[{h:'Task',k:'0',r:r=>r[0]},{h:'Assigned to',k:'1',r:r=>r[1]},{h:'Deadline',k:'2',r:r=>r[2]},{h:'Status',k:'3',r:r=>html`<${Chip} t=${r[3]}/>`}]} rows=${cur.tasks.map((m,i)=>Object.assign(m,{id:i}))}/></${Card}>`}
 ${tab==='team'&&html`<${Card} title="Assigned officers and team"><${Table} cols=${[{h:'Name',k:'n'},{h:'Role',k:'r'}]} rows=${[{id:1,n:cur.lead,r:'Project officer (lead)'},...(cur.id==='p1'?[{id:2,n:'Hamisi Mwinyi',r:'Field support, ranger'}]:[]),{id:9,n:'Fatuma Bakari',r:'Super Admin (oversight)'}]}/></${Card}>`}
 ${tab==='field'&&html`<${Card} title="Field observations, GPS locations and photographs">${fd.length?html`<${Table} cols=${[{h:'Observation',k:'title'},{h:'Date',k:'when'},{h:'GPS',k:'g',cls:'mono',r:r=>{const [a,o]=unproj(r.x,r.y);return a.toFixed(5)+', '+o.toFixed(5);}},{h:'Status',k:'s',r:r=>html`<${Chip} t=${r.status}/>`}]} rows=${fd}/><h3 className="mini-h">Photographs</h3><${Photos}/>`:html`<p className="muted">No field data yet for this project.</p>`}</${Card}>`}
 ${tab==='docs'&&html`<${Card} title="Documents"><ul className="doclist">${cur.docs.map(d=>html`<li key=${d}><${Icon} n="reports" s=${16}/>${d}</li>`)}</ul></${Card}>`}
 ${tab==='bud'&&(budgetOk?html`<${Card} title="Authorised budget information"><div className="kpis small"><${Kpi} label="Budget" value=${KES(cur.budget)}/><${Kpi} label="Spent" value=${KES(cur.spent)}/><${Kpi} label="Remaining" value=${KES(cur.budget-cur.spent)}/></div><${Progress} v=${Math.round(cur.spent/cur.budget*100)}/><p className="muted small">${Math.round(cur.spent/cur.budget*100)}% of budget used</p></${Card}>`:html`<${Notice} tone="warn" title="Budget hidden">Budget information is shown only to roles permitted to see it.</${Notice}>`)}
 ${tab==='upd'&&html`<${Card} title="Progress updates and history"><ul className="feed">${cur.updates.map((u,i)=>html`<li key=${i}>${u}<small>Project update</small></li>`)}<li>Workspace created<small>Super Admin</small></li></ul></${Card}>`}
 </div>`;
};

/* ---------- Coral Restoration ---------- */
const SITES=[
 {id:'S1',name:'Kijiweni Reef Nursery',x:330,y:600,desc:'Frame nursery on sandy reef flat, 3 to 4 m depth.',base:'Degraded, about 12% live coral',sp:'Acropora and Pocillopora',meth:'Frame nursery, cable-tied fragments',n:1240,date:'14 Aug 2026',team:'Rehema Salim, Hamisi Mwinyi',equip:'Underwater camera, dive set, cable ties',surv:92,bleach:2,out:'Fragments growing about 1.6 cm per month'},
 {id:'S2',name:'Iweni Patch Reef',x:560,y:545,desc:'Direct transplant on a patch reef inside the LMMA.',base:'Fair, about 22% live coral',sp:'Acropora',meth:'Direct transplant with epoxy',n:880,date:'02 Sep 2026',team:'Rehema Salim',equip:'Epoxy kit, camera',surv:90,bleach:5,out:'Some fragments lost in rough weather'},
 {id:'S3',name:'Rubu Edge Nursery',x:720,y:600,desc:'Small rope nursery near the Shanga Rubu boundary.',base:'Degraded, about 9% live coral',sp:'Pocillopora',meth:'Rope nursery',n:410,date:'20 Sep 2026',team:'Rehema Salim, Kassim Bwana',equip:'Rope, buoys, camera',surv:93,bleach:1,out:'Stable. Ready for transplant in January.'}
];
const Coral=()=>{
 const {role,assign,can,log,toast}=useApp();
 const [open,setOpen]=useState(null);const [mk,setMk]=useState(false);
 const [mon,setMon]=useState([['09 Nov 2026','Kijiweni Reef Nursery',92,2],['02 Nov 2026','Iweni Patch Reef',90,5],['26 Oct 2026','Rubu Edge Nursery',93,1]]);
 const [f,setF]=useState({site:'Kijiweni Reef Nursery',date:'2026-11-11',surv:'92',bl:'2',notes:''});
 if(role==='officer'&&!assign.rehema.includes('p1'))return html`<div><${PageHead} title="Coral Restoration"/><${Denied} mod="Coral Restoration" role=${role} why="project"/></div>`;
 const cur=open&&SITES.find(s=>s.id===open);const write=can('coral')==='w'||can('coral')==='s';
 const save=()=>{setMon(m=>[[f.date,f.site,+f.surv,+f.bl],...m]);log('Recorded reef monitoring visit','Coral Restoration',f.site);toast('Monitoring visit saved for '+f.site);setMk(false);};
 const sr=['Kijiweni','Iweni','Rubu'];
 return html`<div><${PageHead} title="Coral Restoration" sub="Restoration sites and reef monitoring">${write&&html`<${Btn} kind="primary" icon="plus" onClick=${()=>setMk(true)}>Record monitoring visit</${Btn}>`}</${PageHead}>
 <div className="kpis"><${Kpi} label="Fragments placed" value=${SITES.reduce((a,s)=>a+s.n,0).toLocaleString('en-US')}/><${Kpi} label="Average survival" value="92%" note="all sites" tone="good"/><${Kpi} label="Bleaching recorded" value="3%" note="Watch point M2" tone="warn"/><${Kpi} label="Restoration sites" value="3"/></div>
 <div className="grid2"><${Card} title="Survival over time" sub="Percent of fragments alive"><${LineChart} labels=${['Jun','Jul','Aug','Sep','Oct','Nov']} yMin=${80} yMax=${100} unit="%" series=${[{name:'Kijiweni nursery',color:'var(--c1)',v:[100,96,94,93,92,92]},{name:'Iweni patch reef',color:'var(--c2)',v:[100,98,95,93,91,90]},{name:'Rubu edge',color:'var(--c3)',v:[100,97,96,95,94,93]}]}/></${Card}>
 <${Card} title="Restoration sites"><${Table} sel=${open} onRow=${r=>setOpen(r.id)} cols=${[{h:'Site',k:'name'},{h:'Fragments',k:'n',cls:'num'},{h:'Survival',k:'surv',cls:'num',r:r=>r.surv+'%'},{h:'Bleaching',k:'bleach',cls:'num',r:r=>r.bleach+'%'}]} rows=${SITES}/></${Card}></div>
 <${Card} title="Monitoring visits"><${Table} cols=${[{h:'Date',k:'0',r:r=>r[0]},{h:'Site',k:'1',r:r=>r[1]},{h:'Survival',k:'2',cls:'num',r:r=>r[2]+'%'},{h:'Bleaching',k:'3',cls:'num',r:r=>r[3]+'%'}]} rows=${mon.map((m,i)=>Object.assign([...m],{id:i}))}/></${Card}>
 ${(role==='admin'||role==='board'||role==='fisheries')&&html`<${Card} title="Indicators from other projects" sub="Each project keeps its own indicators"><div className="kpis small"><${Kpi} label="Mangrove planting survival" value="71%" note="plot 1"/><${Kpi} label="Cleanup waste collected" value="214 kg" note="October"/><${Kpi} label="Education sessions" value="23" note="612 learners"/></div></${Card}>`}
 <${Drawer} open=${!!cur} onClose=${()=>setOpen(null)} title=${cur?cur.name:''} sub=${cur?'Restored '+cur.date:''}>${cur&&html`<${KV} rows=${[['GPS coordinates',(()=>{const [a,o]=unproj(cur.x,cur.y);return toDMS(a,'N','S')+' / '+toDMS(o,'E','W');})()],['Site description',cur.desc],['Baseline reef condition',cur.base],['Coral species',cur.sp],['Restoration method',cur.meth],['Fragments or colonies',cur.n.toLocaleString('en-US')],['Team',cur.team],['Responsible officer','Rehema Salim'],['Equipment',cur.equip],['Survival',cur.surv+'%'],['Bleaching',cur.bleach+'%'],['Outcome',cur.out]]}/><h3 className="mini-h">Photographs</h3><${Photos}/>`}</${Drawer}>
 <${Modal} open=${mk} onClose=${()=>setMk(false)} title="Record monitoring visit"><div className="form"><${Field} label="Site" id="cs"><${Sel} id="cs" value=${f.site} onChange=${v=>setF(o=>({...o,site:v}))} opts=${SITES.map(s=>s.name)}/></${Field}><${Field} label="Date" id="cd"><${Inp} id="cd" type="date" value=${f.date} onChange=${v=>setF(o=>({...o,date:v}))}/></${Field}><${Field} label="Fragments alive (%)" id="cv"><${Inp} id="cv" type="number" value=${f.surv} onChange=${v=>setF(o=>({...o,surv:v}))}/></${Field}><${Field} label="Bleaching (%)" id="cb"><${Inp} id="cb" type="number" value=${f.bl} onChange=${v=>setF(o=>({...o,bl:v}))}/></${Field}><${Field} label="Notes" id="cn" wide=${true}><textarea id="cn" rows="3" value=${f.notes} onChange=${e=>setF(o=>({...o,notes:e.target.value}))}/></${Field}><div className="form-foot wide"><${Btn} onClick=${()=>setMk(false)}>Cancel</${Btn}><${Btn} kind="primary" onClick=${save}>Save visit</${Btn}></div></div></${Modal}></div>`;
};

/* ---------- Staff & Users ---------- */
const Staff=()=>{
 const {log,toast}=useApp();
 const [list,setList]=useState(STAFF);const [open,setOpen]=useState(null);const [mk,setMk]=useState(false);
 const [f,setF]=useState({name:'',title:'',role:'Marine Ranger',bmu:'Pate BMU'});
 const cur=open&&list.find(s=>s.no===open);
 const add=()=>{if(!f.name.trim()){toast('Enter the full name first');return;}const no='PCC-0'+(22+list.length-12);setList(l=>[...l,{no,name:f.name,title:f.title||f.role,dept:'—',role:f.role,bmu:f.bmu,proj:'—',status:'Active',start:'Nov 2026'}]);log('Created user account','Staff & Users',no+' '+f.name);toast(f.name+' added. A sign-in invitation is sent to their email.');setMk(false);setF({name:'',title:'',role:'Marine Ranger',bmu:'Pate BMU'});};
 const flip=()=>{setList(l=>l.map(s=>s.no===cur.no?{...s,status:s.status==='Active'?'Deactivated':'Active'}:s));log((cur.status==='Active'?'Deactivated':'Reactivated')+' user','Staff & Users',cur.no);toast(cur.name+(cur.status==='Active'?' deactivated':' reactivated'));};
 return html`<div><${PageHead} title="Staff & Users" sub="Staff records, accounts and role assignment"><${Btn} kind="primary" icon="plus" onClick=${()=>setMk(true)}>Add staff member</${Btn}></${PageHead}>
 <${Notice} tone="info" title="One person, one account">The CBO Manager, LMMA Manager and Super Admin titles are the same person, Fatuma Bakari, with a single account.</${Notice}>
 <${Card}><${Table} sel=${open} onRow=${r=>setOpen(r.no)} cols=${[{h:'Staff no.',k:'no',cls:'mono'},{h:'Name',k:'name'},{h:'Title',k:'title'},{h:'Role in POps',k:'role'},{h:'BMU',k:'bmu'},{h:'Project / team',k:'proj'},{h:'Status',k:'status',r:r=>html`<${Chip} t=${r.status} tone=${r.status==='Active'?'good':r.status==='Deactivated'?'crit':'warn'}/>`}]} rows=${list.map(s=>({...s,id:s.no}))}/></${Card}>
 <${Drawer} open=${!!cur} onClose=${()=>setOpen(null)} title=${cur?cur.name:''} sub=${cur?cur.title:''} foot=${cur&&cur.role!=='Super Admin'?html`<${Btn} kind=${cur.status==='Active'?'danger':'primary'} onClick=${flip}>${cur.status==='Active'?'Deactivate account':'Reactivate account'}</${Btn}>`:null}>${cur&&html`<${KV} rows=${[['Staff number',cur.no],['Department',cur.dept],['Role in POps',cur.role],['BMU affiliation',cur.bmu],['Assigned project or team',cur.proj],['Start date',cur.start],['Training and certifications','First aid, boat safety (sample)'],['Duty roster','Shown to the Super Admin only'],['Personnel and performance records','Restricted']]}/>`}</${Drawer}>
 <${Modal} open=${mk} onClose=${()=>setMk(false)} title="Add staff member"><div className="form"><${Field} label="Full name" id="sn" wide=${true}><${Inp} id="sn" value=${f.name} onChange=${v=>setF(o=>({...o,name:v}))} placeholder="e.g. Amina Salim"/></${Field}><${Field} label="Job title" id="st"><${Inp} id="st" value=${f.title} onChange=${v=>setF(o=>({...o,title:v}))}/></${Field}><${Field} label="Role in POps" id="sr"><${Sel} id="sr" value=${f.role} onChange=${v=>setF(o=>({...o,role:v}))} opts=${['Marine Ranger','Coxswain','Conservation Officer','Tourism Officer','Finance Officer','Fisheries Officer','BMU Representative']}/></${Field}><${Field} label="BMU" id="sb"><${Sel} id="sb" value=${f.bmu} onChange=${v=>setF(o=>({...o,bmu:v}))} opts=${BMUS.map(b=>b.name)}/></${Field}><div className="form-foot wide"><${Btn} onClick=${()=>setMk(false)}>Cancel</${Btn}><${Btn} kind="primary" onClick=${add}>Create account</${Btn}></div></div></${Modal}></div>`;
};

/* ---------- BMUs & Governance ---------- */
const Bmus=()=>{
 const {patrols,can}=useApp();
 const [tab,setTab]=useState('bmu');
 const info={pate:['Pate village','124 registered members','Mangrove planting; reef nursery crew'],ishakani:['Shanga Ishakani','86 registered members','Beach cleanups; guide training'],rubu:['Shanga Rubu','71 registered members','School sessions; snorkel tour route']};
 return html`<div><${PageHead} title="BMUs & Governance" sub="Three separate Beach Management Units, plus Board and committee records"/>
 <${Tabs} value=${tab} onChange=${setTab} tabs=${[['bmu','BMU profiles'],['board','Board & committee']]}/>
 ${tab==='bmu'&&html`<div><${Notice} tone="info" title="Always separate">Shanga Ishakani and Shanga Rubu keep their own records, representatives, activities, reports and permissions. They are never merged.</${Notice}>
 <div className="grid3">${BMUS.map(b=>html`<${Card} key=${b.id} title=${b.name}><${KV} rows=${[['Representative',b.rep],['Community',info[b.id][0]],['Members',info[b.id][1]],['Conservation activities',info[b.id][2]],['Patrols on record',patrols.filter(p=>p.bmu===b.id).length],['Next meeting','Dec 2026']]}/></${Card}>`)}</div>
 <${Card} title="Joint actions"><${Table} cols=${[{h:'Action',k:'a'},{h:'BMUs',k:'b'},{h:'Status',k:'s',r:r=>html`<${Chip} t=${r.s}/>`}]} rows=${[{id:1,a:'Visitor code of conduct',b:'All three, each signs separately',s:'In progress'},{id:2,a:'Joint beach cleanup, December',b:'Pate, Shanga Ishakani',s:'Planned'}]}/></${Card}></div>`}
 ${tab==='board'&&html`<div className="grid2"><${Card} title="Board membership" sub="Governance and oversight, not day-to-day management"><${Table} cols=${[{h:'Name',k:'0',r:r=>r[0]},{h:'Position',k:'1',r:r=>r[1]}]} rows=${BOARD.map((b,i)=>Object.assign([...b],{id:i}))}/></${Card}>
 <${Card} title="Meetings and resolutions"><ul className="feed">${MEETINGS.map(m=>html`<li key=${m[0]}><strong>${m[1]}</strong> · ${m[2]}<small>${m[0]}</small></li>`)}</ul></${Card}>
 <${Card} title="Action points and approvals"><${Table} cols=${[{h:'Action',k:'0',r:r=>r[0]},{h:'Deadline',k:'1',r:r=>r[1]},{h:'Status',k:'2',r:r=>html`<${Chip} t=${r[2]}/>`}]} rows=${ACTIONS_BOARD.map((b,i)=>Object.assign([...b],{id:i}))}/></${Card}>
 <${Card} title="Confidential documents"><p className="muted">Board minutes and governance documents stay internal. They are never shared with the public website or with partners automatically.</p></${Card}></div>`}
 </div>`;
};

/* ---------- Stakeholders & Partners ---------- */
const SHAREABLE=['Incident referrals','Patrol summaries','Coral monitoring summary','Quarterly impact report','Mangrove incident referrals','Gear incident referrals','Project report: Coral Restoration'];
const Partners=()=>{
 const {can,log,toast}=useApp();
 const [list,setList]=useState(PARTNERS);const [open,setOpen]=useState(null);
 const write=can('partners')==='w';const cur=open!==null&&list[open];
 const tg=(it)=>{setList(l=>l.map((p,i)=>i===open?{...p,shared:p.shared.includes(it)?p.shared.filter(x=>x!==it):[...p.shared,it]}:p));log((cur.shared.includes(it)?'Stopped sharing ':'Shared ')+it,'Stakeholders & Partners',cur.name);toast(cur.shared.includes(it)?'No longer shared: '+it:'Now shared with '+cur.name+': '+it);};
 return html`<div><${PageHead} title="Stakeholders & Partners" sub="Directory, engagement history and explicitly shared information"/>
 <${Notice} tone="info" title="Nothing is shared by default">External partners only see items the Super Admin has chosen to share with them.</${Notice}>
 <${Card}><${Table} sel=${open!==null?list[open].name:null} onRow=${r=>setOpen(list.findIndex(p=>p.name===r.name))} cols=${[{h:'Organisation',k:'name'},{h:'Type',k:'type'},{h:'Contact',k:'contact'},{h:'Items shared',k:'sh',cls:'num',r:r=>r.shared.length},{h:'Latest engagement',k:'eng'}]} rows=${list.map(p=>({...p,id:p.name}))}/></${Card}>
 <${Drawer} open=${!!cur} onClose=${()=>setOpen(null)} title=${cur?cur.name:''} sub=${cur?cur.type:''}>${cur&&html`<${KV} rows=${[['Contact',cur.contact],['Latest engagement',cur.eng]]}/><h3 className="mini-h">Shared with this partner</h3><ul className="sharelist">${SHAREABLE.map(it=>html`<li key=${it}><span>${it}</span>${write?html`<${Toggle} on=${cur.shared.includes(it)} onChange=${()=>tg(it)} label=${'Share '+it}/>`:html`<${Chip} t=${cur.shared.includes(it)?'Shared':'Not shared'} tone=${cur.shared.includes(it)?'good':'neutral'}/>`}</li>`)}</ul>`}</${Drawer}></div>`;
};

/* ---------- Boats & Equipment ---------- */
const Boats=()=>{
 const {role,can,log,toast}=useApp();
 const me=ROLES[role].user;
 const [trips,setTrips]=useState([['11 Nov 2026','MV Mlinzi','07:10 / —','Iweni LMMA central','Patrol','Said Famau, H. Mwinyi, K. Bwana','120 / 84 L'],['10 Nov 2026','MV Mlinzi','06:00 / 10:05','Iweni LMMA south','Patrol','Said Famau, H. Mwinyi, A. Kombo','95 / 71 L'],['09 Nov 2026','Jahazi Bahari','06:15 / 09:40','Shanga Ishakani','Patrol','Famau Said, M. Ali, J. Mkuu','60 / 44 L']]);
 const [mk,setMk]=useState(false);const [f,setF]=useState({boat:'MV Mlinzi',dep:'06:00',ret:'10:00',dest:'',pur:'Patrol',crew:'',iss:'',used:'',def:''});
 const boats=role==='cox'?BOATS.filter(b=>b.cox===me):BOATS;
 const write=can('boats')==='w'||can('boats')==='s';
 const save=()=>{setTrips(t=>[[stamp().split(',')[0],f.boat,f.dep+' / '+f.ret,f.dest||'Not stated',f.pur,f.crew||me,(f.iss||'—')+' / '+(f.used||'—')+' L'],...t]);log('Recorded boat trip'+(f.def?' and defect':''),'Boats & Equipment',f.boat);toast('Trip recorded for '+f.boat+(f.def?'. Defect reported to the Super Admin.':''));setMk(false);};
 return html`<div><${PageHead} title="Boats & Equipment" sub=${role==='cox'?'Your assigned boat':'Boats, trips, fuel, defects and equipment'}>${write&&html`<${Btn} kind="primary" icon="plus" onClick=${()=>setMk(true)}>Record trip</${Btn}>`}</${PageHead}>
 <div className="grid3">${boats.map(b=>html`<${Card} key=${b.name} title=${b.name} right=${html`<${Chip} t=${b.status}/>`}><${KV} rows=${[['Registration',b.reg],['Engine',b.engine],['Coxswain',b.cox],['Fuel today',b.fuel],['Last service',b.service],['Open defect',b.defect]]}/></${Card}>`)}</div>
 <${Card} title="Trip log"><${Table} cols=${[{h:'Date',k:'0',r:r=>r[0]},{h:'Boat',k:'1',r:r=>r[1]},{h:'Out / back',k:'2',r:r=>r[2]},{h:'Destination',k:'3',r:r=>r[3]},{h:'Purpose',k:'4',r:r=>r[4]},{h:'Crew',k:'5',r:r=>r[5]},{h:'Fuel issued / used',k:'6',r:r=>r[6]}]} rows=${trips.filter(t=>role!=='cox'||boats.some(b=>b.name===t[1])).map((t,i)=>Object.assign([...t],{id:i}))}/></${Card}>
 ${role!=='cox'&&html`<${Card} title="Equipment"><${Table} cols=${[{h:'Item',k:'0',r:r=>r[0]},{h:'Serial / ref',k:'1',cls:'mono',r:r=>r[1]},{h:'Qty',k:'2',cls:'num',r:r=>r[2]},{h:'Condition',k:'3',r:r=>html`<${Chip} t=${r[3]}/>`},{h:'Assigned to',k:'4',r:r=>r[4]},{h:'Issue / return',k:'5',r:r=>r[5]}]} rows=${EQUIP.map((e,i)=>Object.assign([...e],{id:i}))}/></${Card}>`}
 <${Modal} open=${mk} onClose=${()=>setMk(false)} title="Record boat trip"><div className="form"><${Field} label="Boat" id="bb"><${Sel} id="bb" value=${f.boat} onChange=${v=>setF(o=>({...o,boat:v}))} opts=${boats.map(b=>b.name)}/></${Field}><${Field} label="Purpose" id="bp"><${Sel} id="bp" value=${f.pur} onChange=${v=>setF(o=>({...o,pur:v}))} opts=${['Patrol','Restoration work','Tourism trip','Transport','Other']}/></${Field}><${Field} label="Departure" id="bd"><${Inp} id="bd" type="time" value=${f.dep} onChange=${v=>setF(o=>({...o,dep:v}))}/></${Field}><${Field} label="Return" id="br"><${Inp} id="br" type="time" value=${f.ret} onChange=${v=>setF(o=>({...o,ret:v}))}/></${Field}><${Field} label="Destination" id="bt" wide=${true}><${Inp} id="bt" value=${f.dest} onChange=${v=>setF(o=>({...o,dest:v}))}/></${Field}><${Field} label="Crew" id="bc" wide=${true}><${Inp} id="bc" value=${f.crew} onChange=${v=>setF(o=>({...o,crew:v}))} placeholder="Names"/></${Field}><${Field} label="Fuel issued (L)" id="bi"><${Inp} id="bi" type="number" value=${f.iss} onChange=${v=>setF(o=>({...o,iss:v}))}/></${Field}><${Field} label="Fuel used (L)" id="bu"><${Inp} id="bu" type="number" value=${f.used} onChange=${v=>setF(o=>({...o,used:v}))}/></${Field}><${Field} label="Engine defect or maintenance issue (optional)" id="bf" wide=${true}><${Inp} id="bf" value=${f.def} onChange=${v=>setF(o=>({...o,def:v}))}/></${Field}><div className="form-foot wide"><${Btn} onClick=${()=>setMk(false)}>Cancel</${Btn}><${Btn} kind="primary" onClick=${save}>Save trip</${Btn}></div></div></${Modal}></div>`;
};

/* ---------- Tourism ---------- */
const Tourism=()=>{
 const {tour,setTour,log,toast}=useApp();
 const [tab,setTab]=useState('book');const [open,setOpen]=useState(null);const [mk,setMk]=useState(false);const [shown,setShown]=useState(false);
 const [f,setF]=useState({name:'',cat:'Domestic',nat:'Kenya',n:'2',act:'Snorkelling',dest:'Iweni LMMA',bmu:'pate',arr:'2026-11-20',guide:'Omar Bwanamaka',charge:'6000'});
 const [pay,setPay]=useState({amt:'',method:'M-Pesa',tx:''});
 const cur=open&&tour.find(t=>t.id===open);
 const add=()=>{if(!f.name.trim()){toast('Enter the visitor or group name');return;}const id='BK-'+(1043+tour.length-8);const d=new Date(f.arr+'T12:00:00');setTour(t=>[{id,name:f.name,cat:f.cat,nat:f.nat,n:+f.n,act:f.act,dest:f.dest,bmu:f.bmu,arr:`${pad(d.getDate())} Nov ${d.getFullYear()}`,guide:f.guide,charge:+f.charge,recv:0,method:'M-Pesa',status:'Unpaid',receipt:'—',tx:'—',contact:'Added by officer',rec:'Salma Abdalla',recon:'Not applicable'},...t]);log('Registered visitors','Tourism',id+' '+f.name);toast('Booking '+id+' registered');setMk(false);};
 const record=()=>{const a=+pay.amt;if(!a){toast('Enter the amount received');return;}const recv=cur.recv+a;const st=recv>=cur.charge?'Paid':'Partially paid';const rc='RC-'+(3382+tour.filter(t=>t.receipt!=='—').length-6);setTour(t=>t.map(x=>x.id===cur.id?{...x,recv,status:st,method:pay.method,tx:pay.tx||'—',receipt:rc,recon:'Awaiting reconciliation'}:x));log('Recorded payment','Tourism',cur.id+' '+KES(a));toast('Payment recorded, receipt '+rc+'. Sent to Finance for reconciliation.');setPay({amt:'',method:'M-Pesa',tx:''});};
 const byCat={};tour.forEach(t=>byCat[t.cat]=(byCat[t.cat]||0)+t.n);const byAct={};tour.forEach(t=>byAct[t.act]=(byAct[t.act]||0)+t.recv);
 return html`<div><${PageHead} title="Tourism Management" sub="Visitors, activities, bookings and payments"><${Btn} kind="primary" icon="plus" onClick=${()=>setMk(true)}>Register visitors</${Btn}></${PageHead}>
 <${Tabs} value=${tab} onChange=${setTab} tabs=${[['book','Bookings'],['rep','Reports']]}/>
 ${tab==='book'&&html`<${Card}><${Table} sel=${open} onRow=${r=>{setOpen(r.id);setShown(false);}} cols=${[{h:'Booking',k:'id',cls:'mono'},{h:'Visitor or group',k:'name'},{h:'Category',k:'cat'},{h:'Guests',k:'n',cls:'num'},{h:'Activity',k:'act'},{h:'Arrival',k:'arr'},{h:'Charged',k:'charge',cls:'num',r:r=>KES(r.charge)},{h:'Received',k:'recv',cls:'num',r:r=>KES(r.recv)},{h:'Payment',k:'status',r:r=>html`<${Chip} t=${r.status}/>`}]} rows=${tour}/></${Card}>`}
 ${tab==='rep'&&html`<div className="grid2"><${Card} title="Visitors per month"><${BarChart} data=${TOUR_MONTHS} hi=${5}/></${Card}><${Card} title="Guests by category"><${HBars} data=${Object.entries(byCat)}/></${Card}><${Card} title="Income by activity" sub="Amount received"><${HBars} data=${Object.entries(byAct).filter(a=>a[1]>0)} fmt=${KES} color="var(--c3)"/></${Card}><${Card} title="Outstanding and refunds"><${KV} rows=${[['Outstanding balances',KES(tour.filter(t=>['Partially paid','Unpaid'].includes(t.status)).reduce((a,t)=>a+t.charge-t.recv,0))],['Refunds recorded',tour.filter(t=>t.status==='Refunded').length],['Cancelled bookings',tour.filter(t=>t.status==='Cancelled').length]]}/></${Card}></div>`}
 <${Drawer} open=${!!cur} onClose=${()=>setOpen(null)} title=${cur?cur.name:''} sub=${cur?cur.id+' · '+cur.act:''}>${cur&&html`<${KV} rows=${[['Category',cur.cat+' · '+cur.nat],['Guests',cur.n],['Destination',cur.dest+' · '+bmuName(cur.bmu)],['Arrival',cur.arr],['Assigned guide',cur.guide],['Contact',shown?html`<span className="mono">${cur.contact.replace(/•/g,'7')}</span>`:html`<span className="mono">${cur.contact}</span> <button className="link" onClick=${()=>{setShown(true);log('Viewed visitor contact details','Tourism',cur.id);}}>Show</button>`],['Charged',KES(cur.charge)],['Received',KES(cur.recv)],['Method / reference',cur.method+' · '+cur.tx],['Receipt',cur.receipt],['Payment status',html`<${Chip} t=${cur.status}/>`],['Finance',html`<${Chip} t=${cur.recon}/>`]]}/>
 ${['Unpaid','Partially paid'].includes(cur.status)&&html`<h3 className="mini-h">Record payment</h3><div className="form"><${Field} label="Amount received (KES)" id="pa1"><${Inp} id="pa1" type="number" value=${pay.amt} onChange=${v=>setPay(o=>({...o,amt:v}))}/></${Field}><${Field} label="Method" id="pm1"><${Sel} id="pm1" value=${pay.method} onChange=${v=>setPay(o=>({...o,method:v}))} opts=${['M-Pesa','Cash','Bank','Other']}/></${Field}><${Field} label="Transaction reference" id="pr1" wide=${true}><${Inp} id="pr1" value=${pay.tx} onChange=${v=>setPay(o=>({...o,tx:v}))}/></${Field}><div className="form-foot wide"><${Btn} kind="primary" onClick=${record}>Save payment</${Btn}></div></div><p className="muted small">The payment goes to Finance for reconciliation. Saving it does not reconcile it automatically.</p>`}`}</${Drawer}>
 <${Modal} open=${mk} onClose=${()=>setMk(false)} title="Register visitors"><div className="form"><${Field} label="Visitor or group name" id="tn" wide=${true}><${Inp} id="tn" value=${f.name} onChange=${v=>setF(o=>({...o,name:v}))}/></${Field}><${Field} label="Category" id="tc"><${Sel} id="tc" value=${f.cat} onChange=${v=>setF(o=>({...o,cat:v}))} opts=${['Local','Domestic','International']}/></${Field}><${Field} label="Nationality" id="tt"><${Inp} id="tt" value=${f.nat} onChange=${v=>setF(o=>({...o,nat:v}))}/></${Field}><${Field} label="Number of guests" id="tg"><${Inp} id="tg" type="number" value=${f.n} onChange=${v=>setF(o=>({...o,n:v}))}/></${Field}><${Field} label="Activity" id="ta"><${Sel} id="ta" value=${f.act} onChange=${v=>setF(o=>({...o,act:v}))} opts=${['Snorkelling','Coral reef visit','Marine conservation tour','Boat trip','Cultural tour','Island visit','Ecotourism activity']}/></${Field}><${Field} label="Destination" id="td"><${Inp} id="td" value=${f.dest} onChange=${v=>setF(o=>({...o,dest:v}))}/></${Field}><${Field} label="BMU or community" id="tb"><${Sel} id="tb" value=${f.bmu} onChange=${v=>setF(o=>({...o,bmu:v}))} opts=${BMUS.map(b=>[b.id,b.name])}/></${Field}><${Field} label="Arrival date" id="tr"><${Inp} id="tr" type="date" value=${f.arr} onChange=${v=>setF(o=>({...o,arr:v}))}/></${Field}><${Field} label="Assigned guide" id="tu"><${Inp} id="tu" value=${f.guide} onChange=${v=>setF(o=>({...o,guide:v}))}/></${Field}><${Field} label="Amount charged (KES)" id="tm"><${Inp} id="tm" type="number" value=${f.charge} onChange=${v=>setF(o=>({...o,charge:v}))}/></${Field}><div className="form-foot wide"><${Btn} onClick=${()=>setMk(false)}>Cancel</${Btn}><${Btn} kind="primary" onClick=${add}>Register</${Btn}></div></div></${Modal}></div>`;
};

/* ---------- Finance & Donations ---------- */
const Finance=()=>{
 const {role,fin,setFin,tour,setTour,log,toast,can}=useApp();
 const [tab,setTab]=useState('led');const [open,setOpen]=useState(null);const [mk,setMk]=useState(false);const [dm,setDm]=useState(false);
 const [donors,setDonors]=useState(DONORS);
 const [f,setF]=useState({type:'Expense',cat:'Fuel',desc:'',amt:'',ref:''});const [d,setD]=useState({name:'',amt:'',kind:'One-time',ref:''});
 const cur=open&&fin.find(x=>x.id===open);const write=can('finance')==='w';const approver=ROLES[role].approver;
 const setSt=(s,msg)=>{setFin(x=>x.map(e=>e.id===cur.id?{...e,status:s}:e));log(msg,'Finance',cur.id);toast(cur.id+': '+s);};
 const add=()=>{const a=+f.amt;if(!a||!f.desc.trim()){toast('Enter a description and amount');return;}const id='FN-'+(2212+fin.length-8);setFin(x=>[{id,date:stamp().split(',')[0],type:f.type,cat:f.cat,desc:f.desc,amt:a,ref:f.ref||'—',receipt:'—',status:'Draft',by:ROLES[role].user},...x]);log('Created finance entry (draft)','Finance',id);toast('Draft '+id+' saved. Submit it for approval when ready.');setMk(false);setF({type:'Expense',cat:'Fuel',desc:'',amt:'',ref:''});};
 const addD=()=>{const a=+d.amt;if(!a||!d.name.trim()){toast('Enter the donor and amount');return;}setDonors(x=>[{name:d.name,kind:d.kind,amt:a,status:'Pending',receipt:'—',last:stamp().split(',')[0]},...x]);log('Recorded donation','Finance',d.name+' '+KES(a));toast('Donation recorded as pending. Confirm once the payment reference clears.');setDm(false);setD({name:'',amt:'',kind:'One-time',ref:''});};
 const rec=t=>{setTour(x=>x.map(k=>k.id===t.id?{...k,recon:'Reconciled'}:k));log('Reconciled tourism payment','Finance',t.id);toast(t.id+' reconciled');};
 const pend=tour.filter(t=>t.recon==='Awaiting reconciliation');
 const IN=['Donations','Grants','Project funding','Tourism income','Conservation fees'],EX=['Patrol expenses','Fuel','Boat maintenance','Staff expenses','Conservation activities','Project expenses','Equipment','Administration'];
 return html`<div><${PageHead} title="Finance & Donations" sub="Income, expenditure, budgets and donor records">${write&&html`<${Btn} kind="primary" icon="plus" onClick=${()=>setMk(true)}>New entry</${Btn}>`}</${PageHead}>
 <${Notice} tone="info" title="Separation of duties">Entries are made by the Finance Officer and approved by the designated approver (the Board). Super Admin access does not skip the approval step, and entering a payment never approves it.</${Notice}>
 <${Tabs} value=${tab} onChange=${setTab} tabs=${[['led','Ledger'],['rec','Reconciliation ('+pend.length+')'],['don','Donations'],['bud','Budgets']]}/>
 ${tab==='led'&&html`<${Card}><${Table} sel=${open} onRow=${r=>setOpen(r.id)} cols=${[{h:'Entry',k:'id',cls:'mono'},{h:'Date',k:'date'},{h:'Type',k:'type',r:r=>html`<${Chip} t=${r.type}/>`},{h:'Category',k:'cat'},{h:'Description',k:'desc'},{h:'Amount',k:'amt',cls:'num',r:r=>KES(r.amt)},{h:'Status',k:'status',r:r=>html`<${Chip} t=${r.status}/>`}]} rows=${fin}/></${Card}>`}
 ${tab==='rec'&&html`<${Card} title="Tourism income waiting for reconciliation" sub="Tourism payments feed Finance. They are not reconciled automatically."><${Table} empty="Nothing waiting. All tourism payments are reconciled." cols=${[{h:'Booking',k:'id',cls:'mono'},{h:'Group',k:'name'},{h:'Received',k:'recv',cls:'num',r:r=>KES(r.recv)},{h:'Method / ref',k:'m',r:r=>r.method+' · '+r.tx},{h:'Receipt',k:'receipt'},{h:'',k:'a',r:r=>write?html`<${Btn} kind="small" onClick=${()=>rec(r)}>Reconcile</${Btn}>`:''}]} rows=${pend}/></${Card}>`}
 ${tab==='don'&&html`<${Card} title="Donor records" right=${write&&html`<${Btn} kind="small" onClick=${()=>setDm(true)}>Record donation</${Btn}>`}><${Table} cols=${[{h:'Donor',k:'name'},{h:'Type',k:'kind'},{h:'Amount',k:'amt',cls:'num',r:r=>KES(r.amt)},{h:'Status',k:'status',r:r=>html`<${Chip} t=${r.status}/>`},{h:'Receipt',k:'receipt'},{h:'Last gift',k:'last'}]} rows=${donors.map((x,i)=>({...x,id:i}))}/><p className="muted small">Card details are never stored. Donors pay by M-Pesa or bank, and only the payment reference is kept.</p></${Card}>`}
 ${tab==='bud'&&html`<div className="grid2"><${Card} title="Budget utilisation by project"><ul className="plist">${PROJECTS.map(p=>html`<li key=${p.id}><span>${p.name}<small>${KES(p.spent)} of ${KES(p.budget)}</small></span><${Progress} v=${Math.round(p.spent/p.budget*100)} tone=${p.spent/p.budget>.8?'warn':''}/><b>${Math.round(p.spent/p.budget*100)}%</b></li>`)}</ul></${Card}><${Card} title="Expenditure by category"><${HBars} fmt=${KES} color="var(--c2)" data=${EX.map(c=>[c,fin.filter(e=>e.type==='Expense'&&e.cat===c).reduce((a,e)=>a+e.amt,0)]).filter(x=>x[1]>0)}/></${Card}></div>`}
 <${Drawer} open=${!!cur} onClose=${()=>setOpen(null)} title=${cur?cur.id:''} sub=${cur?cur.desc:''} foot=${cur&&(cur.status==='Draft'&&write?html`<${Btn} kind="primary" onClick=${()=>setSt('Submitted','Submitted finance entry')}>Submit for approval</${Btn}>`:cur.status==='Submitted'&&approver?html`<${Btn} kind="primary" icon="check" onClick=${()=>setSt('Approved','Approved finance entry')}>Approve entry</${Btn}>`:cur.status==='Approved'&&write?html`<${Btn} kind="primary" onClick=${()=>setSt('Reconciled','Reconciled finance entry')}>Mark reconciled</${Btn}>`:null)}>${cur&&html`<${KV} rows=${[['Date',cur.date],['Type',cur.type],['Category',cur.cat],['Amount',KES(cur.amt)],['Payment reference',cur.ref],['Receipt',cur.receipt],['Entered by',cur.by],['Status',html`<${Chip} t=${cur.status}/>`]]}/>${cur.status==='Submitted'&&role==='admin'&&html`<${Notice} tone="warn" title="Waiting for the designated approver">The Super Admin cannot approve this entry. The Board approver must.</${Notice}>`}`}</${Drawer}>
 <${Modal} open=${mk} onClose=${()=>setMk(false)} title="New finance entry"><div className="form"><${Field} label="Type" id="ft"><${Sel} id="ft" value=${f.type} onChange=${v=>setF(o=>({...o,type:v,cat:v==='Income'?IN[0]:EX[0]}))} opts=${['Income','Expense']}/></${Field}><${Field} label="Category" id="fc"><${Sel} id="fc" value=${f.cat} onChange=${v=>setF(o=>({...o,cat:v}))} opts=${f.type==='Income'?IN:EX}/></${Field}><${Field} label="Description" id="fd" wide=${true}><${Inp} id="fd" value=${f.desc} onChange=${v=>setF(o=>({...o,desc:v}))}/></${Field}><${Field} label="Amount (KES)" id="fa"><${Inp} id="fa" type="number" value=${f.amt} onChange=${v=>setF(o=>({...o,amt:v}))}/></${Field}><${Field} label="Payment reference" id="fr"><${Inp} id="fr" value=${f.ref} onChange=${v=>setF(o=>({...o,ref:v}))}/></${Field}><div className="form-foot wide"><${Btn} onClick=${()=>setMk(false)}>Cancel</${Btn}><${Btn} kind="primary" onClick=${add}>Save draft</${Btn}></div></div></${Modal}>
 <${Modal} open=${dm} onClose=${()=>setDm(false)} title="Record donation"><div className="form"><${Field} label="Donor" id="dn" wide=${true}><${Inp} id="dn" value=${d.name} onChange=${v=>setD(o=>({...o,name:v}))}/></${Field}><${Field} label="Amount (KES)" id="da"><${Inp} id="da" type="number" value=${d.amt} onChange=${v=>setD(o=>({...o,amt:v}))}/></${Field}><${Field} label="Type" id="dk"><${Sel} id="dk" value=${d.kind} onChange=${v=>setD(o=>({...o,kind:v}))} opts=${['One-time','Recurring']}/></${Field}><${Field} label="Payment reference" id="dr" wide=${true}><${Inp} id="dr" value=${d.ref} onChange=${v=>setD(o=>({...o,ref:v}))}/></${Field}><div className="form-foot wide"><${Btn} onClick=${()=>setDm(false)}>Cancel</${Btn}><${Btn} kind="primary" onClick=${addD}>Save donation</${Btn}></div></div></${Modal}></div>`;
};

/* ---------- Reports & Documents ---------- */
const REP_SUM={Patrol:[['Patrols completed','17'],['Distance covered','142 km'],['Incidents reported','6']],Incident:[['Incidents','6'],['Referred','3'],['Closed','1']],LMMA:[['Patrols inside LMMA','11'],['Violations recorded','3'],['Boundary status','Draft, 3 of 12 points verified']],'Coral restoration':[['Fragments placed','2,530'],['Average survival','92%'],['Bleaching','3%']],Project:[['Active projects','5'],['Average progress','54%'],['Budget used','48%']],Tourism:[['Visitors','112'],['Income received',KES(212400)],['Outstanding',KES(42000)]],'Boat and equipment':[['Trips','21'],['Fuel used','612 L'],['Open defects','1']],Finance:[['Income',KES(589000)],['Expenditure',KES(211300)],['Awaiting approval','2']],Donation:[['Donors','9'],['Recurring','4'],['Total',KES(190000)]],BMU:[['Active BMUs','3'],['Community activities','8'],['Meetings','3']],Governance:[['Board meetings','1'],['Resolutions','2'],['Open actions','3']],'Staff attendance':[['Staff on roster','12'],['Average attendance','96%'],['On leave','1']]};
const Reports=()=>{
 const {role,settings,bmuId,log,toast,audit,can}=useApp();
 const [view,setView]=useState(null);
 const list=REPORTS.filter(r=>r.roles.includes(role));
 const blocked=(role==='fisheries'&&!settings.fishDl)||(role==='bmu'&&!settings.bmuDl);
 const dl=(r,kind)=>{log('Report download','Reports',r.id);toast(`Download logged: ${r.id} (${kind}). Demo only, no file is created.`);};
 const hist=audit.filter(a=>a[2]==='Report download').slice(0,8);
 return html`<div><${PageHead} title="Reports & Documents" sub=${role==='bmu'?'Authorised reports for '+bmuName(bmuId):'Generate, view and download authorised reports'}/>
 ${blocked&&html`<${Notice} tone="warn" title="Download is switched off for your role">You can view authorised reports. The Super Admin controls whether ${role==='bmu'?'BMU Representatives':'the Fisheries Officer'} can download them.</${Notice}>`}
 <${Card}><${Table} cols=${[{h:'Report',k:'name'},{h:'Type',k:'type'},{h:'Reference',k:'id',cls:'mono'},{h:'Date',k:'date'},{h:'',k:'a',cls:'act',r:r=>html`<span className="btnrow"><${Btn} kind="small" icon="eye" onClick=${()=>setView(r)}>View</${Btn}>${blocked?html`<span className="muted small"><${Icon} n="lock" s=${12}/> Download off</span>`:html`<${Btn} kind="small" icon="download" onClick=${()=>dl(r,'PDF')}>PDF</${Btn}><${Btn} kind="small" icon="download" onClick=${()=>dl(r,'Excel')}>Excel</${Btn}>`}</span>`}]} rows=${list}/></${Card}>
 <div className="grid2">${(role==='admin'||role==='board')&&html`<${Card} title="Document archive"><ul className="doclist">${DOCS.map(d=>html`<li key=${d}><${Icon} n="reports" s=${16}/>${d}</li>`)}</ul></${Card}>`}
 ${role==='admin'&&html`<${Card} title="Download history" sub="Every download logs user, date and time, report name and reference"><${Table} empty="No downloads yet." cols=${[{h:'User',k:'1',r:r=>r[1]},{h:'Date and time',k:'0',r:r=>r[0]},{h:'Reference',k:'4',cls:'mono',r:r=>r[4]}]} rows=${hist.map((h,i)=>Object.assign([...h],{id:i}))}/></${Card}>`}</div>
 <${Modal} open=${!!view} onClose=${()=>setView(null)} title=${view?view.name:''}>${view&&html`<p className="muted small mono">${view.id} · ${view.date}</p><div className="kpis small">${(REP_SUM[view.type]||[]).map(k=>html`<${Kpi} key=${k[0]} label=${k[0]} value=${k[1]}/>`)}</div><p className="muted small">Sample figures. Real reports follow the filters for date range, BMU, project and activity.</p>`}</${Modal}></div>`;
};

/* ---------- Settings & Permissions ---------- */
const SYM={w:['Create / edit','good'],s:['Own or assigned','info'],r:['Read only','neutral']};
const Permissions=()=>{
 const {settings,setSettings,assign,setAssign,log,toast,setRole,go}=useApp();
 const [tab,setTab]=useState('roles');
 const tg=(k,label)=>v=>{setSettings(s=>({...s,[k]:v}));log('Toggled setting: '+label+' = '+(v?'ON':'OFF'),'Settings & Permissions',k==='fishDl'?'SET-FISH-DL':'SET-BMU-DL');toast(label+': '+(v?'ON':'OFF'));};
 const flip=(o,p)=>{const has=assign[o.id].includes(p.id);setAssign(a=>({...a,[o.id]:has?a[o.id].filter(x=>x!==p.id):[...a[o.id],p.id]}));log(has?'Revoked project access':'Assigned officer to project','Settings & Permissions',o.name+' / '+p.name);toast(has?o.name+' no longer has access to '+p.code:o.name+' can now open '+p.code);};
 const [pub,setPub]=useState({a:true,b:true,c:false});
 const rk=Object.keys(ROLES);
 return html`<div><${PageHead} title="Settings & Permissions" sub="Roles, project access, downloads and security"/>
 <${Tabs} value=${tab} onChange=${setTab} tabs=${[['roles','Roles and modules'],['proj','Project access'],['dl','Downloads and sharing'],['sys','Security and system']]}/>
 ${tab==='roles'&&html`<${Card} title="Who can do what" sub="Enforced by the server and database, not by hiding menus"><div className="tscroll"><table className="tbl matrix"><thead><tr><th>Module</th>${rk.map(k=>html`<th key=${k} className="mc">${ROLES[k].label}</th>`)}</tr></thead><tbody>${MODS.map(m=>html`<tr key=${m.id}><td>${m.label}</td>${rk.map(k=>{const v=ROLES[k].mods[m.id];return html`<td key=${k} className="mc">${v?html`<span className=${'mx '+SYM[v][1]} title=${SYM[v][0]}>${v==='w'?'Full':v==='s'?'Own':'Read'}</span>`:html`<span className="mx none">—</span>`}</td>`;})}</tr>`)}</tbody></table></div><p className="muted small">Full = create and edit · Own = own or assigned records · Read = read only. Even Full does not bypass financial approval.</p></${Card}>`}
 ${tab==='proj'&&html`<${Card} title="Conservation Officer project assignments" sub="An officer can only open projects ticked here. Officers cannot assign themselves or each other."><div className="tscroll"><table className="tbl matrix"><thead><tr><th>Officer</th>${PROJECTS.map(p=>html`<th key=${p.id} className="mc">${p.code}</th>`)}</tr></thead><tbody>${OFFICERS.map(o=>html`<tr key=${o.id}><td>${o.name}</td>${PROJECTS.map(p=>html`<td key=${p.id} className="mc"><input type="checkbox" aria-label=${o.name+' access to '+p.name} checked=${assign[o.id].includes(p.id)} onChange=${()=>flip(o,p)}/></td>`)}</tr>`)}</tbody></table></div>
 <p className="muted small">${PROJECTS.map(p=>p.code+' = '+p.name).join(' · ')}</p><div className="rowx"><${Btn} icon="eye" onClick=${()=>{setRole('officer');go('projects');}}>View as Rehema Salim (Conservation Officer)</${Btn}></div></${Card}>`}
 ${tab==='dl'&&html`<div className="grid2"><${Card} title="Report downloads" sub="Two independent settings. Neither grants editing, approving or administrative rights."><ul className="sharelist"><li><span>Allow BMU Representatives to download reports</span><${Toggle} id="t-bmu" on=${settings.bmuDl} onChange=${tg('bmuDl','BMU Representatives download')} label="Allow BMU Representatives to download reports"/></li><li><span>Allow Fisheries Officer to download reports</span><${Toggle} id="t-fish" on=${settings.fishDl} onChange=${tg('fishDl','Fisheries Officer download')} label="Allow Fisheries Officer to download reports"/></li></ul><p className="muted small">Every download is logged with user, date and time, report name and report reference.</p></${Card}>
 <${Card} title="Public website" sub="patteconservation.com stays separate. Only approved items are shared."><ul className="sharelist">${[['a','Restoration milestones (approved summaries)'],['b','Tourism packages and visitor code of conduct'],['c','Annual impact summary']].map(r=>html`<li key=${r[0]}><span>${r[1]}</span><${Toggle} on=${pub[r[0]]} onChange=${v=>{setPub(p=>({...p,[r[0]]:v}));log('Changed public website sharing','Settings & Permissions',r[1]);toast(r[1]+': '+(v?'shared':'not shared'));}} label=${r[1]}/></li>`)}</ul><h3 className="mini-h">Always protected</h3><p className="muted small">Ranger patrol records and GPS tracks · enforcement incidents and evidence · staff records · finance · visitor personal information · internal project records · sensitive locations · confidential Board documents.</p></${Card}></div>`}
 ${tab==='sys'&&html`<div className="grid2"><${Card} title="Security"><${KV} rows=${[['Sign-in','Individual accounts, password reset'],['Two-factor sign-in','Optional, per user'],['Data in transit','Encrypted'],['Bulk download protection','Limit of 50 records per export'],['Backups','Automated daily, last 11 Nov 2026 02:00']]}/></${Card}>
 <${Card} title="Left out on purpose"><ul className="ticks x"><li>No Fisheries Monitoring module</li><li>No landing-site activity, fish catch, species, weight or effort forms</li><li>No separate ranger or management app</li><li>No automatic cross-project access for officers</li><li>No automatic access for external partners</li><li>No automatic public sharing of internal records</li><li>No automatic financial approval when a payment is entered</li></ul></${Card}></div>`}
 </div>`;
};

/* ---------- Audit Trail ---------- */
const Audit=()=>{
 const {audit}=useApp();const [q,setQ]=useState('');const [m,setM]=useState('All');
 const mods=['All',...Array.from(new Set(audit.map(a=>a[3])))];
 const rows=audit.map((a,i)=>({id:i,t:a[0],u:a[1],a:a[2],m:a[3],r:a[4]})).filter(r=>(m==='All'||r.m===m)&&(r.u+r.a+r.r).toLowerCase().includes(q.toLowerCase()));
 return html`<div><${PageHead} title="Audit Trail" sub="Who did what, when, and to which record"/>
 <${Notice} tone="info" title="Read-only">Entries cannot be edited or deleted. New actions you take in this demo appear at the top.</${Notice}>
 <${Card}><div className="toolbar"><div className="search"><${Icon} n="search" s=${16}/><input aria-label="Search audit trail" placeholder="Search user, action or record" value=${q} onChange=${e=>setQ(e.target.value)}/></div><select aria-label="Filter by module" value=${m} onChange=${e=>setM(e.target.value)}>${mods.map(x=>html`<option key=${x}>${x}</option>`)}</select></div>
 <${Table} cols=${[{h:'Date and time',k:'t',cls:'nowrap'},{h:'User',k:'u'},{h:'Action',k:'a'},{h:'Module',k:'m'},{h:'Record',k:'r',cls:'mono'}]} rows=${rows}/></${Card}></div>`;
};
/* ============ solution overview: the story for the client ============ */
const STEPS=[
 ['ranger','dashboard','Ranger','Start a patrol at sea','On the phone, tap Start patrol. The map follows the boat and records the GPS track.'],
 ['ranger','dashboard','Ranger','Report an incident with a photo, offline','Switch on Simulate no signal, add an incident and a photo, then complete and submit. It waits on the phone.'],
 ['ranger','dashboard','Ranger','Back in signal, sync','Go back online and tap Sync now. The records arrive once, with no duplicates.'],
 ['admin','patrols','Super Admin','Review the patrol and its GPS track','Open PT-2026-0421. The recorded track is on the map and the patrol waits for review.'],
 ['admin','incidents','Super Admin','Refer the incident and keep the record','Move the incident from Submitted to Referred. POps records and tracks it. It does not give enforcement powers.'],
 ['board','finance','Board Chairperson','Money follows the same rules','Entries are made by Finance and approved by the Board. The Super Admin cannot skip the approval.'],
 ['fisheries','reports','Fisheries Officer','Partners get read-only access','The Super Admin switches report downloads on or off. Every download is logged.'],
 ['admin','audit','Super Admin','Every step is on record','The Audit Trail shows who did what, when, and to which record.']
];
const GAPS=[
 ['Patrol notes live on paper, in WhatsApp and in photos on personal phones.','One structured patrol record with GPS track, observations and photos, created in the field.','ranger','dashboard'],
 ['No signal at sea, so notes are written later and details are lost.','Records, photos and the map area are kept on the phone and sync without duplicates when signal returns.','ranger','dashboard'],
 ['Incidents are reported by call or message, with no status or follow-up.','Each incident has a reference, a status from Submitted to Closed, a referral to KWS, KFS or Fisheries, and evidence.','admin','incidents'],
 ['The LMMA boundary is a list of coordinates that nobody has verified on a map.','Boundary and zones drawn on a real map. Each point is verified and every version is kept.','admin','iweni-lmma'],
 ['Anyone with the spreadsheet sees everything, including finance and visitor details.','Roles control every screen. Officers see only their assigned projects, and the database enforces it.','officer','projects'],
 ['Reports are rebuilt by hand for each donor, BMU and agency.','Reports come from the records. Downloads are switched on or off per partner and logged.','fisheries','reports'],
 ['Tourism cash and M-Pesa payments do not match what reaches the books.','Booking, payment, receipt and reconciliation sit in one chain. Finance reconciles each payment.','tourism','tourism'],
 ['Fuel, engine faults and boat trips are remembered, not recorded.','A trip log with fuel and a defect report that reaches the Super Admin.','cox','boats'],
 ['Board members chase information before each meeting.','One governance view with meetings, resolutions, action points and approvals.','board','bmus'],
 ['Nobody can say who changed what.','An audit trail of who did what, when and to which record.','admin','audit']
];
const REALVS=[
 ['Map','Real satellite and street maps in the installed app. The preview link shows a vector chart.','Licensed map provider or Patte\'s own tile server, with the verified boundary kept in the database.'],
 ['GPS and camera','Real phone GPS and camera. A simulated route is available at a desk.','The same, with accuracy checks and battery-aware tracking.'],
 ['Offline','Queue, photos and saved map area on the phone.','A full offline database on the phone with background sync and conflict handling.'],
 ['Accounts and access','A role switcher so the client can see every view.','Individual sign-in, optional two-factor, and roles enforced in the API and the database.'],
 ['Data','Sample data held in the browser.','PostgreSQL with PostGIS, daily backups and project-level row security.'],
 ['Tourism payments','Payments are entered by hand.','M-Pesa confirmations pulled in automatically, with manual reconciliation by Finance.'],
 ['Reports','Downloads are logged. CSV export for key reports.','Server-made PDF and Excel on Patte letterhead.'],
 ['Notifications','An in-app list.','Push notifications to phones, and email.'],
 ['Public website','Sharing switches.','Approved items published to the website through a separate, checked feed.']
];
const RISKS=[
 ['GPS accuracy at sea','Show accuracy on every point, keep the raw track, and review before anything is reported.'],
 ['Phone battery on long patrols','Track only during a started patrol, use a sensible interval, and issue power banks.'],
 ['Shared or lost phones','Individual sign-in, auto-lock, remote sign-out, and offline data cleared at sign-out.'],
 ['Weak or no signal','Offline-first design with a saved map area and queued sync.'],
 ['Visitor and personal data','Collect only what is needed, mask contacts, log who views them, and set retention rules in line with Kenya\'s Data Protection Act, 2019. Confirm the details with Patte\'s legal adviser.'],
 ['Boundary not yet settled','A verification workflow with versions and sign-off before any enforcement use.'],
 ['Enforcement expectations','POps records and tracks. Referral goes to KWS, KFS, the Fisheries Department or the Police.'],
 ['Adoption and literacy','Large buttons, English and Kiswahili, training, and a four-week pilot with two rangers.'],
 ['Map licensing','The demo uses public tile servers. The live build uses a licensed provider or a self-hosted tile server.'],
 ['Hosting cost and continuity','Low-cost hosting, daily backups, full data export, and a documented handover.']
];
const PHASES=[
 ['1','Foundation','Accounts, roles, audit trail, staff, Iweni boundary on a real map',true],
 ['2','Field operations pilot','Ranger app, patrols, incidents, offline sync, boats and fuel',true],
 ['3','Conservation and community','Projects, coral restoration, BMUs, partners',true],
 ['4','Income and governance','Tourism, finance, donations, Board approvals',true],
 ['5','Reporting and integrations','Server-made reports, M-Pesa, website feed, push notifications',false]
];
const Overview=()=>{
 const {setRole,go}=useApp();
 const jump=(r,m)=>{setRole(r);go(m);};
 return html`<div className="ov">
 <section className="ov-hero"><div><span className="eyebrow">Patte Conservation CBO · Pate Island, Lamu County</span><h1>One platform for every conservation operation</h1><p>POps brings patrols, incidents, the Iweni LMMA, projects, tourism, finance and governance into one system. Rangers work from a phone, offline. The Super Admin and the Board see the same records, each within their role.</p>
 <div className="ov-cta"><${Btn} kind="primary" icon="play" onClick=${()=>jump('ranger','dashboard')}>Start the walkthrough</${Btn}><a className="btn" href="#field"><${Icon} n="phone" s=${16}/>Open the Ranger app full-screen</a></div></div>
 <ul className="ov-stats"><li><b>16</b><span>modules from the specification</span></li><li><b>9</b><span>role views, each with its own limits</span></li><li><b>1</b><span>login for the whole organisation</span></li><li><b>0</b><span>separate apps to maintain</span></li></ul></section>

 <${Card} title="A patrol from the sea to the Board" sub="Each step opens the right role and screen. Follow them in order.">
  <ol className="steps">${STEPS.map((s,i)=>html`<li key=${i}><span className="sn">${i+1}</span><div><span className="who">${s[2]}</span><h3>${s[3]}</h3><p>${s[4]}</p></div><button className="btn small" onClick=${()=>jump(s[0],s[1])}>Open<${Icon} n="chev" s=${14}/></button></li>`)}</ol></${Card}>

 <${Card} title="Gaps in day-to-day operations and how POps closes them" sub="These are common gaps in community conservation work. Confirm each one with the Patte team before the meeting.">
  <div className="tscroll"><table className="tbl gaps"><thead><tr><th>What goes wrong</th><th>How POps closes it</th><th></th></tr></thead><tbody>${GAPS.map((g,i)=>html`<tr key=${i}><td>${g[0]}</td><td>${g[1]}</td><td className="act"><button className="link" onClick=${()=>jump(g[2],g[3])}>See it<${Icon} n="chev" s=${14}/></button></td></tr>`)}</tbody></table></div></${Card}>

 <div className="grid2">
  <${Card} title="What is real in this demo, and what the live build adds"><div className="tscroll"><table className="tbl"><thead><tr><th>Area</th><th>In this demo</th><th>In the live build</th></tr></thead><tbody>${REALVS.map(r=>html`<tr key=${r[0]}><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td></tr>`)}</tbody></table></div></${Card}>
  <${Card} title="Risks we plan for"><ul className="risks">${RISKS.map(r=>html`<li key=${r[0]}><b>${r[0]}</b><span>${r[1]}</span></li>`)}</ul></${Card}>
 </div>

 <${Card} title="Proposed delivery plan" sub="A suggestion to agree with Patte. Phases 1 to 4 are shown in this demo."><ol className="phases">${PHASES.map(p=>html`<li key=${p[0]} className=${p[3]?'done':''}><span className="pn">${p[0]}</span><div><h3>${p[1]}</h3><p>${p[2]}</p></div>${p[3]?html`<${Chip} t="Shown in demo" tone="good"/>`:html`<${Chip} t="Live build" tone="info"/>`}</li>`)}</ol>
  <div className="ov-next"><strong>Suggested next step.</strong> Confirm the boundary and zone shapes with Patte, then run a four-week pilot of the Ranger app with two rangers on real patrols.</div></${Card}>
 </div>`;
};
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
 const [settings,setSettings]=useState({bmuDl:true,fishDl:false});
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
