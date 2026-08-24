import { prepararEntorno, pedirCon, entrar, ADMIN, CLAVE_QA, BASE, ORIGEN } from './preparar.mjs';

let fallos = 0;
const marca = (ok, detalle) => {
  if (!ok) fallos += 1;
  console.log(`${ok ? 'OK  ' : 'FALLA'} ${detalle}`);
};

const { sesiones } = await prepararEntorno();
const pedir = (usuario, ruta, opciones = {}) => pedirCon(sesiones[usuario])(ruta, opciones);

const PETICION = {
  titulo: 'QA - consolidar el cierre mensual de las sucursales',
  tipo: 'Automatizacion',
  problema: 'Cada cierre de mes se pierden dos dias juntando planillas de las sucursales y siempre falta alguna.',
  situacion_actual: 'Cada sucursal manda su planilla por correo y contabilidad las pega a mano en una sola.',
  propuesta: 'Que cada sucursal cargue sus numeros en el sistema y el consolidado se arme solo al cerrar el mes.',
  beneficio: 'Se ahorran dos dias de trabajo por mes y se elimina el error de copiar y pegar a mano.',
  personas_afectadas: 8,
  frecuencia: 'Mensual',
  urgencia: 'Alta',
  sistemas_actuales: 'Planillas de Excel enviadas por correo'
};

console.log('=== 1. QUIEN PUEDE PROPONER ===');
const alta = await pedir('qa.cliente', '/proyectos', { metodo: 'POST', cuerpo: PETICION });
marca(alta.estado === 201, `un solicitante registra una peticion (${alta.estado})`);
const id = alta.cuerpo.datos?.id;
marca(alta.cuerpo.datos?.estado === 'Recibida', `la peticion nace en estado ${alta.cuerpo.datos?.estado}`);

const propias = await pedir('qa.cliente2', '/proyectos');
const ajenas = (propias.cuerpo.datos ?? []).filter((p) => p.id === id);
marca(ajenas.length === 0, 'un solicitante no ve las peticiones de otro');

const ajena = await pedir('qa.cliente2', `/proyectos/${id}`);
marca(ajena.estado === 403, `tampoco puede abrirla directamente (${ajena.estado})`);

console.log('\n=== 2. LA PETICION DEBE ESTAR EXPLICADA ===');
const vacia = await pedir('qa.cliente', '/proyectos', {
  metodo: 'POST',
  cuerpo: { ...PETICION, problema: 'no anda', situacion_actual: 'nada', propuesta: 'arreglenlo', beneficio: 'mejor' }
});
marca(vacia.estado === 400, `se rechaza una peticion sin explicar (${vacia.estado})`);

const sinTitulo = await pedir('qa.cliente', '/proyectos', { metodo: 'POST', cuerpo: { ...PETICION, titulo: 'Corto' } });
marca(sinTitulo.estado === 400, `se rechaza un titulo demasiado breve (${sinTitulo.estado})`);

const conEspacios = await pedir('qa.cliente', '/proyectos', {
  metodo: 'POST', cuerpo: { ...PETICION, titulo: `   ${PETICION.titulo}   ` }
});
marca(conEspacios.estado === 201, 'los espacios sobrantes del titulo se recortan solos');
marca(conEspacios.cuerpo.datos?.titulo === PETICION.titulo,
  `el titulo queda limpio: "${conEspacios.cuerpo.datos?.titulo?.slice(0, 40)}..."`);

console.log('\n=== 3. CIRCUITO DE LA PETICION ===');
const sinPermiso = await pedir('qa.cliente', `/proyectos/${id}/evaluar`, {
  metodo: 'PUT', cuerpo: { evaluacion_ti: 'Intento sin permiso alguno.', esfuerzo_estimado: 'Bajo', valor_estimado: 'Alto' }
});
marca(sinPermiso.estado === 403, `un solicitante no puede evaluar (${sinPermiso.estado})`);

const aprobarAntes = await pedir('admin', `/proyectos/${id}/aprobar`, { metodo: 'PUT', cuerpo: {} });
marca(aprobarAntes.estado === 409, `no se aprueba antes de evaluar (${aprobarAntes.estado})`);

const evaluada = await pedir('qa.tecnico3', `/proyectos/${id}/evaluar`, {
  metodo: 'PUT',
  cuerpo: {
    evaluacion_ti: 'Viable con el modulo de reportes existente. Requiere un formulario de carga por sucursal.',
    esfuerzo_estimado: 'Medio',
    valor_estimado: 'Alto'
  }
});
marca(evaluada.estado === 200 && evaluada.cuerpo.datos?.estado === 'En evaluacion',
  `el tecnico de segundo nivel la evalua (${evaluada.cuerpo.datos?.estado})`);

