const AK='hmv2-assets',TK='hmv2-tasks',HK='hmv2-history',MIG='hmv2-parts-migration-1';
const uid=()=>crypto.randomUUID();
const todayISO=()=>new Date().toISOString().slice(0,10);
const assetsSeed=[
{id:uid(),name:'2014 Volkswagen Passat',type:'vehicle',year:2014,make:'Volkswagen',model:'Passat',serial:'1VWBS7A36EC087006',meter:'',meterType:'miles',notes:''},
{id:uid(),name:'2021 Ford Expedition',type:'vehicle',year:2021,make:'Ford',model:'Expedition',serial:'1FMJK1JT1MEA80457',meter:'',meterType:'miles',notes:''},
{id:uid(),name:'2002 Ford F-150',type:'vehicle',year:2002,make:'Ford',model:'F-150',serial:'1FTRW08L52KB19982',meter:'',meterType:'miles',notes:''},
{id:uid(),name:'1996 Chevy 1500',type:'vehicle',year:1996,make:'Chevrolet',model:'1500',serial:'',meter:'',meterType:'miles',notes:''},
{id:uid(),name:'2020 Polaris Ranger 1000',type:'power',year:2020,make:'Polaris',model:'Ranger 1000',serial:'',meter:'',meterType:'hours',notes:''},
{id:uid(),name:'2007 Honda Recon 250',type:'power',year:2007,make:'Honda',model:'Recon 250',serial:'',meter:'',meterType:'hours',notes:''},
{id:uid(),name:'2006 Mahindra 4530',type:'power',year:2006,make:'Mahindra',model:'4530',serial:'',meter:'',meterType:'hours',notes:''},
{id:uid(),name:'Scag Freedom Z 52',type:'power',year:'',make:'Scag',model:'Freedom Z 52',serial:'',meter:'',meterType:'hours',notes:''},
{id:uid(),name:'Goodman Outdoor Heat Pump',type:'home',year:'',make:'Goodman',model:'GSZ140601KD',serial:'1703494212',meter:'',meterType:'none',notes:'R-410A; nominal 5-ton class.'},
{id:uid(),name:'Goodman Indoor Air Handler',type:'home',year:'',make:'Goodman',model:'ARUF61D14AA',serial:'1704251868',meter:'',meterType:'none',notes:'208/230 V; 3/4 HP blower.'},
{id:uid(),name:'GE Refrigerator',type:'home',year:'',make:'GE',model:'GFE28GYNIFS',serial:'RT533964',meter:'',meterType:'none',notes:'R600a refrigerant.'},
{id:uid(),name:'GE Dishwasher',type:'home',year:'',make:'GE',model:'GDP670SYV1FS',serial:'SA860633B',meter:'',meterType:'none',notes:''},
{id:uid(),name:'GE Top Load Washer',type:'home',year:'',make:'GE',model:'PTW600BSR1WS',serial:'GA978895G',meter:'',meterType:'none',notes:''},
{id:uid(),name:'Maytag Microwave',type:'home',year:2016,make:'Maytag',model:'MMV4205FZ-0',serial:'TR 6 26 11072',meter:'',meterType:'none',notes:'Manufactured June 2016.'},
{id:uid(),name:'Electric Double-Oven Range',type:'home',year:'',make:'',model:'',serial:'',meter:'',meterType:'none',notes:'Model/serial pending.'},
{id:uid(),name:'BUNN Coffee Maker',type:'home',year:'',make:'BUNN',model:'',serial:'',meter:'',meterType:'none',notes:'Model/serial pending.'}
];
let assets=JSON.parse(localStorage.getItem(AK)||'null')||assetsSeed;
let tasks=JSON.parse(localStorage.getItem(TK)||'null')||[];
let history=JSON.parse(localStorage.getItem(HK)||'null')||[];

