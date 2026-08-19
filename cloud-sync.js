
(() => {
  const CLOUD_KEYS=[
    'hmv2-assets','hmv2-tasks','hmv2-history','hmv2-seasonal','hmv2-weekly-chores'
  ];
  const CFG_KEY='hmv2-cloud-config';
  const HOUSEHOLD_KEY='hmv2-cloud-household';
  const DEVICE_KEY='hmv2-device-id-v35';
  const LAST_TS_KEY='hmv2-cloud-last-ts-v35';
  const ACTIVE_PROFILE_KEY='hmv2-active-profile';

  let sb=null;
  let householdId='';
  let channel=null;
  let applyingRemote=false;
  let cloudReady=false;
  let pushTimer=null;
  let pollTimer=null;
  let lastCloudTs=localStorage.getItem(LAST_TS_KEY)||'';
  const originalSetItem=localStorage.setItem.bind(localStorage);

  const $c=id=>document.getElementById(id);

  function cfg(){
    const hosted=window.HM_CLOUD_CONFIG||{};
    if(hosted.url && hosted.key && !String(hosted.url).includes('PASTE_') && !String(hosted.key).includes('PASTE_')) return hosted;
    try{return JSON.parse(localStorage.getItem(CFG_KEY)||'{}')}catch{return{}}
  }

  function deviceId(){
    let id=localStorage.getItem(DEVICE_KEY);
    if(!id){
      id=(crypto?.randomUUID?.() || ('dev-'+Date.now()+'-'+Math.random().toString(36).slice(2)));
      originalSetItem(DEVICE_KEY,id);
    }
    return id;
  }

  function setStatus(text, cls=''){
    const a=$c('cloudStatusText');
    if(a){a.textContent=text;a.className=cls;}
    const b=$c('cloudSidebarStatus');
    if(b){b.textContent=text;b.dataset.state=cls;}
    try{window.dispatchEvent(new CustomEvent('hm-cloud-status',{detail:{text,cls}}));}catch{}
  }

  function setLastSync(ts, label='Saved'){
    if(!ts)return;
    lastCloudTs=ts;
    originalSetItem(LAST_TS_KEY,ts);
    const el=$c('lastSyncText');
    if(el){
      const d=new Date(ts);
      el.textContent=`${label} ✓ · ${d.toLocaleTimeString([], {hour:'numeric',minute:'2-digit',second:'2-digit'})}`;
    }
  }

  function readJSON(key){
    try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}
  }

  function snapshot(){
    const state={
      version:35,
      source_device:deviceId(),
      saved_at:new Date().toISOString()
    };
    for(const k of CLOUD_KEYS)state[k]=readJSON(k);
    return state;
  }

  function applySnapshot(state, updatedAt){
    if(!state)return;
    applyingRemote=true;
    try{
      for(const k of CLOUD_KEYS){
        if(Object.prototype.hasOwnProperty.call(state,k) && state[k]!==null){
          originalSetItem(k,JSON.stringify(state[k]));
        }
      }
      if(updatedAt)setLastSync(updatedAt,'Updated');
    }finally{
      applyingRemote=false;
    }
    setStatus('Updating…','busy');
    setTimeout(()=>location.reload(),120);
  }

  async function getSession(){
    if(!sb)return null;
    const {data}=await sb.auth.getSession();
    return data.session||null;
  }

  async function listMemberships(){
    const {data,error}=await sb.from('household_members')
      .select('household_id,user_id,display_name,profile_name,role,must_change_password,created_at,households(name,invite_code)')
      .order('created_at',{ascending:true});
    if(error)throw error;
    return data||[];
  }

  async function getCloudRow(){
    if(!sb||!householdId)return null;
    const {data,error}=await sb.from('household_state')
      .select('state,updated_at,updated_by')
      .eq('household_id',householdId)
      .maybeSingle();
    if(error)throw error;
    return data||null;
  }

  async function pushNow(force=false){
    if(!sb||!householdId||applyingRemote)return false;
    const session=await getSession();
    if(!session)return false;

    setStatus('Saving…','busy');

    try{
      if(!force){
        const remote=await getCloudRow();
        if(remote?.updated_at && lastCloudTs && new Date(remote.updated_at)>new Date(lastCloudTs)){
          setStatus('Updating…','busy');
          applySnapshot(remote.state,remote.updated_at);
          return false;
        }
      }

      const now=new Date().toISOString();
      const payload={
        household_id:householdId,
        state:snapshot(),
        updated_at:now,
        updated_by:session.user.id
      };
      const {error}=await sb.from('household_state').upsert(payload,{onConflict:'household_id'});
      if(error)throw error;
      setStatus('Synced','ok');
      setLastSync(now,'Saved');
      return true;
    }catch(err){
      console.error('V35 cloud push failed',err);
      setStatus(navigator.onLine?'Sync Error':'Offline','bad');
      return false;
    }
  }

  function schedulePush(reason='change'){
    if(!cloudReady||applyingRemote)return;
    clearTimeout(pushTimer);
    setStatus('Saving…','busy');
    pushTimer=setTimeout(()=>pushNow(false),700);
  }

  window.hmCloudChanged=(reason='app-change')=>schedulePush(reason);

  // V48.1: explicit commit for high-value actions such as chore completion.
  // This bypasses the debounce path so the completed chore is written immediately.
  window.hmCloudCommit=async(reason='explicit-change')=>{
    if(!cloudReady||applyingRemote){
      setStatus(navigator.onLine?'Waiting for sync…':'Offline','busy');
      return false;
    }
    clearTimeout(pushTimer);
    setStatus('Saving…','busy');
    const ok=await pushNow(true);
    try{window.dispatchEvent(new CustomEvent('hm-cloud-commit',{detail:{ok,reason}}));}catch{}
    return ok;
  };

  function hookStorage(){
    localStorage.setItem=function(key,val){
      originalSetItem(key,val);
      if(CLOUD_KEYS.includes(key))schedulePush('storage');
    };
  }

  async function checkCloud(){
    if(!cloudReady||!sb||!householdId||applyingRemote)return;
    try{
      const row=await getCloudRow();
      if(!row?.updated_at||!row?.state)return;

      if(lastCloudTs && new Date(row.updated_at)<=new Date(lastCloudTs)){
        if(navigator.onLine)setStatus('Synced','ok');
        return;
      }

      // Ignore only this exact device's own echo.
      if(row.state.source_device===deviceId()){
        setLastSync(row.updated_at,'Saved');
        setStatus('Synced','ok');
        return;
      }

      applySnapshot(row.state,row.updated_at);
    }catch(err){
      console.error('V35 poll failed',err);
      setStatus(navigator.onLine?'Sync Error':'Offline','bad');
    }
  }

  function startPolling(){
    clearInterval(pollTimer);
    pollTimer=setInterval(checkCloud,5000);
  }

  function subscribeRealtime(){
    if(!sb||!householdId)return;
    if(channel){
      sb.removeChannel(channel);
      channel=null;
    }

    channel=sb.channel(`hm-v35-${householdId}`)
      .on('postgres_changes',{
        event:'*',
        schema:'public',
        table:'household_state',
        filter:`household_id=eq.${householdId}`
      },payload=>{
        const row=payload.new;
        if(!row?.state||!row?.updated_at)return;

        // Ignore only this device's own event.
        if(row.state.source_device===deviceId()){
          setLastSync(row.updated_at,'Saved');
          setStatus('Synced','ok');
          return;
        }

        if(lastCloudTs && new Date(row.updated_at)<=new Date(lastCloudTs))return;

        applySnapshot(row.state,row.updated_at);
      })
      .subscribe(status=>{
        const rt=$c('realtimeStatusText');
        if(rt)rt.textContent=status==='SUBSCRIBED'?'Realtime connected':'Realtime '+String(status).toLowerCase();
      });
  }

  async function pullCloud(){
    const row=await getCloudRow();
    if(!row?.state)return;
    applySnapshot(row.state,row.updated_at);
  }

  async function connectHousehold(id){
    householdId=id;
    originalSetItem(HOUSEHOLD_KEY,id);
    cloudReady=true;

    const row=await getCloudRow();
    if(!row?.state || Object.keys(row.state).length===0){
      await pushNow(true);
    }else{
      if(!lastCloudTs)setLastSync(row.updated_at,'Connected');
    }

    subscribeRealtime();
    startPolling();
    setStatus('Synced','ok');
  }


  function profileOptions(selected=''){
    const people=Array.isArray(window.HM_PEOPLE)?window.HM_PEOPLE:[];
    return ['<option value="">Not linked</option>',...people.map(p=>`<option value="${p.replace(/"/g,'&quot;')}" ${p===selected?'selected':''}>${p}</option>`)].join('');
  }

  async function saveMemberProfile(memberUserId,profileName){
    if(!sb||!householdId)return;
    const {error}=await sb.rpc('set_household_member_profile',{
      p_household_id:householdId,
      p_user_id:memberUserId,
      p_profile_name:profileName
    });
    if(error){
      alert(error.message||String(error));
      return false;
    }

    const session=await getSession();
    if(session?.user?.id===memberUserId){
      if(profileName)originalSetItem(ACTIVE_PROFILE_KEY,profileName);
      else localStorage.removeItem(ACTIVE_PROFILE_KEY);
      if($c('activeProfileName'))$c('activeProfileName').textContent=profileName||'Not linked';
    }

    await renderFamilyProfiles();
    await refreshCloudUI();
    try{window.renderToday?.();window.render?.();}catch{}
    return true;
  }



  function makeTempPassword(){
    const chars='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    const bytes=new Uint32Array(14);
    crypto.getRandomValues(bytes);
    return Array.from(bytes,n=>chars[n%chars.length]).join('');
  }

  async function createFamilyAccount(){
    const email=($c('newAccountEmail')?.value||'').trim();
    const password=($c('newAccountPassword')?.value||'').trim();
    const profileName=($c('newAccountProfile')?.value||'').trim();
    const result=$c('familyAccountResult');
    if(!profileName||!email||password.length<8){
      if(result)result.textContent='Choose a family member, enter an email, and use a password with at least 8 characters.';
      return;
    }
    const btn=$c('createFamilyAccountBtn');
    if(btn)btn.disabled=true;
    if(result)result.textContent='Creating account…';
    try{
      const {data,error}=await sb.functions.invoke('create-family-account',{
        body:{household_id:householdId,email,password,profile_name:profileName}
      });
      if(error)throw error;
      if(data?.error)throw new Error(data.error);
      if(result)result.innerHTML=`<strong>${profileName}'s account is ready.</strong><br>Email: ${email}<br>Temporary password: <code>${password}</code><br>Give these to ${profileName}. They can sign in immediately.`;
      if($c('newAccountEmail'))$c('newAccountEmail').value='';
      if($c('newAccountPassword'))$c('newAccountPassword').value='';
      await renderFamilyProfiles();
    }catch(err){
      if(result)result.textContent=err?.message||String(err);
    }finally{
      if(btn)btn.disabled=false;
    }
  }


  async function changeOwnPassword(){
    const current=($c('accountCurrentPassword')?.value||'');
    const next=($c('accountNewPassword')?.value||'');
    const confirm=($c('accountConfirmPassword')?.value||'');
    const result=$c('changeOwnPasswordResult');

    if(!current){
      if(result)result.textContent='Enter your current password.';
      return;
    }
    if(next.length<8){
      if(result)result.textContent='New password must be at least 8 characters.';
      return;
    }
    if(next!==confirm){
      if(result)result.textContent='New passwords do not match.';
      return;
    }

    const btn=$c('changeOwnPasswordBtn');
    if(btn)btn.disabled=true;
    if(result)result.textContent='Changing password…';

    try{
      const session=await getSession();
      const email=session?.user?.email;
      if(!email)throw new Error('No signed-in email found.');

      // Verify current password by re-authenticating first.
      const {error:verifyError}=await sb.auth.signInWithPassword({email,password:current});
      if(verifyError)throw new Error('Current password is incorrect.');

      const {error:updateError}=await sb.auth.updateUser({password:next});
      if(updateError)throw updateError;

      // If this was a temporary-password account, clear the forced-change flag.
      try{
        await sb.rpc('clear_my_password_change_flag',{p_household_id:householdId});
      }catch{}

      if($c('accountCurrentPassword'))$c('accountCurrentPassword').value='';
      if($c('accountNewPassword'))$c('accountNewPassword').value='';
      if($c('accountConfirmPassword'))$c('accountConfirmPassword').value='';
      if(result)result.textContent='Password changed successfully ✓';
    }catch(err){
      if(result)result.textContent=err?.message||String(err);
    }finally{
      if(btn)btn.disabled=false;
    }
  }

  async function resetFamilyPassword(userId,profileName){
    if(!confirm(`Reset ${profileName}'s password? A new temporary password will be created.`))return;
    try{
      const {data,error}=await sb.functions.invoke('reset-family-password',{
        body:{household_id:householdId,user_id:userId}
      });
      if(error)throw error;
      if(data?.error)throw new Error(data.error);

      const temp=data?.temporary_password||'';
      alert(`${profileName}'s password has been reset.\n\nTemporary password:\n${temp}\n\nGive this password to ${profileName}. They will be required to change it after signing in.`);
      try{
        await navigator.clipboard.writeText(temp);
      }catch{}
      await renderFamilyProfiles();
    }catch(err){
      alert(err?.message||String(err));
    }
  }

  async function renderFamilyProfiles(){
    const list=$c('familyProfilesList');
    if(!list||!sb||!householdId)return;

    const session=await getSession();
    if(!session)return;

    let members=[];
    try{members=await listMemberships()}catch(err){
      list.innerHTML='<p class="muted">Run the V44 Family Profiles migration in Supabase first.</p>';
      return;
    }

    const me=members.find(m=>m.user_id===session.user.id);
    const owner=me?.role==='owner';
    const accountBox=$c('ownerAccountBox');
    if(accountBox)accountBox.classList.toggle('hidden',!owner);
    const accountProfile=$c('newAccountProfile');
    if(accountProfile){
      const linked=new Set(members.map(m=>(m.profile_name||m.display_name||'').trim()).filter(Boolean));
      const people=Array.isArray(window.HM_PEOPLE)?window.HM_PEOPLE:[];
      accountProfile.innerHTML=people.map(p=>`<option value="${p.replace(/"/g,'&quot;')}" ${linked.has(p)?'disabled':''}>${p}${linked.has(p)?' · account exists':''}</option>`).join('');
    }

    list.innerHTML=members.map(m=>{
      const selected=m.profile_name||m.display_name||'';
      const isMe=m.user_id===session.user.id;
      const canEdit=owner||isMe;
      const label=isMe?'You':(m.display_name||'Family member');
      return `<div class="family-profile-row">
        <div class="family-profile-member">
          <strong>${label}</strong>
          <small>${m.role==='owner'?'Owner':'Member'}${isMe?' · signed in':''}</small>
        </div>
        <div class="family-profile-actions">
          ${canEdit
            ? `<select class="family-profile-select" data-profile-user="${m.user_id}">${profileOptions(selected)}</select>`
            : `<span class="family-profile-linked">${selected||'Not linked'}</span>`}
          ${owner&&!isMe?`<button type="button" class="secondary reset-family-password-btn" data-reset-user="${m.user_id}" data-reset-profile="${selected||label}">Reset Password</button>`:''}
        </div>
      </div>`;
    }).join('');

    list.querySelectorAll('.family-profile-select').forEach(sel=>{
      sel.addEventListener('change',async()=>{
        sel.disabled=true;
        await saveMemberProfile(sel.dataset.profileUser,sel.value);
        sel.disabled=false;
      });
    });

    list.querySelectorAll('.reset-family-password-btn').forEach(btn=>{
      btn.addEventListener('click',()=>resetFamilyPassword(btn.dataset.resetUser,btn.dataset.resetProfile||'Family member'));
    });
  }


  async function enforcePasswordChangeIfNeeded(member){
    if(!member?.must_change_password)return;
    const dlg=$c('forcePasswordDialog');
    if(dlg && !dlg.open){
      dlg.showModal();
      setTimeout(()=>$c('forceNewPassword')?.focus(),50);
    }
  }

  async function changeTemporaryPassword(e){
    e?.preventDefault?.();
    const p1=$c('forceNewPassword')?.value||'';
    const p2=$c('forceConfirmPassword')?.value||'';
    const result=$c('forcePasswordResult');
    if(p1.length<8){
      if(result)result.textContent='Use at least 8 characters.';
      return;
    }
    if(p1!==p2){
      if(result)result.textContent='Passwords do not match.';
      return;
    }
    const btn=$c('forcePasswordSaveBtn');
    if(btn)btn.disabled=true;
    if(result)result.textContent='Saving new password…';
    try{
      const {error}=await sb.auth.updateUser({password:p1});
      if(error)throw error;
      const {error:flagError}=await sb.rpc('clear_my_password_change_flag',{p_household_id:householdId});
      if(flagError)throw flagError;
      if(result)result.textContent='Password changed successfully.';
      setTimeout(()=>{
        try{$c('forcePasswordDialog')?.close()}catch{}
        if($c('forceNewPassword'))$c('forceNewPassword').value='';
        if($c('forceConfirmPassword'))$c('forceConfirmPassword').value='';
      },500);
    }catch(err){
      if(result)result.textContent=err?.message||String(err);
    }finally{
      if(btn)btn.disabled=false;
    }
  }

  async function refreshCloudUI(){
    if(!sb){setStatus('Not configured','off');return;}

    const session=await getSession();
    const auth=$c('cloudAuthBlock'), choose=$c('cloudHouseholdBlock'), active=$c('cloudActiveBlock');

    if(!session){
      auth?.classList.remove('hidden');
      choose?.classList.add('hidden');
      active?.classList.add('hidden');
      setStatus('Signed out','off');
      return;
    }

    auth?.classList.add('hidden');
    const memberships=await listMemberships();

    if(!memberships.length){
      choose?.classList.remove('hidden');
      active?.classList.add('hidden');
      setStatus('Choose household','busy');
      return;
    }

    choose?.classList.add('hidden');
    active?.classList.remove('hidden');

    const saved=localStorage.getItem(HOUSEHOLD_KEY);

    // IMPORTANT: choose the membership row for the currently signed-in user.
    // Previously V46 could choose the first household member (often the owner),
    // which made Ashley's login incorrectly show Jerry as "Your profile".
    const householdMatches=memberships.filter(x=>!saved||x.household_id===saved);
    const chosen=householdMatches.find(x=>x.user_id===session.user.id)
      || memberships.find(x=>x.user_id===session.user.id)
      || householdMatches[0]
      || memberships[0];

    if(!householdId)await connectHousehold(chosen.household_id);

    const h=chosen.households||{};
    const linkedProfile=(chosen.profile_name||chosen.display_name||'').trim();
    if(linkedProfile)originalSetItem(ACTIVE_PROFILE_KEY,linkedProfile);
    else localStorage.removeItem(ACTIVE_PROFILE_KEY);

    if($c('activeHouseholdName'))$c('activeHouseholdName').textContent=h.name||'Household';
    if($c('activeInviteCode'))$c('activeInviteCode').textContent=h.invite_code||'';
    if($c('activeUserEmail'))$c('activeUserEmail').textContent=session.user.email||'';
    if($c('activeDisplayName'))$c('activeDisplayName').textContent=chosen.display_name||'';
    if($c('activeProfileName'))$c('activeProfileName').textContent=linkedProfile||'Not linked';

    await renderFamilyProfiles();
    await enforcePasswordChangeIfNeeded(chosen);
    setStatus('Synced','ok');
  }

  function wireUI(){
    $c('forcePasswordForm')?.addEventListener('submit',changeTemporaryPassword);
    $c('forcePasswordDialog')?.addEventListener('cancel',e=>e.preventDefault());
    $c('changeOwnPasswordBtn')?.addEventListener('click',changeOwnPassword);

    $c('cloudOpenBtn')?.addEventListener('click',()=>{
      $c('cloudDialog').showModal();
      refreshCloudUI();
    });
    $c('cloudCloseBtn')?.addEventListener('click',()=>$c('cloudDialog').close());

    const hc=cfg();
    $c('cloudHostSetupCard')?.classList.toggle('hidden',Boolean(hc.url&&hc.key));

    $c('cloudSignUpBtn')?.addEventListener('click',async()=>{
      if(!sb)return alert('Cloud is not configured.');
      const email=$c('cloudEmail').value.trim(), password=$c('cloudPassword').value;
      const btn=$c('cloudSignUpBtn');
      btn.disabled=true;btn.textContent='Creating…';
      try{
        const {error}=await sb.auth.signUp({
          email,password,
          options:{emailRedirectTo:location.origin+location.pathname}
        });
        if(error)throw error;
        alert('Account created. Check your email if confirmation is required.');
      }catch(err){alert(err.message||String(err));}
      finally{btn.disabled=false;btn.textContent='Create Account';}
    });

    $c('cloudSignInBtn')?.addEventListener('click',async()=>{
      if(!sb)return alert('Cloud is not configured.');
      const email=$c('cloudEmail').value.trim(), password=$c('cloudPassword').value;
      const btn=$c('cloudSignInBtn');
      btn.disabled=true;btn.textContent='Signing in…';
      try{
        const {error}=await sb.auth.signInWithPassword({email,password});
        if(error)throw error;
        await refreshCloudUI();
      }catch(err){alert(err.message||String(err));}
      finally{btn.disabled=false;btn.textContent='Sign In';}
    });

    $c('cloudSignOutBtn')?.addEventListener('click',async()=>{
      clearInterval(pollTimer);
      if(channel){sb.removeChannel(channel);channel=null;}
      householdId='';cloudReady=false;
      originalSetItem(HOUSEHOLD_KEY,'');
      localStorage.removeItem(ACTIVE_PROFILE_KEY);
      await sb.auth.signOut();
      await refreshCloudUI();
    });

    $c('createHouseholdBtn')?.addEventListener('click',async()=>{
      const name=$c('newHouseholdName').value.trim()||'Home Maintenance';
      const display=$c('cloudDisplayName').value.trim();
      const {data,error}=await sb.rpc('create_household',{p_name:name,p_display_name:display});
      if(error)return alert(error.message);
      const id=(data?.[0]||{}).household_id;
      await connectHousehold(id);
      if(display){
        await sb.rpc('set_household_member_profile',{p_household_id:id,p_user_id:(await getSession()).user.id,p_profile_name:display});
      }
      await pushNow(true);
      await refreshCloudUI();
    });

    $c('joinHouseholdBtn')?.addEventListener('click',async()=>{
      const code=$c('joinHouseholdCode').value.trim();
      const display=$c('cloudDisplayName').value.trim();
      const {data,error}=await sb.rpc('join_household',{p_invite_code:code,p_display_name:display});
      if(error)return alert(error.message);
      await connectHousehold(data);
      if(display){
        await sb.rpc('set_household_member_profile',{p_household_id:data,p_user_id:(await getSession()).user.id,p_profile_name:display});
      }
      await pullCloud();
    });

    $c('pushThisDeviceBtn')?.addEventListener('click',async()=>{
      if(confirm('Replace the shared cloud data with this device?'))await pushNow(true);
    });

    $c('pullCloudBtn')?.addEventListener('click',async()=>{
      if(confirm('Replace this device with the current cloud data?'))await pullCloud();
    });

    $c('refreshProfilesBtn')?.addEventListener('click',async()=>{await renderFamilyProfiles();await refreshCloudUI();});
    $c('createFamilyAccountBtn')?.addEventListener('click',createFamilyAccount);
    $c('generateTempPasswordBtn')?.addEventListener('click',()=>{
      const p=makeTempPassword();
      if($c('newAccountPassword'))$c('newAccountPassword').value=p;
    });

    $c('copyInviteBtn')?.addEventListener('click',async()=>{
      const code=$c('activeInviteCode')?.textContent?.trim()||'';
      const text=`Home Maintenance Planner\n${location.origin}${location.pathname}\nInvite code: ${code}\n\nCreate an account, sign in, then choose Join Household and enter this code.`;
      try{
        await navigator.clipboard.writeText(text);
        $c('copyInviteBtn').textContent='Copied ✓';
        setTimeout(()=>$c('copyInviteBtn').textContent='Copy Invite',1200);
      }catch{
        prompt('Copy this invite:',text);
      }
    });
  }

  async function init(){
    hookStorage();
    wireUI();

    const c=cfg();
    if(!c.url||!c.key||!window.supabase?.createClient){
      setStatus('Not configured','off');
      return;
    }

    sb=window.supabase.createClient(c.url,c.key,{
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
    });

    sb.auth.onAuthStateChange(()=>setTimeout(refreshCloudUI,0));

    const session=await getSession();
    if(session){
      const memberships=await listMemberships();
      if(memberships.length){
        const saved=localStorage.getItem(HOUSEHOLD_KEY);
        const householdMatches=memberships.filter(x=>!saved||x.household_id===saved);
        const chosen=householdMatches.find(x=>x.user_id===session.user.id)
          || memberships.find(x=>x.user_id===session.user.id)
          || householdMatches[0]
          || memberships[0];
        await connectHousehold(chosen.household_id);
      }
    }

    window.addEventListener('online',()=>{setStatus('Synced','ok');checkCloud();});
    window.addEventListener('offline',()=>setStatus('Offline','bad'));

    await refreshCloudUI();
  }

  window.addEventListener('DOMContentLoaded',init);
})();
