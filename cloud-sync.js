
(() => {
  const CLOUD_KEYS = [
    'hmv2-assets','hmv2-tasks','hmv2-history','hmv2-seasonal','hmv2-weekly-chores'
  ];
  const CFG_KEY='hmv2-cloud-config';
  const HOUSEHOLD_KEY='hmv2-cloud-household';
  const DISPLAY_KEY='hmv2-cloud-display-name';

  let sb=null, householdId='', channel=null, applyingRemote=false, pushTimer=null, cloudReady=false;
  let originalSetItem=localStorage.setItem.bind(localStorage);

  const $c=id=>document.getElementById(id);
  const cfg=()=>{
    const hosted=window.HM_CLOUD_CONFIG||{};
    if(hosted.url && hosted.key && !String(hosted.url).includes('PASTE_') && !String(hosted.key).includes('PASTE_')) return hosted;
    try{return JSON.parse(localStorage.getItem(CFG_KEY)||'{}')}catch{return{}}
  };

  function setStatus(text, cls=''){
    const el=$c('cloudStatusText'); if(el){el.textContent=text;el.className=cls;}
    const badge=$c('cloudSidebarStatus'); if(badge){badge.textContent=text;badge.dataset.state=cls;}
  }

  function snapshot(){
    const state={version:31,saved_at:new Date().toISOString()};
    for(const k of CLOUD_KEYS){
      try{state[k]=JSON.parse(localStorage.getItem(k)||'null')}catch{state[k]=null}
    }
    return state;
  }

  function applySnapshot(state){
    if(!state)return;
    applyingRemote=true;
    try{
      for(const k of CLOUD_KEYS){
        if(Object.prototype.hasOwnProperty.call(state,k) && state[k]!==null){
          originalSetItem(k,JSON.stringify(state[k]));
        }
      }
    } finally {
      applyingRemote=false;
    }
    location.reload();
  }

  async function createClientFromSavedConfig(){
    const c=cfg();
    if(!c.url||!c.key||!window.supabase?.createClient)return false;
    sb=window.supabase.createClient(c.url,c.key,{
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
    });
    return true;
  }

  async function getSession(){
    if(!sb)return null;
    const {data}=await sb.auth.getSession();
    return data.session||null;
  }

  async function listMemberships(){
    const {data,error}=await sb.from('household_members')
      .select('household_id,display_name,role,households(name,invite_code)')
      .order('created_at',{ascending:true});
    if(error) throw error;
    return data||[];
  }

  async function selectHousehold(id){
    householdId=id;
    originalSetItem(HOUSEHOLD_KEY,id);
    await pullCloudState(true);
    subscribeRealtime();
    cloudReady=true;
    setStatus('Synced','ok');
    refreshCloudUI();
  }

  async function pullCloudState(firstLoad=false){
    if(!sb||!householdId)return;
    const {data,error}=await sb.from('household_state')
      .select('state,updated_at')
      .eq('household_id',householdId)
      .maybeSingle();
    if(error) throw error;
    if(data?.state && Object.keys(data.state).length){
      const local=snapshot();
      // First connection prefers cloud if cloud has state. A blank cloud can be seeded from this device.
      if(firstLoad){
        applySnapshot(data.state);
        return;
      }
    } else {
      await pushCloudState(true);
    }
  }

  async function pushCloudState(force=false){
    if(!sb||!householdId||applyingRemote)return;
    const session=await getSession(); if(!session)return;
    const payload={
      household_id:householdId,
      state:snapshot(),
      updated_at:new Date().toISOString(),
      updated_by:session.user.id
    };
    const {error}=await sb.from('household_state').upsert(payload,{onConflict:'household_id'});
    if(error){console.error(error);setStatus('Sync error','bad');return;}
    setStatus('Synced','ok');
  }

  function schedulePush(){
    if(!cloudReady||applyingRemote)return;
    setStatus('Saving…','busy');
    clearTimeout(pushTimer);
    pushTimer=setTimeout(()=>pushCloudState(),700);
  }

  function hookLocalStorage(){
    localStorage.setItem=function(key,val){
      originalSetItem(key,val);
      if(CLOUD_KEYS.includes(key))schedulePush();
    };
  }

  function subscribeRealtime(){
    if(channel){sb.removeChannel(channel);channel=null;}
    channel=sb.channel(`household-state-${householdId}`)
      .on('postgres_changes',{
        event:'UPDATE',schema:'public',table:'household_state',
        filter:`household_id=eq.${householdId}`
      },async payload=>{
        const session=await getSession();
        if(payload.new?.updated_by && session?.user?.id===payload.new.updated_by)return;
        if(payload.new?.state)applySnapshot(payload.new.state);
      }).subscribe();
  }

  function dataUrlToBlob(dataUrl){
    const [head,b64]=dataUrl.split(',');
    const mime=(head.match(/:(.*?);/)||[])[1]||'image/jpeg';
    const bin=atob(b64);const arr=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);
    return new Blob([arr],{type:mime});
  }

  async function enableCloudPhotos(){
    if(typeof window.dbPutPhoto==='undefined' && typeof dbPutPhoto==='undefined')return;
    try{
      const cloudPut=async rec=>{
        if(!cloudReady) return originalDbPut(rec);
        const session=await getSession(); if(!session) return originalDbPut(rec);
        const safeRef=rec.refKey.replace(/[^a-zA-Z0-9:_-]/g,'_');
        const path=`${householdId}/${safeRef}/${rec.id}.jpg`;
        const blob=dataUrlToBlob(rec.dataUrl);
        let {error}=await sb.storage.from('task-photos').upload(path,blob,{contentType:'image/jpeg',upsert:true});
        if(error) throw error;
        ({error}=await sb.from('task_photo_index').insert({
          id:rec.id,household_id:householdId,ref_key:rec.refKey,object_path:path,
          original_name:rec.name||'',created_by:session.user.id,created_at:rec.createdAt||new Date().toISOString()
        }));
        if(error) throw error;
      };
      const cloudGet=async refKey=>{
        if(!cloudReady)return originalDbGet(refKey);
        const {data,error}=await sb.from('task_photo_index')
          .select('id,ref_key,object_path,original_name,created_at')
          .eq('household_id',householdId).eq('ref_key',refKey)
          .order('created_at',{ascending:false});
        if(error)throw error;
        const out=[];
        for(const p of data||[]){
          const {data:signed,error:se}=await sb.storage.from('task-photos').createSignedUrl(p.object_path,3600);
          if(!se&&signed?.signedUrl)out.push({
            id:p.id,refKey:p.ref_key,dataUrl:signed.signedUrl,name:p.original_name||'',createdAt:p.created_at
          });
        }
        return out;
      };
      const cloudDelete=async id=>{
        if(!cloudReady)return originalDbDelete(id);
        const {data,error}=await sb.from('task_photo_index')
          .select('object_path').eq('household_id',householdId).eq('id',id).single();
        if(error)throw error;
        await sb.storage.from('task-photos').remove([data.object_path]);
        const {error:de}=await sb.from('task_photo_index').delete().eq('household_id',householdId).eq('id',id);
        if(de)throw de;
      };

      const originalDbPut = window.dbPutPhoto || dbPutPhoto;
      const originalDbGet = window.dbGetPhotos || dbGetPhotos;
      const originalDbDelete = window.dbDeletePhoto || dbDeletePhoto;

      // Global function declarations from app.js are writable in classic scripts.
      try{dbPutPhoto=cloudPut;dbGetPhotos=cloudGet;dbDeletePhoto=cloudDelete;}catch{}
      window.dbPutPhoto=cloudPut;window.dbGetPhotos=cloudGet;window.dbDeletePhoto=cloudDelete;
    }catch(e){console.warn('Cloud photo setup',e);}
  }

  async function refreshCloudUI(){
    if(!sb){setStatus('Not configured','off');return;}
    const session=await getSession();
    const authBlock=$c('cloudAuthBlock'), householdBlock=$c('cloudHouseholdBlock'), activeBlock=$c('cloudActiveBlock');
    if(!session){
      authBlock?.classList.remove('hidden'); householdBlock?.classList.add('hidden'); activeBlock?.classList.add('hidden');
      setStatus('Signed out','off');return;
    }
    authBlock?.classList.add('hidden');
    const memberships=await listMemberships();
    if(!memberships.length){
      householdBlock?.classList.remove('hidden');activeBlock?.classList.add('hidden');setStatus('Choose household','busy');return;
    }
    householdBlock?.classList.add('hidden');activeBlock?.classList.remove('hidden');
    const saved=localStorage.getItem(HOUSEHOLD_KEY);
    const chosen=memberships.find(m=>m.household_id===saved)||memberships[0];
    if(!householdId){
      householdId=chosen.household_id;
      originalSetItem(HOUSEHOLD_KEY,householdId);
      subscribeRealtime(); cloudReady=true; await enableCloudPhotos();
    }
    const h=chosen.households||{};
    if($c('activeHouseholdName'))$c('activeHouseholdName').textContent=h.name||'Household';
    if($c('activeInviteCode'))$c('activeInviteCode').textContent=h.invite_code||'';
    if($c('activeUserEmail'))$c('activeUserEmail').textContent=session.user.email||'';
    setStatus('Synced','ok');
  }

  async function init(){
    hookLocalStorage();
    const ok=await createClientFromSavedConfig();
    wireUI();
    if(!ok){setStatus('Setup needed','off');return;}
    sb.auth.onAuthStateChange(()=>setTimeout(refreshCloudUI,0));
    const session=await getSession();
    if(session){
      const memberships=await listMemberships();
      if(memberships.length){
        const saved=localStorage.getItem(HOUSEHOLD_KEY);
        const chosen=memberships.find(m=>m.household_id===saved)||memberships[0];
        householdId=chosen.household_id;
        originalSetItem(HOUSEHOLD_KEY,householdId);
        // First cloud migration: seed empty cloud from current device, otherwise use cloud.
        const {data}=await sb.from('household_state').select('state').eq('household_id',householdId).maybeSingle();
        if(!data?.state || Object.keys(data.state||{}).length===0) await pushCloudState(true);
        subscribeRealtime();cloudReady=true;await enableCloudPhotos();
      }
    }
    await refreshCloudUI();
  }

  function wireUI(){
    $c('cloudOpenBtn')?.addEventListener('click',()=>{$c('cloudDialog').showModal();refreshCloudUI();});
    const hc=cfg();
    $c('cloudHostSetupCard')?.classList.toggle('hidden',Boolean(hc.url&&hc.key));

    $c('cloudCloseBtn')?.addEventListener('click',()=>{$c('cloudDialog').close();});
    // V32 normally reads cloud-config.js. Legacy per-device configuration remains supported if those fields exist.
    if($c('saveCloudConfig')){
      $c('saveCloudConfig').addEventListener('click',()=>{
        const url=$c('cloudProjectUrl').value.trim(),key=$c('cloudPublishableKey').value.trim();
        originalSetItem(CFG_KEY,JSON.stringify({url,key}));location.reload();
      });
      const c=cfg();
      if($c('cloudProjectUrl'))$c('cloudProjectUrl').value=c.url||'';
      if($c('cloudPublishableKey'))$c('cloudPublishableKey').value=c.key||'';
    }

    $c('cloudSignUpBtn')?.addEventListener('click',async()=>{
      const email=$c('cloudEmail').value.trim(),password=$c('cloudPassword').value;
      const {error}=await sb.auth.signUp({email,password}); if(error)return alert(error.message);
      alert('Account created. If email confirmation is enabled in Supabase, confirm the email before signing in.');
    });
    $c('cloudSignInBtn')?.addEventListener('click',async()=>{
      const email=$c('cloudEmail').value.trim(),password=$c('cloudPassword').value;
      const {error}=await sb.auth.signInWithPassword({email,password}); if(error)return alert(error.message);
      await refreshCloudUI();
    });
    $c('cloudSignOutBtn')?.addEventListener('click',async()=>{await sb.auth.signOut();householdId='';cloudReady=false;originalSetItem(HOUSEHOLD_KEY,'');await refreshCloudUI();});
    $c('createHouseholdBtn')?.addEventListener('click',async()=>{
      const name=$c('newHouseholdName').value.trim()||'Home Maintenance';
      const display=$c('cloudDisplayName').value.trim();
      originalSetItem(DISPLAY_KEY,display);
      const {data,error}=await sb.rpc('create_household',{p_name:name,p_display_name:display});
      if(error)return alert(error.message);
      householdId=(data?.[0]||{}).household_id;originalSetItem(HOUSEHOLD_KEY,householdId);
      await pushCloudState(true);subscribeRealtime();cloudReady=true;await enableCloudPhotos();await refreshCloudUI();
    });
    $c('joinHouseholdBtn')?.addEventListener('click',async()=>{
      const code=$c('joinHouseholdCode').value.trim(),display=$c('cloudDisplayName').value.trim();
      originalSetItem(DISPLAY_KEY,display);
      const {data,error}=await sb.rpc('join_household',{p_invite_code:code,p_display_name:display});
      if(error)return alert(error.message);
      householdId=data;originalSetItem(HOUSEHOLD_KEY,householdId);
      await pullCloudState(true);subscribeRealtime();cloudReady=true;await enableCloudPhotos();await refreshCloudUI();
    });
    $c('pushThisDeviceBtn')?.addEventListener('click',async()=>{if(confirm('Replace the shared cloud data with the data on this device?'))await pushCloudState(true);});
    $c('pullCloudBtn')?.addEventListener('click',async()=>{if(confirm('Replace this device data with the current shared cloud data?'))await pullCloudState(true);});
    $c('copyInviteBtn')?.addEventListener('click',async()=>{
      const code=$c('activeInviteCode')?.textContent?.trim()||'';
      const text=`Home Maintenance Planner\n${location.origin}${location.pathname}\nInvite code: ${code}\n\nCreate an account, sign in, then choose Join Household and enter this code.`;
      try{await navigator.clipboard.writeText(text);$c('copyInviteBtn').textContent='Copied ✓';setTimeout(()=>$c('copyInviteBtn').textContent='Copy Invite',1200);}
      catch{prompt('Copy this invite:',text);}
    });
  }

  window.addEventListener('DOMContentLoaded',init);
})();
