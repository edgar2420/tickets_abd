import { prepararEntorno, pedirCon, ADMIN } from './preparar.mjs';

let fallos = 0;
const marca = (ok, detalle) => {
  if (!ok) fallos += 1;
  console.log(`${ok ? 'OK  ' : 'FALLA'} ${detalle}`);
};

const { sesiones } = await prepararEntorno();
const pedir = (usuario, ruta, opciones = {}) => pedirCon(sesiones[usuario])(ruta, opciones);

console.log('=== 1. CATALOGO DEL TICKET ===');
const catalogo = (await pedir('admin', '/tickets/catalogo')).cuerpo.datos;
marca(catalogo?.servicios?.length === 10, `servicios: ${catalogo?.servicios?.length} definidos`);
marca(catalogo?.estados?.join(' > ') === 'Nuevo > Asignado > En Proceso > En Espera > Resuelto > Cerrado',
  `estados: ${catalogo?.estados?.join(' > ')}`);
for (const [prioridad, objetivo] of Object.entries(catalogo?.objetivos ?? {})) {
  marca(Boolean(objetivo.texto && objetivo.horas),
    `${prioridad.padEnd(8)} objetivo ${objetivo.texto} (${objetivo.horas} h)`);
}

console.log('\n=== 2. NUMERACION SYS-ANIO-NUMERO ===');
const anio = new Date().getFullYear();
const primero = await pedir('qa.cliente', '/tickets', {
  metodo: 'POST',
  cuerpo: {
    titulo: 'QA - la impresora de Contabilidad no responde',
    descripcion: 'La impresora no toma los trabajos enviados desde ninguna maquina del area.',
    servicio: 'Soporte informatico',
    categoria: 'PC',
    ubicacion: 'Planta baja - Contabilidad',
    observaciones: 'Ya se reinicio la cola de impresion sin resultado.'
  }
});
const ticket = primero.cuerpo.datos;
marca(primero.estado === 201, `se registra el ticket (${primero.estado})`);
marca(ticket?.anio === anio && ticket?.numero >= 1,
  `numeracion por ano: SYS-${ticket?.anio}-${String(ticket?.numero).padStart(5, '0')}`);
marca(ticket?.estado === 'Nuevo', `nace en estado ${ticket?.estado}`);

const segundo = await pedir('qa.cliente2', '/tickets', {
  metodo: 'POST',
  cuerpo: {
    titulo: 'QA - camara del almacen sin grabacion',
    descripcion: 'La camara del porton no esta grabando desde el fin de semana.',
    servicio: 'CCTV', categoria: 'Camara', ubicacion: 'Almacen'
  }
});
marca(segundo.cuerpo.datos?.numero === ticket.numero + 1,
  `el correlativo avanza dentro del ano: ${ticket.numero} -> ${segundo.cuerpo.datos?.numero}`);

console.log('\n=== 3. LA PRIORIDAD LA DEFINE LA ADMINISTRACION ===');
const intento = await pedir('qa.cliente', '/tickets', {
  metodo: 'POST',
  cuerpo: {
    titulo: 'QA - el solicitante intenta marcarlo como critico',
    descripcion: 'Se verifica que la prioridad enviada por un solicitante no se tome en cuenta.',
    servicio: 'Soporte informatico', categoria: 'PC',
    prioridad: 'Critica'
  }
});
marca(intento.cuerpo.datos?.prioridad === 'Media',
  `la prioridad que manda el solicitante se ignora: quedo en ${intento.cuerpo.datos?.prioridad}`);
marca(intento.cuerpo.datos?.prioridad_por_nombre === null,
  'no consta que nadie la haya definido todavia');

for (const cuenta of ['qa.cliente', 'qa.gerente', 'qa.tecnico', 'qa.tecnico3']) {
  const negado = await pedir(cuenta, `/tickets/${ticket.id}/prioridad`, {
    metodo: 'PUT', cuerpo: { prioridad: 'Critica' }
  });
  marca(negado.estado === 403, `${cuenta.padEnd(12)} no puede cambiar la prioridad (${negado.estado})`);
}

