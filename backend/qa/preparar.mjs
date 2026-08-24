export const BASE = process.env.QA_BASE ?? 'http://localhost:4000/api/v1';
export const ORIGEN = process.env.QA_ORIGEN ?? 'http://localhost:5173';

export const ADMIN = {
  usuario: process.env.QA_ADMIN_USUARIO ?? 'admin',
  password: process.env.QA_ADMIN_PASSWORD ?? '24112001Edgar'
};

export const CLAVE_QA = 'QaPrueba2026x';

export const PERFILES = [
  { usuario: 'qa.tecnico', nombre: 'QA Tecnico Primer Nivel', rol: 'tecnico_l1', sucursal: 0 },
  { usuario: 'qa.tecnico2', nombre: 'QA Tecnico Auxiliar', rol: 'tecnico_l1', sucursal: 0 },
  { usuario: 'qa.tecnico3', nombre: 'QA Tecnico Segundo Nivel', rol: 'tecnico_l2', sucursal: 0 },
  { usuario: 'qa.gerente', nombre: 'QA Gerencia', rol: 'gerencia', sucursal: 0 },
  { usuario: 'qa.cliente', nombre: 'QA Solicitante Central', rol: 'cliente', sucursal: 0 },
  { usuario: 'qa.cliente2', nombre: 'QA Solicitante Segunda', rol: 'cliente', sucursal: 1 },
  { usuario: 'qa.cliente3', nombre: 'QA Solicitante Tercera', rol: 'cliente', sucursal: 2 },
  { usuario: 'qa.cliente4', nombre: 'QA Solicitante Cuarta', rol: 'cliente', sucursal: 3 },
  { usuario: 'qa.bloqueo', nombre: 'QA Cuenta para la prueba de bloqueo', rol: 'cliente', sucursal: 0 }
];

export const entrar = async (usuario, password) => {
  const respuesta = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, password })
  });
  if (!respuesta.status || respuesta.status !== 200) {
    return { estado: respuesta.status, cookie: null, csrf: null, perfil: null };
  }
  const pares = respuesta.headers.getSetCookie().map((c) => c.split(';')[0]);
  return {
    estado: 200,
    cookie: pares.join('; '),
    csrf: pares.find((p) => p.startsWith('tickets_csrf='))?.split('=')[1],
    perfil: (await respuesta.json()).usuario
  };
};

export const pedirCon = (sesion) => async (ruta, opciones = {}) => {
  const cabeceras = { Cookie: sesion.cookie, 'X-CSRF-Token': sesion.csrf, Origin: ORIGEN };
  if (opciones.cuerpo) cabeceras['Content-Type'] = 'application/json';
  const respuesta = await fetch(BASE + ruta, {
    method: opciones.metodo ?? 'GET',
    headers: cabeceras,
    body: opciones.cuerpo ? JSON.stringify(opciones.cuerpo) : undefined
  });
  return { estado: respuesta.status, cuerpo: await respuesta.json().catch(() => ({})) };
};

export const prepararEntorno = async () => {
  const admin = await entrar(ADMIN.usuario, ADMIN.password);
  if (!admin.cookie) {
    throw new Error(`No fue posible entrar como ${ADMIN.usuario}. Revise la clave administradora.`);
  }
  const pedir = pedirCon(admin);

  const [roles, areas, sucursales, usuarios] = await Promise.all([
    pedir('/roles'),
    pedir('/areas'),
    pedir('/sucursales'),
    pedir('/usuarios?limite=200')
  ]);

  const rolPorNombre = Object.fromEntries((roles.cuerpo.datos ?? []).map((r) => [r.nombre, r.id]));
  const listaAreas = areas.cuerpo.datos ?? [];
  const listaSucursales = sucursales.cuerpo.datos ?? [];
  const existentes = new Set((usuarios.cuerpo.datos ?? []).map((u) => u.usuario));

  const areaTi = listaAreas.find((a) => a.nombre.includes('Tecnologias'))?.id ?? listaAreas[0]?.id;

  const sesiones = { admin };

  for (const perfil of PERFILES) {
    if (!existentes.has(perfil.usuario)) {
      const alta = await pedir('/usuarios', {
        metodo: 'POST',
        cuerpo: {
          nombre: perfil.nombre,
          usuario: perfil.usuario,
          password: CLAVE_QA,
          area_id: perfil.rol === 'cliente' ? (listaAreas[perfil.sucursal % listaAreas.length]?.id ?? areaTi) : areaTi,
          sucursal_id: listaSucursales[perfil.sucursal % listaSucursales.length]?.id ?? listaSucursales[0]?.id,
          rol_id: rolPorNombre[perfil.rol]
        }
      });
      if (alta.estado !== 201) {
        throw new Error(`No fue posible crear ${perfil.usuario}: ${alta.cuerpo.mensaje ?? alta.estado}`);
      }
    }
    sesiones[perfil.usuario] = await entrar(perfil.usuario, CLAVE_QA);
  }

  return { sesiones, pedir };
};
