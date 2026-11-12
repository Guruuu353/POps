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
