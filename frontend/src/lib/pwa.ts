const ADMITE = 'serviceWorker' in navigator;

const enContextoSeguro = () => window.isSecureContext;

export const registrarPwa = () => {
  if (!ADMITE || !enContextoSeguro() || import.meta.env.DEV) return;

  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').then((registro) => {
      registro.addEventListener('updatefound', () => {
        const entrante = registro.installing;
        if (!entrante) return;
        entrante.addEventListener('statechange', () => {
          if (entrante.state === 'installed' && navigator.serviceWorker.controller) {
            entrante.postMessage('saltar-espera');
          }
        });
      });
    }).catch(() => {
      /* sin trabajador de servicio la aplicacion funciona igual, solo no se instala */
    });
  });

  let recargando = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (recargando) return;
    recargando = true;
    window.location.reload();
  });
};

export const limpiarPwa = async () => {
  if (!ADMITE) return;
  const registros = await navigator.serviceWorker.getRegistrations().catch(() => []);
  await Promise.all(registros.map((registro) => registro.unregister()));
};
