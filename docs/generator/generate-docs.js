import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DocumentoPDF, PALETA } from '../../backend/src/services/pdf/documento.js';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(aqui, '../..');
const salida = path.join(raiz, 'docs', 'pdf', 'Documentacion-Tecnica-Sistema-Tickets.pdf');

const leerSql = async (archivo) => {
  const contenido = await readFile(path.join(raiz, 'db', archivo), 'utf8');
  return contenido
    .split('\n')
    .filter((linea) => !linea.startsWith('-- ====') && !linea.startsWith('-- Autor'))
    .join('\n')
    .trim();
};

const PERMISOS = [
  { modulo: 'TICKETS', codigo: 'tickets.crear', descripcion: 'Permite crear nuevas solicitudes de soporte.' },
  { modulo: 'TICKETS', codigo: 'tickets.ver_propios', descripcion: 'Permite visualizar los tickets creados por el propio usuario.' },
  { modulo: 'TICKETS', codigo: 'tickets.ver_todos', descripcion: 'Permite visualizar el listado completo de tickets del sistema.' },
  { modulo: 'TICKETS', codigo: 'tickets.responder', descripcion: 'Permite asignarse un ticket y cambiar su estado a En Proceso.' },
  { modulo: 'TICKETS', codigo: 'tickets.resolver', descripcion: 'Permite cerrar/resolver un ticket e ingresar la solucion tecnica.' },
  { modulo: 'ADMIN', codigo: 'admin.usuarios', descripcion: 'Gestion CRUD de usuarios (crear, editar, activar/desactivar).' },
  { modulo: 'ADMIN', codigo: 'admin.roles', descripcion: 'Gestion CRUD de roles y matriz de permisos.' },
  { modulo: 'ADMIN', codigo: 'admin.areas', descripcion: 'Gestion del catalogo de areas de la empresa.' },
  { modulo: 'ADMIN', codigo: 'admin.categorias', descripcion: 'Gestion del catalogo de categorias de tickets.' },
  { modulo: 'ADMIN', codigo: 'admin.sucursales', descripcion: 'Gestion del catalogo de sucursales de la empresa.' },
  { modulo: 'REPORTES', codigo: 'reportes.ver', descripcion: 'Permite consultar el tablero de indicadores y reportes.' },
  { modulo: 'REPORTES', codigo: 'reportes.exportar', descripcion: 'Permite exportar reportes y documentacion en formato PDF.' },
  { modulo: 'INVENTARIO', codigo: 'inventario.ver', descripcion: 'Consultar el catalogo de articulos y el kardex de movimientos.' },
  { modulo: 'INVENTARIO', codigo: 'inventario.articulos', descripcion: 'Gestion CRUD de los articulos del inventario.' },
  { modulo: 'INVENTARIO', codigo: 'inventario.movimientos', descripcion: 'Registrar entradas y salidas de inventario.' },
  { modulo: 'EQUIPOS', codigo: 'equipos.ver', descripcion: 'Consultar el parque de equipos y sus caracteristicas.' },
  { modulo: 'EQUIPOS', codigo: 'equipos.gestionar', descripcion: 'Alta, edicion y baja de equipos y su asignacion.' },
  { modulo: 'EQUIPOS', codigo: 'equipos.credenciales', descripcion: 'Revelar la contrasena de acceso remoto de un equipo.' },
  { modulo: 'COMPRAS', codigo: 'compras.solicitar', descripcion: 'Registrar solicitudes de compra de equipos.' },
  { modulo: 'COMPRAS', codigo: 'compras.ver_todas', descripcion: 'Consultar todas las solicitudes de compra.' },
  { modulo: 'COMPRAS', codigo: 'compras.revisar', descripcion: 'Revisar la viabilidad tecnica y cotizar la solicitud.' },
  { modulo: 'COMPRAS', codigo: 'compras.aprobar', descripcion: 'Aprobar o rechazar la solicitud desde Gerencia.' },
  { modulo: 'COMPRAS', codigo: 'compras.gestionar', descripcion: 'Registrar la compra ejecutada y la entrega.' }
];