function assetByName(n){return assets.find(a=>a.name===n)}
function ensureParts(t){if(!Array.isArray(t.parts))t.parts=[];return t}
if(localStorage.getItem(MIG)!=='1'){
  tasks.forEach(t=>ensureParts(t));
  // Add useful placeholder supply records without inventing unverified OEM part numbers.
  const seedPart=(asset,taskName,part)=>{
    const t=tasks.find(x=>x.asset===asset&&x.name===taskName);
    if(t && !t.parts.some(p=>p.description===part.description)) t.parts.push(part);
  };
  seedPart('2020 Polaris Ranger 1000','Engine oil & filter',{description:'Engine oil',oem:'Verify exact spec',qty:'Per manual',aftermarket:'',notes:'Use Polaris-recommended oil specification for exact engine.'});
  seedPart('2020 Polaris Ranger 1000','Engine oil & filter',{description:'Oil filter',oem:'Verify OEM part #',qty:'1',aftermarket:'',notes:'Enter exact OEM/cross-reference after verification.'});
  seedPart('Scag Freedom Z 52','Engine oil & filter',{description:'Engine oil',oem:'Engine-model dependent',qty:'Per engine manual',aftermarket:'',notes:'Exact oil/filter require installed engine model.'});
  seedPart('Scag Freedom Z 52','Engine oil & filter',{description:'Oil filter',oem:'Engine-model dependent',qty:'1',aftermarket:'',notes:'Do not guess until engine model is confirmed.'});
  seedPart('Goodman Indoor Air Handler','Replace HVAC filter',{description:'Return-air filter',oem:'Enter filter size',qty:'1',aftermarket:'',notes:'Record actual filter dimensions/MERV rating.'});
  seedPart('GE Refrigerator','Replace water filter',{description:'Refrigerator water filter',oem:'Verify OEM part #',qty:'1',aftermarket:'',notes:'Enter exact filter after verification for model GFE28GYNIFS.'});
  localStorage.setItem(MIG,'1');
}
localStorage.setItem(AK,JSON.stringify(assets));localStorage.setItem(TK,JSON.stringify(tasks));localStorage.setItem(HK,JSON.stringify(history));

