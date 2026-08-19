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

// OEM Power Equipment Update 1 — verified Polaris + Scag data.
// This migration only enriches matching maintenance tasks. It does NOT replace asset meter readings.
(function(){
 const KEY='hmv2-oem-power-update-1';
 if(localStorage.getItem(KEY)==='1') return;
 const findTask=(asset,names)=>tasks.find(t=>t.asset===asset && names.includes(t.name));
 const setTask=(asset,names,data)=>{
   const t=findTask(asset,names);
   if(!t) return;
   Object.assign(t,data);
   if(!Array.isArray(t.parts)) t.parts=[];
 };
 const setParts=(asset,names,parts)=>{
   const t=findTask(asset,names);
   if(!t) return;
   t.parts=parts;
 };
 const addTask=(asset,name,data)=>{
   if(tasks.some(t=>t.asset===asset&&t.name===name)) return;
   tasks.push({id:uid(),asset,name,dueDate:'',months:0,miles:0,hours:0,notes:'',parts:[],...data});
 };

 // 2020 Polaris Ranger 1000 — Polaris verified.
 setTask('2020 Polaris Ranger 1000',['Engine oil & filter'],{
   months:6,miles:1000,hours:100,
   notes:'Polaris factory interval: 100 hours / 6 months / 1,000 miles, whichever comes first. Oil capacity 2.5 qt (2.4 L).'
 });
 setParts('2020 Polaris Ranger 1000',['Engine oil & filter'],[
   {description:'Full Synthetic Oil Change Kit',oem:'2879323',qty:'1 kit',aftermarket:'',notes:'Includes 2.5 qt PS-4 5W-50 oil, oil filter and drain-plug washer.'},
   {description:'Oil filter',oem:'2540086',qty:'1',aftermarket:'',notes:'10 micron Polaris oil filter.'},
   {description:'Drain plug sealing washer',oem:'5812232',qty:'1',aftermarket:'',notes:'Replace during oil change.'},
   {description:'PS-4 Full Synthetic engine oil',oem:'Polaris PS-4 5W-50',qty:'2.5 qt (2.4 L)',aftermarket:'',notes:'Factory specified viscosity/specification.'}
 ]);
 setTask('2020 Polaris Ranger 1000',['Drive belt inspection'],{
   months:12,miles:1000,hours:100,
   notes:'Polaris factory periodic inspection: 100 hours / 12 months / 1,000 miles. Inspect and replace as needed.'
 });
 setTask('2020 Polaris Ranger 1000',['Front gearcase fluid'],{
   months:12,miles:1000,hours:100,
   notes:'Polaris factory service: change front gearcase Demand Drive fluid at 100 hours / 12 months / 1,000 miles.'
 });
 setParts('2020 Polaris Ranger 1000',['Front gearcase fluid'],[
   {description:'Front gearcase fluid',oem:'Polaris Demand Drive Fluid',qty:'Verify exact capacity in owner manual',aftermarket:'',notes:'Use Polaris Demand Drive specification.'}
 ]);
 setTask('2020 Polaris Ranger 1000',['Transmission fluid'],{
   months:12,miles:1000,hours:100,
   notes:'Polaris factory service: change transmission fluid at 100 hours / 12 months / 1,000 miles.'
 });
 setParts('2020 Polaris Ranger 1000',['Transmission fluid'],[
   {description:'Transmission fluid',oem:'Polaris AGL Full Synthetic Gearcase Lubricant & Transmission Fluid',qty:'Verify exact capacity in owner manual',aftermarket:'',notes:'Use Polaris AGL specification.'}
 ]);
 setTask('2020 Polaris Ranger 1000',['Brake fluid'],{
   months:24,miles:2000,hours:200,
   notes:'Polaris factory interval: 200 hours / 24 months / 2,000 miles.'
 });
 setTask('2020 Polaris Ranger 1000',['Air filter inspection'],{
   months:6,miles:500,hours:50,
   notes:'Polaris factory inspection: 50 hours / 6 months / 500 miles. Inspect/replace as needed; severe use requires more frequent service.'
 });
 setTask('2020 Polaris Ranger 1000',['Cooling system inspection'],{
   months:6,miles:500,hours:50,
   notes:'Polaris factory inspection: 50 hours / 6 months / 500 miles. Inspect coolant strength, hoses and radiator; clean external surfaces.'
 });
 setTask('2020 Polaris Ranger 1000',['Steering / suspension / wheel bearings'],{
   months:12,miles:1000,hours:100,
   notes:'Factory periodic checks include steering lubrication/inspection at 50 hr / 6 mo / 500 mi and wheel-bearing inspection at 100 hr / 12 mo / 1,000 mi.'
 });
 addTask('2020 Polaris Ranger 1000','Fuel system inspection',{months:1,miles:200,hours:25,notes:'Polaris factory: 25 hours / monthly / 200 miles. Inspect lines and fittings for leaks/abrasion.',parts:[]});
 addTask('2020 Polaris Ranger 1000','General lubrication',{months:3,miles:500,hours:50,notes:'Polaris factory: 50 hours / 3 months / 500 miles. Lubricate fittings, pivots and applicable points.',parts:[{description:'Grease',oem:'Polaris-approved grease',qty:'As needed',aftermarket:'',notes:'Use the grease specification in the owner manual for the service point.'}]});
 addTask('2020 Polaris Ranger 1000','Spark plug inspection',{months:12,miles:1000,hours:100,notes:'Polaris factory: 100 hours / 12 months / 1,000 miles. Inspect; replace as needed.',parts:[{description:'Spark plug',oem:'Verify exact OEM plug from VIN/manual',qty:'As required',aftermarket:'',notes:'Part number intentionally left unfilled until exact application is verified.'}]});
 addTask('2020 Polaris Ranger 1000','Drive shaft grease service',{months:12,miles:1000,hours:100,notes:'Polaris factory: 100 hours / 12 months / 1,000 miles. Grease drive shaft/propshaft service points.',parts:[{description:'Grease',oem:'Polaris-approved grease',qty:'As needed',aftermarket:'',notes:''}]});
 addTask('2020 Polaris Ranger 1000','Exhaust / spark arrestor inspection',{months:12,miles:1000,hours:100,notes:'Inspect exhaust; clean spark arrestor as specified. Polaris oil-change procedure also calls for cleaning the spark arrestor.',parts:[]});

 // Scag Freedom Z 52 — Scag Freedom Z maintenance chart verified.
 // Engine-specific filters/plug remain intentionally unfilled until engine model is confirmed.
 setTask('Scag Freedom Z 52',['Engine oil & filter'],{
   months:0,miles:0,hours:200,
   notes:'Scag chart: change engine oil & filter at first 20 hours, then oil at 100 hours and oil/filter at 200 hours. Engine-specific oil/filter part numbers depend on installed engine.'
 });
 setParts('Scag Freedom Z 52',['Engine oil & filter'],[
   {description:'Engine oil',oem:'Verify installed engine specification',qty:'Per engine manual',aftermarket:'',notes:'Scag directs engine oil specification/capacity to the engine manual.'},
   {description:'Engine oil filter',oem:'Verify installed engine model',qty:'1',aftermarket:'',notes:'Do not guess filter number until engine model is confirmed.'}
 ]);
 setTask('Scag Freedom Z 52',['Inspect blades & blade bolts'],{
   months:0,miles:0,hours:8,
   notes:'Scag maintenance chart: check blade condition every 8 hours; service more frequently under severe conditions.'
 });
 setTask('Scag Freedom Z 52',['Inspect deck & drive belts'],{
   months:0,miles:0,hours:40,
   notes:'Scag chart: belt alignment is checked at break-in and again at 40 hours; inspect condition whenever servicing the mower.'
 });
 setTask('Scag Freedom Z 52',['Air filter inspection'],{
   months:0,miles:0,hours:100,
   notes:'Scag chart: clean air-cleaner element at 100 hours; service more frequently in dusty/dirty conditions. Exact replacement element depends on engine.'
 });
 setTask('Scag Freedom Z 52',['Battery / electrical / PTO inspection'],{
   months:0,miles:0,hours:40,
   notes:'Scag chart: check battery/clean posts and cables at 40 hours. Electric PTO clutch adjustment is listed at 400 hours.'
 });
 addTask('Scag Freedom Z 52','Check engine oil level',{hours:8,notes:'Scag factory chart: check engine oil level every 8 hours.',parts:[]});
 addTask('Scag Freedom Z 52','Clean mower / deck',{hours:8,notes:'Scag factory chart: clean mower every 8 hours; more often in dirty conditions.',parts:[]});
 addTask('Scag Freedom Z 52','Check tire pressure',{hours:8,notes:'Scag factory chart: check tire pressure every 8 hours.',parts:[]});
 addTask('Scag Freedom Z 52','Safety interlock inspection',{hours:8,notes:'Scag factory chart: check operator-presence/safety interlock system every 8 hours.',parts:[]});
 addTask('Scag Freedom Z 52','Hydraulic oil level check',{hours:200,notes:'Scag chart: check hydraulic oil at break-in and 200 hours; inspect for leaks during routine service.',parts:[{description:'Hydraulic oil',oem:'SAE 20W-50 motor oil',qty:'As needed',aftermarket:'',notes:'Scag specifies SAE 20W-50 motor oil for this hydraulic system.'}]});
 addTask('Scag Freedom Z 52','Hydraulic oil & filter service',{hours:400,notes:'Scag factory chart: drain hydraulic system and replace hydraulic oil and filters at 100 hours and again at 400 hours. Use SAE 20W-50 motor oil.',parts:[{description:'Hydraulic oil',oem:'SAE 20W-50 motor oil',qty:'Verify system capacity',aftermarket:'',notes:'Scag-specified fluid type.'},{description:'Hydraulic filter(s)',oem:'Verify exact Scag part # by serial/model',qty:'As required',aftermarket:'',notes:'Part number intentionally left for exact serial-number lookup.'}]});
 addTask('Scag Freedom Z 52','Fuel line inspection',{hours:100,notes:'Scag factory chart: check condition of fuel lines at 100 hours.',parts:[]});
 addTask('Scag Freedom Z 52','Replace engine fuel filter',{hours:400,notes:'Scag factory chart: replace engine fuel filter at 400 hours. Exact filter depends on installed engine.',parts:[{description:'Fuel filter',oem:'Verify installed engine model',qty:'1',aftermarket:'',notes:'Exact part number requires engine identification.'}]});
 addTask('Scag Freedom Z 52','Adjust electric PTO clutch',{hours:400,notes:'Scag factory chart: adjust electric PTO clutch at 400 hours.',parts:[]});
 addTask('Scag Freedom Z 52','Hardware torque inspection',{hours:200,notes:'Scag chart: check all hardware for tightness at break-in and 200 hours.',parts:[]});

 localStorage.setItem(KEY,'1');
 localStorage.setItem(TK,JSON.stringify(tasks));
})();