const ENDPOINTS = [
  { metodo: 'POST', ruta: '/auth/login', permiso: 'Publico', descripcion: 'Autenticacion y emision del token JWT' },
  { metodo: 'GET', ruta: '/auth/perfil', permiso: 'Autenticado', descripcion: 'Perfil, rol y permisos vigentes' },
  { metodo: 'POST', ruta: '/auth/cambiar-password', permiso: 'Autenticado', descripcion: 'Cambio de contrasena propia' },
  { metodo: 'GET', ruta: '/tickets', permiso: 'tickets.ver_propios / ver_todos', descripcion: 'Listado con filtros y alcance por permiso' },
  { metodo: 'GET', ruta: '/tickets/tablero', permiso: 'tickets.ver_propios / ver_todos', descripcion: 'Indicadores y distribuciones' },
  { metodo: 'POST', ruta: '/tickets', permiso: 'tickets.crear', descripcion: 'Apertura de un ticket (estado Abierto)' },
  { metodo: 'GET', ruta: '/tickets/:id', permiso: 'tickets.ver_propios / ver_todos', descripcion: 'Detalle con bitacora de acciones' },
  { metodo: 'PUT', ruta: '/tickets/:id/tomar', permiso: 'tickets.responder', descripcion: 'Autoasignacion y paso a En Proceso' },
  { metodo: 'PUT', ruta: '/tickets/:id/asignar', permiso: 'tickets.responder', descripcion: 'Asignacion manual a otro tecnico' },
  { metodo: 'PUT', ruta: '/tickets/:id/resolver', permiso: 'tickets.resolver', descripcion: 'Registro de la solucion tecnica' },
  { metodo: 'PUT', ruta: '/tickets/:id/cerrar', permiso: 'Solicitante o mesa de ayuda', descripcion: 'Cierre conforme del ticket' },
  { metodo: 'GET', ruta: '/tickets/:id/pdf', permiso: 'tickets.ver_propios / ver_todos', descripcion: 'Acta PDF individual del ticket' },
  { metodo: 'GET', ruta: '/tickets/reporte/pdf', permiso: 'reportes.exportar', descripcion: 'Reporte consolidado en PDF' },
  { metodo: 'GET', ruta: '/tickets/:id/comentarios', permiso: 'Participante del ticket', descripcion: 'Conversacion del ticket' },
  { metodo: 'POST', ruta: '/tickets/:id/comentarios', permiso: 'Participante del ticket', descripcion: 'Mensaje con hasta cinco adjuntos' },
  { metodo: 'GET', ruta: '/adjuntos/:id', permiso: 'Participante del ticket', descripcion: 'Descarga del archivo adjunto' },
  { metodo: 'GET', ruta: '/inventario/resumen', permiso: 'inventario.ver', descripcion: 'Indicadores del inventario' },
  { metodo: 'GET', ruta: '/inventario/articulos', permiso: 'inventario.ver', descripcion: 'Catalogo paginado con filtros' },
  { metodo: 'POST', ruta: '/inventario/articulos', permiso: 'inventario.articulos', descripcion: 'Alta de articulo con stock inicial cero' },
  { metodo: 'PUT', ruta: '/inventario/articulos/:id', permiso: 'inventario.articulos', descripcion: 'Edicion del articulo' },
  { metodo: 'DELETE', ruta: '/inventario/articulos/:id', permiso: 'inventario.articulos', descripcion: 'Baja logica del articulo' },
  { metodo: 'POST', ruta: '/inventario/articulos/:id/movimientos', permiso: 'inventario.movimientos', descripcion: 'Entrada, salida o ajuste' },
  { metodo: 'PUT', ruta: '/inventario/articulos/:id/estado', permiso: 'inventario.articulos', descripcion: 'Cambio de situacion del articulo' },
  { metodo: 'GET', ruta: '/inventario/movimientos', permiso: 'inventario.ver', descripcion: 'Kardex paginado' },
  { metodo: 'GET', ruta: '/inventario/reporte/pdf', permiso: 'inventario.ver', descripcion: 'Reporte del catalogo en PDF' },
  { metodo: 'GET', ruta: '/inventario/articulos/:id/kardex/pdf', permiso: 'inventario.ver', descripcion: 'Kardex del articulo en PDF' },
  { metodo: 'GET', ruta: '/equipos', permiso: 'equipos.ver', descripcion: 'Parque informatico paginado con filtros' },
  { metodo: 'POST', ruta: '/equipos', permiso: 'equipos.gestionar', descripcion: 'Alta de equipo y su asignacion' },
  { metodo: 'PUT', ruta: '/equipos/:id', permiso: 'equipos.gestionar', descripcion: 'Edicion del equipo' },
  { metodo: 'DELETE', ruta: '/equipos/:id', permiso: 'equipos.gestionar', descripcion: 'Baja logica del equipo' },
  { metodo: 'GET', ruta: '/equipos/:id/credenciales', permiso: 'equipos.credenciales', descripcion: 'Revela la contrasena remota, con registro en bitacora' },
  { metodo: 'GET', ruta: '/equipos/reporte/pdf', permiso: 'equipos.ver', descripcion: 'Reporte del parque en PDF' },
  { metodo: 'GET', ruta: '/equipos/:id/ficha/pdf', permiso: 'equipos.ver', descripcion: 'Ficha tecnica del equipo en PDF' },
  { metodo: 'GET', ruta: '/sucursales', permiso: 'Autenticado', descripcion: 'Catalogo de sucursales' },
  { metodo: 'POST', ruta: '/sucursales', permiso: 'admin.sucursales', descripcion: 'Alta de sucursal u oficina' },
  { metodo: 'GET', ruta: '/compras', permiso: 'compras.solicitar / ver_todas', descripcion: 'Solicitudes con alcance por permiso' },
  { metodo: 'POST', ruta: '/compras', permiso: 'compras.solicitar', descripcion: 'Registro del pedido de equipo' },
  { metodo: 'PUT', ruta: '/compras/:id/revisar', permiso: 'compras.revisar', descripcion: 'Revision tecnica y cotizacion' },
  { metodo: 'PUT', ruta: '/compras/:id/aprobar-ti', permiso: 'compras.revisar', descripcion: 'Aprobacion tecnica, eleva a Gerencia' },
  { metodo: 'PUT', ruta: '/compras/:id/aprobar-gerencia', permiso: 'compras.aprobar', descripcion: 'Aprobacion presupuestaria' },
  { metodo: 'PUT', ruta: '/compras/:id/rechazar', permiso: 'compras.revisar / aprobar', descripcion: 'Rechazo con motivo' },
  { metodo: 'PUT', ruta: '/compras/:id/comprar', permiso: 'compras.gestionar', descripcion: 'Registro de la compra ejecutada' },
  { metodo: 'PUT', ruta: '/compras/:id/entregar', permiso: 'compras.gestionar', descripcion: 'Entrega y vinculo con el parque' },
  { metodo: 'GET', ruta: '/areas', permiso: 'Autenticado', descripcion: 'Catalogo de areas' },
  { metodo: 'POST', ruta: '/areas', permiso: 'admin.areas', descripcion: 'Alta de area' },
  { metodo: 'PUT', ruta: '/areas/:id', permiso: 'admin.areas', descripcion: 'Edicion de area' },
  { metodo: 'DELETE', ruta: '/areas/:id', permiso: 'admin.areas', descripcion: 'Baja logica de area' },
  { metodo: 'GET', ruta: '/roles', permiso: 'admin.roles / admin.usuarios', descripcion: 'Roles con su matriz de permisos' },
  { metodo: 'POST', ruta: '/roles', permiso: 'admin.roles', descripcion: 'Creacion de rol con permisos' },
  { metodo: 'PUT', ruta: '/roles/:id', permiso: 'admin.roles', descripcion: 'Reemplazo integral de la matriz del rol' },
  { metodo: 'DELETE', ruta: '/roles/:id', permiso: 'admin.roles', descripcion: 'Eliminacion de rol sin usuarios' },
  { metodo: 'GET', ruta: '/permisos', permiso: 'admin.roles', descripcion: 'Catalogo de permisos agrupado por modulo' },
  { metodo: 'GET', ruta: '/categorias', permiso: 'Autenticado', descripcion: 'Catalogo de categorias de ticket' },
  { metodo: 'POST', ruta: '/categorias', permiso: 'admin.categorias', descripcion: 'Alta de categoria con color e icono' },
  { metodo: 'PUT', ruta: '/categorias/:id', permiso: 'admin.categorias', descripcion: 'Edicion con propagacion del nombre a los tickets' },
  { metodo: 'DELETE', ruta: '/categorias/:id', permiso: 'admin.categorias', descripcion: 'Baja logica de categoria' },
  { metodo: 'GET', ruta: '/usuarios', permiso: 'admin.usuarios', descripcion: 'Listado con filtros' },
  { metodo: 'GET', ruta: '/usuarios/tecnicos', permiso: 'tickets.ver_todos', descripcion: 'Tecnicos disponibles para asignacion' },
  { metodo: 'POST', ruta: '/usuarios', permiso: 'admin.usuarios', descripcion: 'Alta de usuario con hash bcrypt' },
  { metodo: 'PUT', ruta: '/usuarios/:id', permiso: 'admin.usuarios', descripcion: 'Edicion de usuario' },
  { metodo: 'DELETE', ruta: '/usuarios/:id', permiso: 'admin.usuarios', descripcion: 'Baja logica de usuario' },
  { metodo: 'GET', ruta: '/notificaciones', permiso: 'Autenticado', descripcion: 'Bandeja de notificaciones propias' },
  { metodo: 'PUT', ruta: '/notificaciones/:id/leida', permiso: 'Autenticado', descripcion: 'Marcado individual como leida' },
  { metodo: 'GET', ruta: '/auditoria', permiso: 'reportes.ver / admin.usuarios', descripcion: 'Bitacora de acciones' },
  { metodo: 'GET', ruta: '/auditoria/pdf', permiso: 'reportes.exportar', descripcion: 'Bitacora de auditoria en PDF' },
  { metodo: 'GET', ruta: '/auditoria/matriz-rbac/pdf', permiso: 'admin.roles', descripcion: 'Matriz de roles y permisos en PDF' }
];

const EVENTOS = [
  { evento: 'conexion:establecida', direccion: 'Servidor a cliente', descripcion: 'Confirma la autenticacion del socket y las salas asignadas' },
  { evento: 'ticket:suscribir', direccion: 'Cliente a servidor', descripcion: 'Suscribe al canal de un ticket especifico' },
  { evento: 'ticket:desuscribir', direccion: 'Cliente a servidor', descripcion: 'Abandona el canal de un ticket' },
  { evento: 'ticket:creado', direccion: 'Servidor a cliente', descripcion: 'Nuevo ticket registrado en la mesa de ayuda' },
  { evento: 'ticket:actualizado', direccion: 'Servidor a cliente', descripcion: 'Cambio de estado, asignacion o cierre' },
  { evento: 'ticket:resuelto', direccion: 'Servidor a cliente', descripcion: 'Registro de la solucion tecnica' },
  { evento: 'notificacion:nueva', direccion: 'Servidor a cliente', descripcion: 'Notificacion personal para el destinatario' },
  { evento: 'comentario:nuevo', direccion: 'Servidor a cliente', descripcion: 'Mensaje nuevo en la conversacion del ticket' },
  { evento: 'inventario:movimiento', direccion: 'Servidor a cliente', descripcion: 'Entrada o salida registrada en el inventario' },
  { evento: 'compra:creada', direccion: 'Servidor a cliente', descripcion: 'Nueva solicitud de compra registrada' },
  { evento: 'compra:actualizada', direccion: 'Servidor a cliente', descripcion: 'Avance de la solicitud en el circuito' }
];

