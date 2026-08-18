# Sistema de Gestion de Tickets TI y Control de Acceso RBAC

Implementacion completa de la especificacion tecnica **STD-2026-TI v1.0.0**: mesa de ayuda
centralizada para el departamento de Tecnologias de la Informacion, con trazabilidad total
sobre quien solicito, quien atendio y quien resolvio cada ticket, sobre una arquitectura de
seguridad basada en roles con asignacion dinamica de permisos.

## Contenido del repositorio

| Carpeta | Contenido |
|---|---|
| `db/` | Esquema DDL de PostgreSQL, carga inicial y catalogo de categorias |
| `backend/` | API REST en Node.js + Express, JWT, guard RBAC, WebSockets y motor documental PDF |
| `frontend/` | Aplicacion web en React 18 + Tailwind CSS con iconografia vectorial (lucide-react) |
| `mobile/` | Aplicacion movil en React Native (Expo) sobre la misma API y el mismo canal de eventos |
| `docs/` | Generador de la documentacion tecnica en PDF y su salida en `docs/pdf/` |
| `docker-compose.yml` | Orquestacion de base de datos, API y aplicacion web para despliegue en servidor |

## Arquitectura

| Capa | Tecnologia | Responsabilidad |
|---|---|---|
| Persistencia | PostgreSQL 16 | Modelo relacional, integridad referencial y restricciones de dominio |
| Servicios | Node.js 20 + Express | API REST, reglas de negocio y control de acceso |
| Tiempo real | Socket.IO | Notificaciones y difusion de cambios por salas |
| Documental | PDFKit | Actas de ticket, reportes, bitacora y documentacion tecnica |
| Cliente web | React 18 + Tailwind CSS | Interfaz operativa y administrativa |
| Cliente movil | React Native (Expo) | Atencion de tickets desde dispositivos moviles |
| Despliegue | Docker Compose + Nginx | Publicacion en servidor y proxy de API y WebSockets |

## Despliegue con Docker

```bash
cp .env.example .env      # definir credenciales y JWT_SECRET
docker compose build
docker compose up -d
```

Servicios publicados:

- Aplicacion web: `http://localhost:8080`
- API REST: `http://localhost:4000/api/v1`
- Verificacion de estado: `http://localhost:4000/salud`

La base de datos aplica automaticamente todos los archivos de `db/` en orden numerico durante
su primer arranque, mediante el directorio de inicializacion de la imagen oficial de PostgreSQL.

## Ejecucion en desarrollo

```bash
# 1. Base de datos (PostgreSQL local ya instalado)
createdb tickets_ti

# 2. API
cd backend
cp .env.example .env       # ajustar DB_HOST, DB_USER, DB_PASSWORD, JWT_SECRET
npm install
npm run migrate            # aplica esquema y datos iniciales
npm run dev                # http://localhost:4000

# 3. Aplicacion web
cd ../frontend
npm install
npm run dev                # http://localhost:5173

# 4. Aplicacion movil
cd ../mobile
npm install
npm start                  # Expo; configurar la IP de la API en app.json
```

## Acceso inicial

La carga inicial crea unicamente la cuenta administradora:

| Usuario | Contrasena | Rol | Area |
|---|---|---|---|
| `admin` | `Admin123*` | admin | Tecnologias de la Informacion |

Cambie esta contrasena en el primer ingreso, junto con `JWT_SECRET` y la clave de la base de
datos, antes de publicar el sistema en produccion.

### Cuentas de demostracion

Para recorrer el ciclo completo del ticket hace falta al menos un solicitante y un tecnico.
Puede crearlos desde **Usuarios** en el panel, o generarlos con:

```bash
cd backend
npm run demo
```

Todas comparten la contrasena `Prueba123*`:

| Usuario | Nombre | Rol | Area | Para probar |
|---|---|---|---|---|
| `solicitante` | Ana Quispe Torrez | cliente | Contabilidad | Alta de tickets y visibilidad restringida a los propios |
| `solicitante2` | Carlos Vargas Rojas | cliente | Recursos Humanos | Que un solicitante no vea los tickets de otro |
| `solicitante3` | Maria Flores Colque | cliente | Comercial | Distribucion de tickets por area en el tablero |
| `tecnico` | Luis Mamani Colque | tecnico_l1 | Tecnologias de la Informacion | Atender, resolver y cerrar |
| `tecnico2` | Jorge Choque Silva | tecnico_l1 | Tecnologias de la Informacion | Asignacion de un ticket a otro tecnico |
| `tecnico3` | Patricia Nina Alvarez | tecnico_l2 | Tecnologias de la Informacion | Escalamiento a segundo nivel |

Estas credenciales son conocidas y por eso **no** forman parte de la carga inicial: el script
es de ejecucion manual y las cuentas deben desactivarse antes de publicar el sistema.

## Control de acceso (RBAC)

Cada endpoint valida el token JWT y luego evalua el guard de permisos atomicos:

```js
ticketsRouter.post('/',            requierePermiso('tickets.crear'),     crear);
ticketsRouter.put('/:id/tomar',    requierePermiso('tickets.responder'), tomar);
ticketsRouter.put('/:id/resolver', requierePermiso('tickets.resolver'),  resolver);
rolesRouter.post('/',              requierePermiso('admin.roles'),       crearRol);
```

Permisos precargados:

| Modulo | Codigo | Accion |
|---|---|---|
| TICKETS | `tickets.crear` | Crear nuevas solicitudes de soporte |
| TICKETS | `tickets.ver_propios` | Ver los tickets creados por el propio usuario |
| TICKETS | `tickets.ver_todos` | Ver el listado completo de tickets |
| TICKETS | `tickets.responder` | Asignarse un ticket y pasarlo a En Proceso |
| TICKETS | `tickets.resolver` | Registrar la solucion tecnica |
| ADMIN | `admin.usuarios` | Gestion CRUD de usuarios |
| ADMIN | `admin.roles` | Gestion CRUD de roles y matriz de permisos |
| ADMIN | `admin.areas` | Gestion del catalogo de areas |
| ADMIN | `admin.categorias` | Gestion del catalogo de categorias de tickets |
| REPORTES | `reportes.ver` | Consultar tablero de indicadores |
| REPORTES | `reportes.exportar` | Exportar reportes y documentacion en PDF |

Los permisos vigentes de cada rol se resuelven contra la base de datos y se mantienen en una
cache de corta duracion que se invalida al modificar la matriz de un rol, de modo que un
cambio administrativo surte efecto de inmediato.

## Ciclo de vida del ticket

| Estado | Disparador | Efectos |
|---|---|---|
| Abierto | `POST /tickets` | `solicitante_id = JWT.user_id`; asignado y resolutor en NULL |
| En Proceso | `PUT /tickets/:id/tomar` | `asignado_id = JWT.user_id`; `fecha_asignacion = NOW()` |
| En Proceso | `PUT /tickets/:id/asignar` | Asignacion manual a otro tecnico |
| Resuelto | `PUT /tickets/:id/resolver` | `solucion_detalle`; `resuelto_por_id = JWT.user_id`; `fecha_resolucion = NOW()` |
| Cerrado | `PUT /tickets/:id/cerrar` | Cierre conforme por el solicitante o la mesa de ayuda |

Cada transicion registra la accion en la bitacora de auditoria, emite el evento por WebSockets
y archiva automaticamente un acta PDF del ticket en el repositorio documental.

## Tiempo real

El socket se autentica con el mismo token JWT en el handshake. Cada usuario se une a su sala
personal y los perfiles con `tickets.ver_todos` se incorporan a la sala del equipo tecnico.

| Evento | Direccion | Descripcion |
|---|---|---|
| `conexion:establecida` | Servidor a cliente | Confirma autenticacion y salas asignadas |
| `ticket:suscribir` / `ticket:desuscribir` | Cliente a servidor | Canal de un ticket especifico |
| `ticket:creado` | Servidor a cliente | Nuevo ticket registrado |
| `ticket:actualizado` | Servidor a cliente | Cambio de estado, asignacion o cierre |
| `ticket:resuelto` | Servidor a cliente | Registro de la solucion tecnica |
| `notificacion:nueva` | Servidor a cliente | Notificacion personal para el destinatario |