// OEM Power Equipment Update 2 — Honda Recon 250 + Mahindra 4530.
// Enriches tasks only; does not overwrite current asset meter readings.
(function(){
 const KEY='hmv2-oem-honda-mahindra-1';
 if(localStorage.getItem(KEY)==='1') return;
 const find=(asset,name)=>tasks.find(t=>t.asset===asset&&t.name===name);
 const add=(asset,name,data={})=>{
   let t=find(asset,name);
   if(!t){t={id:uid(),asset,name,dueDate:'',months:0,miles:0,hours:0,notes:'',parts:[]};tasks.push(t);}
   Object.assign(t,data); if(!Array.isArray(t.parts))t.parts=[];
   return t;
 };
 const parts=(asset,name,arr)=>add(asset,name).parts=arr;

 // 2007 Honda Recon 250 (TRX250TE/TM family schedule).
 add('2007 Honda Recon 250','Engine oil service',{months:12,miles:600,hours:100,
   notes:'Honda factory schedule: initial oil change at 100 mi / 20 hr / 1 month; regular oil replacement every 600 mi / 100 hr / 12 months, whichever comes first.'});
 parts('2007 Honda Recon 250','Engine oil service',[
   {description:'4-stroke motorcycle/ATV engine oil',oem:'Honda-recommended oil — verify viscosity for temperature',qty:'Verify capacity in exact owner manual',aftermarket:'',notes:'Use oil meeting Honda manual requirements; exact capacity intentionally left for model/manual verification.'}
 ]);
 add('2007 Honda Recon 250','Air cleaner service',{miles:600,hours:100,
   notes:'Honda schedule: clean air cleaner at regular service intervals; service more frequently in dusty areas, sand or snow.',parts:[
   {description:'Air cleaner element',oem:'Verify exact Honda OEM part #',qty:'1 as needed',aftermarket:'',notes:'Exact element number requires TE/TM configuration/parts lookup.'}
 ]});
 add('2007 Honda Recon 250','Air cleaner housing drain tube inspection',{miles:600,hours:100,
   notes:'Inspect drain tube at regular maintenance; service more frequently after muddy/very wet operation.'});
 add('2007 Honda Recon 250','Spark plug inspection',{miles:600,hours:100,
   notes:'Honda schedule includes spark plug inspection at regular maintenance intervals.',parts:[
   {description:'Spark plug',oem:'Verify exact Honda/NGK part #',qty:'1',aftermarket:'',notes:'Part number intentionally not guessed.'}
 ]});
 add('2007 Honda Recon 250','Valve clearance inspection',{miles:600,hours:100,
   notes:'Honda schedule: inspect valve clearance at initial 100 mi / 20 hr and regular 600 mi / 100 hr intervals.'});
 add('2007 Honda Recon 250','Engine oil strainer screen cleaning',{miles:1200,hours:200,
   notes:'Honda maintenance schedule includes cleaning the engine oil strainer screen.'});
 add('2007 Honda Recon 250','Centrifugal oil filter cleaning',{miles:1200,hours:200,
   notes:'Honda maintenance schedule includes cleaning the centrifugal oil filter.'});
 add('2007 Honda Recon 250','Engine idle speed inspection',{miles:600,hours:100,
   notes:'Honda schedule includes idle-speed inspection at initial and regular maintenance intervals.'});
 add('2007 Honda Recon 250','Rear final gear case oil inspection',{miles:600,hours:100,
   notes:'Honda schedule includes final gear case oil inspection; replacement is specified every 2 years.',parts:[
   {description:'Final drive gear oil',oem:'Verify Honda-specified gear oil',qty:'Verify capacity',aftermarket:'',notes:'Exact lubricant/capacity to be entered from exact model manual.'}
 ]});
 add('2007 Honda Recon 250','Rear final gear case oil change',{months:24,
   notes:'Honda factory schedule: replace rear final gear case oil every 2 years.'});
 add('2007 Honda Recon 250','Brake fluid inspection',{miles:600,hours:100,
   notes:'Honda schedule includes brake-fluid inspection; replacement interval is every 2 years where applicable.'});
 add('2007 Honda Recon 250','Brake fluid replacement',{months:24,
   notes:'Honda maintenance note: replace brake fluid every 2 years. Mechanical skill is required.',parts:[
   {description:'Brake fluid',oem:'Honda-specified brake fluid — verify exact DOT spec',qty:'As required',aftermarket:'',notes:'Exact specification to be confirmed from the model manual.'}
 ]});
 add('2007 Honda Recon 250','Brake system / wear inspection',{miles:600,hours:100,
   notes:'Inspect brake shoe/pad wear, brake-light switch and brake system at scheduled intervals; more often in mud/wet use.'});
 add('2007 Honda Recon 250','Reverse lock system inspection',{miles:600,hours:100,
   notes:'Honda factory maintenance item: inspect reverse lock system.'});
 add('2007 Honda Recon 250','Suspension & steering inspection',{miles:600,hours:100,
   notes:'Honda factory maintenance items include suspension, steering shaft holder bearing and steering system inspection/lubrication as specified.'});
 add('2007 Honda Recon 250','Spark arrester cleaning',{miles:600,hours:100,
   notes:'Honda factory maintenance item: inspect/clean spark arrester at regular interval.'});

 // Mahindra 4530 4WD — 30 Series operator manual schedule.
 add('2006 Mahindra 4530','Engine oil & filter',{hours:250,
   notes:'Mahindra factory: initial engine oil/filter at 100 hr on a new/overhauled engine; thereafter every 250 hr. Change oil if tractor is unused for 6 months.',parts:[
   {description:'Diesel engine oil',oem:'SAE 15W-40; MIL-L-2104E class per manual',qty:'Verify sump capacity',aftermarket:'Citgo Citgard 500 / Exxon XD3 Extra / Chevron Delo 400 / Mobil Delvac 1300 / Shell Rotella T / Texaco Ursa Super Plus 15W-40',notes:'Manual lists these 15W-40 examples for approximately -15°C to 50°C ambient range.'},
   {description:'Spin-on engine oil filter',oem:'Verify Mahindra OEM part #',qty:'1',aftermarket:'',notes:'Prime new filter with clean oil; exact part number to be verified.'}
 ]});
 add('2006 Mahindra 4530','Check engine oil level',{hours:10,
   notes:'Mahindra routine schedule: check engine oil level daily / approximately every 10 operating hours and top up as necessary.'});
 add('2006 Mahindra 4530','Drain water from fuel filters',{hours:50,
   notes:'Mahindra manual text: drain dirt/water from fuel-filter points every 50 operating hours; routine chart also calls for periodic draining.'});
 add('2006 Mahindra 4530','Replace primary fuel filter',{hours:250,
   notes:'Mahindra factory: replace primary-stage paper fuel-filter insert every 250 hr or earlier if required.',parts:[
   {description:'Primary fuel filter element',oem:'Verify Mahindra OEM part #',qty:'1',aftermarket:'',notes:'Paper insert; do not clean/reuse.'}
 ]});
 add('2006 Mahindra 4530','Replace secondary fuel filter',{hours:500,
   notes:'Mahindra factory: replace secondary-stage paper fuel-filter insert every 500 hr or earlier if required.',parts:[
   {description:'Secondary fuel filter element',oem:'Verify Mahindra OEM part #',qty:'1',aftermarket:'',notes:'Paper insert; do not clean/reuse.'}
 ]});
 add('2006 Mahindra 4530','Clean air-cleaner dust collector',{hours:10,
   notes:'Mahindra routine schedule: clean air-cleaner dust collector daily; shorten interval in dusty work.'});
 add('2006 Mahindra 4530','Clean primary air-cleaner element',{hours:300,
   notes:'Mahindra routine schedule: clean primary air-cleaner element every 300 hr; service sooner for restriction/dust.'});
 add('2006 Mahindra 4530','Replace primary air-cleaner element',{hours:900,
   notes:'Mahindra routine schedule: replace primary element every 900 hr (manual also indicates replacement after limited cleanings).',parts:[
   {description:'Primary air filter element',oem:'Verify Mahindra OEM part #',qty:'1',aftermarket:'',notes:'Exact part number pending OEM parts lookup.'}
 ]});
 add('2006 Mahindra 4530','Replace air-cleaner safety cartridge',{hours:900,
   notes:'Mahindra routine schedule: replace safety cartridge every 900 hr.',parts:[
   {description:'Air cleaner safety element',oem:'Verify Mahindra OEM part #',qty:'1',aftermarket:'',notes:'Exact part number pending OEM parts lookup.'}
 ]});
 add('2006 Mahindra 4530','Cooling system / fan belt inspection',{hours:250,
   notes:'Mahindra schedule: check coolant, radiator hose connections and fan-belt tension; recurring service at 250 hr. Belt deflection guidance is about 3/8–1/2 in midway between pulleys.'});
 add('2006 Mahindra 4530','Flush cooling system',{hours:1000,
   notes:'Mahindra routine schedule: flush cooling system every 1,000 hr.',parts:[
   {description:'Coolant',oem:'Verify Mahindra coolant specification',qty:'Verify cooling-system capacity',aftermarket:'',notes:'Do not mix incompatible coolant types.'}
 ]});
 add('2006 Mahindra 4530','Clean battery terminals',{hours:250,
   notes:'Mahindra routine schedule: clean battery terminals every 250 hr.'});
 add('2006 Mahindra 4530','Transmission / hydraulic oil level check',{hours:250,
   notes:'Mahindra routine schedule: check common transmission/hydraulic/steering reservoir level and top up as necessary.'});
 add('2006 Mahindra 4530','Transmission oil change & strainer cleaning',{hours:1000,
   notes:'Mahindra routine schedule: change transmission oil and clean strainer during oil change; exact initial-service requirement should also be observed.',parts:[
   {description:'Transmission / hydraulic oil',oem:'Verify Mahindra specification',qty:'Verify reservoir capacity',aftermarket:'',notes:'Common reservoir serves transmission, hydraulics and steering.'}
 ]});
 add('2006 Mahindra 4530','Hydraulic suction strainer cleaning',{hours:600,
   notes:'Mahindra routine schedule: clean hydraulic suction strainer every 600 hr.'});
 add('2006 Mahindra 4530','Hydraulic orifice filter cleaning',{hours:600,
   notes:'Mahindra routine schedule: clean hydraulic orifice filter every 600 hr.'});
 add('2006 Mahindra 4530','Hydraulic suction filter replacement',{hours:500,
   notes:'Routine chart shows recurring suction-filter service; manual text states suction filter element replacement every 600 hr or whenever transmission oil is changed. Use the more conservative due reminder until exact serial/manual interpretation is finalized.',parts:[
   {description:'Hydraulic suction filter element',oem:'Verify Mahindra OEM part #',qty:'1',aftermarket:'',notes:'Manual text explicitly states replacement every 600 hr or with transmission oil change.'}
 ]});
 add('2006 Mahindra 4530','Brake inspection & adjustment',{hours:250,
   notes:'Mahindra routine schedule: check and adjust brakes based on conditions; recurring chart service at 250 hr.'});
 add('2006 Mahindra 4530','Steering / toe-in / grease inspection',{hours:500,
   notes:'Mahindra routine schedule includes steering wheel play, toe-in and lubrication of grease points. Greasing frequency also depends on operating conditions.'});
 add('2006 Mahindra 4530','Front axle oil level check',{hours:250,
   notes:'Mahindra routine schedule: check front axle oil level and top up as necessary.'});
 add('2006 Mahindra 4530','Front axle oil change',{hours:1000,
   notes:'Mahindra routine schedule: change front axle oil every 1,000 hr.',parts:[
   {description:'Front axle lubricant',oem:'Verify Mahindra specification',qty:'Verify capacity',aftermarket:'',notes:'Exact lubricant/capacity pending operator-manual specification lookup.'}
 ]});
 add('2006 Mahindra 4530','Front axle bearing grease',{hours:600,
   notes:'Mahindra manual: grease front axle bearing grease nipple every 600 operating hours.',parts:[
   {description:'Grease',oem:'Verify Mahindra grease specification',qty:'As needed',aftermarket:'',notes:''}
 ]});
 add('2006 Mahindra 4530','Valve clearance / cylinder head torque',{hours:1000,
   notes:'Mahindra routine schedule includes cylinder-head bolt torque and valve-clearance service at 1,000 hr.'});
 add('2006 Mahindra 4530','Injector pressure inspection',{hours:1000,
   notes:'Mahindra routine schedule: check/adjust injector pressure every 1,000 hr; appropriate diesel service equipment is required.'});

 localStorage.setItem(KEY,'1');
 localStorage.setItem(TK,JSON.stringify(tasks));
})();


// OEM Parts Update — verified service parts for Mahindra 4530 and Honda Recon.
(function(){
 const KEY='hmv2-oem-parts-verified-1';
 if(localStorage.getItem(KEY)==='1') return;
 const task=(asset,name)=>tasks.find(t=>t.asset===asset&&t.name===name);
 const setParts=(asset,name,parts)=>{const t=task(asset,name);if(t)t.parts=parts;};

 // Mahindra 4530 — fitment verified in 4530-specific OEM parts listings.
 setParts('2006 Mahindra 4530','Engine oil & filter',[
   {description:'Engine oil filter',oem:'000020316E05',qty:'1',aftermarket:'',notes:'Mahindra OEM; supersedes 006008549C1. Listed for 4530.'},
   {description:'15W-40 diesel engine oil',oem:'MV15W401G',qty:'As required',aftermarket:'',notes:'Mahindra 15W-40 diesel engine oil, 1-gallon package number.'},
   {description:'Oil drain plug sealing washer',oem:'000020286E05',qty:'1',aftermarket:'',notes:'Mahindra OEM sealing washer listed for 4530.'}
 ]);
 setParts('2006 Mahindra 4530','Replace primary fuel filter',[
   {description:'Primary fuel filter',oem:'006006648D1',qty:'1',aftermarket:'',notes:'Mahindra OEM fuel filter listed for 4530.'}
 ]);
 setParts('2006 Mahindra 4530','Replace secondary fuel filter',[
   {description:'Secondary fuel filter',oem:'001081778R93',qty:'1',aftermarket:'',notes:'Mahindra OEM secondary fuel filter listed for 4530.'}
 ]);
 setParts('2006 Mahindra 4530','Replace primary air-cleaner element',[
   {description:'Primary / outer air filter',oem:'006008799F1',qty:'1',aftermarket:'',notes:'Mahindra OEM primary outer air filter listed for 4530.'}
 ]);
 setParts('2006 Mahindra 4530','Replace air-cleaner safety cartridge',[
   {description:'Secondary / inner air filter',oem:'006000456F1',qty:'1',aftermarket:'',notes:'Mahindra OEM inner air filter listed for 4530.'}
 ]);
 setParts('2006 Mahindra 4530','Hydraulic suction filter replacement',[
   {description:'Hydraulic oil filter',oem:'000013427P04',qty:'1',aftermarket:'',notes:'Mahindra OEM hydraulic oil filter; fitment listing includes 4530.'},
   {description:'Hydraulic suction strainer',oem:'000013701P04',qty:'1 as needed',aftermarket:'',notes:'Mahindra OEM suction strainer listed for 4530.'},
   {description:'Suction strainer gasket',oem:'007201350C1',qty:'1 as needed',aftermarket:'',notes:'Mahindra OEM gasket listed for 4530.'},
   {description:'Universal 3 synthetic transmission/hydraulic fluid',oem:'MVUTF1G',qty:'As required',aftermarket:'',notes:'Mahindra MUTTO 3 / Universal 3 fluid, 1-gallon package number.'}
 ]);
 setParts('2006 Mahindra 4530','Transmission oil change & strainer cleaning',[
   {description:'Universal 3 synthetic transmission/hydraulic fluid',oem:'MVUTF1G',qty:'As required',aftermarket:'',notes:'Mahindra MUTTO 3 / Universal 3 fluid.'},
   {description:'Hydraulic suction strainer',oem:'000013701P04',qty:'Inspect/clean; replace as needed',aftermarket:'',notes:'4530-listed OEM strainer.'},
   {description:'Suction strainer gasket',oem:'007201350C1',qty:'1 as needed',aftermarket:'',notes:'4530-listed OEM gasket.'}
 ]);
 const fan=task('2006 Mahindra 4530','Cooling system / fan belt inspection');
 if(fan) fan.parts=[
   {description:'Fan belt',oem:'000020325E05',qty:'1 as needed',aftermarket:'',notes:'Mahindra OEM fan belt listed for 4530.'}
 ];

 // Honda 2007 Recon TRX250 — parts shared by TM/TE where verified.
 setParts('2007 Honda Recon 250','Air cleaner service',[
   {description:'Air cleaner element / air cleaner',oem:'17254-HM8-000',qty:'1',aftermarket:'',notes:'Honda OEM air-cleaner part listed for Recon family; air-cleaner assembly components are shared across 2007 TRX250TM/TE listings.'}
 ]);
 setParts('2007 Honda Recon 250','Spark plug inspection',[
   {description:'Standard spark plug',oem:'98069-58916',qty:'1',aftermarket:'NGK DPR8EA-9',notes:'Honda OEM listing identifies DPR8EA-9 (NGK) as the standard plug; colder/hotter optional plugs also exist.'}
 ]);
 // Recon engine has reusable strainer/centrifugal filter rather than a conventional replaceable spin-on oil filter.
 const oil=task('2007 Honda Recon 250','Engine oil service');
 if(oil) oil.parts=[
   {description:'4-stroke engine oil',oem:'Honda GN4 or manual-equivalent specification',qty:'Verify exact service capacity',aftermarket:'',notes:'No conventional replaceable spin-on oil filter is assigned here; the maintenance schedule separately services the oil strainer screen and centrifugal oil filter.'}
 ];

 localStorage.setItem(KEY,'1');
 localStorage.setItem(TK,JSON.stringify(tasks));
})();


