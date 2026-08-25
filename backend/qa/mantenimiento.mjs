import { prepararEntorno, pedirCon } from './preparar.mjs';

let fallos = 0;
const marca = (ok, detalle) => {
  if (!ok) fallos += 1;
  console.log(`${ok ? 'OK  ' : 'FALLA'} ${detalle}`);
};

const { sesiones } = await prepararEntorno();
const pedir = (usuario, ruta, opciones = {}) => pedirCon(sesiones[usuario])(ruta, opciones);

const fechaTexto = (dias) => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  return fecha.toISOString().slice(0, 10);
};

console.log('=== 1. QUIEN PUEDE VER EL PLAN ===');
const negado = await pedir('qa.cliente', '/mantenimiento');
marca(negado.estado === 403, `un solicitante no accede al plan (${negado.estado})`);

const visto = await pedir('qa.tecnico', '/mantenimiento');
marca(visto.estado === 200, `el personal tecnico si accede (${visto.estado})`);

console.log('\n=== 2. UN EQUIPO ENTRA AL PLAN ===');
const sugerido = await pedir('admin', '/equipos/siguiente-codigo?tipo=PC&ubicacion=QA');
const alta = await pedir('admin', '/equipos', {
  metodo: 'POST',
  cuerpo: {
    codigo: sugerido.cuerpo.datos.codigo,
    nombre_equipo: 'QA-EQUIPO-MANTENIMIENTO',
    tipo: 'PC', estado: 'Operativo', activo: true
  }
});
const equipoId = alta.cuerpo.datos?.id;
marca(Boolean(equipoId), `se registra el equipo de prueba ${sugerido.cuerpo.datos.codigo}`);

const sinPermiso = await pedir('qa.cliente', `/mantenimiento/${equipoId}/plan`, {
  metodo: 'PUT', cuerpo: { frecuencia_mantenimiento: 'Mensual' }
});
marca(sinPermiso.estado === 403, `un solicitante no fija la frecuencia (${sinPermiso.estado})`);

const vencido = await pedir('admin', `/mantenimiento/${equipoId}/plan`, {
  metodo: 'PUT',
  cuerpo: { frecuencia_mantenimiento: 'Trimestral', ultimo_mantenimiento: fechaTexto(-200) }
});
marca(vencido.cuerpo.datos?.frecuencia_mantenimiento === 'Trimestral',
  `queda con frecuencia ${vencido.cuerpo.datos?.frecuencia_mantenimiento}`);
marca(vencido.cuerpo.datos?.situacion === 'Vencido',
  `con el ultimo hace 200 dias la situacion es ${vencido.cuerpo.datos?.situacion}`);
marca(Boolean(vencido.cuerpo.datos?.proximo_mantenimiento),
  `se calcula el proximo: ${vencido.cuerpo.datos?.proximo_mantenimiento?.slice(0, 10)}`);

console.log('\n=== 3. LAS SITUACIONES SE CALCULAN SOLAS ===');
const casos = [
  { dias: -10, frecuencia: 'Anual', esperada: 'Al dia' },
  { dias: -350, frecuencia: 'Anual', esperada: 'Por vencer' },
  { dias: -400, frecuencia: 'Anual', esperada: 'Vencido' }
];
for (const caso of casos) {
  const r = await pedir('admin', `/mantenimiento/${equipoId}/plan`, {
    metodo: 'PUT',
    cuerpo: { frecuencia_mantenimiento: caso.frecuencia, ultimo_mantenimiento: fechaTexto(caso.dias) }
  });
  marca(r.cuerpo.datos?.situacion === caso.esperada,
    `ultimo hace ${-caso.dias} dias con plan ${caso.frecuencia}: ${r.cuerpo.datos?.situacion}`);
}

console.log('\n=== 4. EL TICKET DE MANTENIMIENTO ===');
const ticket = await pedir('admin', `/mantenimiento/${equipoId}/ticket`, { metodo: 'POST' });
marca(ticket.estado === 201, `se genera el ticket (${ticket.estado})`);
marca(ticket.cuerpo.datos?.servicio === 'Mantenimiento',
  `queda con el servicio ${ticket.cuerpo.datos?.servicio}`);
marca(ticket.cuerpo.datos?.equipo_id === equipoId,
  `queda ligado al activo ${ticket.cuerpo.datos?.equipo_codigo}`);
marca(ticket.cuerpo.datos?.estado === 'Nuevo', `nace en estado ${ticket.cuerpo.datos?.estado}`);

console.log('\n=== 5. EL MANTENIMIENTO REALIZADO ===');
const registro = await pedir('admin', `/mantenimiento/${equipoId}/registrar`, {
  metodo: 'POST',
  cuerpo: {
    fecha: fechaTexto(0),
    observaciones: 'Limpieza interna y revision de ventiladores.',
    ticket_id: ticket.cuerpo.datos?.id
  }
});
marca(registro.estado === 201, `se registra lo realizado (${registro.estado})`);
marca(registro.cuerpo.datos?.situacion === 'Al dia',
  `tras registrarlo la situacion pasa a ${registro.cuerpo.datos?.situacion}`);
marca(registro.cuerpo.datos?.realizados >= 1,
  `lleva ${registro.cuerpo.datos?.realizados} mantenimiento(s)`);

const historial = await pedir('qa.tecnico', `/mantenimiento/${equipoId}/historial`);
marca((historial.cuerpo.datos?.historial ?? []).length >= 1,
  `el historial guarda ${historial.cuerpo.datos?.historial?.length} registro(s)`);
marca(Boolean(historial.cuerpo.datos?.historial?.[0]?.realizado_por_nombre),
  `consta quien lo hizo: ${historial.cuerpo.datos?.historial?.[0]?.realizado_por_nombre}`);

console.log('\n=== 6. EL RESUMEN ===');
const resumen = await pedir('admin', '/mantenimiento/resumen');
for (const clave of ['con_plan', 'vencidos', 'por_vencer', 'al_dia', 'sin_registro', 'sin_plan']) {
  marca(typeof resumen.cuerpo.datos?.[clave] === 'number',
    `${clave.padEnd(14)} ${resumen.cuerpo.datos?.[clave]}`);
}

console.log('\n=== 7. FILTROS ===');
const porSituacion = await pedir('admin', '/mantenimiento?situacion=Al dia');
marca((porSituacion.cuerpo.datos ?? []).every((e) => e.situacion === 'Al dia'),
  `filtra por situacion (${porSituacion.cuerpo.datos?.length} al dia)`);

const porFrecuencia = await pedir('admin', '/mantenimiento?frecuencia=Anual');
marca((porFrecuencia.cuerpo.datos ?? []).every((e) => e.frecuencia_mantenimiento === 'Anual'),
  `filtra por frecuencia (${porFrecuencia.cuerpo.datos?.length} anuales)`);

console.log('\n=== 8. RETIRO DEL PLAN ===');
const retirado = await pedir('admin', `/mantenimiento/${equipoId}/plan`, {
  metodo: 'PUT', cuerpo: { frecuencia_mantenimiento: null }
});
marca(retirado.estado === 200, `se retira del plan (${retirado.estado})`);
const tras = await pedir('admin', '/mantenimiento');
marca(!(tras.cuerpo.datos ?? []).some((e) => e.id === equipoId),
  'el equipo retirado deja de figurar en el plan');

console.log('\n========================================');
console.log(fallos === 0 ? 'MANTENIMIENTO PREVENTIVO: TODAS LAS PRUEBAS PASARON' : `MANTENIMIENTO PREVENTIVO: ${fallos} FALLA(S)`);
console.log('========================================');
process.exit(fallos === 0 ? 0 : 1);