const ARCHIVOS = [
  { componente: 'Base de datos', ruta: 'db/01_schema.sql', descripcion: 'Esquema DDL completo e indices' },
  { componente: 'Base de datos', ruta: 'db/02_seed.sql', descripcion: 'Areas, roles, permisos y usuario administrador' },
  { componente: 'Base de datos', ruta: 'db/03_categorias.sql', descripcion: 'Catalogo administrable de categorias' },
  { componente: 'Base de datos', ruta: 'db/04_comentarios.sql', descripcion: 'Conversacion y adjuntos del ticket' },
  { componente: 'Base de datos', ruta: 'db/05_inventario.sql', descripcion: 'Articulos y kardex de movimientos' },
  { componente: 'Base de datos', ruta: 'db/06_equipos.sql', descripcion: 'Parque de equipos de la empresa' },
  { componente: 'Base de datos', ruta: 'db/07_estado_articulos.sql', descripcion: 'Situacion del articulo de inventario' },
  { componente: 'Base de datos', ruta: 'db/08_sucursales.sql', descripcion: 'Sucursales y ubicacion de usuarios, tickets y equipos' },
  { componente: 'Base de datos', ruta: 'db/09_compras.sql', descripcion: 'Solicitudes de compra con doble aprobacion' },
  { componente: 'Base de datos', ruta: 'db/10_fabrica.sql', descripcion: 'La sede de Santa Cruz como fabrica' },
  { componente: 'API', ruta: 'backend/src/modules/compras/', descripcion: 'Circuito de adquisiciones de equipos' },
  { componente: 'API', ruta: 'backend/src/modules/equipos/', descripcion: 'Parque informatico y credenciales de acceso remoto' },
  { componente: 'API', ruta: 'backend/src/utils/cifrado.js', descripcion: 'Cifrado AES-256-GCM de credenciales' },
  { componente: 'API', ruta: 'backend/src/modules/inventario/', descripcion: 'Catalogo, movimientos y reportes de inventario' },
  { componente: 'API', ruta: 'backend/src/utils/paginacion.js', descripcion: 'Limites de carga uniformes de los listados' },
  { componente: 'API', ruta: 'backend/src/app.js', descripcion: 'Composicion de middlewares y montaje de rutas' },
  { componente: 'API', ruta: 'backend/src/server.js', descripcion: 'Servidor HTTP, sockets y apagado ordenado' },
  { componente: 'API', ruta: 'backend/src/middleware/auth.js', descripcion: 'Verificacion JWT para HTTP y para sockets' },
  { componente: 'API', ruta: 'backend/src/middleware/rbac.js', descripcion: 'Guard RequierePermiso sobre permisos atomicos' },
  { componente: 'API', ruta: 'backend/src/modules/tickets/', descripcion: 'Ciclo de vida completo del ticket' },
  { componente: 'API', ruta: 'backend/src/realtime/socket.js', descripcion: 'Canal de tiempo real y gestion de salas' },
  { componente: 'API', ruta: 'backend/src/services/pdf/', descripcion: 'Motor documental: iconos, plantilla y reportes' },
  { componente: 'Web', ruta: 'frontend/src/context/', descripcion: 'Sesion, permisos y notificaciones en vivo' },
  { componente: 'Web', ruta: 'frontend/src/pages/', descripcion: 'Tablero, tickets, administracion y auditoria' },
  { componente: 'Movil', ruta: 'mobile/src/screens/', descripcion: 'Pantallas Expo con el mismo modelo de permisos' },
  { componente: 'Despliegue', ruta: 'docker-compose.yml', descripcion: 'Orquestacion de base de datos, API y web' }
];

const CONTROLES_SEGURIDAD = [
  {
    control: 'Sesion en cookie httpOnly',
    riesgo: 'Robo de la credencial por codigo inyectado en la pagina',
    como: 'El token viaja en una cookie que ningun script puede leer, con SameSite estricto'
  },
  {
    control: 'Verificacion de origen',
    riesgo: 'Peticiones forjadas desde otro sitio ya abierto en el navegador',
    como: 'Doble envio: cookie legible mas cabecera X-CSRF-Token, comparadas en tiempo constante'
  },
  {
    control: 'Bloqueo por cuenta',
    riesgo: 'Adivinacion de contrasenas rotando la direccion de origen',
    como: 'Cinco fallos en quince minutos bloquean el usuario otros quince, sin inhabilitar la cuenta'
  },
  {
    control: 'Freno por origen',
    riesgo: 'Saturacion del servicio y fuerza bruta masiva',
    como: 'Trescientas peticiones por minuto y cuarenta intentos fallidos de acceso cada diez minutos'
  },
  {
    control: 'Retardo progresivo',
    riesgo: 'Automatismos que prueban claves de forma sistematica',
    como: 'Desde el quinto fallo cada intento responde medio segundo mas lento, hasta cinco segundos'
  },
  {
    control: 'Origen declarado',
    riesgo: 'Escrituras emitidas desde un sitio ajeno o desde un guion que no es un navegador',
    como: 'Toda escritura con cookie debe partir de un origen de la lista autorizada'
  },
  {
    control: 'Acceso cerrado por omision',
    riesgo: 'Una ruta nueva publicada sin guardia por descuido',
    como: 'La API exige credencial salvo en las rutas declaradas abiertas de forma explicita'
  },
  {
    control: 'Rol de base sin privilegios de estructura',
    riesgo: 'Que una falla de inyeccion alcance a destruir o alterar las tablas',
    como: 'La API se conecta con un rol que solo lee y escribe filas, no dueño del esquema'
  },
  {
    control: 'Conexiones cifradas',
    riesgo: 'Lectura de la sesion en cualquier punto intermedio de la red',
    como: 'Con FORZAR_HTTPS las lecturas se reconducen a HTTPS y las escrituras en claro se rechazan'
  },
  {
    control: 'Cabeceras de proteccion',
    riesgo: 'Enmarcado del sitio, interpretacion indebida de archivos y fuga por el referente',
    como: 'Politica de contenido restrictiva, nosniff, SAMEORIGIN, referente suprimido y HSTS'
  },
  {
    control: 'Cifrado de credenciales',
    riesgo: 'Exposicion de las claves de acceso remoto guardadas',
    como: 'AES-256-GCM con clave derivada por scrypt; se revelan solo bajo peticion autorizada'
  },
  {
    control: 'Validacion de entrada',
    riesgo: 'Datos malformados, inyeccion y cuerpos desmedidos',
    como: 'Esquemas declarativos por endpoint, consultas parametrizadas y cuerpo limitado a un megabyte'
  },
  {
    control: 'Rastro de auditoria',
    riesgo: 'Acciones sin responsable identificable',
    como: 'Cada operacion de escritura deja usuario, entidad, accion, direccion de origen y momento'
  },
  {
    control: 'Secretos obligatorios',
    riesgo: 'Publicacion con las claves del archivo de ejemplo',
    como: 'El arranque en produccion se detiene si un secreto conserva el valor de muestra'
  }
];