// OEM Parts Fix 2 — resilient matching/creation for Honda and Mahindra tasks.
// Preserves all meter readings and existing service history.
(function(){
 const KEY='hmv2-oem-parts-fix-2';
 if(localStorage.getItem(KEY)==='1') return;

 const norm=s=>(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 const assetMatch=(t,asset)=>norm(t.asset)===norm(asset);
 const findBy=(asset,keywords)=>{
   const ks=keywords.map(norm);
   return tasks.find(t=>assetMatch(t,asset)&&ks.every(k=>norm(t.name).includes(k)));
 };
 const ensure=(asset,name,keywords,data={})=>{
   let t=findBy(asset,keywords);
   if(!t){
     t={id:uid(),asset,name,dueDate:'',months:0,miles:0,hours:0,notes:'',parts:[]};
     tasks.push(t);
   }
   Object.assign(t,data);
   if(!Array.isArray(t.parts))t.parts=[];
   return t;
 };
 const setParts=(t,parts)=>{t.parts=parts};

 // ----- Mahindra 4530 -----
 let t=ensure('2006 Mahindra 4530','Engine oil & filter',['oil'],{
   hours:250,
   notes:'Mahindra factory: initial engine oil/filter at 100 hr on a new/overhauled engine; thereafter every 250 hr. Use 15W-40 diesel engine oil meeting the manual requirement.'
 });
 setParts(t,[
   {description:'Engine oil filter',oem:'000020316E05',qty:'1',aftermarket:'',notes:'Mahindra OEM; supersedes 006008549C1. Listed for 4530.'},
   {description:'15W-40 diesel engine oil',oem:'MV15W401G',qty:'As required',aftermarket:'',notes:'Mahindra 15W-40 diesel oil package number.'},
   {description:'Oil drain plug sealing washer',oem:'000020286E05',qty:'1',aftermarket:'',notes:'Mahindra OEM sealing washer listed for 4530.'}
 ]);

 t=ensure('2006 Mahindra 4530','Replace primary fuel filter',['primary','fuel'],{hours:250,notes:'Replace primary fuel-filter element every 250 hr or earlier if required.'});
 setParts(t,[{description:'Primary fuel filter',oem:'006006648D1',qty:'1',aftermarket:'',notes:'Mahindra OEM listed for 4530.'}]);

 t=ensure('2006 Mahindra 4530','Replace secondary fuel filter',['secondary','fuel'],{hours:500,notes:'Replace secondary fuel-filter element every 500 hr or earlier if required.'});
 setParts(t,[{description:'Secondary fuel filter',oem:'001081778R93',qty:'1',aftermarket:'',notes:'Mahindra OEM listed for 4530.'}]);

 t=ensure('2006 Mahindra 4530','Replace primary air-cleaner element',['air'],{hours:900,notes:'Replace primary outer air-filter element at the factory interval or sooner if damaged/restriction is high.'});
 setParts(t,[
   {description:'Primary / outer air filter',oem:'006008799F1',qty:'1',aftermarket:'',notes:'Mahindra OEM listed for 4530.'},
   {description:'Secondary / inner air filter',oem:'006000456F1',qty:'1 as needed',aftermarket:'',notes:'Mahindra OEM inner/safety element listed for 4530.'}
 ]);

 t=ensure('2006 Mahindra 4530','Hydraulic oil & filter service',['hydraulic'],{hours:600,notes:'Service hydraulic/transmission filtration and suction components at the operator-manual interval.'});
 setParts(t,[
   {description:'Hydraulic oil filter',oem:'000013427P04',qty:'1',aftermarket:'',notes:'Mahindra OEM filter; fitment listing includes 4530.'},
   {description:'Hydraulic suction strainer',oem:'000013701P04',qty:'1 as needed',aftermarket:'',notes:'Mahindra OEM suction strainer listed for 4530.'},
   {description:'Suction strainer gasket',oem:'007201350C1',qty:'1 as needed',aftermarket:'',notes:'Mahindra OEM gasket listed for 4530.'},
   {description:'Universal 3 transmission/hydraulic fluid',oem:'MVUTF1G',qty:'As required',aftermarket:'',notes:'Mahindra Universal 3 / MUTTO-type fluid package number.'}
 ]);

 t=ensure('2006 Mahindra 4530','Cooling system / fan belt inspection',['belt'],{hours:250,notes:'Inspect coolant system and fan-belt condition/tension.'});
 setParts(t,[{description:'Fan belt',oem:'000020325E05',qty:'1 as needed',aftermarket:'',notes:'Mahindra OEM fan belt listed for 4530.'}]);

 // ----- Honda Recon 250 -----
 t=ensure('2007 Honda Recon 250','Air cleaner service',['air'],{miles:600,hours:100,notes:'Honda factory service point: inspect/clean air cleaner; service more often in dust/mud.'});
 setParts(t,[{description:'Air cleaner element',oem:'17254-HM8-000',qty:'1',aftermarket:'',notes:'Honda OEM air cleaner element for Recon family application.'}]);

 t=ensure('2007 Honda Recon 250','Spark plug inspection',['spark'],{miles:600,hours:100,notes:'Honda factory inspection interval. Replace as needed.'});
 setParts(t,[{description:'Spark plug',oem:'98069-58916',qty:'1',aftermarket:'NGK DPR8EA-9',notes:'Honda standard plug listing.'}]);

 t=ensure('2007 Honda Recon 250','Engine oil service',['oil'],{months:12,miles:600,hours:100,notes:'Honda factory regular interval: 600 mi / 100 hr / 12 months, whichever comes first.'});
 setParts(t,[{description:'4-stroke engine oil',oem:'Honda GN4 or manual-equivalent specification',qty:'Verify exact capacity',aftermarket:'',notes:'Recon service uses scheduled strainer/centrifugal-filter cleaning; no spin-on oil filter assigned here.'}]);

 // Make sure every OEM-updated task has a visible Parts & Supplies array.
 tasks.forEach(x=>{if(!Array.isArray(x.parts))x.parts=[]});

 localStorage.setItem(TK,JSON.stringify(tasks));
 localStorage.setItem(KEY,'1');
})();


// OEM Parts Visibility Fix 3
// Guarantees OEM numbers are visible by appending them to task notes as well as parts arrays.
(function(){
 const KEY='hmv2-oem-parts-visible-fix-3';
 if(localStorage.getItem(KEY)==='1') return;

 const norm=s=>(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 const findTask=(asset,keywords)=>{
   const ks=keywords.map(norm);
   return tasks.find(t=>norm(t.asset)===norm(asset) && ks.every(k=>norm(t.name).includes(k)));
 };
 const ensure=(asset,name,keywords)=>{
   let t=findTask(asset,keywords);
   if(!t){
     t={id:uid(),asset,name,dueDate:'',months:0,miles:0,hours:0,notes:'',parts:[]};
     tasks.push(t);
   }
   if(!Array.isArray(t.parts)) t.parts=[];
   return t;
 };
 const inject=(asset,name,keywords,partsText,partsArr)=>{
   const t=ensure(asset,name,keywords);
   const marker='OEM PARTS:';
   let base=(t.notes||'').split(marker)[0].trim();
   t.notes=(base?base+' ':'')+marker+' '+partsText;
   t.parts=partsArr;
   return t;
 };

 inject('2006 Mahindra 4530','Engine oil & filter',['oil'],
   'Oil filter 000020316E05; drain washer 000020286E05; Mahindra 15W-40 oil package MV15W401G.',
   [
    {description:'Engine oil filter',oem:'000020316E05',qty:'1',aftermarket:'',notes:'Mahindra OEM; supersedes 006008549C1.'},
    {description:'Oil drain plug sealing washer',oem:'000020286E05',qty:'1',aftermarket:'',notes:'Mahindra OEM.'},
    {description:'15W-40 diesel engine oil',oem:'MV15W401G',qty:'As required',aftermarket:'',notes:'Mahindra 15W-40 package number.'}
   ]);

 inject('2006 Mahindra 4530','Replace primary fuel filter',['primary','fuel'],
   'Primary fuel filter 006006648D1.',
   [{description:'Primary fuel filter',oem:'006006648D1',qty:'1',aftermarket:'',notes:'Mahindra OEM.'}]);

 inject('2006 Mahindra 4530','Replace secondary fuel filter',['secondary','fuel'],
   'Secondary fuel filter 001081778R93.',
   [{description:'Secondary fuel filter',oem:'001081778R93',qty:'1',aftermarket:'',notes:'Mahindra OEM.'}]);

 inject('2006 Mahindra 4530','Air filter service',['air'],
   'Outer air filter 006008799F1; inner/safety air filter 006000456F1.',
   [
    {description:'Outer air filter',oem:'006008799F1',qty:'1',aftermarket:'',notes:'Mahindra OEM.'},
    {description:'Inner / safety air filter',oem:'006000456F1',qty:'1',aftermarket:'',notes:'Mahindra OEM.'}
   ]);

 inject('2006 Mahindra 4530','Hydraulic oil & filter service',['hydraulic'],
   'Hydraulic filter 000013427P04; suction strainer 000013701P04; strainer gasket 007201350C1; hydraulic fluid package MVUTF1G.',
   [
    {description:'Hydraulic oil filter',oem:'000013427P04',qty:'1',aftermarket:'',notes:'Mahindra OEM.'},
    {description:'Hydraulic suction strainer',oem:'000013701P04',qty:'1 as needed',aftermarket:'',notes:'Mahindra OEM.'},
    {description:'Suction strainer gasket',oem:'007201350C1',qty:'1 as needed',aftermarket:'',notes:'Mahindra OEM.'},
    {description:'Transmission / hydraulic fluid',oem:'MVUTF1G',qty:'As required',aftermarket:'',notes:'Mahindra Universal 3 / MUTTO type package number.'}
   ]);

 inject('2006 Mahindra 4530','Cooling system / fan belt inspection',['belt'],
   'Fan belt 000020325E05.',
   [{description:'Fan belt',oem:'000020325E05',qty:'1 as needed',aftermarket:'',notes:'Mahindra OEM.'}]);

 inject('2007 Honda Recon 250','Air cleaner service',['air'],
   'Air cleaner element 17254-HM8-000.',
   [{description:'Air cleaner element',oem:'17254-HM8-000',qty:'1',aftermarket:'',notes:'Honda OEM.'}]);

 inject('2007 Honda Recon 250','Spark plug inspection',['spark'],
   'Spark plug Honda 98069-58916 / NGK DPR8EA-9.',
   [{description:'Spark plug',oem:'98069-58916',qty:'1',aftermarket:'NGK DPR8EA-9',notes:'Honda standard plug listing.'}]);

 localStorage.setItem(TK,JSON.stringify(tasks));
 localStorage.setItem(KEY,'1');
})();


// Vehicle OEM Update 1 — Expedition, F-150, Passat, Chevy starter.
(function(){
 const KEY='hmv2-vehicle-oem-update-1';
 if(localStorage.getItem(KEY)==='1') return;
 const norm=s=>(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 const find=(asset,keywords)=>tasks.find(t=>norm(t.asset)===norm(asset)&&keywords.map(norm).every(k=>norm(t.name).includes(k)));
 const ensure=(asset,name,keywords,data={})=>{
   let t=find(asset,keywords);
   if(!t){t={id:uid(),asset,name,dueDate:'',months:0,miles:0,hours:0,notes:'',parts:[]};tasks.push(t)}
   Object.assign(t,data); if(!Array.isArray(t.parts))t.parts=[]; return t;
 };
 const set=(asset,name,keywords,data,parts)=>{const t=ensure(asset,name,keywords,data); if(parts)t.parts=parts; return t;};

 // 2021 Ford Expedition MAX XLT 3.5L GTDI
 let a=assets.find(x=>x.name==='2021 Ford Expedition');
 if(a){a.model='Expedition MAX XLT';a.notes=(a.notes||'')+(a.notes?' ':'')+'VIN decodes to 3.5L GTDI V6, 4WD, 10-speed automatic.';}
 set('2021 Ford Expedition','Engine oil & filter',['oil'],{
   months:12,miles:10000,notes:'Ford: follow Intelligent Oil-Life Monitor; do not exceed 1 year / 10,000 mi between oil services.'
 },[
   {description:'Engine oil filter',oem:'FL-500-S',qty:'1',aftermarket:'',notes:'Motorcraft factory service part.'},
   {description:'Engine oil',oem:'Motorcraft oil meeting Ford specification',qty:'Verify exact 3.5L capacity before service',aftermarket:'',notes:'Use viscosity/spec listed in 2021 owner manual.'}
 ]);
 set('2021 Ford Expedition','Cabin air filter',['cabin'],{miles:20000,notes:'Ford factory interval: replace every 20,000 mi.'},[
   {description:'Cabin air filter',oem:'FP-92',qty:'1',aftermarket:'',notes:'Motorcraft part listed for 2021 Expedition.'}
 ]);
 set('2021 Ford Expedition','Engine air filter',['air'],{miles:30000,notes:'Ford factory interval: replace every 30,000 mi.'},[
   {description:'Engine air filter',oem:'FA-1883',qty:'1',aftermarket:'',notes:'Motorcraft part listed for 2021 Expedition.'}
 ]);
 set('2021 Ford Expedition','Spark plugs',['spark'],{miles:100000,notes:'Ford factory interval: replace every 100,000 mi.'},[
   {description:'Spark plug',oem:'SP-594',qty:'6',aftermarket:'',notes:'Motorcraft part listed for 2021 Expedition.'}
 ]);
 set('2021 Ford Expedition','Brake fluid',['brake','fluid'],{months:36,notes:'Ford factory interval: change brake fluid every 3 years.'},[
   {description:'Brake fluid',oem:'Motorcraft / Ford specified brake fluid',qty:'As required',aftermarket:'',notes:'Verify exact Ford specification on reservoir/owner manual before service.'}
 ]);
 set('2021 Ford Expedition','Automatic transmission fluid',['transmission'],{miles:150000,notes:'Ford factory interval: change automatic transmission fluid at 150,000 mi.'},[]);
 set('2021 Ford Expedition','Front axle fluid',['front','axle'],{miles:150000,notes:'Ford factory interval: change front axle fluid at 150,000 mi on 4WD vehicles.'},[]);
 set('2021 Ford Expedition','Rear axle fluid',['rear','axle'],{miles:150000,notes:'Ford factory interval: change rear axle fluid at 150,000 mi.'},[]);
 set('2021 Ford Expedition','Transfer case fluid',['transfer'],{miles:150000,notes:'Ford factory interval: change transfer case fluid at 150,000 mi on 4WD vehicles.'},[]);
 set('2021 Ford Expedition','Accessory drive belt',['belt'],{miles:100000,notes:'Inspect at 100,000 mi; after initial inspection, inspect every other oil change until replaced. Replace by 150,000 mi.'},[]);
 set('2021 Ford Expedition','Engine coolant',['coolant'],{months:120,miles:200000,notes:'Ford initial coolant replacement: 10 years / 200,000 mi, then every 5 years / 100,000 mi.'},[]);

 // 2002 Ford F-150 VIN L = 5.4L SOHC V8 gas
 a=assets.find(x=>x.name==='2002 Ford F-150');
 if(a){a.notes=(a.notes||'')+(a.notes?' ':'')+'VIN engine code L = 5.4L SOHC V8 gasoline.';}
 set('2002 Ford F-150','Engine oil & filter',['oil'],{months:6,miles:5000,notes:'Use the owner-manual interval appropriate to driving conditions; this task is set conservatively at 5,000 mi / 6 months.'},[
   {description:'Engine oil filter',oem:'FL-820-S',qty:'1',aftermarket:'',notes:'Motorcraft; 2002 F-150 5.4L owner manual.'},
   {description:'Engine oil',oem:'Motorcraft SAE 5W-20',qty:'6.0 qt with filter',aftermarket:'',notes:'5.4L non-supercharged V8 capacity/specification from 2002 owner manual.'}
 ]);
 set('2002 Ford F-150','Engine air filter',['air'],{miles:30000,notes:'Inspect routinely; replace based on restriction/condition and scheduled-maintenance guidance.'},[
   {description:'Air filter element',oem:'FA-1634',qty:'1',aftermarket:'',notes:'Motorcraft; 2002 F-150 5.4L.'}
 ]);
 set('2002 Ford F-150','Fuel filter',['fuel'],{miles:30000,notes:'Periodic fuel-filter replacement; adjust for service history.'},[
   {description:'Fuel filter',oem:'FG-986B',qty:'1',aftermarket:'',notes:'Motorcraft; 2002 F-150.'}
 ]);
 set('2002 Ford F-150','PCV valve',['pcv'],{miles:100000,notes:'Replace per scheduled maintenance/emissions service guidance.'},[
   {description:'PCV valve',oem:'EV-233',qty:'1',aftermarket:'',notes:'Motorcraft; 5.4L V8.'}
 ]);
 set('2002 Ford F-150','Spark plugs',['spark'],{miles:100000,notes:'Replace at major tune-up interval; use only the correct plug for the 5.4L VIN L application and verify VECI gap.'},[
   {description:'Spark plug',oem:'AGSF-22W',qty:'8',aftermarket:'',notes:'2002 owner manual lists AGSF-22W for 5.4L V8. Verify current supersession before purchase.'}
 ]);

 // 2014 Volkswagen Passat — OEM data for 1.8T application. Keep explicit verify note.
 a=assets.find(x=>x.name==='2014 Volkswagen Passat');
 if(a){a.notes=(a.notes||'')+(a.notes?' ':'')+'OEM service parts below are for the 1.8L turbo gasoline D6J application; verify engine label/PR code before purchase.';}
 set('2014 Volkswagen Passat','Engine oil & filter',['oil'],{months:12,miles:10000,notes:'VW 1.8T service task. Verify exact engine/PR code before purchasing parts.'},[
   {description:'Oil filter element with gasket',oem:'06K115562',qty:'1',aftermarket:'',notes:'VW OEM for 1.8L turbo gasoline D6J application.'},
   {description:'VW-approved engine oil',oem:'VW-approved oil specification',qty:'Verify capacity',aftermarket:'',notes:'Use oil meeting the exact VW spec on the owner/service documentation.'}
 ]);
 set('2014 Volkswagen Passat','Spark plugs',['spark'],{miles:40000,notes:'Starter service interval for 1.8T application; verify against exact VW maintenance schedule/engine code.'},[
   {description:'Spark plug',oem:'06K905601D',qty:'4',aftermarket:'',notes:'VW OEM spark plug for 2014 Passat 1.8L application.'}
 ]);
 set('2014 Volkswagen Passat','Engine air filter',['air'],{miles:40000,notes:'Inspect/replace per VW maintenance schedule; exact filter variant may depend on PR code.'},[
   {description:'Air filter element',oem:'1K0129620D / 1K0129620E',qty:'1',aftermarket:'',notes:'2014 Passat catalog lists multiple variants; confirm installed filter/PR code before purchase.'}
 ]);
 set('2014 Volkswagen Passat','Cabin air filter',['cabin'],{miles:20000,notes:'Replace pollen/cabin filter periodically; exact insert variant can depend on equipment.'},[
   {description:'Dust & pollen filter',oem:'1K0819644B',qty:'1',aftermarket:'',notes:'VW catalog service part; verify equipped filter style.'}
 ]);

 // 1996 Chevy 1500 — no VIN yet, so do not invent engine-specific parts.
 set('1996 Chevy 1500','Engine oil & filter',['oil'],{months:3,miles:3000,notes:'1996 GM short-trip/city schedule calls for oil/filter every 3 months or 3,000 mi. Exact filter/oil capacity depends on engine; VIN/engine code still needed.'},[
   {description:'Oil filter',oem:'VERIFY ENGINE CODE',qty:'1',aftermarket:'',notes:'Need VIN 8th digit or engine size before assigning OEM/ACDelco number.'},
   {description:'Engine oil',oem:'VERIFY ENGINE CODE',qty:'Verify capacity',aftermarket:'',notes:'Need engine size first.'}
 ]);
 set('1996 Chevy 1500','Chassis lubrication',['chassis'],{months:3,miles:3000,notes:'GM schedule calls for chassis lubrication every 3 months / 3,000 mi under short-trip/city schedule.'},[]);
 set('1996 Chevy 1500','Tire rotation & brake inspection',['tire'],{miles:6000,notes:'Rotate tires and inspect brake components at scheduled intervals.'},[]);

 localStorage.setItem(AK,JSON.stringify(assets));
 localStorage.setItem(TK,JSON.stringify(tasks));
 localStorage.setItem(KEY,'1');
})();


// Home equipment maintenance + parts migration
(function(){
 const KEY='hmv2-home-library-1'; if(localStorage.getItem(KEY)==='1')return;
 const norm=s=>(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 const ensure=(asset,name,months,notes,parts=[])=>{
  let t=tasks.find(x=>norm(x.asset)===norm(asset)&&norm(x.name)===norm(name));
  if(!t){t={id:uid(),asset,name,dueDate:'',months,miles:0,hours:0,notes,parts};tasks.push(t)}
  else{t.months=months;t.miles=0;t.hours=0;t.notes=notes;t.parts=parts}
 };
 ensure('GE Refrigerator','Replace water filter',6,'Replace sooner if flow drops or filter indicator calls for replacement.',[
  {description:'Refrigerator water filter',oem:'RPWFE',qty:'1',aftermarket:'',notes:'GE genuine filter listed for exact model GFE28GYNIFS.'}
 ]);
 ensure('GE Refrigerator','Clean condenser / ventilation areas',12,'Vacuum accessible dust/debris and keep ventilation areas unobstructed. Follow owner-manual access guidance.',[]);
 ensure('GE Refrigerator','Inspect door gaskets',6,'Clean gaskets and inspect for tears, deformation or poor sealing.',[]);
 ensure('GE Dishwasher','Clean filter system',1,'Remove debris and clean filter components; inspect sump area and spray-arm openings.',[
  {description:'Fine filter / basket',oem:'WD12X25995',qty:'1 as needed',aftermarket:'',notes:'Exact-model service part.'},
  {description:'Coarse filter',oem:'WD22X25465',qty:'1 as needed',aftermarket:'',notes:'Exact-model service part.'}
 ]);
 ensure('GE Dishwasher','Inspect lower spray arm',3,'Inspect for melting, cracks, blockage and free rotation.',[
  {description:'Lower spray arm',oem:'WD22X33499',qty:'1 as needed',aftermarket:'',notes:'Replacement part for the model family; verify exact revision at purchase.'}
 ]);
 ensure('GE Dishwasher','Inspect door seal & leaks',3,'Clean door sealing surfaces and inspect underneath/around unit for signs of leakage.',[]);
 ensure('GE Top Load Washer','Clean washer / basket',1,'Run the washer cleaning procedure and clean dispenser areas according to owner instructions.',[]);
 ensure('GE Top Load Washer','Inspect fill hoses & connections',6,'Inspect for bulges, cracking, abrasion and leaks; verify connections are secure.',[]);
 ensure('GE Top Load Washer','Inspect drain system',6,'Inspect drain hose routing, leaks and slow-drain symptoms.',[
  {description:'Drain pump assembly',oem:'WH23X28418',qty:'1 as needed',aftermarket:'',notes:'GE exact-model parts catalog.'}
 ]);
 ensure('Maytag Microwave','Clean grease filter',1,'Clean grease filter regularly; replace if damaged or no longer cleans effectively.',[
  {description:'Grease filter',oem:'W10208631A',qty:'1 as needed',aftermarket:'',notes:'Maytag service part.'}
 ]);
 ensure('Maytag Microwave','Replace charcoal filter',6,'For recirculating/non-vented installation, replace charcoal filter periodically based on use.',[
  {description:'Charcoal filter',oem:'8206230A',qty:'1',aftermarket:'',notes:'Applicable when microwave is configured for recirculating ventilation.'}
 ]);
 ensure('Goodman Outdoor Heat Pump','Outdoor coil inspection / cleaning',6,'Inspect outdoor coil and cabinet for dirt, grass, leaves and airflow blockage. Clean using appropriate HVAC methods.',[]);
 ensure('Goodman Outdoor Heat Pump','Professional HVAC inspection',12,'Inspect electrical connections/components, refrigerant-system performance, defrost operation and overall heat-pump condition.',[]);
 ensure('Goodman Indoor Air Handler','Replace HVAC filter',3,'Replace based on actual filter type, MERV rating, household conditions and pressure drop. Record installed filter size in equipment notes.',[
  {description:'Return-air filter',oem:'SIZE PENDING',qty:'1',aftermarket:'',notes:'Enter exact installed filter dimensions before purchase.'}
 ]);
 ensure('Goodman Indoor Air Handler','Flush condensate drain',6,'Inspect drain pan and flush condensate drain; verify free drainage and no biological buildup.',[]);
 ensure('Goodman Indoor Air Handler','Blower / indoor coil inspection',12,'Inspect blower wheel/motor area, indoor coil cleanliness, electrical connections and drain pan.',[]);
 localStorage.setItem(TK,JSON.stringify(tasks));localStorage.setItem(KEY,'1');
})();

localStorage.setItem(AK,JSON.stringify(assets));localStorage.setItem(TK,JSON.stringify(tasks));localStorage.setItem(HK,JSON.stringify(history));

const $=x=>document.getElementById(x);
function save(){localStorage.setItem(AK,JSON.stringify(assets));localStorage.setItem(TK,JSON.stringify(tasks));localStorage.setItem(HK,JSON.stringify(history));render()}
function esc(x=''){return String(x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function addMonths(dateStr,n){const d=new Date((dateStr||todayISO())+'T12:00:00');d.setMonth(d.getMonth()+(+n||0));return d.toISOString().slice(0,10)}
function isHomeAsset(name){return assetByName(name)?.type==='home'}
function meterLabel(a){if(!a||a.type==='home'||a.meterType==='none')return'';return a.meter!==''?`${a.meter} ${a.meterType}`:'Meter not entered'}
function renderAssets(type,id){$(id).innerHTML=assets.filter(a=>a.type===type).map(a=>`<article class="card"><h3>${esc(a.name)}</h3><div class="muted">${esc([a.year,a.make,a.model].filter(Boolean).join(' '))}</div>${type!=='home'?`<div class="meter">${esc(meterLabel(a))}</div>`:''}${a.serial?`<div class="muted">VIN / Serial: ${esc(a.serial)}</div>`:''}<p>${esc(a.notes||'')}</p><div class="card-actions"><button onclick="openEquipmentDetail('${a.id}','recommended')">Recommended</button><button class="secondary" onclick="openEquipmentDetail('${a.id}','parts')">Parts List</button><button class="secondary" onclick="openEquipmentDetail('${a.id}','manuals')">Manuals</button><button class="secondary" onclick="openEquipmentDetail('${a.id}','specs')">Specs</button><button class="secondary" onclick="openEquipmentDetail('${a.id}','history')">History</button><button class="secondary" onclick="editAsset('${a.id}')">Edit</button></div></article>`).join('')}
function partsHTML(t){if(!t.parts?.length)return'';return `<div class="parts"><strong>Parts & Supplies</strong>${t.parts.map(p=>`<div class="part-view"><b>${esc(p.description)}</b>${p.oem?` · OEM: ${esc(p.oem)}`:''}${p.aftermarket?` · Cross-ref: ${esc(p.aftermarket)}`:''}${p.qty?` · Qty/Capacity: ${esc(p.qty)}`:''}${p.notes?`<br>${esc(p.notes)}`:''}</div>`).join('')}</div>`}
function historyHTML(t){const h=history.filter(x=>x.taskId===t.id).sort((a,b)=>(b.date||'').localeCompare(a.date||''));if(!h.length)return'';return `<details class="history"><summary>Service history (${h.length})</summary>${h.map(x=>`<div>${esc(x.date)}${x.meter!==''&&x.meter!=null?` · ${esc(x.meter)} ${esc(x.meterType||'')}`:''}${x.cost?` · $${Number(x.cost).toFixed(2)}`:''}${x.notes?`<br>${esc(x.notes)}`:''}</div>`).join('<hr>')}</details>`}
function dueClass(t){if(!t.dueDate)return'';const days=(new Date(t.dueDate+'T12:00:00')-new Date())/86400000;if(days<0)return'overdue';if(days<=30)return'soon';return''}

function taskUrgency(t){
 if(!t.dueDate)return 3;
 const diff=(new Date(t.dueDate+'T12:00:00')-new Date())/86400000;
 if(diff<0)return 0;
 if(diff<=30)return 1;
 return 2;
}
function urgencyLabel(t){
 const u=taskUrgency(t);
 return u===0?'Overdue':u===1?'Due Soon':u===2?'Upcoming':'No Due Date';
}
function urgencyClass(t){
 const u=taskUrgency(t);
 return u===0?'overdue':u===1?'soon':'upcoming';
}
function taskSort(a,b){
 const ua=taskUrgency(a),ub=taskUrgency(b);
 if(ua!==ub)return ua-ub;
 if(a.dueDate&&b.dueDate)return a.dueDate.localeCompare(b.dueDate);
 if(a.dueDate)return -1;if(b.dueDate)return 1;
 return a.name.localeCompare(b.name);
}
function assetIcon(a){
 if(!a)return'⚙️';
 if(a.type==='vehicle')return'🚙';
 if(a.type==='power'){
  if((a.name||'').toLowerCase().includes('tractor'))return'🚜';
  if((a.name||'').toLowerCase().includes('scag'))return'🌱';
  return'🛞';
 }
 if(a.type==='home'){
  const n=(a.name||'').toLowerCase();
  if(n.includes('hvac')||n.includes('heat pump')||n.includes('air handler'))return'❄️';
  if(n.includes('refrigerator'))return'🧊';
  if(n.includes('washer')||n.includes('dishwasher'))return'🧺';
  if(n.includes('microwave')||n.includes('range'))return'🍳';
  return'🏠';
 }
 return'⚙️';
}

const equipmentLibrary={
 '2021 Ford Expedition':{
  manuals:[{title:'2021 Ford Expedition Owner Manual',url:'https://www.fordservicecontent.com/Ford_Content/Catalog/owner_information/2021-Ford-Expedition-Owners-Manual-version-1_om_EN-US_10_2020.pdf',note:'Ford owner manual / maintenance information.'}],
  specs:[['Engine','3.5L GTDI V6'],['Oil filter','Motorcraft FL-500-S'],['Engine air filter','Motorcraft FA-1883'],['Cabin filter','Motorcraft FP-92'],['Spark plugs','Motorcraft SP-594 (6)']]
 },
 '2002 Ford F-150':{
  manuals:[{title:'2002 Ford F-150 Owner Manual',url:'https://www.fordservicecontent.com/Ford_Content/catalog/owner_guides/02f12og4e.pdf',note:'Ford factory owner guide.'}],
  specs:[['Engine','5.4L SOHC V8 (VIN L)'],['Engine oil','SAE 5W-20'],['Oil capacity','6.0 qt with filter'],['Oil filter','Motorcraft FL-820-S'],['Air filter','Motorcraft FA-1634'],['Fuel filter','Motorcraft FG-986B']]
 },
 '2020 Polaris Ranger 1000':{
  manuals:[{title:'Polaris Owner Manual',url:'https://publications.polaris.com/owner/owners-manuals/0000631847.xml?onepage=true',note:'Polaris online owner manual.'}],
  specs:[['Engine oil','PS-4 Full Synthetic 5W-50'],['Oil capacity','2.5 qt (2.4 L)'],['Oil kit','2879323'],['Oil filter','2540086'],['Drain washer','5812232']]
 },
 'Scag Freedom Z 52':{
  manuals:[{title:'Scag Freedom Z Operator Manual',url:'https://www.scag.com/wp-content/uploads/2020/04/SFZ_Book_03270_Rev2.pdf',note:'Scag operator manual. Kohler engine manual will be added after exact engine model is identified.'}],
  specs:[['Deck','52 in'],['Engine','Kohler — exact model pending'],['Hydraulic oil','SAE 20W-50 motor oil'],['Engine service parts','Pending exact Kohler model']]
 },
 '2006 Mahindra 4530':{
  manuals:[{title:'Mahindra 4530 / 30 Series Operator Manual',url:'',note:'Manual record added; exact stable manufacturer-hosted PDF link can be attached when available.'}],
  specs:[['Engine oil','SAE 15W-40'],['Oil filter','000020316E05'],['Primary fuel filter','006006648D1'],['Secondary fuel filter','001081778R93'],['Outer air filter','006008799F1'],['Inner air filter','006000456F1'],['Hydraulic filter','000013427P04']]
 },
 '2007 Honda Recon 250':{
  manuals:[{title:'Honda Recon Owner Manual',url:'',note:'Exact 2007 TRX250TM/TE manual link will be attached after shift variant is confirmed.'}],
  specs:[['Air cleaner','17254-HM8-000'],['Spark plug','Honda 98069-58916 / NGK DPR8EA-9'],['Engine oil service','600 mi / 100 hr / 12 months']]
 },
 '2014 Volkswagen Passat':{
  manuals:[{title:'Volkswagen Owner Literature',url:'https://www.vwserviceandparts.com/digital-resources/online-owners-manual/',note:'Volkswagen owner-manual lookup; use VIN for exact literature.'}],
  specs:[['VIN','1VWBS7A36EC087006'],['Oil filter (1.8T application)','06K115562 — verify engine/PR code'],['Spark plug (1.8T application)','06K905601D — verify engine/PR code']]
 },
 '1996 Chevy 1500':{
  manuals:[{title:'Chevrolet Owner Manual',url:'',note:'Exact manual and engine-specific service parts will be attached after VIN/engine code is entered.'}],
  specs:[['Engine','Pending VIN / engine code'],['Oil filter','Pending engine identification'],['Oil capacity','Pending engine identification']]
 }
};

// Home Equipment Library Update
Object.assign(equipmentLibrary,{
 'Goodman Outdoor Heat Pump':{
  manuals:[
   {title:'Goodman GSZ14 Product / Technical Resources',url:'https://www.goodmanmfg.com/products/heat-pumps/gsz14',note:'Manufacturer product family resource for GSZ14 heat pumps.'},
   {title:'Goodman Literature Library',url:'https://www.goodmanmfg.com/resources/literature-library',note:'Manufacturer literature lookup for installation, service and specification documents.'}
  ],
  specs:[
   ['Model','GSZ140601KD'],['Serial','1703494212'],['Type','Split-system heat pump'],['Nominal capacity','5 ton class'],['Refrigerant','R-410A'],['Electrical','208/230 V'],['Compressor','Single-stage configuration'],['Outdoor coil maintenance','Inspect/clean as needed; keep vegetation/debris clear']
  ],
  repair:[
   ['Contactor','Verify exact OEM by model/serial before purchase'],
   ['Run capacitor','Verify µF/rating from installed capacitor / OEM catalog'],
   ['Condenser fan motor','Verify OEM by model/serial'],
   ['Defrost control / sensor','Verify OEM revision by model/serial'],
   ['Reversing valve components','Verify exact OEM before purchase']
  ]
 },
 'Goodman Indoor Air Handler':{
  manuals:[
   {title:'Goodman ARUF Product / Technical Resources',url:'https://www.goodmanmfg.com/products/air-handlers-and-coils/air-handlers/aruf',note:'Manufacturer product family resource.'},
   {title:'Goodman Literature Library',url:'https://www.goodmanmfg.com/resources/literature-library',note:'Use model ARUF61D14AA for exact literature.'}
  ],
  specs:[
   ['Model','ARUF61D14AA'],['Serial','1704251868'],['Electrical','208/230 V'],['Blower motor','3/4 HP'],['Filter','Record actual installed filter dimensions/MERV'],['Condensate','Inspect drain/pan and flush drain routinely']
  ],
  repair:[
   ['Blower motor / module','Verify exact OEM by model/serial'],
   ['Blower wheel','Verify exact OEM by model/serial'],
   ['Transformer','Verify voltage/VA and OEM catalog'],
   ['Electric heat kit','Equipment-dependent; verify installed kit model'],
   ['Drain pan / condensate parts','Verify OEM by model/serial']
  ]
 },
 'GE Refrigerator':{
  manuals:[
   {title:'GE Refrigerator Owner Support / Manual',url:'https://products.geappliances.com/appliance/gea-specs/GFE28GYNFS/support',note:'GE manufacturer support page for the GFE28GYNF family; exact stored model is GFE28GYNIFS.'},
   {title:'GE Exact Model Parts Diagrams',url:'https://www.geapplianceparts.com/store/parts/assembly/GFE28GYNIFS',note:'GE genuine parts diagrams for exact model GFE28GYNIFS.'}
  ],
  specs:[
   ['Model','GFE28GYNIFS'],['Serial','RT533964'],['Configuration','French-door refrigerator'],['Refrigerant','R600a'],['Water filter','RPWFE'],['Fresh-food fan motor','WR60X35205'],['Temperature sensor','WR55X11153'],['Dual water valve','WR57X10098'],['Ice bucket & crusher','WR30X10174']
  ],
  repair:[
   ['Water filter','RPWFE'],
   ['Water filter bypass plug','WR01X29059'],
   ['Fresh-food fan motor','WR60X35205'],
   ['Temperature sensor','WR55X11153'],
   ['Dual water valve','WR57X10098'],
   ['Ice bucket & crusher','WR30X10174'],
   ['Fresh-food heater & harness','WR55X36090'],
   ['Fresh-food evaporator','WR87X36103 (replacement shown by GE)']
  ]
 },
 'GE Dishwasher':{
  manuals:[
   {title:'GE Dishwasher Owner Support / Manual',url:'https://products.geappliances.com/appliance/gea-specs/GDP670SYVFS/support',note:'GE manufacturer support page for GDP670SYVFS family.'},
   {title:'GE Dishwasher Installation Instructions',url:'https://products.geappliances.com/appliance/gea-specs/GDP670SYVFS/install',note:'GE installation and setup resource.'}
  ],
  specs:[
   ['Model','GDP670SYV1FS'],['Serial','SA860633B'],['Configuration','Top-control stainless-interior dishwasher'],['Maintenance focus','Clean filters, inspect spray arms, check door seal, clean sump area']
  ],
  repair:[
   ['Fine filter / basket','WD12X25995'],
   ['Coarse filter','WD22X25465'],
   ['Lower spray arm','WD22X33499'],
   ['Other pump/heater/rack parts','Use GE exact-model exploded parts diagram before purchase']
  ]
 },
 'GE Top Load Washer':{
  manuals:[
   {title:'GE Exact Model Parts / Owner Manual',url:'https://www.geapplianceparts.com/store/parts/assembly/PTW600BSR1WS',note:'GE page includes Product Specifications, Owner’s Manual, Installation Instructions and exploded parts diagrams.'}
  ],
  specs:[
   ['Model','PTW600BSR1WS'],['Serial','GA978895G'],['Capacity','5.0 cu. ft. class'],['Main control','WH22X33178'],['Mode shifter','WH03X30517'],['Drain pump','WH23X28418'],['Water valve assembly','WH13X26637']
  ],
  repair:[
   ['Main control board','WH22X33178'],
   ['Mode shifter','WH03X30517'],
   ['Drain pump assembly','WH23X28418'],
   ['Quad water valve assembly','WH13X26637'],
   ['Motor pulley & nut','WH03X33317'],
   ['Transmission pulley & nut','WH03X32097'],
   ['Speed sensor','WH03X32158'],
   ['Drive belt','Verify exact current GE part number from exact-model diagram before purchase']
  ]
 },
 'Maytag Microwave':{
  manuals:[
   {title:'Maytag MMV4205FZ Owner Center',url:'https://www.maytag.com/owners-center-pdp.MMV4205FZ.html',note:'Maytag manufacturer owner resources for MMV4205FZ family.'}
  ],
  specs:[
   ['Model','MMV4205FZ-0'],['Serial','TR 6 26 11072'],['Manufactured','June 2016'],['Grease filter','W10208631A'],['Charcoal filter','8206230A'],['Cooktop light bulb','8206232A / 40 W']
  ],
  repair:[
   ['Grease filter','W10208631A'],
   ['Charcoal filter','8206230A'],
   ['40 W light bulb','8206232A'],
   ['Other electrical / high-voltage parts','Service-only; verify exact OEM before repair']
  ]
 },
 'Electric Double-Oven Range':{
  manuals:[],
  specs:[['Model','Pending'],['Serial','Pending'],['Next step','Enter model/serial from rating label to unlock exact manual and parts catalog']],
  repair:[]
 },
 'BUNN Coffee Maker':{
  manuals:[{title:'BUNN Product Manuals',url:'https://retail.bunn.com/support/product-manuals',note:'Manufacturer manual lookup; exact model still needed.'}],
  specs:[['Model','Pending'],['Serial','Pending'],['Next step','Enter exact model from bottom/back data label']],
  repair:[]
 }
});

function collectedParts(assetName){
 const out=[],seen=new Set();
 tasks.filter(t=>t.asset===assetName).forEach(t=>(t.parts||[]).forEach(p=>{
  const key=[p.description,p.oem,p.aftermarket].join('|');
  if(!seen.has(key)&&(p.description||p.oem)){seen.add(key);out.push({...p,service:t.name})}
 }));
 return out;
}
function renderDetailTab(tab){
 document.querySelectorAll('[data-detail-tab]').forEach(b=>b.classList.toggle('active',b.dataset.detailTab===tab));
 ['detailRecommended','detailParts','detailManuals','detailSpecs','detailHistory'].forEach(id=>$(id).classList.add('hidden'));
 const a=assets.find(x=>x.id===$('equipmentDetailDialog').dataset.assetId);if(!a)return;
 const lib=equipmentLibrary[a.name]||{manuals:[],specs:[]};

 if(tab==='recommended'){
  $('detailRecommended').classList.remove('hidden');
  const rec=tasks.filter(t=>t.asset===a.name&&!t.completed).slice().sort(taskSort);
  $('detailRecommended').innerHTML=rec.length?`<div class="recommended-list">${rec.map(t=>{
    const u=taskUrgency(t),cls=u===0?'overdue':u===1?'soon':'current';
    const status=u===0?'Overdue':u===1?'Due Soon':t.dueDate?'Scheduled':'Recommended';
    const interval=[t.months&&t.months+' mo',t.miles&&t.miles+' mi',t.hours&&t.hours+' hr'].filter(Boolean).join(' / ');
    const source=/factory|manufacturer|oem|polaris|ford|honda|mahindra|scag|goodman|ge |maytag|volkswagen|vw /i.test(t.notes||'')?'Manufacturer / OEM':'Recommended';
    return `<article class="recommended-item ${cls}"><div class="recommended-head"><div><div class="recommended-title">${esc(t.name)}</div><div class="recommended-meta">${esc(status)}${t.dueDate?` · Due ${esc(t.dueDate)}`:''}${interval?` · ${esc(interval)}`:''}</div><span class="recommended-source">${esc(source)}</span></div></div>${t.notes?`<p>${esc(t.notes)}</p>`:''}${partsHTML(t)}<div class="recommended-actions"><button onclick="event.stopPropagation();completeTask('${t.id}')">✓ Complete</button><button class="secondary" onclick="event.stopPropagation();editTask('${t.id}')">Edit</button></div></article>`;
   }).join('')}</div>`:'<p class="muted">No recommended maintenance tasks have been added for this equipment yet.</p>';
 }else if(tab==='parts'){
  $('detailParts').classList.remove('hidden');const ps=collectedParts(a.name);
  $('detailParts').innerHTML=ps.length?`<table class="parts-table"><thead><tr><th>Part / Supply</th><th>OEM #</th><th>Qty / Capacity</th><th>Cross-ref</th><th>Service</th></tr></thead><tbody>${ps.map(p=>`<tr><td><b>${esc(p.description)}</b>${p.notes?`<div class="muted">${esc(p.notes)}</div>`:''}</td><td>${esc(p.oem||'—')}</td><td>${esc(p.qty||'—')}</td><td>${esc(p.aftermarket||'—')}</td><td>${esc(p.service||'')}</td></tr>`).join('')}</tbody></table>`:'<p class="muted">No verified parts have been added for this equipment yet.</p>';
 }else if(tab==='manuals'){
  $('detailManuals').classList.remove('hidden');
  $('detailManuals').innerHTML=lib.manuals.length?lib.manuals.map(m=>`<article class="manual-card"><h4>${esc(m.title)}</h4><div class="muted">${esc(m.note||'')}</div>${m.url?`<a href="${esc(m.url)}" target="_blank" rel="noopener">Open manufacturer manual ↗</a>`:'<div class="muted" style="margin-top:8px">Manual link pending verification.</div>'}</article>`).join(''):'<p class="muted">Manufacturer manual has not been attached yet.</p>';
 }else if(tab==='history'){
  $('detailHistory').classList.remove('hidden');
  $('detailHistory').innerHTML=historyRows(a.name);
 }else{
  $('detailSpecs').classList.remove('hidden');
  const base=[['Make / Brand',a.make||'—'],['Model',a.model||'—'],['Year',a.year||'—'],['VIN / Serial',a.serial||'—']];
  const specs=base.concat(lib.specs||[]);
  $('detailSpecs').innerHTML=`<div class="spec-grid">${specs.map(s=>`<div class="spec-card"><b>${esc(s[0])}</b><span>${esc(s[1])}</span></div>`).join('')}</div>${a.notes?`<div class="spec-card"><h4>Notes</h4>${esc(a.notes)}</div>`:''}${lib.repair&&lib.repair.length?`<div class="spec-card"><h4>Common Repair Parts</h4>${lib.repair.map(r=>`<div class="part-view"><b>${esc(r[0])}</b> · ${esc(r[1])}</div>`).join('')}</div>`:''}`;
 }
}
window.openEquipmentDetail=(id,tab='recommended')=>{
 const a=assets.find(x=>x.id===id);if(!a)return;
 const d=$('equipmentDetailDialog');d.dataset.assetId=id;
 $('detailType').textContent=a.type==='vehicle'?'VEHICLE':a.type==='power'?'POWER EQUIPMENT':'HOME EQUIPMENT';
 $('detailTitle').textContent=a.name;
 $('detailSubtitle').textContent=[a.year,a.make,a.model,a.type!=='home'&&a.meter!==''?`${a.meter} ${a.meterType}`:''].filter(Boolean).join(' · ');
 renderDetailTab(tab);d.showModal();
};


const SK='hmv2-seasonal';
let seasonal=JSON.parse(localStorage.getItem(SK)||'null')||[
 {id:'s1',season:'Spring',name:'HVAC spring inspection',notes:'Inspect heat pump/air handler, outdoor coil, condensate drain and filter before cooling season.',months:12,lastDone:''},
 {id:'s2',season:'Spring',name:'Gutters & downspouts',notes:'Clean debris; verify downspouts discharge away from foundation.',months:12,lastDone:''},
 {id:'s3',season:'Spring',name:'Exterior caulk & weather seal inspection',notes:'Inspect windows, doors, penetrations and exterior sealant.',months:12,lastDone:''},
 {id:'s4',season:'Spring',name:'Plumbing leak inspection',notes:'Check under sinks, toilets, supply lines, outdoor faucets and visible piping.',months:12,lastDone:''},
 {id:'s5',season:'Summer',name:'HVAC outdoor unit cleanup',notes:'Remove grass/leaves and maintain clear airflow around condenser/heat pump.',months:12,lastDone:''},
 {id:'s6',season:'Summer',name:'Dryer vent inspection & cleaning',notes:'Inspect/clean dryer exhaust duct and exterior termination.',months:12,lastDone:''},
 {id:'s7',season:'Summer',name:'Garage door inspection & lubrication',notes:'Inspect rollers, hinges, cables, springs and balance; lubricate appropriate moving points. Do not adjust loaded torsion springs unless qualified.',months:12,lastDone:''},
 {id:'s8',season:'Fall',name:'HVAC fall inspection',notes:'Inspect heating operation, filter, blower area and heat-pump defrost readiness.',months:12,lastDone:''},
 {id:'s9',season:'Fall',name:'Gutters & roof drainage',notes:'Clean leaves/debris and inspect drainage before winter.',months:12,lastDone:''},
 {id:'s10',season:'Fall',name:'Smoke & CO alarm test',notes:'Test alarms; replace batteries where applicable and replace expired alarms.',months:6,lastDone:''},
 {id:'s11',season:'Fall',name:'Exterior freeze preparation',notes:'Inspect hose bibs, exposed piping and weather seals before freezing weather.',months:12,lastDone:''},
 {id:'s12',season:'Winter',name:'Home water leak / freeze inspection',notes:'Inspect exposed plumbing and areas vulnerable to freezing or condensation.',months:12,lastDone:''},
 {id:'s13',season:'Winter',name:'Fire extinguisher inspection',notes:'Check gauge, pin/seal, accessibility and condition; follow manufacturer inspection requirements.',months:12,lastDone:''},
 {id:'s14',season:'Winter',name:'Smoke & CO alarm test',notes:'Test alarms and verify they are within service life.',months:6,lastDone:''}
];
let seasonalFilter='All';

function seasonalDoneThisCycle(x){
 if(!x.lastDone)return false;
 const d=new Date(x.lastDone+'T12:00:00'),now=new Date();
 const months=(now.getFullYear()-d.getFullYear())*12+(now.getMonth()-d.getMonth());
 return months<(x.months||12);
}

window.assignSeasonal=function(id,person){
 const x=seasonal.find(s=>s.id===id);if(!x)return;
 x.assignee=person||'';
 localStorage.setItem(SK,JSON.stringify(seasonal));
};

window.completeSeasonal=function(id){
 const x=seasonal.find(s=>s.id===id);if(!x)return;
 x.lastDone=new Date().toISOString().slice(0,10);
 history.push({id:uid(),asset:'Home / Seasonal',task:x.name,assignee:x.assignee||'',date:x.lastDone,meter:'',meterType:'',cost:'',notes:x.season+' seasonal maintenance completed'});
 localStorage.setItem(SK,JSON.stringify(seasonal));
 localStorage.setItem(HK,JSON.stringify(history));
 render();
};

function renderSeasonalPanelState(){
 const body=$('seasonalPanelBody'),btn=$('toggleSeasonalPanel');
 if(!body||!btn)return;
 body.classList.toggle('hidden',!seasonalPanelOpen);
 btn.textContent=seasonalPanelOpen?'Hide':'Show';
 btn.setAttribute('aria-expanded',seasonalPanelOpen?'true':'false');
}

function renderSeasonal(){
 document.querySelectorAll('[data-season]').forEach(b=>b.classList.toggle('active',b.dataset.season===seasonalFilter));
 const showDone=$('showCompletedSeasonal')?.checked||false;
 const list=seasonal.filter(x=>(seasonalFilter==='All'||x.season===seasonalFilter)&&(showDone||!seasonalDoneThisCycle(x)));
 $('seasonalList').innerHTML=list.map(x=>`<article class="season-item ${seasonalDoneThisCycle(x)?'done':''} clickable-task" onclick="openTaskDetails('seasonal','${x.id}')"><div><div class="season-name">${esc(x.name)}</div><div class="season-meta">${esc(x.season)}${x.lastDone?` · Last completed ${esc(x.lastDone)}`:''}</div><p>${esc(x.notes)}</p></div><div class="season-actions"><select onchange="assignSeasonal('${x.id}',this.value)"><option value="">Unassigned</option>${PEOPLE.map(p=>`<option value="${esc(p)}" ${x.assignee===p?'selected':''}>${esc(p)}</option>`).join('')}</select>${seasonalDoneThisCycle(x)?`<button class="undo-btn" onclick="event.stopPropagation();undoSeasonalCompletion('${x.id}')">↶ Undo</button>`:`<button onclick="event.stopPropagation();completeSeasonal('${x.id}')">✓ Complete</button>`}</div></article>`).join('');
}
function historyRows(assetName,limit){
 const rows=history.filter(h=>!assetName||h.asset===assetName).slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,limit||999);
 return rows.length?rows.map(h=>`<div class="history-row"><strong>${esc(h.task||h.name||'Maintenance')}</strong><div class="history-meta">${esc(h.date||'')}${h.asset?` · ${esc(h.asset)}`:''}${h.assignee?` · Assigned: ${esc(h.assignee)}`:''}${h.meter!==''&&h.meter!=null?` · ${esc(String(h.meter))}${h.meterType?` ${esc(h.meterType)}`:''}`:''}${h.cost?` · $${Number(h.cost).toFixed(2)}`:''}</div>${h.notes?`<div>${esc(h.notes)}</div>`:''}<div style="margin-top:7px">${h.taskId?`<button class="undo-btn" onclick="undoMaintenanceCompletion('${h.id}')">↶ Mark Not Done</button>`:h.asset==='Home / Seasonal'?`<button class="undo-btn" onclick="event.stopPropagation();undoSeasonalCompletion('${seasonal.find(s=>s.name===h.task)?.id||''}')">↶ Mark Not Done</button>`:''}</div></div>`).join(''):'<p class="muted">No completed maintenance recorded yet.</p>';
}


const PEOPLE=['Jerry','Ashley','Jack','Jace','Wesley','Waylon','Roger'];
const ASSIGNEE_MIG='hmv2-assignees-v1';
if(localStorage.getItem(ASSIGNEE_MIG)!=='1'){
  tasks.forEach(t=>{if(typeof t.assignee!=='string')t.assignee='';});
  if(typeof seasonal!=='undefined' && Array.isArray(seasonal)){
    seasonal.forEach(s=>{if(typeof s.assignee!=='string')s.assignee='';});
    localStorage.setItem(SK,JSON.stringify(seasonal));
  }
  localStorage.setItem(TK,JSON.stringify(tasks));
  localStorage.setItem(ASSIGNEE_MIG,'1');
}
function assigneeChip(name){
 return name?`<span class="assignee-chip">👤 ${esc(name)}</span>`:`<span class="assignee-chip unassigned">Unassigned</span>`;
}
function populateAssigneeSelect(selectId,selected=''){
 const el=$(selectId); if(!el)return;
 el.innerHTML='<option value="">Unassigned</option>'+PEOPLE.map(p=>`<option value="${esc(p)}">${esc(p)}</option>`).join('');
 el.value=selected||'';
}


function addMonthsSafe(dateStr,n){
 const d=new Date((dateStr||todayISO())+'T12:00:00');
 d.setMonth(d.getMonth()+(+n||0));
 return d.toISOString().slice(0,10);
}
function previousHistoryForTask(taskId,excludeId){
 return history.filter(h=>h.taskId===taskId&&h.id!==excludeId).slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''))[0]||null;
}
window.undoMaintenanceCompletion=function(historyId){
 const h=history.find(x=>x.id===historyId);
 if(!h)return;
 if(!confirm('Mark this maintenance as not completed?'))return;
 const t=tasks.find(x=>x.id===h.taskId);
 if(t){
   t.completed=false;
   const prev=previousHistoryForTask(t.id,h.id);
   if(prev){
     t.lastCompleted=prev.date||'';
     t.lastCompletedMeter=prev.meter||'';
     if(t.months)t.dueDate=addMonthsSafe(prev.date,t.months);
     if(prev.meter!==''&&prev.meter!=null){
       t.nextDueMeterMiles=(prev.meterType==='miles'&&t.miles)?(+prev.meter+t.miles):'';
       t.nextDueMeterHours=(prev.meterType==='hours'&&t.hours)?(+prev.meter+t.hours):'';
     }
   }else{
     t.lastCompleted='';
     t.lastCompletedMeter='';
     t.nextDueMeterMiles='';
     t.nextDueMeterHours='';
     // Restore it to an active state. If it previously had no known due date, use today.
     t.dueDate=t.dueDate&&new Date(t.dueDate+'T12:00:00')<new Date()?t.dueDate:todayISO();
   }
 }
 history=history.filter(x=>x.id!==historyId);
 localStorage.setItem(TK,JSON.stringify(tasks));
 localStorage.setItem(HK,JSON.stringify(history));
 render();
};
window.undoSeasonalCompletion=function(id){
 const x=seasonal.find(s=>s.id===id);
 if(!x)return;
 if(!confirm('Mark this seasonal task as not completed?'))return;
 const matching=history.filter(h=>h.asset==='Home / Seasonal'&&h.task===x.name).slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''));
 if(matching.length)history=history.filter(h=>h.id!==matching[0].id);
 x.lastDone='';
 localStorage.setItem(SK,JSON.stringify(seasonal));
 localStorage.setItem(HK,JSON.stringify(history));
 render();
};

let seasonalPanelOpen=false;

const CK='hmv2-weekly-chores';
let chores=JSON.parse(localStorage.getItem(CK)||'null')||[];
let choreFilter='today';
function mondayOfWeek(d=new Date()){
 const x=new Date(d);const day=(x.getDay()+6)%7;x.setHours(12,0,0,0);x.setDate(x.getDate()-day);return x.toISOString().slice(0,10);
}

const CHORE_CAL_MIG='hmv2-chore-calendar-mig-1';
if(localStorage.getItem(CHORE_CAL_MIG)!=='1'){
 const wk=mondayOfWeek();
 chores.forEach(c=>{
   // Preserve any explicit current-week assignment.
   if(c.assignmentWeek!==wk && c.assignee){
     c.assignmentWeek=wk;
     c.weekAssignee=c.assignee;
   }
 });
 saveChores();
 localStorage.setItem(CHORE_CAL_MIG,'1');
}


const CHORE_WEEK_ASSIGN_FIX='hmv2-chore-week-assign-fix-2';
if(localStorage.getItem(CHORE_WEEK_ASSIGN_FIX)!=='1'){
 const wk=mondayOfWeek();
 chores.forEach(c=>{
   if(c.assignmentWeek!==wk){
     c.assignmentWeek=wk;
     c.weekAssignee=c.weekAssignee||c.assignee||'';
   }
 });
 saveChores();
 localStorage.setItem(CHORE_WEEK_ASSIGN_FIX,'1');
}

function currentDayName(){return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()]}
function choreDoneThisWeek(c){return c.completedWeek===mondayOfWeek()}
function saveChores(){localStorage.setItem(CK,JSON.stringify(chores))}

