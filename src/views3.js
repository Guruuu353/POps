/* ============ solution overview: the story for the client ============ */
const STEPS=[
 ['ranger','dashboard','Ranger','Start a patrol: confirm crew, vessel and area','Tap Start patrol. Check who is aboard, the boat and the patrol area. The map then follows the boat and records the GPS track.'],
 ['ranger','dashboard','Ranger','Record a fisher check and a seizure, with no signal','Tap Fisher check and fill one Form 1A row. Choose an infringement code and switch on Items seized to make the Seizure Form too. Switch on Simulate no signal under Me to try it offline.'],
 ['ranger','dashboard','Ranger','Finish: the four forms are already filled in','Complete the patrol, tick the challenges, sign with a finger and look at Form 1A, the Patrol Report, the Seizure Form and the MCS sheet. Submit, then sync when signal returns.'],
 ['admin','patrols','Super Admin','Open the patrol and its Forms tab','Open PT-2026-0416. See the same four forms in the paper layout, with ID and phone numbers shown to this role only.'],
 ['admin','incidents','Super Admin','Refer an incident and keep the record','Move the incident from Submitted to Referred. POps records and tracks it. It does not give enforcement powers.'],
 ['admin','reports','Super Admin','Infringements by type and CSV export','See the summary the MCS outcome form asks for, across all patrols. In the installed app, export every Form 1A row to CSV.'],
 ['cox','boats','Coxswain','Log a trip and watch the engine service counter','Add a log entry in the same layout as the paper Vessel Log. Both engine hour meters update, and run hours since the last service count up. Try Service settings to raise an alert.'],
 ['board','finance','Board Chairperson','Money follows the same rules','Entries are made by Finance and approved by the Board. The Super Admin cannot skip the approval.'],
 ['fisheries','reports','Fisheries Officer','Partners get read-only access','The Super Admin switches report downloads on or off. Fisher IDs and phones are masked unless the role is allowed to see them. Every download is logged.'],
 ['admin','audit','Super Admin','Every step is on record','The Audit Trail shows who did what, when, and to which record.']
];
const GAPS=[
 ['One patrol is written four times: Form 1A, the BMU Patrol Report, the Seizure Form and the MCS Outcome sheet.','The ranger records the patrol once. POps fills in all four in the same layout and keeps them linked to the patrol.','ranger','dashboard'],
 ['Handwritten IDs, phone numbers and names are hard to read. In the March report the patrol reference and BMU name were left blank.','Typed entries, a patrol reference made by POps, and the BMU and boat filled in from the assignment.','admin','patrols'],
 ['Two infringement lists are in use: 10 codes on Form 1A, and four groups (people, gears, crafts, fish) on the current template.','One list in POps: the 10 Form 1A codes, plus four types from the current template that Fisheries should confirm.','ranger','dashboard'],
 ['A blank Seizure Form is attached even when nothing was seized.','POps makes a Seizure Form only when an item is seized, filled from the fisher check: officer, station, place and time.','admin','patrols'],
 ['Fisher ID and phone numbers travel on paper and in photos, open to anyone who holds the page.','Masked by role. BMU Representatives see them only if the Super Admin allows it. Exports are logged.','admin','permissions'],
 ['No signal at sea, so notes are written later and details are lost.','Records, photos and the map area are kept on the phone and sync without duplicates when signal returns.','ranger','dashboard'],
 ['Incidents are reported by call or message, with no status or follow-up.','Each incident has a reference, a status from Submitted to Closed, a referral to KWS, KFS or Fisheries, and evidence.','admin','incidents'],
 ['The LMMA boundary is a list of coordinates that nobody has verified on a map.','Boundary and zones drawn on a real map. Each point is verified and every version is kept.','admin','iweni-lmma'],
 ['Convictions, fines and prosecution outcomes are never added back to the patrol.','The MCS follow-up columns are filled in later against the same patrol, and roll up into one summary.','admin','reports'],
 ['Anyone with the spreadsheet sees everything, including finance and visitor details.','Roles control every screen. Officers see only their assigned projects, and the database enforces it.','officer','projects'],
 ['Tourism cash and M-Pesa payments do not match what reaches the books.','Booking, payment, receipt and reconciliation sit in one chain. Finance reconciles each payment.','tourism','tourism'],
 ['Fuel, engine faults and boat trips are remembered, not recorded. On the Nguru log we received, every engine hours and refuel box was empty.','A digital vessel log in the same layout, with an hour meter per engine, run hours since the last service, and an alert before a service is due.','cox','boats'],
 ['Nobody can say who changed what.','An audit trail of who did what, when and to which record.','admin','audit']
];
const QUESTIONS=[
 ['Patrol Costing table','Annex 2 lists it as an attachment, but it was not in the forms we received. Please send the template so POps can fill it from fuel, boat and crew records.'],
 ['Infringement types 11 to 14','These come from the current template (poor handling, polluting methods, transport of immature fish and illegal gears). Do they stay as codes, or fold into the 10 official codes?'],
 ['"JCMA" name','Form 1A asks for it. Confirm the full name and the value to print for Pate and Shanga.'],
 ['Draft marking','The current template is marked "TOT\'s draft, July 2023, limited circulation". Confirm which version Patte and the Fisheries Department treat as final.'],
 ['Who receives which form','Confirm where Form 1A, the Patrol Report, Form DF/SZ and the MCS sheet are sent, and by when.'],
 ['Vessel log: engine hours','The sheet has two columns both headed "Engine hours". Are they the meter reading at arrival, or hours run on that trip? POps stores meter readings and works out the run hours.'],
 ['Service rules per engine','What is the service interval for each engine make, in hours and months? Who must be alerted, and how: in the app, SMS, WhatsApp or email?'],
 ['Printed and electronic signatures','Confirm whether a printed POps form with a drawn signature is accepted, or whether a signed paper copy must be kept.']
];
const REALVS=[
 ['Map','Real satellite and street maps in the installed app. The preview link shows a vector chart.','Licensed map provider or Patte\'s own tile server, with the verified boundary kept in the database.'],
 ['GPS and camera','Real phone GPS and camera. A simulated route is available at a desk.','The same, with accuracy checks and battery-aware tracking.'],
 ['Offline','Queue, photos and saved map area on the phone.','A full offline database on the phone with background sync and conflict handling.'],
 ['Accounts and access','A role switcher so the client can see every view.','Individual sign-in, optional two-factor, and roles enforced in the API and the database.'],
 ['Data','Sample data held in the browser.','PostgreSQL with PostGIS, daily backups and project-level row security.'],
 ['Tourism payments','Payments are entered by hand.','M-Pesa confirmations pulled in automatically, with manual reconciliation by Finance.'],
 ['The four forms','Form 1A, Patrol Report, Seizure Form and MCS sheet in the paper layout. Print or save as PDF, and CSV export, in the installed app link.','Server-made PDF on the final layouts once Patte and Fisheries approve them.'],
 ['Signatures','Drawn on the phone screen.','Signing rules agreed with the Fisheries Department, with each signature on the audit trail.'],
 ['Reports','Downloads are logged. Summary of infringements by type.','Server-made PDF and Excel on Patte letterhead.'],
 ['Service alerts','Shown in the bell menu and on the Coxswain page when an engine is near or past its service limit.','The same alerts by SMS, email or push, checked every night as well as when a log is saved.'],
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
 ['Electronic forms in place of paper','Agree with the Fisheries Department whether a printed POps form is accepted for Form DF/SZ, or keep a signed paper copy until it is.'],
 ['Enforcement expectations','POps records and tracks. Referral goes to KWS, KFS, the Fisheries Department or the Police.'],
 ['Adoption and literacy','Large buttons, English and Kiswahili, training, and a four-week pilot with two rangers.'],
 ['Map licensing','The demo uses public tile servers. The live build uses a licensed provider or a self-hosted tile server.'],
 ['Hosting cost and continuity','Low-cost hosting, daily backups, full data export, and a documented handover.']
];
const PHASES=[
 ['1','Foundation','Accounts, roles, audit trail, staff, Iweni boundary on a real map',true],
 ['2','Field operations pilot','Ranger app, Form 1A, Patrol Report, Seizure Form, MCS outcome, offline sync, boats and fuel',true],
 ['3','Conservation and community','Projects, coral restoration, BMUs, partners',true],
 ['4','Income and governance','Tourism, finance, donations, Board approvals',true],
 ['5','Reporting and integrations','Server-made reports, M-Pesa, website feed, push notifications',false]
];
const Overview=()=>{
 const {setRole,go}=useApp();
 const jump=(r,m)=>{setRole(r);go(m);};
 return html`<div className="ov">
 <section className="ov-hero"><div><span className="eyebrow">Patte Conservation CBO · Pate Island, Lamu County</span><h1>One platform for every conservation operation</h1><p>POps brings patrols, incidents, the Iweni LMMA, projects, tourism, finance and governance into one system. Rangers work from a phone, offline, and record each patrol once. The four paper forms, Form 1A, the BMU Patrol Report, the Seizure Form and the MCS Outcome sheet, are then filled in for them. The Super Admin and the Board see the same records, each within their role.</p>
 <div className="ov-cta"><${Btn} kind="primary" icon="play" onClick=${()=>jump('ranger','dashboard')}>Start the walkthrough</${Btn}><a className="btn" href="#field"><${Icon} n="phone" s=${16}/>Open the Ranger app full-screen</a></div></div>
 <ul className="ov-stats"><li><b>16</b><span>modules from the specification</span></li><li><b>9</b><span>role views, each with its own limits</span></li><li><b>1</b><span>login for the whole organisation</span></li><li><b>4</b><span>paper forms made from one capture</span></li></ul></section>

 <${Card} title="A patrol from the sea to the Board" sub="Each step opens the right role and screen. Follow them in order.">
  <ol className="steps">${STEPS.map((s,i)=>html`<li key=${i}><span className="sn">${i+1}</span><div><span className="who">${s[2]}</span><h3>${s[3]}</h3><p>${s[4]}</p></div><button className="btn small" onClick=${()=>jump(s[0],s[1])}>Open<${Icon} n="chev" s=${14}/></button></li>`)}</ol></${Card}>

 <${Card} title="Gaps in day-to-day operations and how POps closes them" sub="These are common gaps in community conservation work. Confirm each one with the Patte team before the meeting.">
  <div className="tscroll"><table className="tbl gaps"><thead><tr><th>What goes wrong</th><th>How POps closes it</th><th></th></tr></thead><tbody>${GAPS.map((g,i)=>html`<tr key=${i}><td>${g[0]}</td><td>${g[1]}</td><td className="act"><button className="link" onClick=${()=>jump(g[2],g[3])}>See it<${Icon} n="chev" s=${14}/></button></td></tr>`)}</tbody></table></div></${Card}>

 <${Card} title="Open questions for Patte" sub="Found while matching POps to the forms. Answers change what we build."><ul className="risks">${QUESTIONS.map(q=>html`<li key=${q[0]}><b>${q[0]}</b><span>${q[1]}</span></li>`)}</ul></${Card}>

 <div className="grid2">
  <${Card} title="What is real in this demo, and what the live build adds"><div className="tscroll"><table className="tbl"><thead><tr><th>Area</th><th>In this demo</th><th>In the live build</th></tr></thead><tbody>${REALVS.map(r=>html`<tr key=${r[0]}><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td></tr>`)}</tbody></table></div></${Card}>
  <${Card} title="Risks we plan for"><ul className="risks">${RISKS.map(r=>html`<li key=${r[0]}><b>${r[0]}</b><span>${r[1]}</span></li>`)}</ul></${Card}>
 </div>

 <${Card} title="Proposed delivery plan" sub="A suggestion to agree with Patte. Phases 1 to 4 are shown in this demo."><ol className="phases">${PHASES.map(p=>html`<li key=${p[0]} className=${p[3]?'done':''}><span className="pn">${p[0]}</span><div><h3>${p[1]}</h3><p>${p[2]}</p></div>${p[3]?html`<${Chip} t="Shown in demo" tone="good"/>`:html`<${Chip} t="Live build" tone="info"/>`}</li>`)}</ol>
  <div className="ov-next"><strong>Suggested next step.</strong> Confirm the boundary and zone shapes with Patte, then run a four-week pilot of the Ranger app with two rangers on real patrols.</div></${Card}>
 </div>`;
};