const RESULTADO_PRUEBAS = [
  {
    bateria: 'Secretos',
    que: 'Configuracion fuera del control de versiones, historial completo del repositorio, credenciales '
      + 'incrustadas en el codigo y valores del archivo de ejemplo',
    resultado: '7 de 7'
  },
  {
    bateria: 'Seguridad',
    que: 'Cookies de sesion, verificacion del origen declarado, cabeceras, bloqueo por intentos, cache, '
      + 'acceso cerrado por omision y cierre de sesion',
    resultado: '34 de 34'
  },
  {
    bateria: 'Funcional',
    que: 'Acceso de las once cuentas, catalogos, ciclo completo del ticket, inventario, equipos, compras con doble '
      + 'aprobacion, tablero, notificaciones, auditoria, paginacion, ocho documentos PDF y validacion de entrada',
    resultado: '70 de 70'
  },
  {
    bateria: 'Tiempo real',
    que: 'Ingreso al canal, reparto por salas, aviso inmediato de un ticket nuevo y rechazo de conexiones sin sesion',
    resultado: '4 de 4'
  }
];

const PENDIENTES = [
  {
    punto: 'Aplicacion movil',
    situacion: 'El codigo esta escrito y consume la API con cabecera Authorization, pero no se ha compilado ni '
      + 'probado sobre un dispositivo real',
    prioridad: 'Alta si se quiere usar en campo'
  },
  {
    punto: 'Certificado HTTPS',
    situacion: 'El reconducido a HTTPS y la cookie segura estan implementados; falta el certificado. Sin el hay '
      + 'que desactivarlos de forma explicita con FORZAR_HTTPS y COOKIE_SECURE',
    prioridad: 'Alta antes de publicar'
  },
  {
    punto: 'Dependencias de la aplicacion movil',
    situacion: 'Nunca se instalaron, de modo que no se pudo auditar su arbol de dependencias',
    prioridad: 'Media'
  },
  {
    punto: 'Revision periodica de dependencias',
    situacion: 'La auditoria esta limpia hoy, pero no hay revision automatica que avise de un aviso nuevo',
    prioridad: 'Media'
  },
  {
    punto: 'Revocacion de sesiones',
    situacion: 'El token es valido hasta su vencimiento; desactivar un usuario no corta la sesion ya abierta',
    prioridad: 'Media'
  },
  {
    punto: 'Estado compartido entre instancias',
    situacion: 'La cache, el bloqueo por intentos y el freno por origen viven en memoria del proceso: con varias '
      + 'instancias haria falta un almacen comun',
    prioridad: 'Media si se escala'
  },
  {
    punto: 'Cambio de clave obligatorio',
    situacion: 'Las cuentas se entregan con una contrasena inicial conocida y el sistema no exige cambiarla al '
      + 'primer ingreso',
    prioridad: 'Media'
  },
  {
    punto: 'Aviso por correo',
    situacion: 'Los avisos llegan por el canal en tiempo real y por la bandeja interna, no por correo electronico',
    prioridad: 'Baja'
  },
  {
    punto: 'Respaldo de la base de datos',
    situacion: 'No hay tarea programada de respaldo ni prueba de restauracion',
    prioridad: 'Alta antes de publicar'
  },
  {
    punto: 'Pruebas unitarias',
    situacion: 'La verificacion es de extremo a extremo contra la API; no hay pruebas unitarias por funcion',
    prioridad: 'Baja'
  }
];