const CHORE_SCOPE_MIG='hmv2-chore-scope-v1';
if(localStorage.getItem(CHORE_SCOPE_MIG)!=='1'){
 chores.forEach(c=>{
   if(!c.scheduleType)c.scheduleType='day';
   if(typeof c.weekDueDate!=='string')c.weekDueDate='';
 });
 saveChores();
 localStorage.setItem(CHORE_SCOPE_MIG,'1');
}
function currentWeekRange(){
 const mon=new Date(mondayOfWeek()+'T12:00:00');
 const sun=new Date(mon);sun.setDate(mon.getDate()+6);
 return {start:isoLocal(mon),end:isoLocal(sun)};
}
function choreEffectiveDueDate(c){
 if(c.assignmentWeek!==mondayOfWeek())return '';
 if(c.weekDueDate)return c.weekDueDate;
 if(c.scheduleType==='week')return currentWeekRange().end;
 return choreDateForWeek(c);
}

function renderChores(){
 const pf=$('chorePersonFilter')?.value||'';
 if($('chorePersonFilter')){
  $('chorePersonFilter').innerHTML='<option value="">Everyone</option>'+PEOPLE.map(p=>`<option value="${esc(p)}">${esc(p)}</option>`).join('');
  $('chorePersonFilter').value=pf;
 }
 document.querySelectorAll('[data-chore-filter]').forEach(b=>b.classList.toggle('active',b.dataset.choreFilter===choreFilter));
 const done=chores.filter(choreDoneThisWeek).length;
 $('choreProgress').textContent=`${done} of ${chores.length} complete`;
 let list=chores.filter(c=>!pf||c.assignee===pf);
 if(choreFilter==='today')list=list.filter(c=>!choreDoneThisWeek(c)&&(c.scheduleType==='week'||c.day===currentDayName()));
 else if(choreFilter==='week')list=list.filter(c=>!choreDoneThisWeek(c));
 list.sort((a,b)=>['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].indexOf(a.day)-['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].indexOf(b.day));
 $('choreList').innerHTML=list.length?list.map(c=>`<article class="chore-card ${choreDoneThisWeek(c)?'done':''} clickable-task" onclick="openTaskDetails('chore','${c.id}')"><div><div class="chore-title">${esc(c.name)}</div><div class="chore-meta">${c.scheduleType==='week'?'Entire week':esc(c.day)}${c.weekDueDate?` · Due ${esc(c.weekDueDate)}`:''} · ${(effectiveChoreAssignee(c)||c.assignee)?`Assigned to ${esc(effectiveChoreAssignee(c)||c.assignee)}`:'Unassigned'}</div>${c.notes?`<p>${esc(c.notes)}</p>`:''}${choreDoneThisWeek(c)?'<span class="completed-badge">✓ Completed this week</span>':''}</div><div class="chore-actions">${choreDoneThisWeek(c)?`<button class="undo-chore" onclick="event.stopPropagation();undoChore('${c.id}')">↶ Undo</button>`:`<button onclick="event.stopPropagation();completeChore('${c.id}')">✓ Complete</button>`}<button class="edit-chore" onclick="event.stopPropagation();editChore('${c.id}')">Edit</button></div></article>`).join(''):'<div class="dashboard-panel"><p class="muted">No chores to show for this view.</p></div>';
}
window.completeChore=id=>{const c=chores.find(x=>x.id===id);if(!c)return;c.completedWeek=mondayOfWeek();c.completedDate=todayISO();saveChores();renderChores();if(!$('calendar').classList.contains('hidden'))renderCalendar()};
window.undoChore=id=>{const c=chores.find(x=>x.id===id);if(!c)return;c.completedWeek='';c.completedDate='';saveChores();renderChores();if(!$('calendar').classList.contains('hidden'))renderCalendar()};
window.editChore=id=>{const c=chores.find(x=>x.id===id);if(!c)return;$('choreId').value=c.id;$('choreName').value=c.name;populateAssigneeSelect('choreAssignee',c.assignee||'');$('choreScheduleType').value=c.scheduleType||'day';$('choreDay').value=c.day||'Monday';$('choreDayWrap').classList.toggle('hidden',(c.scheduleType||'day')==='week');$('choreNotes').value=c.notes||'';$('choreDialogTitle').textContent='Edit Weekly Chore';$('choreDialog').showModal()};