const aprobada = await pedir('admin', `/proyectos/${id}/aprobar`, {
  metodo: 'PUT', cuerpo: { observacion_aprobacion: 'Entra en la cartera del trimestre.' }
});
marca(aprobada.estado === 200 && aprobada.cuerpo.datos?.estado === 'Aprobada',
  `se aprueba e incorpora a la cartera (${aprobada.cuerpo.datos?.estado})`);

const enCurso = await pedir('admin', `/proyectos/${id}/avance`, {
  metodo: 'PUT', cuerpo: { estado: 'En desarrollo', avance: 40 }
});
marca(enCurso.cuerpo.datos?.avance === 40, `se registra el avance (${enCurso.cuerpo.datos?.avance}%)`);
marca(Boolean(enCurso.cuerpo.datos?.fecha_inicio), 'queda la fecha en que empezo el desarrollo');

const terminada = await pedir('admin', `/proyectos/${id}/avance`, {
  metodo: 'PUT', cuerpo: { estado: 'Implementada', avance: 80 }
});
marca(terminada.cuerpo.datos?.estado === 'Implementada' && terminada.cuerpo.datos?.avance === 100,
  `al implementarla el avance queda en ${terminada.cuerpo.datos?.avance}%`);
marca(Boolean(terminada.cuerpo.datos?.fecha_entrega), 'queda la fecha de entrega');

const cerrada = await pedir('admin', `/proyectos/${id}/evaluar`, {
  metodo: 'PUT', cuerpo: { evaluacion_ti: 'Intento sobre una peticion ya cerrada.', esfuerzo_estimado: 'Bajo', valor_estimado: 'Bajo' }
});
marca(cerrada.estado === 409, `una peticion cerrada ya no admite cambios (${cerrada.estado})`);

console.log('\n=== 4. RECHAZO ===');
const paraRechazar = await pedir('qa.cliente3', '/proyectos', {
  metodo: 'POST', cuerpo: { ...PETICION, titulo: 'QA - peticion que sera rechazada por costo' }
});
const rechazo = await pedir('qa.tecnico3', `/proyectos/${paraRechazar.cuerpo.datos.id}/rechazar`, {
  metodo: 'PUT', cuerpo: { motivo_rechazo: 'El costo supera el beneficio esperado para este ciclo.' }
});
marca(rechazo.estado === 200 && rechazo.cuerpo.datos?.estado === 'Rechazada',
  `se puede no aprobar con motivo (${rechazo.cuerpo.datos?.estado})`);
marca(Boolean(rechazo.cuerpo.datos?.rechazado_por_nombre),
  `consta quien no la aprobo: ${rechazo.cuerpo.datos?.rechazado_por_nombre}`);

const sinMotivo = await pedir('qa.tecnico3', `/proyectos/${id}/rechazar`, { metodo: 'PUT', cuerpo: { motivo_rechazo: 'no' } });
marca(sinMotivo.estado === 400, `no se puede rechazar sin explicar (${sinMotivo.estado})`);

console.log('\n=== 5. ALCANCE Y DOCUMENTOS ===');
const resumen = await pedir('admin', '/proyectos/resumen');
marca(resumen.estado === 200 && typeof resumen.cuerpo.datos?.total === 'number',
  `resumen: ${resumen.cuerpo.datos?.total} peticiones, ${resumen.cuerpo.datos?.implementadas} implementadas`);

const gerencia = await pedir('qa.gerente', '/proyectos');
marca(gerencia.estado === 200, `Gerencia consulta la cartera completa (${gerencia.cuerpo.datos?.length} peticiones)`);

const ficha = await fetch(`${BASE}/proyectos/${id}/pdf`, { headers: { Cookie: sesiones.admin.cookie, Origin: ORIGEN } });
const bytesFicha = ficha.ok ? (await ficha.arrayBuffer()).byteLength : 0;
marca(ficha.ok && bytesFicha > 1500, `la ficha en PDF se descarga (${ficha.status}, ${bytesFicha} bytes)`);

const cartera = await fetch(`${BASE}/proyectos/reporte/pdf`, { headers: { Cookie: sesiones.admin.cookie, Origin: ORIGEN } });
const bytesCartera = cartera.ok ? (await cartera.arrayBuffer()).byteLength : 0;
marca(cartera.ok && bytesCartera > 1500, `el reporte de la cartera se descarga (${cartera.status}, ${bytesCartera} bytes)`);

