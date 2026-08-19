
(() => {
  let installPrompt=null;
  window.addEventListener('beforeinstallprompt',e=>{
    e.preventDefault();
    installPrompt=e;
    document.getElementById('installAppBtn')?.classList.remove('hidden');
  });
  window.addEventListener('appinstalled',()=>{
    installPrompt=null;
    document.getElementById('installAppBtn')?.classList.add('hidden');
  });
  window.addEventListener('DOMContentLoaded',()=>{
    if('serviceWorker' in navigator){
      navigator.serviceWorker.register('./service-worker.js').catch(console.error);
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