function calendarTaskStatus(t){
 const u=taskUrgency(t);
 return u===0?'overdue':u===1?'due-soon':'upcoming';
}
function choreAssignedThisWeek(c){
 return c.assignmentWeek===mondayOfWeek() && Boolean(c.weekAssignee);
}
function effectiveChoreAssignee(c){
 if(c.assignmentWeek===mondayOfWeek())return c.weekAssignee||'';
 return '';
}

let calendarCursor=new Date();
calendarCursor.setDate(1);
let selectedCalendarDate='';

function isoLocal(d){
 const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
 return `${y}-${m}-${day}`;
}
function choreDateForWeek(c){
 if(c.assignmentWeek!==mondayOfWeek())return '';
 const days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
 const di=days.indexOf(c.day); if(di<0)return '';
 const d=new Date(c.assignmentWeek+'T12:00:00');d.setDate(d.getDate()+di);return isoLocal(d);
}
function calendarItemsForDate(dateStr){
 const items=[];
 const today=isoLocal(new Date());

 // 1) Tasks with an actual calendar due date.
 tasks.filter(t=>!t.completed&&t.dueDate===dateStr).forEach(t=>{
   items.push({
     type:'Maintenance',
     name:t.name,
     asset:t.asset,
     assignee:t.assignee||'',
     status:calendarTaskStatus(t),
     id:t.id,
     note:'Scheduled due date'
   });
 });

 // 2) Active mileage/hour-based tasks often do not have dueDate.
 // Put currently overdue / due-soon meter-based work on TODAY so it is visible.
 if(dateStr===today){
   tasks.filter(t=>{
     if(t.completed||t.dueDate)return false;
     const s=calendarTaskStatus(t);
     return s==='overdue'||s==='due-soon';
   }).forEach(t=>{
     if(!items.some(x=>x.type==='Maintenance'&&x.id===t.id)){
       items.push({
         type:'Maintenance',
         name:t.name,
         asset:t.asset,
         assignee:t.assignee||'',
         status:calendarTaskStatus(t),
         id:t.id,
         note:'Due by mileage / hours'
       });
     }
   });
 }

 // 3) Weekly chores assigned for the current week.
 seasonal.filter(s=>s.dueDate===dateStr&&!seasonalDoneThisCycle(s)).forEach(s=>{
   items.push({type:'Seasonal',name:s.name,asset:'Home / Seasonal',assignee:s.assignee||'',status:'scheduled',id:s.id,note:s.season||'Seasonal'});
 });
 chores.filter(c=>{
   if(!choreAssignedThisWeek(c))return false;
   if(c.scheduleType==='week'){const r=currentWeekRange();return dateStr>=r.start&&dateStr<=r.end;}
   return choreEffectiveDueDate(c)===dateStr;
 }).forEach(c=>{
   items.push({
     type:'Chore',
     name:c.name,
     asset:'Weekly Chores',
     assignee:effectiveChoreAssignee(c),
     status:choreDoneThisWeek(c)?'completed':'scheduled',
     id:c.id,
     note:c.day
   });
 });

 return items;
}
function renderCalendar(){
 if(!selectedCalendarDate)selectedCalendarDate=isoLocal(new Date());
 const y=calendarCursor.getFullYear(),m=calendarCursor.getMonth();
 $('calendarMonthLabel').textContent=calendarCursor.toLocaleDateString(undefined,{month:'long',year:'numeric'});
 const first=new Date(y,m,1),start=new Date(y,m,1-first.getDay());
 let cells='',today=isoLocal(new Date());
 for(let i=0;i<42;i++){
   const d=new Date(start);d.setDate(start.getDate()+i);
   const ds=isoLocal(d);let items=[];try{items=calendarItemsForDate(ds)}catch(err){console.error('Calendar item error',err)}
   const maint=items.some(x=>x.type==='Maintenance'),chore=items.some(x=>x.type==='Chore'),overdue=items.some(x=>x.status==='overdue');
   cells+=`<button type="button" class="calendar-day ${d.getMonth()!==m?'other-month':''} ${ds===today?'today':''} ${ds===selectedCalendarDate?'selected':''}" onclick="selectCalendarDate('${ds}')"><span class="calendar-date-num">${d.getDate()}</span><span class="calendar-count">${items.length?`${items.length} item${items.length===1?'':'s'}`:''}</span><span class="calendar-dots">${overdue?'<span class="calendar-dot dot-overdue"></span>':''}${maint?'<span class="calendar-dot dot-maint"></span>':''}${chore?'<span class="calendar-dot dot-chore"></span>':''}</span></button>`;
 }
 $('calendarGrid').innerHTML=cells;
 if(selectedCalendarDate)renderCalendarDayDetails(selectedCalendarDate);
}
window.selectCalendarDate=function(ds){
 selectedCalendarDate=ds;
 const d=new Date(ds+'T12:00:00');calendarCursor=new Date(d.getFullYear(),d.getMonth(),1);renderCalendar();
};
function renderCalendarDayDetails(ds){
 const items=calendarItemsForDate(ds);
 const label=new Date(ds+'T12:00:00').toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric'});
 $('calendarDayDetails').innerHTML=`<h3>${esc(label)}</h3>`+(items.length?items.map(i=>`<div class="calendar-detail-item"><strong>${esc(i.name)}</strong><div class="calendar-detail-meta">${esc(i.type)} · ${esc(i.asset)}${i.assignee?` · Assigned to ${esc(i.assignee)}`:''}${i.note?` · ${esc(i.note)}`:''}</div><div class="person-task-actions" style="margin-top:8px">${i.type==='Maintenance'?`<button onclick="event.stopPropagation();completeTask('${i.id}')">✓ Complete</button><button class="secondary" onclick="event.stopPropagation();editTask('${i.id}')">Edit</button>`:`<button onclick="event.stopPropagation();completeChore('${i.id}');renderCalendar()">✓ Complete</button><button class="secondary" onclick="event.stopPropagation();editChore('${i.id}')">Edit Chore</button>`}</div></div>`).join(''):'<p class="muted">Nothing scheduled for this day.</p>');
}