console.log('\n=== 6. POLITICA DE CONTRASENAS ===');
const CASOS = [
  ['Corta12', 'menos de diez caracteres'],
  ['con espacio 12', 'contiene espacios'],
  ['solamenteletras', 'sin numeros'],
  ['12345678901', 'sin letras'],
  ['1234567890', 'demasiado previsible']
];

for (const [clave, caso] of CASOS) {
  const intento = await pedir('qa.cliente', '/auth/cambiar-password', {
    metodo: 'POST', cuerpo: { passwordActual: CLAVE_QA, passwordNueva: clave }
  });
  marca(intento.estado === 400, `${caso.padEnd(28)} rechazada (${intento.estado})`);
}

const igual = await pedir('qa.cliente', '/auth/cambiar-password', {
  metodo: 'POST', cuerpo: { passwordActual: CLAVE_QA, passwordNueva: CLAVE_QA }
});
marca(igual.estado === 400, `repetir la clave actual se rechaza (${igual.estado})`);

const CLAVE_NUEVA = 'QaCambiada2026z';
const cambio = await pedir('qa.cliente', '/auth/cambiar-password', {
  metodo: 'POST', cuerpo: { passwordActual: CLAVE_QA, passwordNueva: CLAVE_NUEVA }
});
marca(cambio.estado === 200, `una clave que cumple todo se acepta (${cambio.estado})`);

const conNueva = await entrar('qa.cliente', CLAVE_NUEVA);
marca(conNueva.estado === 200, `el usuario entra con la clave nueva (${conNueva.estado})`);
const conVieja = await entrar('qa.cliente', CLAVE_QA);
marca(conVieja.estado === 401, `la clave anterior deja de servir (${conVieja.estado})`);

const reinicio = await pedir('admin', `/usuarios/${conNueva.perfil.id}/password`, {
  metodo: 'PUT', cuerpo: { password: CLAVE_QA }
});
marca(reinicio.estado === 200, `un administrador restablece la clave (${reinicio.estado})`);
const restablecida = await entrar('qa.cliente', CLAVE_QA);
marca(restablecida.estado === 200, 'el usuario vuelve a entrar con la clave restablecida');

const reinicioAjeno = await pedir('qa.cliente2', `/usuarios/${conNueva.perfil.id}/password`, {
  metodo: 'PUT', cuerpo: { password: 'OtraClave2026x' }
});
marca(reinicioAjeno.estado === 403, `un usuario comun no restablece claves ajenas (${reinicioAjeno.estado})`);

console.log('\n=== 7. LA ENTRADA NO ALTERA LAS CONSULTAS ===');
const INYECCIONES = [
  "'; DROP TABLE tickets; --",
  "' OR '1'='1",
  "1; DELETE FROM usuarios WHERE 1=1; --",
  "admin'--",
  "' UNION SELECT password_hash FROM usuarios --"
];

for (const carga of INYECCIONES) {
  const busqueda = await pedir('admin', `/proyectos?busqueda=${encodeURIComponent(carga)}`);
  const usuarios = await pedir('admin', `/usuarios?busqueda=${encodeURIComponent(carga)}`);
  marca(busqueda.estado === 200 && usuarios.estado === 200,
    `${carga.slice(0, 34).padEnd(36)} se trata como texto (${busqueda.estado}/${usuarios.estado})`);
}

const siguenLasTablas = await pedir('admin', '/tickets?limite=1');
marca(siguenLasTablas.estado === 200, 'las tablas siguen en pie despues de los intentos');

const login = await entrar("admin'--", 'lo-que-sea');
marca(login.estado === 400,
  `un nombre de usuario con comilla se rechaza antes de llegar a la consulta (${login.estado})`);

const conEspaciosUsuario = await entrar('  ADMIN  ', 'lo-que-sea');
marca(conEspaciosUsuario.estado === 401,
  `el nombre de usuario se recorta y normaliza antes de buscarlo (${conEspaciosUsuario.estado})`);

console.log('\n========================================');
console.log(fallos === 0 ? 'PROYECTOS Y CLAVES: TODAS LAS PRUEBAS PASARON' : `PROYECTOS Y CLAVES: ${fallos} FALLA(S)`);
console.log('========================================');
process.exit(fallos === 0 ? 0 : 1);
