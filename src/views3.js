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
