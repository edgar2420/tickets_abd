/**
 * Generador de la documentacion tecnica del Sistema de Gestion de Tickets TI.
 *
 * Produce un PDF institucional (sin emojis, con iconografia vectorial y pie de
 * pagina de autoria) que documenta cada componente construido del sistema.
 *
 * Uso:  node docs/generator/generate-docs.js
 * Autor: Ing. Edgar Rojas Apaza - Desarrollo de Modulo de Tickets
 */
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
  { modulo: 'REPORTES', codigo: 'reportes.ver', descripcion: 'Permite consultar el tablero de indicadores y reportes.' },
  { modulo: 'REPORTES', codigo: 'reportes.exportar', descripcion: 'Permite exportar reportes y documentacion en formato PDF.' },
  { modulo: 'INVENTARIO', codigo: 'inventario.ver', descripcion: 'Consultar el catalogo de articulos y el kardex de movimientos.' },
  { modulo: 'INVENTARIO', codigo: 'inventario.articulos', descripcion: 'Gestion CRUD de los articulos del inventario.' },
  { modulo: 'INVENTARIO', codigo: 'inventario.movimientos', descripcion: 'Registrar entradas y salidas de inventario.' }
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
  { metodo: 'GET', ruta: '/inventario/movimientos', permiso: 'inventario.ver', descripcion: 'Kardex paginado' },
  { metodo: 'GET', ruta: '/inventario/reporte/pdf', permiso: 'inventario.ver', descripcion: 'Reporte del catalogo en PDF' },
  { metodo: 'GET', ruta: '/inventario/articulos/:id/kardex/pdf', permiso: 'inventario.ver', descripcion: 'Kardex del articulo en PDF' },
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
  { evento: 'inventario:movimiento', direccion: 'Servidor a cliente', descripcion: 'Entrada o salida registrada en el inventario' }
];

