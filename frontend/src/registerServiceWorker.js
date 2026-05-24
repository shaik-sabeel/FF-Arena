let deferredPrompt;

export function register() {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
        });
    });
  }

  // Listen for the custom install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    
    // Dispatch a custom event to notify React components
    const event = new CustomEvent('pwaInstallPromptReady', { detail: e });
    window.dispatchEvent(event);
    console.log('[PWA] App is installable. Event captured.');
  });

  window.addEventListener('appinstalled', (evt) => {
    console.log('[PWA] App was successfully installed to home screen.');
    deferredPrompt = null;
  });
}

export function getDeferredPrompt() {
  return deferredPrompt;
}

export function clearDeferredPrompt() {
  deferredPrompt = null;
}