const PHOTO_DB='hmv2-photo-db', PHOTO_STORE='taskPhotos';
let currentDetailRef=null;
function openPhotoDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open(PHOTO_DB,1);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(PHOTO_STORE)){const s=db.createObjectStore(PHOTO_STORE,{keyPath:'id'});s.createIndex('refKey','refKey',{unique:false});}};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function dbPutPhoto(rec){const db=await openPhotoDB();return new Promise((res,rej)=>{const tx=db.transaction(PHOTO_STORE,'readwrite');tx.objectStore(PHOTO_STORE).put(rec);tx.oncomplete=res;tx.onerror=()=>rej(tx.error);});}
async function dbGetPhotos(refKey){const db=await openPhotoDB();return new Promise((res,rej)=>{const tx=db.transaction(PHOTO_STORE,'readonly');const q=tx.objectStore(PHOTO_STORE).index('refKey').getAll(refKey);q.onsuccess=()=>res(q.result||[]);q.onerror=()=>rej(q.error);});}
async function dbDeletePhoto(id){const db=await openPhotoDB();return new Promise((res,rej)=>{const tx=db.transaction(PHOTO_STORE,'readwrite');tx.objectStore(PHOTO_STORE).delete(id);tx.oncomplete=res;tx.onerror=()=>rej(tx.error);});}
function photoRefKey(type,id){return `${type}:${id}`}
function resizeImage(file,maxDim=1280,quality=.78){return new Promise((resolve,reject)=>{const fr=new FileReader();fr.onload=()=>{const img=new Image();img.onload=()=>{let w=img.width,h=img.height;if(Math.max(w,h)>maxDim){const s=maxDim/Math.max(w,h);w=Math.round(w*s);h=Math.round(h*s);}const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);resolve(c.toDataURL('image/jpeg',quality));};img.onerror=reject;img.src=fr.result;};fr.onerror=reject;fr.readAsDataURL(file);});}
function findDetailEntity(ref){if(!ref)return null;if(ref.type==='maintenance')return tasks.find(t=>t.id===ref.id);if(ref.type==='seasonal')return seasonal.find(s=>s.id===ref.id);if(ref.type==='chore')return chores.find(c=>c.id===ref.id);return null;}
function detailAssignee(ref,obj){return ref.type==='chore'?(effectiveChoreAssignee(obj)||obj.assignee||''):(obj.assignee||'');}
window.openTaskDetails=async function(type,id){
 const obj=findDetailEntity({type,id});if(!obj)return;currentDetailRef={type,id};
 $('taskDetailType').textContent=type==='maintenance'?'MAINTENANCE':type==='seasonal'?'SEASONAL MAINTENANCE':'WEEKLY CHORE';
 $('taskDetailTitle').textContent=obj.name;
 const asset=type==='maintenance'?obj.asset:type==='seasonal'?'Home / Seasonal':'Weekly Chores', assignee=detailAssignee(currentDetailRef,obj);
 const due=type==='maintenance'?(obj.dueDate||((obj.hours||obj.miles)?'Mileage / hours based':'No due date')):type==='seasonal'?(obj.dueDate||obj.season||'Seasonal'):(obj.scheduleType==='week'?'Entire week':(obj.weekDueDate||obj.day||'Weekly'));
 $('taskDetailMeta').textContent=[asset,assignee?`Assigned to ${assignee}`:'Unassigned',due].filter(Boolean).join(' · ');
 let details=type==='maintenance'?[['Equipment',obj.asset||'—'],['Assigned To',assignee||'Unassigned'],['Due',due],['Interval',[obj.months&&obj.months+' mo',obj.miles&&obj.miles+' mi',obj.hours&&obj.hours+' hr'].filter(Boolean).join(' / ')||'—']]:type==='seasonal'?[['Season',obj.season||'—'],['Assigned To',assignee||'Unassigned'],['Last Completed',obj.lastDone||'Not completed']]:[['Day',obj.day||'—'],['Assigned This Week',assignee||'Unassigned'],['Completed This Week',choreDoneThisWeek(obj)?'Yes':'No']];
 $('taskDetailBody').innerHTML=`<div class="task-detail-summary">${details.map(x=>`<div class="spec-card"><b>${esc(x[0])}</b><span>${esc(x[1])}</span></div>`).join('')}</div>${type==='maintenance'&&obj.parts?.length?partsHTML(obj):''}`;
 populateAssigneeSelect('taskDetailAssignee',assignee||'');
 $('taskDetailDueDate').value=type==='maintenance'?(obj.dueDate||''):type==='seasonal'?(obj.dueDate||''):(obj.weekDueDate||choreEffectiveDueDate(obj)||'');
 $('taskDetailNotes').value=obj.detailNotes||obj.notes||'';
 $('taskDetailCompleteBtn').textContent=(type==='seasonal'&&seasonalDoneThisCycle(obj))||(type==='chore'&&choreDoneThisWeek(obj))?'↶ Mark Not Done':'✓ Complete Task';
 $('taskDetailEditBtn').classList.toggle('hidden',type==='seasonal');
 await renderTaskPhotos();$('taskDetailsDialog').showModal();
};
async function renderTaskPhotos(){if(!currentDetailRef)return;const ps=await dbGetPhotos(photoRefKey(currentDetailRef.type,currentDetailRef.id));$('taskPhotoGrid').innerHTML=ps.length?ps.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).map(p=>`<div class="photo-card"><button class="delete-photo" onclick="deleteTaskPhoto('${p.id}')">✕</button><img src="${p.dataUrl}" onclick="viewTaskPhoto('${p.id}')" alt="Task photo"><div class="photo-meta">${esc(new Date(p.createdAt).toLocaleDateString())}</div></div>`).join(''):'<p class="muted">No photos added yet.</p>';}
window.deleteTaskPhoto=async id=>{if(!confirm('Delete this photo?'))return;await dbDeletePhoto(id);await renderTaskPhotos();};
window.viewTaskPhoto=async id=>{const ps=await dbGetPhotos(photoRefKey(currentDetailRef.type,currentDetailRef.id));const p=ps.find(x=>x.id===id);if(!p)return;$('photoViewerImage').src=p.dataUrl;$('photoViewerCaption').textContent=new Date(p.createdAt).toLocaleString();$('photoViewerDialog').showModal();};

