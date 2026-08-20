
(() => {
  const VERSION='49';
  let installPrompt=null;
  let waitingWorker=null;

  function updateConnection(){
    const el=document.getElementById('connectionFriendly');
    if(!el)return;
    el.textContent=navigator.onLine?'Online ✓':'Offline';
    el.classList.toggle('offline',!navigator.onLine);
  }

  function showUpdate(worker){
    waitingWorker=worker||waitingWorker;
    document.getElementById('appUpdateBanner')?.classList.remove('hidden');
  }

  window.addEventListener('beforeinstallprompt',e=>{
    e.preventDefault();
    installPrompt=e;
    document.getElementById('installAppBtn')?.classList.remove('hidden');
  });

  window.addEventListener('appinstalled',()=>{
    installPrompt=null;
    document.getElementById('installAppBtn')?.classList.add('hidden');
  });

  window.addEventListener('online',updateConnection);
  window.addEventListener('offline',updateConnection);

  window.addEventListener('DOMContentLoaded',async()=>{
    const version=document.getElementById('appVersionLabel');
    if(version)version.textContent='v'+VERSION;
    updateConnection();

    const reloadBtn=document.getElementById('reloadForUpdateBtn');
    reloadBtn?.addEventListener('click',()=>{
      if(waitingWorker)waitingWorker.postMessage({type:'SKIP_WAITING'});
      else location.reload();
    });

    if('serviceWorker' in navigator){
      try{
        const reg=await navigator.serviceWorker.register('./service-worker.js');
        if(reg.waiting)showUpdate(reg.waiting);

        reg.addEventListener('updatefound',()=>{
          const worker=reg.installing;
          if(!worker)return;
          worker.addEventListener('statechange',()=>{
            if(worker.state==='installed'&&navigator.serviceWorker.controller)showUpdate(worker);
          });
        });

        navigator.serviceWorker.addEventListener('controllerchange',()=>{
          if(sessionStorage.getItem('hmv2-reloading-update'))return;
          sessionStorage.setItem('hmv2-reloading-update','1');
          location.reload();
        });

        setInterval(()=>reg.update().catch(()=>{}),10*60*1000);
      }catch(err){console.error(err)}
    }

    const btn=document.getElementById('installAppBtn');
    btn?.addEventListener('click',async()=>{
      if(installPrompt){
        installPrompt.prompt();
        await installPrompt.userChoice;
        installPrompt=null;
        btn.classList.add('hidden');
        return;
      }
      const ua=navigator.userAgent.toLowerCase();
      if(/iphone|ipad|ipod/.test(ua)){
        alert('On iPhone/iPad: open this site in Safari, tap Share, then choose Add to Home Screen.');
      }else{
        alert('Open your browser menu and choose Install app or Add to Home screen.');
      }
    });
  });
})();