const $=x=>document.getElementById(x);
function save(){localStorage.setItem(AK,JSON.stringify(assets));localStorage.setItem(TK,JSON.stringify(tasks));localStorage.setItem(HK,JSON.stringify(history));render()}
function esc(x=''){return String(x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function addMonths(dateStr,n){const d=new Date((dateStr||todayISO())+'T12:00:00');d.setMonth(d.getMonth()+(+n||0));return d.toISOString().slice(0,10)}
function isHomeAsset(name){return assetByName(name)?.type==='home'}
function meterLabel(a){if(!a||a.type==='home'||a.meterType==='none')return'';return a.meter!==''?`${a.meter} ${a.meterType}`:'Meter not entered'}
function renderAssets(type,id){$(id).innerHTML=assets.filter(a=>a.type===type).map(a=>`<article class="card"><h3>${esc(a.name)}</h3><div class="muted">${esc([a.year,a.make,a.model].filter(Boolean).join(' '))}</div>${type!=='home'?`<div class="meter">${esc(meterLabel(a))}</div>`:''}${a.serial?`<div class="muted">VIN / Serial: ${esc(a.serial)}</div>`:''}<p>${esc(a.notes||'')}</p><button onclick="editAsset('${a.id}')">Edit</button></article>`).join('')}
function partsHTML(t){if(!t.parts?.length)return'';return `<div class="parts"><strong>Parts & Supplies</strong>${t.parts.map(p=>`<div class="part-view"><b>${esc(p.description)}</b>${p.oem?` · OEM: ${esc(p.oem)}`:''}${p.aftermarket?` · Cross-ref: ${esc(p.aftermarket)}`:''}${p.qty?` · Qty/Capacity: ${esc(p.qty)}`:''}${p.notes?`<br>${esc(p.notes)}`:''}</div>`).join('')}</div>`}
function historyHTML(t){const h=history.filter(x=>x.taskId===t.id).sort((a,b)=>(b.date||'').localeCompare(a.date||''));if(!h.length)return'';return `<details class="history"><summary>Service history (${h.length})</summary>${h.map(x=>`<div>${esc(x.date)}${x.meter!==''&&x.meter!=null?` · ${esc(x.meter)} ${esc(x.meterType||'')}`:''}${x.cost?` · $${Number(x.cost).toFixed(2)}`:''}${x.notes?`<br>${esc(x.notes)}`:''}</div>`).join('<hr>')}</details>`}
function dueClass(t){if(!t.dueDate)return'';const days=(new Date(t.dueDate+'T12:00:00')-new Date())/86400000;if(days<0)return'overdue';if(days<=30)return'soon';return''}
function render(){
 renderAssets('vehicle','vehiclesList');renderAssets('power','powerList');renderAssets('home','homeList');
 const prev=$('assetFilter').value;
 $('assetFilter').innerHTML='<option value="">All equipment</option>'+assets.map(a=>`<option>${esc(a.name)}</option>`).join('');
 $('assetFilter').value=prev;
 let q=$('search').value.toLowerCase(),f=$('assetFilter').value;
 let list=tasks.filter(t=>(!f||t.asset===f)&&(`${t.name} ${t.asset} ${t.notes} ${(t.parts||[]).map(p=>Object.values(p).join(' ')).join(' ')}`).toLowerCase().includes(q));
 $('taskList').innerHTML=list.map(t=>{const a=assetByName(t.asset);const intervals=[t.months&&t.months+' mo',!isHomeAsset(t.asset)&&t.miles&&t.miles+' mi',!isHomeAsset(t.asset)&&t.hours&&t.hours+' hr'].filter(Boolean);return `<article class="task ${dueClass(t)}"><div class="task-main"><strong>${esc(t.name)}</strong><div class="muted">${esc(t.asset)}</div>${t.dueDate?`<p><b>Next due:</b> ${esc(t.dueDate)}</p>`:''}<p>${esc(t.notes||'')}</p><span class="badge">${intervals.join(' / ')||'Condition / periodic check'}</span>${partsHTML(t)}${historyHTML(t)}</div><div class="task-actions"><button class="complete-btn" onclick="completeTask('${t.id}')">✓ Complete</button><button onclick="editTask('${t.id}')">Edit</button></div></article>`}).join('');
 $('overdue').textContent=list.filter(t=>t.dueDate&&new Date(t.dueDate+'T12:00:00')<new Date()).length;
 $('soon').textContent=list.filter(t=>t.dueDate&&new Date(t.dueDate+'T12:00:00')>=new Date()&&(new Date(t.dueDate+'T12:00:00')-new Date())/86400000<=30).length;
 $('upcoming').textContent=list.filter(t=>!t.dueDate||(new Date(t.dueDate+'T12:00:00')-new Date())/86400000>30).length;
}
function updateMeterVisibility(type){$('meterFields').classList.toggle('hidden',type==='home')}
document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('#tabs button').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.querySelectorAll('.view').forEach(x=>x.classList.add('hidden'));$(b.dataset.view).classList.remove('hidden')});
window.editAsset=id=>{let a=assets.find(x=>x.id===id);['name','year','type','make','model','serial','meter','meterType','notes'].forEach(k=>$(k).value=a[k]??'');$('assetId').value=id;updateMeterVisibility(a.type);$('assetDialog').showModal()};
$('addBtn').onclick=()=>{['assetId','name','year','make','model','serial','meter','notes'].forEach(k=>$(k).value='');$('type').value='power';$('meterType').value='hours';updateMeterVisibility('power');$('assetDialog').showModal()};
$('type').onchange=()=>updateMeterVisibility($('type').value);
$('assetForm').onsubmit=e=>{e.preventDefault();let id=$('assetId').value,old=assets.find(a=>a.id===id);let obj={id:id||uid(),name:$('name').value,type:$('type').value,year:$('year').value,make:$('make').value,model:$('model').value,serial:$('serial').value,meter:$('type').value==='home'?'':$('meter').value,meterType:$('type').value==='home'?'none':$('meterType').value,notes:$('notes').value};if(old&&old.name!==obj.name)tasks.forEach(t=>{if(t.asset===old.name)t.asset=obj.name});if(id)assets=assets.map(a=>a.id===id?obj:a);else assets.push(obj);$('assetDialog').close();save()};
$('cancelAsset').onclick=()=>$('assetDialog').close();