const ARCHIVOS = [
  { componente: 'Base de datos', ruta: 'db/01_schema.sql', descripcion: 'Esquema DDL completo e indices' },
  { componente: 'Base de datos', ruta: 'db/02_seed.sql', descripcion: 'Areas, roles, permisos y usuario administrador' },
  { componente: 'Base de datos', ruta: 'db/03_categorias.sql', descripcion: 'Catalogo administrable de categorias' },
  { componente: 'Base de datos', ruta: 'db/04_comentarios.sql', descripcion: 'Conversacion y adjuntos del ticket' },
  { componente: 'Base de datos', ruta: 'db/05_inventario.sql', descripcion: 'Articulos y kardex de movimientos' },
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

const construir = async () => {
  const ddl = await leerSql('01_schema.sql');
  const doc = new DocumentoPDF({
    titulo: 'Documentacion Tecnica del Sistema',
    subtitulo: 'Gestion de Tickets TI y Control de Acceso RBAC',
    codigo: 'STD-2026-TI',
    icono: 'documento'
  });

  // 1. Resumen
  doc.titulo1('1. Resumen del sistema', 'ticket');
  doc.parrafo('Sistema centralizado de mesa de ayuda para el departamento de Tecnologias de la Informacion. '
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

  // 2. Arquitectura
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

  // 3. Modelo de datos
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
    { tabla: 'inventario_movimientos', proposito: 'Kardex de entradas, salidas y ajustes' }
  ]);
  doc.nota('La categoria del ticket dejo de ser una lista fija en el codigo: ahora se valida contra el '
    + 'catalogo administrable de la tabla categorias, mantenible desde el panel de administracion. '
    + 'Al renombrar una categoria el cambio se propaga a los tickets ya clasificados.', { icono: 'engranaje' });

  doc.titulo2('Esquema DDL implementado');
  doc.codigoFuente(ddl);

  // 4. Permisos
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

  // 5. Control de acceso
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

  // 6. Ciclo de vida
  doc.saltoPagina();
  doc.titulo1('6. Ciclo de vida del ticket', 'flujo');
  doc.tabla([
    { titulo: 'Estado', campo: 'estado', ancho: 0.16 },
    { titulo: 'Disparador', campo: 'disparador', ancho: 0.26 },
    { titulo: 'Efectos registrados', campo: 'efectos', ancho: 0.58 }
  ], [
    {
      estado: 'Abierto',
      disparador: 'POST /tickets',
      efectos: 'solicitante_id = JWT.user_id; asignado_id y resuelto_por_id en NULL; fecha_creacion = NOW()'
    },
    {
      estado: 'En Proceso',
      disparador: 'PUT /tickets/:id/tomar',
      efectos: 'asignado_id = JWT.user_id; fecha_asignacion = NOW(); notificacion al solicitante'
    },
    {
      estado: 'En Proceso',
      disparador: 'PUT /tickets/:id/asignar',
      efectos: 'asignado_id = tecnico elegido; notificacion al tecnico asignado'
    },
    {
      estado: 'Resuelto',
      disparador: 'PUT /tickets/:id/resolver',
      efectos: 'solucion_detalle registrada; resuelto_por_id = JWT.user_id; fecha_resolucion = NOW()'
    },
    {
      estado: 'Cerrado',
      disparador: 'PUT /tickets/:id/cerrar',
      efectos: 'Cierre conforme por el solicitante o la mesa de ayuda'
    }
  ], { alturaFila: 30 });
  doc.nota('Cada transicion registra su accion en la bitacora de auditoria, emite el evento correspondiente por '
    + 'WebSockets y archiva automaticamente un acta PDF del ticket en el repositorio documental.', { icono: 'documento' });

  // 7. API
  doc.titulo1('7. Endpoints expuestos', 'red');
  doc.parrafo('Prefijo base de la API: /api/v1');
  doc.tabla([
    { titulo: 'Metodo', campo: 'metodo', ancho: 0.1 },
    { titulo: 'Ruta', campo: 'ruta', ancho: 0.3 },
    { titulo: 'Permiso requerido', campo: 'permiso', ancho: 0.28 },
    { titulo: 'Descripcion', campo: 'descripcion', ancho: 0.32 }
  ], ENDPOINTS, { alturaFila: 15 });

  // 8. Tiempo real
  doc.saltoPagina();
  doc.titulo1('8. Canal de tiempo real', 'red');
  doc.parrafo('El socket se autentica con el mismo token JWT en el handshake. Cada usuario se une a una sala personal '
    + 'y los perfiles con permiso tickets.ver_todos se incorporan ademas a la sala del equipo tecnico.');
  doc.tabla([
    { titulo: 'Evento', campo: 'evento', ancho: 0.28 },
    { titulo: 'Direccion', campo: 'direccion', ancho: 0.24 },
    { titulo: 'Descripcion', campo: 'descripcion', ancho: 0.48 }
  ], EVENTOS);

  // 9. Documentacion automatica
  doc.titulo1('9. Modulo de documentacion en PDF', 'documento');
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

  // 9 bis. Inventario
  doc.titulo1('10. Modulo de inventario de sistemas', 'baseDatos');
  doc.parrafo('El inventario mantiene el catalogo de articulos y el kardex de movimientos. El saldo de '
    + 'un articulo nunca se edita de forma directa: resulta exclusivamente de las entradas, salidas y '
    + 'ajustes registrados, cada uno con su saldo anterior y resultante.');
  doc.lista([
    'Entrada: incrementa el saldo. Se emplea en compras y devoluciones al deposito.',
    'Salida: descuenta el saldo y se rechaza si no alcanza el stock disponible.',
    'Ajuste: fija el saldo en la cantidad indicada, para recuentos fisicos.',
    'El movimiento puede asociarse a un ticket, dejando trazabilidad del consumo.',
    'La fila del articulo se bloquea durante la transaccion, de modo que dos movimientos simultaneos no dejan un saldo erroneo.',
    'Al caer por debajo del minimo definido se avisa al equipo tecnico.'
  ]);

  doc.titulo2('Limites de carga de los listados');
  doc.parrafo('Todos los listados extensos del sistema responden paginados. El limite por defecto es de '
    + '25 registros y el maximo admitido es de 200, acotado en el servidor: un cliente no puede solicitar '
    + 'la tabla completa y saturar la memoria del navegador ni la del servidor.');

  // 11. Despliegue
  doc.saltoPagina();
  doc.titulo1('11. Despliegue en servidor', 'engranaje');
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

  // 11. Inventario
  doc.titulo1('12. Inventario de componentes', 'baseDatos');
  doc.tabla([
    { titulo: 'Componente', campo: 'componente', ancho: 0.18 },
    { titulo: 'Ruta', campo: 'ruta', ancho: 0.38 },
    { titulo: 'Contenido', campo: 'descripcion', ancho: 0.44 }
  ], ARCHIVOS);

  // 12. Credenciales y control de versiones
  doc.titulo1('13. Acceso inicial y control de versiones', 'usuario');
  doc.camposClaveValor([
    { etiqueta: 'Usuario administrador', valor: 'admin' },
    { etiqueta: 'Contrasena inicial', valor: 'Admin123*' },
    { etiqueta: 'Area asignada', valor: 'Tecnologias de la Informacion' },
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
      fecha: new Date().toLocaleDateString('es-BO'),
      descripcion: 'Construccion inicial completa del sistema segun STD-2026-TI',
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