## Documentacion en PDF

Todas las salidas documentales se generan con un unico motor (`backend/src/services/pdf/`) que
garantiza identidad visual uniforme: encabezado institucional, iconografia vectorial trazada,
tablas con encabezado repetido y pie de pagina de autoria en cada hoja. **No se utilizan emojis
en ninguna salida del sistema.**

| Documento | Origen | Emision |
|---|---|---|
| Acta de ticket | `GET /tickets/:id/pdf` | Bajo demanda y automatica en cada transicion |
| Reporte de gestion | `GET /tickets/reporte/pdf` | Bajo demanda con los filtros vigentes |
| Bitacora de auditoria | `GET /auditoria/pdf` | Bajo demanda por periodo y entidad |
| Matriz de roles y permisos | `GET /auditoria/matriz-rbac/pdf` | Bajo demanda desde el panel de roles |
| Documentacion tecnica | `node docs/generator/generate-docs.js` | En cada actualizacion del sistema |

Las actas generadas automaticamente se archivan en `backend/storage/documentos/tickets/`
(volumen `documentos_pdf` en el despliegue con Docker).

Para regenerar la documentacion tecnica:

```bash
node docs/generator/generate-docs.js
# Salida: docs/pdf/Documentacion-Tecnica-Sistema-Tickets.pdf
```

## Endpoints principales

Prefijo base: `/api/v1`

| Metodo | Ruta | Permiso |
|---|---|---|
| POST | `/auth/login` | Publico |
| GET | `/auth/perfil` | Autenticado |
| GET | `/tickets` | `tickets.ver_propios` / `tickets.ver_todos` |
| GET | `/tickets/tablero` | `tickets.ver_propios` / `tickets.ver_todos` |
| POST | `/tickets` | `tickets.crear` |
| PUT | `/tickets/:id/tomar` | `tickets.responder` |
| PUT | `/tickets/:id/asignar` | `tickets.responder` |
| PUT | `/tickets/:id/resolver` | `tickets.resolver` |
| PUT | `/tickets/:id/cerrar` | Solicitante o mesa de ayuda |
| GET | `/tickets/:id/pdf` | `tickets.ver_propios` / `tickets.ver_todos` |
| GET | `/tickets/reporte/pdf` | `reportes.exportar` |
| GET/POST/PUT/DELETE | `/usuarios` | `admin.usuarios` |
| GET/POST/PUT/DELETE | `/roles` | `admin.roles` |
| GET/POST/PUT/DELETE | `/areas` | `admin.areas` |
| GET/POST/PUT/DELETE | `/categorias` | `admin.categorias` (lectura: autenticado) |
| GET | `/permisos` | `admin.roles` |
| GET | `/notificaciones` | Autenticado |
| GET | `/auditoria` | `reportes.ver` / `admin.usuarios` |

## Catalogo de categorias

La clasificacion del ticket no esta fija en el codigo: se administra desde
**Categorias** en el panel, con nombre, descripcion, color e icono propios. El backend
valida cada ticket contra el catalogo y, al renombrar una categoria, propaga el cambio a
los tickets ya registrados. La baja es logica, de modo que el historial conserva su
clasificacion aunque la categoria deje de ofrecerse.

## Seguridad aplicada

- Contrasenas almacenadas con hash bcrypt (10 rondas).
- Identidad tomada exclusivamente del token JWT; el cliente nunca envia el identificador de usuario.
- Guard de permisos atomicos por endpoint, con verificacion adicional de propiedad del ticket.
- Limitador de intentos de inicio de sesion.
- Cabeceras de seguridad con Helmet y CORS restringido por lista de origenes.
- Bajas logicas en usuarios y areas para preservar la trazabilidad historica de los tickets.
- Bitacora de auditoria de cada operacion, exportable en PDF.

---

**Ing. Edgar Rojas Apaza** | Desarrollo de Modulo de Tickets
Documento de referencia: STD-2026-TI - Version 1.0.0