const construir = async () => {
  const ddl = await leerSql('01_schema.sql');
  const doc = new DocumentoPDF({
    titulo: 'Documentacion Tecnica del Sistema',
    subtitulo: 'Gestion de Tickets TI y Control de Acceso RBAC',
    codigo: 'STD-2026-TI',
    icono: 'documento'
  });

  doc.titulo1('1. Resumen del sistema', 'ticket');
  doc.parrafo('Sistema centralizado de mesa de ayuda para el departamento de Sistemas. '
    + 'Gestiona el ciclo de vida completo de incidencias y requerimientos garantizando trazabilidad total sobre '
    + 'quien solicito, quien atendio y quien resolvio cada ticket, sobre una arquitectura de seguridad basada en '
    + 'control de acceso por roles con asignacion dinamica de permisos.');
  doc.titulo2('Componentes construidos');
  doc.lista([
    'API REST en Node.js con Express, autenticacion JWT y guard de permisos atomicos.',
    'Base de datos PostgreSQL con el esquema DDL de la especificacion mas bitacora y notificaciones.',
    'Canal de tiempo real con Socket.IO para notificaciones y actualizacion inmediata de tableros.',
    'Aplicacion web en React con Tailwind CSS e iconografia vectorial, sin uso de emojis.',
    'Aplicacion movil en React Native (Expo) que consume la misma API y el mismo canal de eventos.',
    'Motor documental PDF que emite actas, reportes y esta misma documentacion tecnica.',
    'Despliegue contenedorizado con Docker Compose para publicacion en servidor.'
  ]);

  doc.titulo1('2. Arquitectura de la solucion', 'red');
  doc.tabla([
    { titulo: 'Capa', campo: 'capa', ancho: 0.24 },
    { titulo: 'Tecnologia', campo: 'tecnologia', ancho: 0.32 },
    { titulo: 'Responsabilidad', campo: 'responsabilidad', ancho: 0.44 }
  ], [
    { capa: 'Persistencia', tecnologia: 'PostgreSQL 16', responsabilidad: 'Modelo relacional, integridad referencial y restricciones de dominio' },
    { capa: 'Servicios', tecnologia: 'Node.js 20 + Express', responsabilidad: 'API REST, reglas de negocio y control de acceso' },
    { capa: 'Tiempo real', tecnologia: 'Socket.IO', responsabilidad: 'Notificaciones y difusion de cambios por salas' },
    { capa: 'Documental', tecnologia: 'PDFKit', responsabilidad: 'Actas, reportes y documentacion tecnica en PDF' },
    { capa: 'Cliente web', tecnologia: 'React 18 + Tailwind CSS', responsabilidad: 'Interfaz administrativa y operativa' },
    { capa: 'Cliente movil', tecnologia: 'React Native (Expo)', responsabilidad: 'Atencion de tickets desde dispositivos moviles' },
    { capa: 'Despliegue', tecnologia: 'Docker Compose + Nginx', responsabilidad: 'Publicacion en servidor y proxy de API y sockets' }
  ]);
  doc.nota('El token JWT es la unica fuente de identidad: el identificador del usuario nunca se acepta desde el cliente '
    + 'en las operaciones de creacion, atencion o resolucion de tickets.', { icono: 'escudo' });

  doc.saltoPagina();
  doc.titulo1('3. Modelo de datos', 'baseDatos');
  doc.parrafo('Estructura fisica implementada segun la especificacion, ampliada con las tablas de bitacora de '
    + 'auditoria y de notificaciones necesarias para la trazabilidad documental y el canal de tiempo real.');
  doc.tabla([
    { titulo: 'Tabla', campo: 'tabla', ancho: 0.26 },
    { titulo: 'Proposito', campo: 'proposito', ancho: 0.74 }
  ], [
    { tabla: 'areas', proposito: 'Catalogo de areas de la organizacion' },
    { tabla: 'categorias', proposito: 'Catalogo administrable de clasificacion de tickets' },
    { tabla: 'roles', proposito: 'Roles configurables desde el panel de administracion' },
    { tabla: 'permisos', proposito: 'Permisos atomicos del sistema agrupados por modulo' },
    { tabla: 'rol_permisos', proposito: 'Relacion N:M que materializa la matriz de permisos' },
    { tabla: 'usuarios', proposito: 'Cuentas con area, rol, estado y hash bcrypt de la contrasena' },
    { tabla: 'tickets', proposito: 'Requerimientos con trazabilidad de solicitante, asignado y resolutor' },
    { tabla: 'auditoria', proposito: 'Bitacora de cada accion ejecutada, base de los reportes PDF' },
    { tabla: 'notificaciones', proposito: 'Persistencia de los avisos emitidos por WebSockets' },
    { tabla: 'comentarios', proposito: 'Conversacion entre solicitante y tecnico sobre el ticket' },
    { tabla: 'adjuntos', proposito: 'Capturas de pantalla y documentos asociados al ticket' },
    { tabla: 'inventario_articulos', proposito: 'Catalogo de articulos con su saldo vigente' },
    { tabla: 'inventario_movimientos', proposito: 'Kardex de entradas, salidas y ajustes' },
    { tabla: 'equipos', proposito: 'Parque informatico, asignacion y acceso remoto cifrado' },
    { tabla: 'sucursales', proposito: 'Mapa de la empresa: casa central, plantas, sucursales y oficinas' },
    { tabla: 'solicitudes_compra', proposito: 'Pedidos de equipos con doble aprobacion y trazabilidad' }
  ]);
  doc.nota('La categoria del ticket dejo de ser una lista fija en el codigo: ahora se valida contra el '
    + 'catalogo administrable de la tabla categorias, mantenible desde el panel de administracion. '
    + 'Al renombrar una categoria el cambio se propaga a los tickets ya clasificados.', { icono: 'engranaje' });

  doc.titulo2('Esquema DDL implementado');
  doc.codigoFuente(ddl);

  doc.saltoPagina();
  doc.titulo1('4. Diccionario de permisos atomicos', 'engranaje');
  doc.parrafo('Permisos precargados en la base de datos. La interfaz de administracion construye los roles de forma '
    + 'dinamica a partir de este catalogo, agrupando las casillas de verificacion por modulo.');
  doc.tabla([
    { titulo: 'Modulo', campo: 'modulo', ancho: 0.16 },
    { titulo: 'Codigo', campo: 'codigo', ancho: 0.28 },
    { titulo: 'Descripcion de la accion', campo: 'descripcion', ancho: 0.56 }
  ], PERMISOS);

  doc.titulo2('Roles precargados');
  doc.tabla([
    { titulo: 'Rol', campo: 'rol', ancho: 0.2 },
    { titulo: 'Permisos concedidos', campo: 'permisos', ancho: 0.8 }
  ], [
    { rol: 'admin', permisos: 'Todos los permisos del sistema' },
    { rol: 'tecnico_l1', permisos: 'tickets.crear, ver_propios, ver_todos, responder, resolver, reportes.ver, reportes.exportar' },
    { rol: 'tecnico_l2', permisos: 'Identico a tecnico_l1, previsto para escalamiento' },
    { rol: 'cliente', permisos: 'tickets.crear, tickets.ver_propios' }
  ]);

  doc.titulo1('5. Control de acceso (middleware RBAC)', 'escudo');
  doc.parrafo('Cada endpoint valida el token JWT y luego evalua el guard de permisos. Los permisos vigentes del rol '
    + 'se resuelven contra la base de datos y se mantienen en una cache de corta duracion que se invalida al modificar '
    + 'la matriz de un rol, de modo que un cambio administrativo surte efecto de inmediato.');
  doc.codigoFuente([
    "// Definicion de rutas protegidas",
    "ticketsRouter.post('/',              requierePermiso('tickets.crear'),    crear);",
    "ticketsRouter.put('/:id/tomar',      requierePermiso('tickets.responder'), tomar);",
    "ticketsRouter.put('/:id/resolver',   requierePermiso('tickets.resolver'),  resolver);",
    "rolesRouter.post('/',                requierePermiso('admin.roles'),       crearRol);",
    "",
    "// Guard: exige al menos uno de los codigos indicados",
    "export const requierePermiso = (...codigos) => (req, _res, next) => {",
    "  const posee = codigos.some((codigo) => req.usuario.permisos.includes(codigo));",
    "  if (!posee) return next(HttpError.forbidden());",
    "  return next();",
    "};"
  ].join('\n'));

  doc.saltoPagina();
  doc.titulo1('6. Modelo del ticket', 'ticket');
  doc.parrafo('Cada ticket se identifica con un correlativo por gestion en el formato SYS-AAAA-NNNNN. '
    + 'El numero se asigna en la misma sentencia de insercion, de modo que dos altas simultaneas no pueden '
    + 'obtener el mismo correlativo.');
  doc.tabla([
    { titulo: 'Campo', campo: 'campo', ancho: 0.24 },
    { titulo: 'Contenido', campo: 'contenido', ancho: 0.76 }
  ], [
    { campo: 'Numero', contenido: 'SYS-AAAA-NNNNN, correlativo unico dentro de cada gestion' },
    { campo: 'Tipo', contenido: 'Incidente, Requerimiento, Mantenimiento o Desarrollo' },
    { campo: 'Servicio', contenido: 'Soporte informatico, Redes, Telefonia, CCTV, Servidores, IBS, Desarrollo, '
      + 'Mantenimiento, Proyectos o Gestion tecnologica' },
    { campo: 'Categoria', contenido: 'Catalogo administrable: PC, Red, Camara, Telefonia, IBS, Servidores y otros' },
    { campo: 'Ubicacion', contenido: 'Piso, oficina o area donde ocurre el hecho' },
    { campo: 'Activo relacionado', contenido: 'Equipo del parque sobre el que se trabaja, validado contra inventario' },
    { campo: 'Prioridad', contenido: 'La determina Sistemas, no el solicitante; queda registrado quien la fijo' },
    { campo: 'Tiempo empleado', contenido: 'Minutos efectivamente dedicados, se registran al resolver' },
    { campo: 'Observaciones', contenido: 'Recomendacion o pendiente que deja el tecnico' }
  ], { alturaFila: 26 });

  doc.titulo2('Objetivo de atencion por prioridad');
  doc.tabla([
    { titulo: 'Prioridad', campo: 'prioridad', ancho: 0.16 },
    { titulo: 'Objetivo', campo: 'objetivo', ancho: 0.26 },
    { titulo: 'Criterio', campo: 'criterio', ancho: 0.58 }
  ], [
    { prioridad: 'Critica', objetivo: 'Inmediata (2 h)',
      criterio: 'Operacion detenida, IBS caido, red general caida o problema critico de produccion' },
    { prioridad: 'Alta', objetivo: 'Prioritaria (8 h)',
      criterio: 'Afecta significativamente a un area, a un usuario critico o a un servicio importante' },
    { prioridad: 'Media', objetivo: 'Dentro de la jornada (24 h)', criterio: 'Problema operativo normal' },
    { prioridad: 'Baja', objetivo: 'Programada (72 h)', criterio: 'Mejora o requerimiento no urgente' }
  ], { alturaFila: 24 });
  doc.nota('El sistema calcula la fecha objetivo al fijarse la prioridad y marca como vencido todo ticket abierto '
    + 'que la supere. El tablero de Sistemas expone ese conteo como indicador propio.', { icono: 'alerta' });

  doc.titulo1('7. Ciclo de vida del ticket', 'flujo');
  doc.tabla([
    { titulo: 'Estado', campo: 'estado', ancho: 0.16 },
    { titulo: 'Disparador', campo: 'disparador', ancho: 0.26 },
    { titulo: 'Efectos registrados', campo: 'efectos', ancho: 0.58 }
  ], [
    {
      estado: 'Nuevo',
      disparador: 'POST /tickets',
      efectos: 'anio y numero correlativos; solicitante_id = sesion; prioridad Media hasta que Sistemas la defina'
    },
    {
      estado: 'Asignado',
      disparador: 'PUT /tickets/:id/tomar o /asignar',
      efectos: 'asignado_id fijado; fecha_asignacion = NOW(); notificacion al solicitante y al tecnico'
    },
    {
      estado: 'En Proceso',
      disparador: 'PUT /tickets/:id/iniciar',
      efectos: 'fecha_inicio = NOW(); al reanudar desde espera se limpia el motivo registrado'
    },
    {
      estado: 'En Espera',
      disparador: 'PUT /tickets/:id/espera',
      efectos: 'motivo_espera obligatorio; fecha_espera = NOW(); solo se sale reanudando la atencion'
    },
    {
      estado: 'Resuelto',
      disparador: 'PUT /tickets/:id/resolver',
      efectos: 'solucion_detalle, minutos_empleados y observaciones; resuelto_por_id = sesion; fecha_resolucion'
    },
    {
      estado: 'Cerrado',
      disparador: 'PUT /tickets/:id/cerrar',
      efectos: 'Cierre conforme por el solicitante o la mesa de ayuda; fecha_cierre = NOW()'
    }
  ], { alturaFila: 30 });
  doc.parrafo('Las transiciones estan restringidas: de Asignado no se puede saltar a Cerrado, de Cerrado no se '
    + 'sale, y todo intento fuera de la secuencia se rechaza con codigo 409.');
  doc.nota('Cada transicion registra su accion en la bitacora de auditoria, emite el evento correspondiente por '
    + 'WebSockets y archiva automaticamente un acta PDF del ticket en el repositorio documental.', { icono: 'documento' });

  doc.titulo1('8. Endpoints expuestos', 'red');
  doc.parrafo('Prefijo base de la API: /api/v1');
  doc.tabla([
    { titulo: 'Metodo', campo: 'metodo', ancho: 0.1 },
    { titulo: 'Ruta', campo: 'ruta', ancho: 0.3 },
    { titulo: 'Permiso requerido', campo: 'permiso', ancho: 0.28 },
    { titulo: 'Descripcion', campo: 'descripcion', ancho: 0.32 }
  ], ENDPOINTS, { alturaFila: 15 });

  doc.saltoPagina();
  doc.titulo1('9. Canal de tiempo real', 'red');
  doc.parrafo('El socket se autentica con el mismo token JWT en el handshake. Cada usuario se une a una sala personal '
    + 'y los perfiles con permiso tickets.ver_todos se incorporan ademas a la sala del equipo tecnico.');
  doc.tabla([
    { titulo: 'Evento', campo: 'evento', ancho: 0.28 },
    { titulo: 'Direccion', campo: 'direccion', ancho: 0.24 },
    { titulo: 'Descripcion', campo: 'descripcion', ancho: 0.48 }
  ], EVENTOS);

  doc.titulo1('10. Modulo de documentacion en PDF', 'documento');
  doc.parrafo('Todas las salidas documentales del sistema se generan con un unico motor que garantiza identidad '
    + 'visual uniforme: encabezado institucional, iconografia vectorial, tablas con encabezado repetido y pie de '
    + 'pagina con la autoria del modulo en cada hoja. No se emplean emojis en ningun documento.');
  doc.tabla([
    { titulo: 'Documento', campo: 'documento', ancho: 0.3 },
    { titulo: 'Origen', campo: 'origen', ancho: 0.34 },
    { titulo: 'Momento de emision', campo: 'momento', ancho: 0.36 }
  ], [
    { documento: 'Acta de ticket', origen: 'GET /tickets/:id/pdf', momento: 'Bajo demanda y automatica en cada transicion' },
    { documento: 'Reporte de gestion', origen: 'GET /tickets/reporte/pdf', momento: 'Bajo demanda con los filtros vigentes' },
    { documento: 'Bitacora de auditoria', origen: 'GET /auditoria/pdf', momento: 'Bajo demanda por periodo y entidad' },
    { documento: 'Matriz de roles y permisos', origen: 'GET /auditoria/matriz-rbac/pdf', momento: 'Bajo demanda desde el panel de roles' },
    { documento: 'Documentacion tecnica', origen: 'node docs/generator/generate-docs.js', momento: 'En cada actualizacion del sistema' }
  ], { alturaFila: 26 });
  doc.titulo2('Iconografia disponible en los documentos');
  doc.lista([
    'ticket, usuario, escudo y engranaje para identidad de modulos y secciones.',
    'reloj, check y alerta para estados, cumplimiento y prioridades criticas.',
    'documento, grafico, baseDatos, flujo y red para reportes y arquitectura.'
  ], 'check');

  doc.titulo1('11. Modulo de inventario de sistemas', 'baseDatos');
  doc.parrafo('El inventario mantiene el catalogo de articulos y el kardex de movimientos. El saldo de '
    + 'un articulo nunca se edita de forma directa: resulta exclusivamente de las entradas, salidas y '
    + 'ajustes registrados, cada uno con su saldo anterior y resultante.');
  doc.lista([
    'Entrada: incrementa el saldo. Se emplea en compras y devoluciones al deposito.',
    'Salida: descuenta el saldo y se rechaza si no alcanza el stock disponible.',
    'Ajuste: fija el saldo en la cantidad indicada, para recuentos fisicos.',
    'El movimiento puede asociarse a un ticket, dejando trazabilidad del consumo.',
    'La fila del articulo se bloquea durante la transaccion, de modo que dos movimientos simultaneos no dejan un saldo erroneo.',
    'Al caer por debajo del minimo definido se avisa al equipo tecnico.',
    'Cada articulo lleva ademas su situacion: Disponible, En reparacion, En resguardo o De baja.',
    'Darlo de baja lo retira de los activos y le impide admitir movimientos; volver a Disponible lo reactiva.'
  ]);

  doc.titulo2('Limites de carga de los listados');
  doc.parrafo('Todos los listados extensos del sistema responden paginados. El limite por defecto es de '
    + '25 registros y el maximo admitido es de 200, acotado en el servidor: un cliente no puede solicitar '
    + 'la tabla completa y saturar la memoria del navegador ni la del servidor.');

  doc.saltoPagina();
  doc.titulo1('12. Modulo de equipos de la empresa', 'engranaje');
  doc.parrafo('Registra el parque informatico con su asignacion por usuario y area, las caracteristicas '
    + 'tecnicas de cada maquina y los datos de acceso remoto empleados por la mesa de ayuda.');
  doc.tabla([
    { titulo: 'Grupo de datos', campo: 'grupo', ancho: 0.28 },
    { titulo: 'Contenido', campo: 'contenido', ancho: 0.72 }
  ], [
    { grupo: 'Identificacion', contenido: 'Codigo, nombre del equipo, tipo, marca, modelo y numero de serie' },
    { grupo: 'Caracteristicas', contenido: 'Sistema operativo, procesador, memoria RAM y almacenamiento' },
    { grupo: 'Conectividad', contenido: 'Direccion IP y direccion MAC, ambas validadas por formato' },
    { grupo: 'Acceso remoto', contenido: 'Identificador de AnyDesk y contrasena cifrada' },
    { grupo: 'Asignacion', contenido: 'Usuario responsable, area, ubicacion, estado y fecha de asignacion' }
  ], { alturaFila: 20 });

  doc.titulo2('Tratamiento de la contrasena de acceso remoto');
  doc.lista([
    'Se almacena cifrada con AES-256-GCM, nunca en texto plano.',
    'La clave se deriva por scrypt de la semilla definida en la variable CLAVE_CIFRADO.',
    'La etiqueta de autenticidad permite detectar cualquier alteracion del dato guardado.',
    'No viaja en los listados: la respuesta solo informa si existe contrasena registrada.',
    'Revelarla exige el permiso equipos.credenciales y queda asentado en la bitacora con usuario y fecha.',
    'Ningun documento PDF exportable incluye contrasenas.'
  ], 'escudo');

  doc.nota('Al perder la semilla CLAVE_CIFRADO las contrasenas guardadas dejan de poder descifrarse y '
    + 'deben registrarse nuevamente. Conservela junto con el resto de los secretos del despliegue.',
  { icono: 'alerta', color: PALETA.critico });

  doc.saltoPagina();
  doc.titulo1('13. Sucursales y circuito de compras', 'red');
  doc.parrafo('El usuario pertenece a una sucursal y a un area, ambas independientes: las mismas areas '
    + 'funcionales existen en varias sucursales, de modo que separarlas evita duplicar el catalogo y '
    + 'permite cortar los indicadores por cualquiera de las dos dimensiones. El ticket, el equipo y la '
    + 'solicitud de compra heredan la sucursal de quien los origina, sin preguntarla.');
  doc.tabla([
    { titulo: 'Codigo', campo: 'codigo', ancho: 0.22 },
    { titulo: 'Sucursal', campo: 'nombre', ancho: 0.4 },
    { titulo: 'Tipo', campo: 'tipo', ancho: 0.38 }
  ], [
    { codigo: 'SCZ', nombre: 'Fabrica Santa Cruz', tipo: 'Fabrica, sede del sistema' },
    { codigo: 'SILO', nombre: 'Silos Central de Insumos', tipo: 'Planta' },
    { codigo: 'LP, CBBA, SRE, ORU', nombre: 'La Paz, Cochabamba, Sucre y Oruro', tipo: 'Sucursales' }
  ], { alturaFila: 18 });
  doc.nota('El catalogo es administrable: las oficinas futuras, como Distribucion Central o Venta Privada, '
    + 'se agregan desde el panel sin intervenir el codigo.', { icono: 'engranaje' });

  doc.titulo2('Circuito de la solicitud de compra');
  doc.tabla([
    { titulo: 'Estado', campo: 'estado', ancho: 0.28 },
    { titulo: 'Quien actua', campo: 'quien', ancho: 0.24 },
    { titulo: 'Que ocurre', campo: 'que', ancho: 0.48 }
  ], [
    { estado: 'Solicitada', quien: 'Solicitante', que: 'Registra el pedido con su justificacion' },
    { estado: 'En revision', quien: 'TI', que: 'Evalua la viabilidad tecnica y cotiza' },
    { estado: 'Aprobada por TI', quien: 'TI', que: 'Da el visto bueno tecnico y eleva a Gerencia' },
    { estado: 'Aprobada por Gerencia', quien: 'Gerencia', que: 'Aprueba el presupuesto' },
    { estado: 'Comprada', quien: 'TI', que: 'Registra la orden de compra y el monto final' },
    { estado: 'Entregada', quien: 'TI', que: 'Entrega el equipo y lo vincula al parque' },
    { estado: 'Rechazada', quien: 'TI o Gerencia', que: 'Rechaza con motivo, antes de la compra' }
  ], { alturaFila: 18 });
  doc.nota('El orden del circuito se valida en el servidor: Gerencia no puede aprobar antes que TI, ni se '
    + 'puede registrar una compra sin aprobacion previa.', { icono: 'escudo' });

  doc.saltoPagina();
  doc.saltoPagina();
  doc.titulo1('14. Seguridad de la plataforma', 'escudo');
  doc.parrafo('La credencial de sesion no se guarda en el almacenamiento del navegador. Al iniciar sesion el '
    + 'servidor deja dos cookies complementarias: una de sesion marcada httpOnly, que ningun script de la pagina '
    + 'puede leer, y una segunda de verificacion de origen que la aplicacion si lee y reenvia por cabecera en cada '
    + 'operacion de escritura. Un sitio ajeno puede provocar que el navegador envie la cookie de sesion, pero no '
    + 'puede leer la segunda para reproducir la cabecera, de modo que la peticion se rechaza.');
  doc.tabla([
    { titulo: 'Control', campo: 'control', ancho: 0.28 },
    { titulo: 'Riesgo que atiende', campo: 'riesgo', ancho: 0.32 },
    { titulo: 'Implementacion', campo: 'como', ancho: 0.4 }
  ], CONTROLES_SEGURIDAD);

  doc.titulo2('Circuito de la sesion');
  doc.codigoFuente([
    '// Inicio de sesion',
    'Set-Cookie: tickets_sesion=<token>; HttpOnly; SameSite=Strict; Secure; Path=/',
    'Set-Cookie: tickets_csrf=<token de origen>; SameSite=Strict; Secure; Path=/',
    '',
    '// Toda escritura desde el navegador',
    'X-CSRF-Token: <token de origen>   // debe coincidir con la cookie',
    '',
    '// La aplicacion movil conserva el esquema con cabecera,',
    '// que no es explotable por peticiones forjadas entre sitios',
    'Authorization: Bearer <token>'
  ].join('\n'));

  doc.nota('En produccion el servicio se niega a arrancar si JWT_SECRET, CLAVE_CIFRADO o la contrasena de la base '
    + 'de datos conservan el valor de ejemplo o tienen menos de 24 caracteres.', { icono: 'alerta', color: PALETA.critico });

  doc.titulo2('La API no se conecta como dueña de las tablas');
  doc.parrafo('La aplicacion trabaja con un rol de privilegios recortados que solo puede leer, insertar, '
    + 'modificar y borrar filas. No puede crear, alterar ni destruir tablas, ni vaciarlas de un golpe, ni crear '
    + 'roles. De ese modo una eventual falla de inyeccion queda acotada a los datos y no alcanza a la estructura. '
    + 'El rol se crea con "npm run privilegios" y las tablas que se agreguen en el futuro heredan el mismo criterio.');

  doc.titulo2('Sobre la seguridad por fila');
  doc.parrafo('La seguridad por fila de PostgreSQL tiene sentido cuando el cliente habla directamente con la base '
    + 'de datos, porque ahi es la unica frontera que queda. En esta instalacion la base nunca es alcanzable por el '
    + 'cliente: la API es la unica puerta y la autorizacion se decide en ella, con permisos atomicos por endpoint y '
    + 'verificacion de propiedad sobre cada registro.');
  doc.parrafo('Hay ademas un detalle tecnico determinante: el dueño de una tabla omite las politicas de seguridad '
    + 'por fila salvo que se declaren forzadas. Mientras la aplicacion se conectara con la cuenta propietaria, '
    + 'activarlas habria dado una falsa sensacion de proteccion sin efecto real. Por eso se opto por quitarle esa '
    + 'propiedad, que es el requisito previo y aporta mas por si solo. El rol de trabajo queda preparado con '
    + 'NOBYPASSRLS, de modo que si en el futuro se decide exponer la base a algun cliente, basta con agregar las '
    + 'politicas y fijar la identidad del usuario por transaccion.');

  doc.titulo2('Proteccion contra automatismos');
  doc.parrafo('No se emplea un desafio visual de terceros: obligaria a cargar codigo externo, romperia la politica '
    + 'de contenido y entregaria el trafico de la empresa a un proveedor ajeno. En su lugar actuan tres controles '
    + 'propios que castigan unicamente el fracaso, de modo que quien entra bien no los nota: el retardo progresivo, '
    + 'el bloqueo por cuenta y la exigencia de un origen declarado y autorizado.');

  doc.titulo2('Aprovechamiento de cache');
  doc.parrafo('Los catalogos que se consultan en casi toda navegacion y cambian pocas veces (areas, sucursales y '
    + 'categorias) se resuelven desde una cache en memoria de dos minutos y se acompanan de una cabecera '
    + 'Cache-Control privada con etiqueta de entidad. Una consulta repetida se resuelve con un 304 sin volver a '
    + 'transferir el cuerpo. Toda escritura sobre un catalogo descarta su clave, de modo que un cambio '
    + 'administrativo se ve de inmediato y no queda a la espera de que venza un plazo.');

  doc.saltoPagina();
  doc.titulo1('15. Verificacion y resultado de las pruebas', 'escudo');
  doc.parrafo('El repositorio incorpora una bateria de pruebas automatizadas que recorre el sistema de extremo a '
    + 'extremo contra la API en ejecucion. Se invocan con "npm run qa" desde la carpeta backend y dejan la base sin '
    + 'residuos mediante "npm run qa:limpiar".');
  doc.tabla([
    { titulo: 'Bateria', campo: 'bateria', ancho: 0.26 },
    { titulo: 'Que comprueba', campo: 'que', ancho: 0.54 },
    { titulo: 'Resultado', campo: 'resultado', ancho: 0.2 }
  ], RESULTADO_PRUEBAS);

  doc.titulo2('Puntos pendientes conocidos');
  doc.parrafo('Los siguientes puntos no son defectos del sistema construido, sino trabajo que corresponde a la '
    + 'puesta en produccion o a alcances no solicitados hasta ahora. Se dejan enumerados para que la decision sobre '
    + 'cada uno quede documentada.');
  doc.tabla([
    { titulo: 'Punto pendiente', campo: 'punto', ancho: 0.3 },
    { titulo: 'Situacion actual', campo: 'situacion', ancho: 0.42 },
    { titulo: 'Prioridad', campo: 'prioridad', ancho: 0.28 }
  ], PENDIENTES);

  doc.titulo1('16. Despliegue en servidor', 'engranaje');
  doc.parrafo('La solucion se publica con Docker Compose. La base de datos aplica automaticamente el esquema y la '
    + 'carga inicial en su primer arranque; la aplicacion web se sirve mediante Nginx, que ademas actua como proxy '
    + 'de la API y del canal de WebSockets.');
  doc.codigoFuente([
    'cp .env.example .env        # definir credenciales y JWT_SECRET',
    'docker compose build',
    'docker compose up -d',
    '',
    '# Servicios publicados',
    'web  -> http://localhost:8080',
    'api  -> http://localhost:4000/api/v1',
    'salud -> http://localhost:4000/salud'
  ].join('\n'));
  doc.nota('Antes de publicar en produccion es obligatorio reemplazar JWT_SECRET y la contrasena de la base de '
    + 'datos, y cambiar la clave del usuario administrador inicial.', { icono: 'alerta', color: PALETA.critico });

  doc.titulo2('Ejecucion en entorno de desarrollo');
  doc.codigoFuente([
    '# 1. Base de datos (PostgreSQL local)',
    'createdb tickets_ti',
    'cd backend && npm install && npm run migrate',
    '',
    '# 2. API',
    'npm run dev',
    '',
    '# 3. Aplicacion web',
    'cd ../frontend && npm install && npm run dev',
    '',
    '# 4. Aplicacion movil',
    'cd ../mobile && npm install && npm start'
  ].join('\n'));

  doc.titulo1('17. Inventario de componentes', 'baseDatos');
  doc.tabla([
    { titulo: 'Componente', campo: 'componente', ancho: 0.18 },
    { titulo: 'Ruta', campo: 'ruta', ancho: 0.38 },
    { titulo: 'Contenido', campo: 'descripcion', ancho: 0.44 }
  ], ARCHIVOS);

  doc.titulo1('18. Acceso inicial y control de versiones', 'usuario');
  doc.camposClaveValor([
    { etiqueta: 'Usuario administrador', valor: 'admin' },
    { etiqueta: 'Contrasena inicial', valor: 'Definida al instalar, minimo diez caracteres' },
    { etiqueta: 'Area asignada', valor: 'Sistemas' },
    { etiqueta: 'Rol asignado', valor: 'admin' }
  ], 2);
  doc.tabla([
    { titulo: 'Version', campo: 'version', ancho: 0.14 },
    { titulo: 'Fecha', campo: 'fecha', ancho: 0.2 },
    { titulo: 'Descripcion', campo: 'descripcion', ancho: 0.44 },
    { titulo: 'Responsable', campo: 'responsable', ancho: 0.22 }
  ], [
    {
      version: '1.0.0',
      fecha: '18/08/2026',
      descripcion: 'Construccion inicial completa del sistema segun STD-2026-TI',
      responsable: 'Ing. Edgar Rojas Apaza'
    },
    {
      version: '1.7.0',
      fecha: '20/08/2026',
      descripcion: 'Sucursales, circuito de compras con doble aprobacion, inventario y equipos',
      responsable: 'Ing. Edgar Rojas Apaza'
    },
    {
      version: '1.7.2',
      fecha: '20/08/2026',
      descripcion: 'Legibilidad de los documentos PDF y constancia de la aprobacion de Gerencia',
      responsable: 'Ing. Edgar Rojas Apaza'
    },
    {
      version: '1.8.0',
      fecha: '21/08/2026',
      descripcion: 'Sesion en cookie httpOnly con verificacion de origen, cache de catalogos, bloqueo por '
        + 'intentos fallidos, secretos obligatorios en produccion y bateria de pruebas automatizadas',
      responsable: 'Ing. Edgar Rojas Apaza'
    },
    {
      version: '1.9.0',
      fecha: '21/08/2026',
      descripcion: 'Rol de base sin privilegios de estructura, API cerrada por omision, verificacion del origen '
        + 'declarado, retardo progresivo ante automatismos, reconducido a HTTPS y rastreo de secretos',
      responsable: 'Ing. Edgar Rojas Apaza'
    },
    {
      version: '1.11.0',
      fecha: '21/08/2026',
      descripcion: 'Recorrido visible de la solicitud de compra, actualizacion en tiempo real para Gerencia, '
        + 'importes en bolivianos y revision tecnica centrada en sugerir el equipo',
      responsable: 'Ing. Edgar Rojas Apaza'
    },
    {
      version: '2.0.0',
      fecha: '21/08/2026',
      descripcion: 'Arquitectura por modulos, tabla declarativa de rutas y codigo sin comentarios',
      responsable: 'Ing. Edgar Rojas Apaza'
    },
    {
      version: '2.1.0',
      fecha: '22/08/2026',
      descripcion: 'Reporte mensual de la mesa de ayuda en el tablero, Gerencia habilitada para registrar '
        + 'tickets y bitacora de auditoria con permiso propio',
      responsable: 'Ing. Edgar Rojas Apaza'
    },
    {
      version: '2.2.2',
      fecha: '23/08/2026',
      descripcion: 'Reporte mensual detallado con filtros, correccion del desborde de paginas en los PDF y '
        + 'calendario para elegir el periodo',
      responsable: 'Ing. Edgar Rojas Apaza'
    },
    {
      version: '2.3.0',
      fecha: new Date().toLocaleDateString('es-BO'),
      descripcion: 'Modulo de peticiones de proyecto, politica de contrasenas con cambio y restablecimiento, '
        + 'base reiniciada a una sola cuenta administradora y baterias de prueba autosuficientes',
      responsable: 'Ing. Edgar Rojas Apaza'
    },
    {
      version: '2.7.0',
      fecha: new Date().toLocaleDateString('es-BO'),
      descripcion: 'Modelo completo del ticket: numeracion SYS-AAAA-NNNNN, tipo y servicio, ubicacion, activo '
        + 'relacionado, seis estados con En Espera, tiempo empleado, prioridad determinada por Sistemas con '
        + 'objetivo de atencion y tablero del Jefe de Sistemas',
      responsable: 'Ing. Edgar Rojas Apaza'
    },
    {
      version: '2.8.0',
      fecha: new Date().toLocaleDateString('es-BO'),
      descripcion: 'Reporte mensual en pantalla propia sin duplicar indicadores, modales mas anchos con las '
        + 'acciones fijas en el encabezado, auditoria de diez registros sin la columna de origen y limpieza '
        + 'de cache y cookies desde la barra superior',
      responsable: 'Ing. Edgar Rojas Apaza'
    }
  ], { alturaFila: 26 });

  await doc.aArchivo(salida);
  console.log('[documentacion] PDF generado en: ' + salida);
};

construir().catch((error) => {
  console.error('[documentacion] Error al generar el PDF:', error);
  process.exit(1);
});
