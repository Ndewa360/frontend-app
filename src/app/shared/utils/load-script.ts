const pending = new Map<string, Promise<void>>();

/**
 * Charge un script externe une seule fois, à la demande. Utilisé pour les SDK
 * qui ne servent qu'à une page (connexion Google) : ils étaient chargés par
 * `index.html` sur toutes les pages.
 */
export function loadScriptOnce(src: string): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve();
  let promise = pending.get(src);
  if (!promise) {
    promise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        pending.delete(src);
        script.remove();
        reject(new Error(`Script non chargé : ${src}`));
      };
      document.head.appendChild(script);
    });
    pending.set(src, promise);
  }
  return promise;
}