function partRow(p={}){const div=document.createElement('div');div.className='part-row';div.innerHTML=`<input data-k="description" placeholder="Part / fluid / supply" value="${esc(p.description||'')}"><input data-k="oem" placeholder="OEM part #" value="${esc(p.oem||'')}"><input data-k="qty" placeholder="Qty / capacity" value="${esc(p.qty||'')}"><input data-k="aftermarket" placeholder="Cross-reference" value="${esc(p.aftermarket||'')}"><button type="button">×</button><input data-k="notes" placeholder="Notes / spec" value="${esc(p.notes||'')}" style="grid-column:1/-2">`;div.querySelector('button').onclick=()=>div.remove();return div}
$('addPartBtn').onclick=()=>$('partsEditor').appendChild(partRow());
function collectParts(){return [...$('partsEditor').children].map(r=>{let o={};r.querySelectorAll('[data-k]').forEach(i=>o[i.dataset.k]=i.value.trim());return o}).filter(p=>p.description||p.oem||p.aftermarket||p.notes)}

window.editTask=id=>{let t=ensureParts(tasks.find(x=>x.id===id));$('taskId').value=id;$('taskName').value=t.name;$('taskAsset').innerHTML=assets.map(a=>`<option>${esc(a.name)}</option>`).join('');$('taskAsset').value=t.asset;$('dueDate').value=t.dueDate||'';$('months').value=t.months||0;$('miles').value=t.miles||0;$('hours').value=t.hours||0;$('taskNotes').value=t.notes||'';$('meterIntervals').classList.toggle('hidden',isHomeAsset(t.asset));$('partsEditor').innerHTML='';t.parts.forEach(p=>$('partsEditor').appendChild(partRow(p)));$('taskDialog').showModal()};
$('taskAsset').onchange=()=>$('meterIntervals').classList.toggle('hidden',isHomeAsset($('taskAsset').value));
$('taskForm').onsubmit=e=>{e.preventDefault();let id=$('taskId').value,home=isHomeAsset($('taskAsset').value),obj={id,asset:$('taskAsset').value,name:$('taskName').value,dueDate:$('dueDate').value,months:+$('months').value||0,miles:home?0:(+$('miles').value||0),hours:home?0:(+$('hours').value||0),notes:$('taskNotes').value,parts:collectParts()};tasks=tasks.map(t=>t.id===id?obj:t);$('taskDialog').close();save()};
$('cancelTask').onclick=()=>$('taskDialog').close();

window.completeTask=id=>{const t=tasks.find(x=>x.id===id),a=assetByName(t.asset);$('completeTaskId').value=id;$('completeTitle').textContent=`${t.name} — ${t.asset}`;$('completedDate').value=todayISO();$('completedCost').value='';$('completedNotes').value='';$('completedMeter').value=(a&&a.type!=='home')?a.meter||'':'';$('completeMeterWrap').classList.toggle('hidden',!a||a.type==='home');$('completeDialog').showModal()};
$('completeForm').onsubmit=e=>{e.preventDefault();const id=$('completeTaskId').value,t=tasks.find(x=>x.id===id),a=assetByName(t.asset);const date=$('completedDate').value, meter=(a&&a.type!=='home')?$('completedMeter').value:'';history.push({id:uid(),taskId:id,date,cost:$('completedCost').value,meter,meterType:a?.meterType||'',notes:$('completedNotes').value});if(a&&a.type!=='home'&&meter!=='')a.meter=meter;if(t.months)t.dueDate=addMonths(date,t.months);else if(!t.dueDate)t.dueDate='';t.lastCompleted=date;t.lastCompletedMeter=meter;t.nextDueMeterMiles=(a?.meterType==='miles'&&t.miles&&meter!=='')?(+meter+t.miles):'';t.nextDueMeterHours=(a?.meterType==='hours'&&t.hours&&meter!=='')?(+meter+t.hours):'';$('completeDialog').close();save()};
$('cancelComplete').onclick=()=>$('completeDialog').close();
$('search').oninput=render;$('assetFilter').onchange=render;render();