let currentStatusFilter='all';
function render(){
 renderAssets('vehicle','vehiclesList');renderAssets('power','powerList');renderAssets('home','homeList');
 const prev=$('assetFilter').value;
 const prevAssignee=$('assigneeFilter')?.value||'';
 $('assetFilter').innerHTML='<option value="">All equipment</option>'+assets.map(a=>`<option>${esc(a.name)}</option>`).join('');
 $('assetFilter').value=prev;
 if($('assigneeFilter')){
   $('assigneeFilter').innerHTML='<option value="">Everyone</option>'+PEOPLE.map(p=>`<option value="${esc(p)}">${esc(p)}</option>`).join('');
   $('assigneeFilter').value=prevAssignee;
 }
 $('peopleMiniList').innerHTML=PEOPLE.map(p=>`<button type="button" class="${prevAssignee===p?'active':''}" onclick="openPersonTasks('${esc(p)}')">${esc(p)}</button>`).join('');
 $('equipmentTotal').textContent=assets.length;
 renderSeasonalPanelState();
 if(seasonalPanelOpen){renderSeasonal();}
 $('recentHistory').innerHTML=historyRows(null,8);

 const q=$('search').value.toLowerCase(),f=$('assetFilter').value,person=$('assigneeFilter')?.value||'';
 const baseFiltered=tasks.filter(t=>!t.completed&&(!f||t.asset===f)&&(!person||t.assignee===person)&&(`${t.name} ${t.asset} ${t.assignee||''} ${t.notes} ${(t.parts||[]).map(p=>Object.values(p).join(' ')).join(' ')}`).toLowerCase().includes(q));
 const allFiltered=baseFiltered.filter(t=>{
   if(currentStatusFilter==='all')return true;
   const u=taskUrgency(t);
   if(currentStatusFilter==='overdue')return u===0;
   if(currentStatusFilter==='soon')return u===1;
   if(currentStatusFilter==='upcoming')return u>=2;
   return true;
 }).sort(taskSort);

 const attention=allFiltered.filter(t=>taskUrgency(t)<=1);
 $('attentionList').innerHTML=attention.map(t=>`<article class="attention-item ${urgencyClass(t)} clickable-task" onclick="openTaskDetails('maintenance','${t.id}')"><div><div class="status-label ${urgencyClass(t)}">${urgencyLabel(t)}</div><strong>${esc(t.name)}</strong><div class="attention-meta">${esc(t.asset)}${t.dueDate?` · Due ${esc(t.dueDate)}`:''}</div>${assigneeChip(t.assignee)}${partsHTML(t)}</div><div class="attention-actions"><button class="complete-btn" onclick="event.stopPropagation();completeTask('${t.id}')">✓ Complete</button><button onclick="event.stopPropagation();editTask('${t.id}')">Edit</button></div></article>`).join('');
 $('attentionEmpty').classList.toggle('hidden',attention.length>0);

 const grouped=assets.map(a=>({asset:a,tasks:allFiltered.filter(t=>t.asset===a.name)})).filter(g=>g.tasks.length||(!q&&!f));
 $('equipmentGroups').innerHTML=grouped.map(g=>{
   const overdue=g.tasks.filter(t=>taskUrgency(t)===0).length;
   const soon=g.tasks.filter(t=>taskUrgency(t)===1).length;
   const sorted=g.tasks.slice().sort(taskSort);
   const meter=(g.asset.type!=='home'&&g.asset.meter!=='')?`${g.asset.meter} ${g.asset.meterType}`:'';
   const shouldOpen=overdue>0||soon>0||Boolean(f);
   return `<details class="equipment-group" ${shouldOpen?'open':''}><summary><div class="group-title"><span>${assetIcon(g.asset)}</span><div><h3>${esc(g.asset.name)}</h3><div class="group-meta">${esc([g.asset.year,g.asset.make,g.asset.model].filter(Boolean).join(' '))}${meter?` · ${esc(meter)}`:''}</div></div></div><div class="group-badges">${overdue?`<span class="badge">${overdue} overdue</span>`:''}${soon?`<span class="badge">${soon} due soon</span>`:''}<span class="badge">${g.tasks.length} tasks</span></div></summary><div class="group-body">${sorted.length?sorted.map(t=>`<article class="group-task ${urgencyClass(t)} clickable-task" onclick="openTaskDetails('maintenance','${t.id}')"><div class="group-task-main"><div class="status-label ${urgencyClass(t)}">${urgencyLabel(t)}</div><strong>${esc(t.name)}</strong>${t.dueDate?`<div class="muted">Due ${esc(t.dueDate)}</div>`:''}${assigneeChip(t.assignee)}<p>${esc(t.notes||'')}</p>${partsHTML(t)}${historyHTML(t)}</div><div class="group-task-actions"><button class="complete-btn" onclick="event.stopPropagation();completeTask('${t.id}')">✓ Complete</button><button onclick="event.stopPropagation();editTask('${t.id}')">Edit</button></div></article>`).join(''):'<p class="muted">No maintenance tasks match the current filter.</p>'}</div></details>`;
 }).join('');

 $('taskList').innerHTML='';
 $('overdue').textContent=baseFiltered.filter(t=>taskUrgency(t)===0).length;
 $('soon').textContent=baseFiltered.filter(t=>taskUrgency(t)===1).length;
 $('upcoming').textContent=baseFiltered.filter(t=>taskUrgency(t)>=2).length;

 document.querySelectorAll('[data-status-filter]').forEach(b=>b.classList.toggle('active',b.dataset.statusFilter===currentStatusFilter));
 const af=$('activeStatusFilter');
 if(currentStatusFilter==='all'){
   af.classList.add('hidden');af.innerHTML='';
 }else{
   const label=currentStatusFilter==='overdue'?'Overdue only':currentStatusFilter==='soon'?'Due Soon only':'Upcoming only';
   af.classList.remove('hidden');
   af.innerHTML=`Showing: ${label}<button id="clearStatusFilter">Clear filter</button>`;
   $('clearStatusFilter').onclick=()=>{currentStatusFilter='all';render();};
 }
}
function updateMeterVisibility(type){$('meterFields').classList.toggle('hidden',type==='home')}

const pageMeta={
 maintenance:['HOME & PROPERTY','Dashboard','Everything that needs attention, grouped and prioritized.'],
 calendar:['SCHEDULE','Calendar','Maintenance and weekly chores organized by date.'],
 vehicles:['FLEET','Vehicles','Mileage-based maintenance, OEM parts, manuals and service history.'],
 power:['EQUIPMENT','Power Equipment','Hours-based maintenance for mowers, UTVs, tractors and outdoor equipment.'],
 home:['HOME SYSTEMS','Home Equipment','Appliances, HVAC, manuals, parts and calendar maintenance.'],
 chores:['HOUSEHOLD','Weekly Chores','Recurring household chores, assignments and weekly progress.'],
 person:['ASSIGNED TASKS','Person Dashboard','Maintenance, seasonal work and chores assigned to one person.']
};
function setPageMeta(view){
 const m=pageMeta[view]||pageMeta.maintenance;
 $('pageEyebrow').textContent=m[0];$('pageTitle').textContent=m[1];$('pageSubtitle').textContent=m[2];
}
function closeSidebar(){
 $('sidebar').classList.remove('open');$('sidebarBackdrop').classList.remove('show');
}
function openSidebar(){
 $('sidebar').classList.add('open');$('sidebarBackdrop').classList.add('show');
}

window.openPersonTasks=function(person){
 currentPerson=person;
 showMainView('person');
 renderPersonDashboard(person);
};


