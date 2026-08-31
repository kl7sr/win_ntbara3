import { useState, useEffect } from 'react';

const INSTALLED_KEY = 'win_ntbara3_pwa_installed';

// Global deferred prompt holder so any component can trigger the native browser install dialog
let globalDeferredPrompt: any = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    globalDeferredPrompt = e;
    window.dispatchEvent(new Event('pwa-prompt-ready'));
  });

  window.addEventListener('appinstalled', () => {
    localStorage.setItem(INSTALLED_KEY, 'true');
    globalDeferredPrompt = null;
    window.dispatchEvent(new Event('pwa-installed'));
  });
}

export function checkIsStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    (window.navigator as any).standalone === true ||
    window.location.search.includes('mode=standalone') ||
    document.referrer.includes('android-app://')
  );
}

export function usePwaInstall() {
  const [isStandalone, setIsStandalone] = useState<boolean>(checkIsStandalone());
  const [hasPrompt, setHasPrompt] = useState<boolean>(!!globalDeferredPrompt);

  useEffect(() => {
    const updateStandalone = () => setIsStandalone(checkIsStandalone());
    const onPromptReady = () => setHasPrompt(true);
    const onInstalled = () => {
      setIsStandalone(true);
      setHasPrompt(false);
    };

    updateStandalone();

    window.addEventListener('pwa-prompt-ready', onPromptReady);
    window.addEventListener('pwa-installed', onInstalled);

    return () => {
      window.removeEventListener('pwa-prompt-ready', onPromptReady);
      window.removeEventListener('pwa-installed', onInstalled);
    };
  }, []);

  const triggerInstall = async (onFallbackToGuide?: () => void) => {
    if (globalDeferredPrompt) {
      globalDeferredPrompt.prompt();
      const choice = await globalDeferredPrompt.userChoice;
      if (choice?.outcome === 'accepted') {
        localStorage.setItem(INSTALLED_KEY, 'true');
        setIsStandalone(true);
      }
      globalDeferredPrompt = null;
      setHasPrompt(false);
    } else {
      onFallbackToGuide?.();
    }
  };

  return {
    isStandalone,
    hasPrompt,
    triggerInstall,
  };
}
