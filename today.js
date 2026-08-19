
(() => {
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const todayStr=()=>{
    const d=new Date();
    return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);
  };
  const currentDayName=()=>new Date().toLocaleDateString('en-US',{weekday:'long'});

  function tasks(){
    try{
      const v=window.HM_APP_BRIDGE?.getTasks?.();
      return Array.isArray(v)?v:[];
    }catch{return[]}
  }
  function chores(){
    try{
      const v=window.HM_APP_BRIDGE?.getChores?.();
      return Array.isArray(v)?v:[];
    }catch{return[]}
  }
  function doneTask(t){
    return !!(t.completed||t.done||t.status==='completed');
  }
  function taskDue(t){
    return t.dueDate||'';
  }
  function choreDone(c){
    try{return !!window.HM_APP_BRIDGE?.choreDoneThisWeek?.(c)}catch{return !!c.completedWeek}
  }
  function choreAssignee(c){
    try{return window.HM_APP_BRIDGE?.effectiveChoreAssignee?.(c)||c.weekAssignee||c.assignee||''}
    catch{return c.weekAssignee||c.assignee||''}
  }
  function choreDue(c){
    try{
      if(c.weekDueDate)return c.weekDueDate;
      return window.HM_APP_BRIDGE?.choreDateForWeek?.(c)||'';
    }catch{return c.weekDueDate||''}
  }
  function choreIsToday(c){
    if(choreDone(c))return false;
    if(x.scheduleType==='week')return true;
    const due=choreDue(c);
    if(due)return due===todayStr();
    return (c.day||'')===currentDayName();
  }
  function row(title,who,due,type){
    return `<div class="today-row"><div><b>${esc(title)}</b><small>${esc(type)}${who?' · '+esc(who):''}${due?' · '+esc(due):''}</small></div></div>`;
  }
  function fill(id,items,empty){
    const el=$(id);if(!el)return;
    el.innerHTML=items.length?items.join(''):`<div class="today-empty">${esc(empty)}</div>`;
  }

  function renderToday(){
    const t=todayStr();
    const allTasks=tasks().filter(x=>x&&!doneTask(x));
    const allChores=chores().filter(x=>x&&!choreDone(x));

    const dueToday=allTasks.filter(x=>taskDue(x)===t);
    const overdue=allTasks.filter(x=>taskDue(x)&&taskDue(x)<t);
    const todayChores=allChores.filter(choreIsToday);

    const display=(document.getElementById('activeDisplayName')?.textContent||localStorage.getItem('hmv2-cloud-display-name')||'').trim().toLowerCase();
    const mine=[
      ...allTasks.filter(x=>display && String(x.assignee||'').trim().toLowerCase()===display),
      ...todayChores.filter(x=>display && String(choreAssignee(x)).trim().toLowerCase()===display)
    ];

    $('todayDateLabel') && ($('todayDateLabel').textContent=new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'}));
    $('todayDueCount') && ($('todayDueCount').textContent=dueToday.length);
    $('todayOverdueCount') && ($('todayOverdueCount').textContent=overdue.length);
    $('todayChoreCount') && ($('todayChoreCount').textContent=todayChores.length);
    $('todayMineCount') && ($('todayMineCount').textContent=mine.length);

    fill('todayDueList',dueToday.map(x=>row(x.name||'Task',x.assignee||'',taskDue(x),'Maintenance')),'Nothing due today.');
    fill('todayOverdueList',overdue.map(x=>row(x.name||'Task',x.assignee||'',taskDue(x),'Maintenance')),'No overdue tasks.');
    fill('todayChoreList',todayChores.map(x=>row(x.name||'Chore',choreAssignee(x),choreDue(x),x.scheduleType==='week'?'Weekly chore':'Chore')),'No chores scheduled today.');
    fill('todayMineList',mine.map(x=>{
      const isChore=Object.prototype.hasOwnProperty.call(x,'scheduleType')||Object.prototype.hasOwnProperty.call(x,'day');
      return row(x.name||'Task',isChore?choreAssignee(x):(x.assignee||''),isChore?choreDue(x):taskDue(x),isChore?'Chore':'Maintenance');
    }),'Nothing assigned to you today.');
  }

  function openToday(){
    // Use same top-level containers as existing app, plus generic .page fallback.
    document.querySelectorAll('.page, main > section').forEach(p=>{
      if(p.id!=='page-today' && p.id!=='cloudDialog')p.classList.add('hidden');
    });
    $('page-today')?.classList.remove('hidden');
    renderToday();
  }

  window.renderToday=renderToday;

  window.addEventListener('DOMContentLoaded',()=>{
    document.querySelectorAll('[data-page="today"],[data-view="today"]').forEach(b=>b.addEventListener('click',openToday));
    $('todayRefreshBtn')?.addEventListener('click',renderToday);
    renderToday();
  });
})();
