
(() => {
  const $=id=>document.getElementById(id);
  const parse=k=>{try{return JSON.parse(localStorage.getItem(k)||'[]')}catch{return[]}};
  const ymd=d=>new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);
  const today=()=>ymd(new Date());

  function arr(v){
    if(Array.isArray(v))return v;
    if(v && typeof v==='object')return Object.values(v).flatMap(x=>Array.isArray(x)?x:[x]);
    return [];
  }
  function dateOf(x){
    return x?.dueDate||x?.due_date||x?.date||x?.nextDue||x?.next_due||x?.scheduledDate||x?.scheduled_date||'';
  }
  function titleOf(x){
    return x?.title||x?.name||x?.task||x?.label||x?.description||'Task';
  }
  function personOf(x){
    return x?.assignee||x?.assignedTo||x?.assigned_to||x?.person||x?.owner||'Unassigned';
  }
  function done(x){
    return Boolean(x?.completed||x?.done||x?.isComplete||x?.status==='completed'||x?.status==='done');
  }
  function row(x){
    const el=document.createElement('div');
    el.className='today-row';
    const who=personOf(x);
    const due=dateOf(x);
    el.innerHTML=`<div><b>${escapeHtml(titleOf(x))}</b><small>${escapeHtml(who)}${due?' · '+escapeHtml(due):''}</small></div>`;
    return el;
  }
  function escapeHtml(s){
    return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function fill(id,items,empty='Nothing here.'){
    const el=$(id); if(!el)return;
    el.innerHTML='';
    if(!items.length){el.innerHTML=`<div class="today-empty">${empty}</div>`;return;}
    items.slice(0,50).forEach(x=>el.appendChild(row(x)));
  }

  function render(){
    const t=today();
    const tasks=arr(parse('hmv2-tasks')).filter(x=>x && typeof x==='object');
    const chores=arr(parse('hmv2-weekly-chores')).filter(x=>x && typeof x==='object');
    const activeTasks=tasks.filter(x=>!done(x));
    const activeChores=chores.filter(x=>!done(x));

    const due=activeTasks.filter(x=>dateOf(x)===t);
    const overdue=activeTasks.filter(x=>dateOf(x) && dateOf(x)<t);

    // Weekly chores may use explicit date, day name, or whole-week flag.
    const dayName=new Date().toLocaleDateString('en-US',{weekday:'long'}).toLowerCase();
    const todayChores=activeChores.filter(x=>{
      const d=dateOf(x);
      const day=String(x?.day||x?.weekday||x?.dayOfWeek||'').toLowerCase();
      return d===t || day===dayName || x?.entireWeek===true || x?.allWeek===true;
    });

    // Determine signed-in display name from cloud UI or locally stored member name.
    const myName=($('activeDisplayName')?.textContent||localStorage.getItem('hmv2-cloud-display-name')||'').trim().toLowerCase();
    const mine=[...activeTasks,...todayChores].filter(x=>myName && personOf(x).trim().toLowerCase()===myName);

    $('todayDateLabel') && ($('todayDateLabel').textContent=new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'}));
    $('todayDueCount') && ($('todayDueCount').textContent=due.length);
    $('todayOverdueCount') && ($('todayOverdueCount').textContent=overdue.length);
    $('todayChoreCount') && ($('todayChoreCount').textContent=todayChores.length);
    $('todayMineCount') && ($('todayMineCount').textContent=mine.length);

    fill('todayDueList',due,'Nothing due today.');
    fill('todayOverdueList',overdue,'No overdue tasks.');
    fill('todayChoreList',todayChores,'No chores scheduled today.');
    fill('todayMineList',mine,'Nothing assigned to you today.');
  }

  function openToday(){
    // Hide existing page-like sections.
    document.querySelectorAll('.page').forEach(p=>p.classList.add('hidden'));
    $('page-today')?.classList.remove('hidden');
    render();
  }

  window.addEventListener('DOMContentLoaded',()=>{
    document.querySelectorAll('[data-page="today"]').forEach(b=>b.addEventListener('click',openToday));
    $('todayRefreshBtn')?.addEventListener('click',render);
    render();
  });
})();
