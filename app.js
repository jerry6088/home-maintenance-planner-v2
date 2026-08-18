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