let currentPerson='';
function personTaskStatus(t){
 const s=calendarTaskStatus(t);
 if(s==='overdue')return 'overdue';
 if(s==='due-soon')return 'due-soon';
 return 'upcoming';
}
function renderPersonDashboard(person){
 currentPerson=person;
 $('personTitle').textContent=person+"'s Tasks";
 $('personSubtitle').textContent='Maintenance, seasonal work and weekly chores assigned to '+person+'.';

 const mt=tasks.filter(t=>!t.completed&&t.assignee===person);
 const overdue=mt.filter(t=>calendarTaskStatus(t)==='overdue').length;
 const soon=mt.filter(t=>calendarTaskStatus(t)==='due-soon').length;
 const pc=chores.filter(c=>c.assignee===person);
 const today=pc.filter(c=>!choreDoneThisWeek(c)&&(c.scheduleType==='week'||c.day===currentDayName())).length;
 const doneWeek=pc.filter(choreDoneThisWeek).length;
 $('personOverdue').textContent=overdue;$('personDueSoon').textContent=soon;$('personChoresToday').textContent=today;$('personDoneWeek').textContent=doneWeek;

 const sorted=mt.slice().sort((a,b)=>{const rank={overdue:0,'due-soon':1,upcoming:2};return rank[personTaskStatus(a)]-rank[personTaskStatus(b)]});
 $('personMaintenance').innerHTML=sorted.length?sorted.map(t=>`<article class="person-task ${personTaskStatus(t)} clickable-task" onclick="openTaskDetails('maintenance','${t.id}')"><div><div class="person-task-title">${esc(t.name)}</div><div class="person-task-meta">${esc(t.asset)}${t.dueDate?` · Due ${esc(t.dueDate)}`:''}</div>${partsHTML(t)}</div><div class="person-task-actions"><button onclick="event.stopPropagation();completeTask('${t.id}')">✓ Complete</button><button class="secondary" onclick="event.stopPropagation();editTask('${t.id}')">Edit</button></div></article>`).join(''):'<p class="muted">No active maintenance assigned.</p>';

 const ss=seasonal.filter(s=>s.assignee===person&&!seasonalDoneThisCycle(s));
 $('personSeasonal').innerHTML=ss.length?ss.map(s=>`<article class="person-task"><div><div class="person-task-title">${esc(s.name)}</div><div class="person-task-meta">${esc(s.season)}</div><p>${esc(s.notes||'')}</p></div><div class="person-task-actions"><button onclick="event.stopPropagation();completeSeasonal('${s.id}');renderPersonDashboard('${esc(person)}')">✓ Complete</button></div></article>`).join(''):'<p class="muted">No active seasonal maintenance assigned.</p>';

 const activeChores=pc.filter(c=>!choreDoneThisWeek(c));
 $('personChores').innerHTML=activeChores.length?activeChores.map(c=>`<article class="person-task"><div><div class="person-task-title">${esc(c.name)}</div><div class="person-task-meta">${esc(c.day)}</div>${c.notes?`<p>${esc(c.notes)}</p>`:''}</div><div class="person-task-actions"><button onclick="event.stopPropagation();completeChore('${c.id}');renderPersonDashboard('${esc(person)}')">✓ Complete</button><button class="secondary" onclick="event.stopPropagation();editChore('${c.id}')">Edit</button></div></article>`).join(''):'<p class="muted">No active weekly chores assigned.</p>';

 const ph=history.filter(h=>h.assignee===person).slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,10);
 $('personHistory').innerHTML=ph.length?ph.map(h=>`<div class="history-row"><strong>${esc(h.task||h.name||'Completed task')}</strong><div class="history-meta">${esc(h.date||'')}${h.asset?` · ${esc(h.asset)}`:''}</div>${h.notes?`<div>${esc(h.notes)}</div>`:''}</div>`).join(''):'<p class="muted">No recorded activity yet.</p>';
 document.querySelectorAll('#peopleMiniList button').forEach(b=>b.classList.toggle('active',b.textContent===person));
}

function showMainView(view){
 document.querySelectorAll('#tabs button[data-view]').forEach(x=>x.classList.toggle('active',x.dataset.view===view));
 document.querySelectorAll('.view').forEach(x=>x.classList.add('hidden'));
 $(view).classList.remove('hidden');
 setPageMeta(view);
 if(view==='chores')renderChores();
 if(view==='calendar')renderCalendar();
 if(view==='person'&&currentPerson)renderPersonDashboard(currentPerson);
 closeSidebar();
 window.scrollTo({top:0,behavior:'smooth'});
}

document.querySelectorAll('#tabs button[data-view]').forEach(b=>b.onclick=()=>showMainView(b.dataset.view));
window.editAsset=id=>{let a=assets.find(x=>x.id===id);['name','year','type','make','model','serial','meter','meterType','notes'].forEach(k=>$(k).value=a[k]??'');$('assetId').value=id;updateMeterVisibility(a.type);$('assetDialog').showModal()};
$('addBtn').onclick=()=>{['assetId','name','year','make','model','serial','meter','notes'].forEach(k=>$(k).value='');$('type').value='power';$('meterType').value='hours';updateMeterVisibility('power');$('assetDialog').showModal()};
$('type').onchange=()=>updateMeterVisibility($('type').value);
$('assetForm').onsubmit=e=>{e.preventDefault();let id=$('assetId').value,old=assets.find(a=>a.id===id);let obj={id:id||uid(),name:$('name').value,type:$('type').value,year:$('year').value,make:$('make').value,model:$('model').value,serial:$('serial').value,meter:$('type').value==='home'?'':$('meter').value,meterType:$('type').value==='home'?'none':$('meterType').value,notes:$('notes').value};if(old&&old.name!==obj.name)tasks.forEach(t=>{if(t.asset===old.name)t.asset=obj.name});if(id)assets=assets.map(a=>a.id===id?obj:a);else assets.push(obj);$('assetDialog').close();save()};
$('cancelAsset').onclick=()=>$('assetDialog').close();

function partRow(p={}){const div=document.createElement('div');div.className='part-row';div.innerHTML=`<input data-k="description" placeholder="Part / fluid / supply" value="${esc(p.description||'')}"><input data-k="oem" placeholder="OEM part #" value="${esc(p.oem||'')}"><input data-k="qty" placeholder="Qty / capacity" value="${esc(p.qty||'')}"><input data-k="aftermarket" placeholder="Cross-reference" value="${esc(p.aftermarket||'')}"><button type="button">×</button><input data-k="notes" placeholder="Notes / spec" value="${esc(p.notes||'')}" style="grid-column:1/-2">`;div.querySelector('button').onclick=()=>div.remove();return div}
$('addPartBtn').onclick=()=>$('partsEditor').appendChild(partRow());
function collectParts(){return [...$('partsEditor').children].map(r=>{let o={};r.querySelectorAll('[data-k]').forEach(i=>o[i.dataset.k]=i.value.trim());return o}).filter(p=>p.description||p.oem||p.aftermarket||p.notes)}

window.editTask=id=>{let t=ensureParts(tasks.find(x=>x.id===id));$('taskId').value=id;$('taskName').value=t.name;$('taskAsset').innerHTML=assets.map(a=>`<option>${esc(a.name)}</option>`).join('');$('taskAsset').value=t.asset;$('dueDate').value=t.dueDate||'';$('months').value=t.months||0;$('miles').value=t.miles||0;$('hours').value=t.hours||0;$('taskNotes').value=t.notes||'';populateAssigneeSelect('taskAssignee',t.assignee||'');$('meterIntervals').classList.toggle('hidden',isHomeAsset(t.asset));$('partsEditor').innerHTML='';t.parts.forEach(p=>$('partsEditor').appendChild(partRow(p)));$('taskDialog').showModal()};
$('taskAsset').onchange=()=>$('meterIntervals').classList.toggle('hidden',isHomeAsset($('taskAsset').value));
$('taskForm').onsubmit=e=>{e.preventDefault();let id=$('taskId').value,home=isHomeAsset($('taskAsset').value),obj={id,asset:$('taskAsset').value,name:$('taskName').value,dueDate:$('dueDate').value,months:+$('months').value||0,miles:home?0:(+$('miles').value||0),hours:home?0:(+$('hours').value||0),notes:$('taskNotes').value,assignee:$('taskAssignee').value||'',parts:collectParts()};tasks=tasks.map(t=>t.id===id?obj:t);$('taskDialog').close();save()};
$('cancelTask').onclick=()=>$('taskDialog').close();

window.completeTask=id=>{const t=tasks.find(x=>x.id===id),a=assetByName(t.asset);$('completeTaskId').value=id;$('completeTitle').textContent=`${t.name} — ${t.asset}`;$('completedDate').value=todayISO();$('completedCost').value='';$('completedNotes').value='';$('completedMeter').value=(a&&a.type!=='home')?a.meter||'':'';$('completeMeterWrap').classList.toggle('hidden',!a||a.type==='home');$('completeDialog').showModal()};
$('completeForm').onsubmit=e=>{e.preventDefault();const id=$('completeTaskId').value,t=tasks.find(x=>x.id===id),a=assetByName(t.asset);const date=$('completedDate').value, meter=(a&&a.type!=='home')?$('completedMeter').value:'';history.push({id:uid(),taskId:id,task:t.name,asset:t.asset,assignee:t.assignee||'',date,cost:$('completedCost').value,meter,meterType:a?.meterType||'',notes:$('completedNotes').value});if(a&&a.type!=='home'&&meter!=='')a.meter=meter;if(t.months)t.dueDate=addMonths(date,t.months);else if(t.miles||t.hours){t.dueDate='';}else{t.completed=true;t.dueDate='';}t.lastCompleted=date;t.lastCompletedMeter=meter;t.nextDueMeterMiles=(a?.meterType==='miles'&&t.miles&&meter!=='')?(+meter+t.miles):'';t.nextDueMeterHours=(a?.meterType==='hours'&&t.hours&&meter!=='')?(+meter+t.hours):'';$('completeDialog').close();save();if(currentPerson&&!$('person').classList.contains('hidden'))renderPersonDashboard(currentPerson)};
$('cancelComplete').onclick=()=>$('completeDialog').close();
$('search').oninput=render;
$('assetFilter').onchange=render;
$('assigneeFilter').onchange=render;
$('showCompletedSeasonal').onchange=renderSeasonal;
$('toggleSeasonalPanel').onclick=()=>{
 seasonalPanelOpen=!seasonalPanelOpen;
 renderSeasonalPanelState();
 if(seasonalPanelOpen)renderSeasonal();
};

$('closeDetail').onclick=()=>$('equipmentDetailDialog').close();
document.querySelectorAll('[data-detail-tab]').forEach(b=>b.onclick=()=>renderDetailTab(b.dataset.detailTab));
document.querySelectorAll('[data-season]').forEach(b=>b.onclick=()=>{seasonalFilter=b.dataset.season;renderSeasonal();});
document.querySelectorAll('[data-status-filter]').forEach(b=>b.onclick=()=>{
 currentStatusFilter=b.dataset.statusFilter;
 render();
});

$('mobileMenu').onclick=openSidebar;
$('mobileClose').onclick=closeSidebar;
$('sidebarBackdrop').onclick=closeSidebar;
$('sidebarAddBtn').onclick=()=>$('addBtn').click();
$('sidebarDashboardBtn').onclick=()=>showMainView('maintenance');
$('seasonNavBtn').onclick=()=>{
 showMainView('maintenance');
 seasonalPanelOpen=true;
 renderSeasonalPanelState();
 renderSeasonal();
 setTimeout(()=>document.querySelector('.seasonal-panel')?.scrollIntoView({behavior:'smooth',block:'start'}),80);
};
$('historyNavBtn').onclick=()=>{
 showMainView('maintenance');
 setTimeout(()=>$('recentHistory')?.closest('.dashboard-panel')?.scrollIntoView({behavior:'smooth',block:'start'}),80);
};
setPageMeta('maintenance');


$('addChoreBtn').onclick=()=>{$('choreForm').reset();$('choreId').value='';populateAssigneeSelect('choreAssignee','');$('choreScheduleType').value='day';$('choreDayWrap').classList.remove('hidden');$('choreDialogTitle').textContent='Add Weekly Chore';$('choreDialog').showModal()};
$('cancelChore').onclick=()=>$('choreDialog').close();
$('choreScheduleType').onchange=()=>$('choreDayWrap').classList.toggle('hidden',$('choreScheduleType').value==='week');
$('choreForm').onsubmit=e=>{e.preventDefault();const id=$('choreId').value;const data={id:id||uid(),name:$('choreName').value.trim(),assignee:$('choreAssignee').value||'',day:$('choreDay').value,scheduleType:$('choreScheduleType').value,notes:$('choreNotes').value.trim(),completedWeek:'',completedDate:'',assignmentWeek:'',weekAssignee:'',weekDueDate:''};if(id){const old=chores.find(c=>c.id===id);if(old){data.completedWeek=old.completedWeek||'';data.completedDate=old.completedDate||'';data.assignmentWeek=old.assignmentWeek||'';data.weekAssignee=old.weekAssignee||'';data.weekDueDate=old.weekDueDate||'';Object.assign(old,data)}}else chores.push(data);saveChores();$('choreDialog').close();renderChores()};
document.querySelectorAll('[data-chore-filter]').forEach(b=>b.onclick=()=>{choreFilter=b.dataset.choreFilter;renderChores()});
$('chorePersonFilter').onchange=renderChores;


$('backDashboardBtn').onclick=()=>{currentPerson='';showMainView('maintenance')};


$('prevMonthBtn').onclick=()=>{calendarCursor.setMonth(calendarCursor.getMonth()-1);renderCalendar();};
$('nextMonthBtn').onclick=()=>{calendarCursor.setMonth(calendarCursor.getMonth()+1);renderCalendar();};
$('todayMonthBtn').onclick=()=>{calendarCursor=new Date();calendarCursor.setDate(1);selectedCalendarDate=isoLocal(new Date());renderCalendar();};


$('calendarTodayBtn').onclick=()=>{calendarCursor=new Date();calendarCursor.setDate(1);selectedCalendarDate=isoLocal(new Date());renderCalendar();};


$('closeTaskDetails').onclick=()=>$('taskDetailsDialog').close();
$('closePhotoViewer').onclick=()=>$('photoViewerDialog').close();
$('saveTaskDetailNotes').onclick=()=>{if(!currentDetailRef)return;const obj=findDetailEntity(currentDetailRef);if(!obj)return;obj.detailNotes=$('taskDetailNotes').value.trim();if(currentDetailRef.type==='maintenance')localStorage.setItem(TK,JSON.stringify(tasks));else if(currentDetailRef.type==='seasonal')localStorage.setItem(SK,JSON.stringify(seasonal));else saveChores();$('saveTaskDetailNotes').textContent='Saved ✓';setTimeout(()=>$('saveTaskDetailNotes').textContent='Save Notes',900);};
$('taskPhotoInput').onchange=async e=>{if(!currentDetailRef)return;for(const file of [...e.target.files]){if(!file.type.startsWith('image/'))continue;const dataUrl=await resizeImage(file);await dbPutPhoto({id:uid(),refKey:photoRefKey(currentDetailRef.type,currentDetailRef.id),dataUrl,name:file.name,createdAt:new Date().toISOString()});}e.target.value='';await renderTaskPhotos();};
$('taskDetailCompleteBtn').onclick=()=>{if(!currentDetailRef)return;const ref={...currentDetailRef},obj=findDetailEntity(ref);if(!obj)return;$('taskDetailsDialog').close();if(ref.type==='maintenance')completeTask(ref.id);else if(ref.type==='seasonal'){if(seasonalDoneThisCycle(obj))undoSeasonalCompletion(ref.id);else completeSeasonal(ref.id);}else{if(choreDoneThisWeek(obj))undoChore(ref.id);else completeChore(ref.id);}};
$('taskDetailEditBtn').onclick=()=>{if(!currentDetailRef)return;const ref={...currentDetailRef};$('taskDetailsDialog').close();if(ref.type==='maintenance')editTask(ref.id);else if(ref.type==='chore')editChore(ref.id);};


$('saveTaskDetailAssignment').onclick=()=>{
 if(!currentDetailRef)return;
 const obj=findDetailEntity(currentDetailRef);if(!obj)return;
 const person=$('taskDetailAssignee').value||'',due=$('taskDetailDueDate').value||'';
 if(currentDetailRef.type==='maintenance'){
   obj.assignee=person;obj.dueDate=due;localStorage.setItem(TK,JSON.stringify(tasks));
 }else if(currentDetailRef.type==='seasonal'){
   obj.assignee=person;obj.dueDate=due;localStorage.setItem(SK,JSON.stringify(seasonal));
 }else{
   obj.assignmentWeek=mondayOfWeek();obj.weekAssignee=person;obj.weekDueDate=due;saveChores();
 }
 $('saveTaskDetailAssignment').textContent='Saved ✓';
 setTimeout(()=>$('saveTaskDetailAssignment').textContent='Save Assignment',900);
 render();
 if(!$('calendar').classList.contains('hidden'))renderCalendar();
};

render();
