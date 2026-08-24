const borrarCookiesLegibles = () => {
  for (const par of document.cookie.split(';')) {
    const nombre = par.split('=')[0]?.trim();
    if (!nombre) continue;
    for (const ruta of ['/', window.location.pathname]) {
      document.cookie = `${nombre}=; path=${ruta}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  }
};

export const limpiarCacheYCookies = async () => {
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch {
    /* el navegador puede tener el almacenamiento bloqueado */
  }

  borrarCookiesLegibles();

  if ('caches' in window) {
    try {
      const nombres = await caches.keys();
      await Promise.all(nombres.map((nombre) => caches.delete(nombre)));
    } catch {
      /* sin acceso a la cache del navegador */
    }
  }

  if ('serviceWorker' in navigator) {
    try {
      const registros = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registros.map((registro) => registro.unregister()));
    } catch {
      /* sin trabajadores de servicio registrados */
    }
  }
};