const altaTecnico = await pedir('qa.tecnico', '/tickets', {
  metodo: 'POST',
  cuerpo: {
    titulo: 'QA - un tecnico tampoco fija la prioridad al registrar',
    descripcion: 'Se verifica que ni el personal tecnico pueda nacer un ticket con prioridad propia.',
    servicio: 'Soporte informatico', categoria: 'PC', prioridad: 'Critica'
  }
});
marca(altaTecnico.cuerpo.datos?.prioridad === 'Media',
  `al tecnico tambien se le ignora la prioridad enviada: quedo en ${altaTecnico.cuerpo.datos?.prioridad}`);

const definida = await pedir('admin', `/tickets/${ticket.id}/prioridad`, {
  metodo: 'PUT', cuerpo: { prioridad: 'Critica', motivo: 'Contabilidad no puede emitir comprobantes.' }
});
marca(definida.cuerpo.datos?.prioridad === 'Critica',
  `la administracion la fija en ${definida.cuerpo.datos?.prioridad}`);
marca(Boolean(definida.cuerpo.datos?.prioridad_por_nombre),
  `consta quien la definio: ${definida.cuerpo.datos?.prioridad_por_nombre}`);
marca(Boolean(definida.cuerpo.datos?.fecha_objetivo), 'queda fijado el objetivo de atencion');

console.log('\n=== 4. LOS SEIS ESTADOS ===');
const tomado = await pedir('qa.tecnico', `/tickets/${ticket.id}/tomar`, { metodo: 'PUT' });
marca(tomado.cuerpo.datos?.estado === 'Asignado', `Nuevo -> ${tomado.cuerpo.datos?.estado}`);

const saltar = await pedir('qa.tecnico', `/tickets/${ticket.id}/cerrar`, { metodo: 'PUT' });
marca(saltar.estado === 409, `no se puede saltar de Asignado a Cerrado (${saltar.estado})`);

const iniciado = await pedir('qa.tecnico', `/tickets/${ticket.id}/iniciar`, { metodo: 'PUT' });
marca(iniciado.cuerpo.datos?.estado === 'En Proceso', `Asignado -> ${iniciado.cuerpo.datos?.estado}`);
marca(Boolean(iniciado.cuerpo.datos?.fecha_inicio), 'queda la hora en que se empezo a trabajar');

const sinMotivo = await pedir('qa.tecnico', `/tickets/${ticket.id}/espera`, {
  metodo: 'PUT', cuerpo: { motivo_espera: 'corto' }
});
marca(sinMotivo.estado === 400, `no se puede dejar en espera sin explicar (${sinMotivo.estado})`);

const enEspera = await pedir('qa.tecnico', `/tickets/${ticket.id}/espera`, {
  metodo: 'PUT', cuerpo: { motivo_espera: 'A la espera del toner que debe entregar el proveedor.' }
});
marca(enEspera.cuerpo.datos?.estado === 'En Espera', `En Proceso -> ${enEspera.cuerpo.datos?.estado}`);
marca(Boolean(enEspera.cuerpo.datos?.motivo_espera), `con motivo: ${enEspera.cuerpo.datos?.motivo_espera}`);

const reanudado = await pedir('qa.tecnico', `/tickets/${ticket.id}/iniciar`, { metodo: 'PUT' });
marca(reanudado.cuerpo.datos?.estado === 'En Proceso', `En Espera -> ${reanudado.cuerpo.datos?.estado}`);
marca(reanudado.cuerpo.datos?.motivo_espera === null, 'al reanudar se limpia el motivo de espera');

console.log('\n=== 5. TIEMPO EMPLEADO Y ACTIVO RELACIONADO ===');
const equipos = await pedir('admin', '/equipos');
let equipoId = equipos.cuerpo.datos?.[0]?.id;
if (!equipoId) {
  const sugerido = await pedir('admin', '/equipos/siguiente-codigo?tipo=PC&ubicacion=QA');
  const alta = await pedir('admin', '/equipos', {
    metodo: 'POST',
    cuerpo: {
      codigo: sugerido.cuerpo.datos.codigo, nombre_equipo: 'QA-EQUIPO-TICKET',
      tipo: 'PC', estado: 'Operativo', activo: true
    }
  });
  equipoId = alta.cuerpo.datos?.id;
}

