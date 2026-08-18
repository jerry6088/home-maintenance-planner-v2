const AK='hmv2-assets',TK='hmv2-tasks';
const uid=()=>crypto.randomUUID();
const assetsSeed=[
{id:uid(),name:'2014 Volkswagen Passat',type:'vehicle',year:2014,make:'Volkswagen',model:'Passat',serial:'1VWBS7A36EC087006',meter:'',meterType:'miles',notes:''},
{id:uid(),name:'2021 Ford Expedition',type:'vehicle',year:2021,make:'Ford',model:'Expedition',serial:'1FMJK1JT1MEA80457',meter:'',meterType:'miles',notes:''},
{id:uid(),name:'2002 Ford F-150',type:'vehicle',year:2002,make:'Ford',model:'F-150',serial:'1FTRW08L52KB19982',meter:'',meterType:'miles',notes:''},
{id:uid(),name:'1996 Chevy 1500',type:'vehicle',year:1996,make:'Chevrolet',model:'1500',serial:'',meter:'',meterType:'miles',notes:''},
{id:uid(),name:'2020 Polaris Ranger 1000',type:'power',year:2020,make:'Polaris',model:'Ranger 1000',serial:'',meter:'',meterType:'hours',notes:''},
{id:uid(),name:'2007 Honda Recon 250',type:'power',year:2007,make:'Honda',model:'Recon 250',serial:'',meter:'',meterType:'hours',notes:''},
{id:uid(),name:'2006 Mahindra 4530',type:'power',year:2006,make:'Mahindra',model:'4530',serial:'',meter:'',meterType:'hours',notes:''},
{id:uid(),name:'Scag Freedom Z 52',type:'power',year:'',make:'Scag',model:'Freedom Z 52',serial:'',meter:'',meterType:'hours',notes:'Enter current mower hours.'},
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
const A=n=>assets.find(a=>a.name===n);
const add=(asset,name,months=0,miles=0,hours=0,notes='')=>{if(A(asset)&&!tasks.some(t=>t.asset===asset&&t.name===name))tasks.push({id:uid(),asset,name,months,miles,hours,dueDate:'',notes})};
// Factory-style starting catalog. Exact legacy intervals can be refined from model-specific manuals.
add('2020 Polaris Ranger 1000','Engine oil & filter',6,1000,100,'Factory: whichever comes first — 100 hr / 6 mo / 1,000 mi.');
add('2020 Polaris Ranger 1000','Drive belt inspection',12,1000,100,'Factory periodic inspection; severe use may require more often.');
add('2020 Polaris Ranger 1000','Front gearcase fluid',12,1000,100,'Factory periodic fluid service.');
add('2020 Polaris Ranger 1000','Transmission fluid',12,1000,100,'Factory periodic fluid service.');
add('2020 Polaris Ranger 1000','Brake fluid',24,2000,200,'Factory: 200 hr / 24 mo / 2,000 mi.');
add('2020 Polaris Ranger 1000','Air filter inspection',6,500,50,'Inspect more often in dust/mud.');
add('2020 Polaris Ranger 1000','Cooling system inspection',6,500,50,'Inspect coolant, hoses and radiator.');
add('2020 Polaris Ranger 1000','Steering / suspension / wheel bearings',12,1000,100,'Inspect wear, looseness and lubrication points.');
add('Scag Freedom Z 52','Engine oil & filter',6,0,0,'Set exact hour interval after confirming installed engine model; initial service commonly includes early oil change.');
add('Scag Freedom Z 52','Inspect blades & blade bolts',1,0,0,'Inspect frequently; sharpen/replace as needed.');
add('Scag Freedom Z 52','Inspect deck & drive belts',1,0,0,'Check wear, cracking, tracking and tension.');
add('Scag Freedom Z 52','Grease caster-yoke pivots',12,0,500,'Scag guidance: annually or 500 hr, whichever comes first.');
add('Scag Freedom Z 52','Air filter inspection',3,0,0,'Service more often in dusty mowing.');
add('Scag Freedom Z 52','Battery / electrical / PTO inspection',6,0,0,'Inspect connections, wiring and PTO operation.');
['2014 Volkswagen Passat','2021 Ford Expedition','2002 Ford F-150','1996 Chevy 1500'].forEach(v=>{
 add(v,'Engine oil & filter',6,5000,0,'Starter interval only. Replace with exact engine/OEM oil-life schedule once engine/service history is confirmed.');
 add(v,'Tires: pressure, tread & rotation',6,5000,0,'Inspect regularly; rotation interval can be refined by tire/OEM guidance.');
 add(v,'Brake inspection',12,10000,0,'Inspect pads/shoes, rotors/drums, hoses and fluid condition.');
 add(v,'Battery, belts, hoses & fluid check',12,10000,0,'General scheduled inspection.');
});
['2007 Honda Recon 250','2006 Mahindra 4530'].forEach(v=>{
 add(v,'Engine oil service',6,0,0,'Factory service point; exact hour interval to be refined from the model-specific manual.');
 add(v,'Air cleaner inspection',3,0,0,'Service more frequently in dusty conditions.');
 add(v,'Brakes / steering / tires inspection',6,0,0,'Routine factory service points; exact hour interval to be refined.');
 add(v,'Battery / electrical inspection',6,0,0,'Routine inspection.');
});
add('2006 Mahindra 4530','Hydraulic / transmission fluid & filter check',12,0,0,'Exact hour-based change interval to be refined from the 4530 operator manual.');
add('2006 Mahindra 4530','Grease chassis / 3-point / attachments',1,0,0,'Grease based on use; exact points/intervals to be refined.');
add('Goodman Outdoor Heat Pump','Seasonal HVAC inspection',6,0,0,'Inspect outdoor coil, electrical components, refrigerant-side symptoms and general operation.');
add('Goodman Outdoor Heat Pump','Clean outdoor coil / clear debris',6,0,0,'Clean as condition requires; keep airflow clear.');
add('Goodman Indoor Air Handler','Replace HVAC filter',1,0,0,'Enter filter size and adjust interval for actual filter type/dust load.');
add('Goodman Indoor Air Handler','Inspect condensate drain & pan',6,0,0,'Clean/flush as needed; inspect for algae, leaks and overflow risk.');
add('Goodman Indoor Air Handler','Inspect blower & indoor coil area',12,0,0,'Inspect cleanliness and airflow; professional cleaning as needed.');
add('GE Refrigerator','Clean condenser / ventilation area',6,0,0,'Vacuum accessible dust and maintain ventilation clearance.');
add('GE Refrigerator','Replace water filter',6,0,0,'Adjust to filter indicator and water use.');
add('GE Dishwasher','Clean filter & inspect spray arms',1,0,0,'Clean debris and inspect spray-arm openings.');
add('GE Dishwasher','Dishwasher cleaning cycle',1,0,0,'Run cleaning cycle and inspect seals.');
add('GE Top Load Washer','Tub cleaning cycle',1,0,0,'Run washer cleaning cycle; inspect for residue/odor.');
add('GE Top Load Washer','Inspect fill & drain hoses',6,0,0,'Inspect for leaks, cracks, bulges and rubbing.');
add('Maytag Microwave','Clean grease filters / vent area',2,0,0,'Clean reusable filters and vent area.');
add('Electric Double-Oven Range','Clean ovens & inspect door seals',3,0,0,'Inspect heating performance and door gaskets.');
localStorage.setItem(AK,JSON.stringify(assets));localStorage.setItem(TK,JSON.stringify(tasks));

const $=x=>document.getElementById(x);
function save(){localStorage.setItem(AK,JSON.stringify(assets));localStorage.setItem(TK,JSON.stringify(tasks));render()}
function esc(x=''){return String(x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function renderAssets(type,id){$(id).innerHTML=assets.filter(a=>a.type===type).map(a=>`<article class="card"><h3>${esc(a.name)}</h3><div class="muted">${esc([a.year,a.make,a.model].filter(Boolean).join(' '))}</div><div class="meter">${a.meter!==''?esc(a.meter)+' '+esc(a.meterType):'Meter not entered'}</div>${a.serial?`<div class="muted">VIN / Serial: ${esc(a.serial)}</div>`:''}<p>${esc(a.notes||'')}</p><button onclick="editAsset('${a.id}')">Edit</button></article>`).join('')}
function render(){
 renderAssets('vehicle','vehiclesList');renderAssets('power','powerList');renderAssets('home','homeList');
 $('assetFilter').innerHTML='<option value="">All equipment</option>'+assets.map(a=>`<option>${esc(a.name)}</option>`).join('');
 let q=$('search').value.toLowerCase(),f=$('assetFilter').value;
 let list=tasks.filter(t=>(!f||t.asset===f)&&(`${t.name} ${t.asset} ${t.notes}`).toLowerCase().includes(q));
 $('taskList').innerHTML=list.map(t=>`<article class="task"><div><strong>${esc(t.name)}</strong><div class="muted">${esc(t.asset)}</div><p>${esc(t.notes)}</p><span class="badge">${[t.months&&t.months+' mo',t.miles&&t.miles+' mi',t.hours&&t.hours+' hr'].filter(Boolean).join(' / ')||'Inspection'}</span></div><button onclick="editTask('${t.id}')">Edit</button></article>`).join('');
 $('overdue').textContent=list.filter(t=>t.dueDate&&new Date(t.dueDate)<new Date()).length;
 $('soon').textContent=list.filter(t=>t.dueDate&&new Date(t.dueDate)>=new Date()&&(new Date(t.dueDate)-new Date())/86400000<=30).length;
 $('upcoming').textContent=list.filter(t=>!t.dueDate||(new Date(t.dueDate)-new Date())/86400000>30).length;
}
document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('#tabs button').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.querySelectorAll('.view').forEach(x=>x.classList.add('hidden'));$(b.dataset.view).classList.remove('hidden')});
window.editAsset=id=>{let a=assets.find(x=>x.id===id);['name','year','type','make','model','serial','meter','meterType','notes'].forEach(k=>$(k).value=a[k]??'');$('assetId').value=id;$('assetDialog').showModal()};
$('addBtn').onclick=()=>{['assetId','name','year','make','model','serial','meter','notes'].forEach(k=>$(k).value='');$('type').value='power';$('meterType').value='hours';$('assetDialog').showModal()};
$('assetForm').onsubmit=e=>{e.preventDefault();let id=$('assetId').value,obj={id:id||uid(),name:$('name').value,type:$('type').value,year:$('year').value,make:$('make').value,model:$('model').value,serial:$('serial').value,meter:$('meter').value,meterType:$('meterType').value,notes:$('notes').value};if(id)assets=assets.map(a=>a.id===id?obj:a);else assets.push(obj);$('assetDialog').close();save()};
$('cancelAsset').onclick=()=>$('assetDialog').close();
window.editTask=id=>{let t=tasks.find(x=>x.id===id);$('taskId').value=id;$('taskName').value=t.name;$('taskAsset').innerHTML=assets.map(a=>`<option>${esc(a.name)}</option>`).join('');$('taskAsset').value=t.asset;$('dueDate').value=t.dueDate||'';$('months').value=t.months||0;$('miles').value=t.miles||0;$('hours').value=t.hours||0;$('taskNotes').value=t.notes||'';$('taskDialog').showModal()};
$('taskForm').onsubmit=e=>{e.preventDefault();let id=$('taskId').value,obj={id,asset:$('taskAsset').value,name:$('taskName').value,dueDate:$('dueDate').value,months:+$('months').value||0,miles:+$('miles').value||0,hours:+$('hours').value||0,notes:$('taskNotes').value};tasks=tasks.map(t=>t.id===id?obj:t);$('taskDialog').close();save()};
$('cancelTask').onclick=()=>$('taskDialog').close();$('search').oninput=render;$('assetFilter').onchange=render;render();