const conActivo = await pedir('qa.cliente', '/tickets', {
  metodo: 'POST',
  cuerpo: {
    titulo: 'QA - ticket vinculado a un activo del parque',
    descripcion: 'Se verifica que el ticket pueda apuntar al equipo sobre el que se trabaja.',
    servicio: 'Mantenimiento', categoria: 'PC',
    equipo_id: equipoId
  }
});
marca(Boolean(conActivo.cuerpo.datos?.equipo_codigo),
  `el ticket queda ligado al activo ${conActivo.cuerpo.datos?.equipo_codigo}`);

const activoInexistente = await pedir('qa.cliente', '/tickets', {
  metodo: 'POST',
  cuerpo: {
    titulo: 'QA - ticket con un activo que no existe',
    descripcion: 'Se verifica que no se pueda apuntar a un activo inexistente.',
    servicio: 'Soporte informatico', categoria: 'PC', equipo_id: 999999
  }
});
marca(activoInexistente.estado === 400, `un activo inexistente se rechaza (${activoInexistente.estado})`);

const resuelto = await pedir('qa.tecnico', `/tickets/${ticket.id}/resolver`, {
  metodo: 'PUT',
  cuerpo: {
    solucion_detalle: 'Se reinstalo el controlador de impresion y se purgo la cola de trabajos.',
    minutos_empleados: 90,
    observaciones: 'Conviene programar el reemplazo del toner antes de fin de mes.'
  }
});
marca(resuelto.cuerpo.datos?.estado === 'Resuelto', `En Proceso -> ${resuelto.cuerpo.datos?.estado}`);
marca(resuelto.cuerpo.datos?.minutos_empleados === 90,
  `queda el tiempo empleado: ${resuelto.cuerpo.datos?.minutos_empleados} minutos`);
marca(Boolean(resuelto.cuerpo.datos?.observaciones), 'quedan las observaciones');

const cerrado = await pedir('qa.cliente', `/tickets/${ticket.id}/cerrar`, { metodo: 'PUT' });
marca(cerrado.cuerpo.datos?.estado === 'Cerrado', `Resuelto -> ${cerrado.cuerpo.datos?.estado}`);

console.log('\n=== 6. FILTROS NUEVOS ===');
const porServicio = await pedir('admin', '/tickets?servicio=CCTV');
marca((porServicio.cuerpo.datos ?? []).every((t) => t.servicio === 'CCTV'),
  `filtra por servicio (${porServicio.cuerpo.datos?.length} de CCTV)`);

const vencidos = await pedir('admin', '/tickets?vencidos=true');
marca(vencidos.estado === 200, `filtra los vencidos (${vencidos.cuerpo.datos?.length})`);

console.log('\n=== 7. INDICADORES DEL JEFE DE SISTEMAS ===');
const tablero = (await pedir('admin', '/tickets/tablero')).cuerpo.datos;
const ESPERADOS = [
  'nuevos', 'asignados', 'en_proceso', 'en_espera', 'resueltos', 'cerrados',
  'criticos', 'altos', 'vencidos', 'mantenimientos', 'pendientes_ibs'
];
for (const clave of ESPERADOS) {
  marca(typeof tablero?.resumen?.[clave] === 'number',
    `${clave.padEnd(15)} ${tablero?.resumen?.[clave]}`);
}
marca(Array.isArray(tablero?.graficos?.porResponsable), 'desglose por responsable');
marca(Array.isArray(tablero?.graficos?.porUbicacion), 'desglose por ubicacion');
marca(Array.isArray(tablero?.graficos?.porServicio), 'desglose por servicio');

console.log('\n========================================');
console.log(fallos === 0 ? 'MODELO DEL TICKET: TODAS LAS PRUEBAS PASARON' : `MODELO DEL TICKET: ${fallos} FALLA(S)`);
console.log('========================================');
process.exit(fallos === 0 ? 0 : 1);
