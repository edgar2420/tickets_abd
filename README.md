# Sistema de Gestion de Tickets TI y Control de Acceso RBAC

Implementacion completa de la especificacion tecnica **STD-2026-TI v1.0.0**: mesa de ayuda
centralizada para el departamento de Tecnologias de la Informacion, con trazabilidad total
sobre quien solicito, quien atendio y quien resolvio cada ticket, sobre una arquitectura de
seguridad basada en roles con asignacion dinamica de permisos.

## Arquitectura

El codigo esta organizado por modulos: todo lo de un tema vive en su propia carpeta.
La guia completa, con la anatomia de un modulo y los pasos para agregar una pantalla
o un endpoint, esta en [ARQUITECTURA.md](ARQUITECTURA.md).

El codigo no lleva comentarios: cuando un bloque necesita explicacion se parte en
funciones con nombre propio hasta que se lea solo.

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

El sistema arranca con una sola cuenta. No se crean tecnicos, clientes ni datos de ejemplo:

| Usuario | Contrasena | Rol |
|---|---|---|
| `admin` | `24112001Edgar` | admin (Ing. Edgar Rojas Apaza) |

Desde **Usuarios** se dan de alta las demas cuentas, y cada una elige sucursal y area al crearse.

### Dejar la base en cero

```bash
cd backend
npm run reiniciar        # muestra que se va a borrar, sin tocar nada
npm run reiniciar -- --si  # confirma y borra
```

Retira tickets, comentarios, adjuntos, notificaciones, inventario, equipos, compras, peticiones
de proyecto, la bitacora y todas las cuentas, y vuelve a crear la administradora. Conserva la
configuracion: roles, permisos, areas, sucursales y categorias.

## Contrasenas

| Regla | Detalle |
|---|---|
| Largo | Al menos **10 caracteres** |
| Espacios | No se admite ninguno, en ningun lugar de la clave |
| Composicion | Al menos una letra y al menos un numero |
| Reutilizacion | No puede ser igual al nombre de usuario ni a la clave actual |
| Previsibles | Se rechaza una lista corta de claves obvias |

La misma politica rige en los tres lugares donde se define una clave: el alta de un usuario, el
cambio que hace cada persona desde el icono de llave de la cabecera, y el restablecimiento que
puede hacer un administrador desde **Usuarios**.

El nombre de usuario se recorta y se pasa a minusculas antes de guardarse, y solo admite letras,
numeros, punto, guion y guion bajo: una comilla se rechaza antes de llegar a la consulta.

## Peticiones de proyecto

Un apartado para que cualquier area proponga una mejora al sistema o una idea de software nueva.
El formulario guia la explicacion en cuatro preguntas, cada una con su ayuda y su largo minimo:

| Pregunta | Que se busca |
|---|---|
| Que problema quiere resolver | La dificultad concreta, no la solucion |
| Como lo resuelven hoy | El procedimiento actual: planillas, correos, papel |
| Como se lo imagina funcionando | Lo que le gustaria poder hacer, sin lenguaje tecnico |
| Que se gana con esto | Tiempo ahorrado, errores evitados, informacion disponible antes |

Se completa con el alcance declarado: a cuantas personas afecta, cada cuanto ocurre, que tan
urgente es y que herramientas usan hoy.

El circuito tiene cinco pasos, visibles en una barra de progreso:

**Registro** que hace el area, **Evaluacion de TI** con esfuerzo y valor estimados, **Aprobacion**
que incorpora la peticion a la cartera y designa responsable, **Desarrollo** con porcentaje de
avance, y **Entrega**. En cualquier punto anterior al cierre puede no aprobarse, siempre con
motivo escrito.

Cada peticion se descarga como ficha en PDF y la cartera completa como reporte.

## Control de acceso (RBAC)## Control de acceso (RBAC)

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
| ADMIN | `admin.sucursales` | Gestion del catalogo de sucursales |
| REPORTES | `reportes.ver` | Consultar tablero de indicadores |
| REPORTES | `reportes.exportar` | Exportar reportes y documentacion en PDF |
| INVENTARIO | `inventario.ver` | Consultar el catalogo y el kardex |
| INVENTARIO | `inventario.articulos` | Gestion CRUD de articulos |
| INVENTARIO | `inventario.movimientos` | Registrar entradas y salidas |
| EQUIPOS | `equipos.ver` | Consultar el parque informatico |
| EQUIPOS | `equipos.gestionar` | Alta, edicion y baja de equipos |
| EQUIPOS | `equipos.credenciales` | Revelar la contrasena de acceso remoto |
| COMPRAS | `compras.solicitar` | Registrar solicitudes de compra de equipos |
| COMPRAS | `compras.ver_todas` | Consultar todas las solicitudes |
| COMPRAS | `compras.revisar` | Revision tecnica y cotizacion |
| COMPRAS | `compras.aprobar` | Aprobacion presupuestaria de Gerencia |
| COMPRAS | `compras.gestionar` | Registrar la compra y la entrega |

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
| `comentario:nuevo` | Servidor a cliente | Mensaje nuevo en la conversacion del ticket |
| `inventario:movimiento` | Servidor a cliente | Entrada o salida registrada en el inventario |

## Documentacion en PDF

Todas las salidas documentales se generan con un unico motor (`backend/src/services/pdf/`) que
garantiza identidad visual uniforme: encabezado institucional, iconografia vectorial trazada,
tablas con encabezado repetido y pie de pagina de autoria en cada hoja. **No se utilizan emojis
en ninguna salida del sistema.**

| Documento | Origen | Emision |
|---|---|---|
| Acta de ticket | `GET /tickets/:id/pdf` | Bajo demanda y automatica en cada transicion |
| Inventario | `GET /inventario/reporte/pdf` | Bajo demanda desde el modulo |
| Kardex de articulo | `GET /inventario/articulos/:id/kardex/pdf` | Bajo demanda desde el listado |
| Parque de equipos | `GET /equipos/reporte/pdf` | Bajo demanda desde el modulo |
| Ficha de equipo | `GET /equipos/:id/ficha/pdf` | Bajo demanda desde el listado |
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
| GET | `/inventario/articulos` | `inventario.ver` |
| POST/PUT/DELETE | `/inventario/articulos` | `inventario.articulos` |
| POST | `/inventario/articulos/:id/movimientos` | `inventario.movimientos` |
| GET | `/inventario/movimientos` | `inventario.ver` |
| GET | `/equipos` | `equipos.ver` |
| POST/PUT/DELETE | `/equipos` | `equipos.gestionar` |
| GET | `/equipos/:id/credenciales` | `equipos.credenciales` |
| GET | `/sucursales` | Autenticado (alta: `admin.sucursales`) |
| GET/POST | `/compras` | `compras.solicitar` / `compras.ver_todas` |
| PUT | `/compras/:id/aprobar-ti` | `compras.revisar` |
| PUT | `/compras/:id/aprobar-gerencia` | `compras.aprobar` |
| GET | `/permisos` | `admin.roles` |
| GET | `/notificaciones` | Autenticado |
| GET | `/auditoria` | `reportes.ver` / `admin.usuarios` |

## Sucursales

El usuario pertenece a una **sucursal** y a un **area**, dos dimensiones independientes: las
mismas areas funcionales existen en varias sucursales, de modo que separarlas evita duplicar el
catalogo y permite cortar los indicadores por cualquiera de las dos.

| Codigo | Sucursal | Tipo |
|---|---|---|
| SCZ | Fabrica Santa Cruz | Fabrica, sede del sistema |
| SILO | Silos Central de Insumos | Planta |
| LP, CBBA, SRE, ORU | La Paz, Cochabamba, Sucre y Oruro | Sucursales |

El catalogo es administrable desde **Sucursales**: las oficinas futuras, como Distribucion
Central o Venta Privada, se agregan sin tocar el codigo.

El **ticket, el equipo y la solicitud de compra heredan la sucursal** de quien los origina, sin
preguntarla, de modo que siempre se sabe desde donde se pide. El area de TI ve el conjunto de
las sucursales; la sucursal funciona como dato y filtro, no como restriccion de acceso.

## Solicitudes de compra

Circuito propio para el pedido de equipos, que cualquier solicitante puede iniciar:

| Estado | Quien actua | Que ocurre |
|---|---|---|
| Solicitada | Solicitante | Registra el pedido con su justificacion |
| En revision | TI | Evalua la viabilidad tecnica y cotiza |
| Aprobada por TI | TI | Da el visto bueno tecnico y eleva a Gerencia |
| Aprobada por Gerencia | Gerencia | Aprueba el presupuesto |
| Comprada | TI | Registra la orden de compra y el monto final |
| Entregada | TI | Entrega el equipo y lo vincula al parque |
| Rechazada | TI o Gerencia | Rechaza con motivo, antes de la compra |

Cada instancia registra **quien actuo y con que cargo**: la ficha y el PDF de la solicitud
muestran el nombre, el area y la fecha de quien aprobo, con una constancia destacada de la
aprobacion presupuestaria de Gerencia.

**El orden se valida en el servidor**: Gerencia no puede aprobar antes que TI, ni se puede
registrar una compra sin aprobacion previa. Cada paso avisa a quien corresponde y queda
asentado en la bitacora. Al entregar, la solicitud puede vincularse al equipo dado de alta en el
parque, cerrando la trazabilidad entre el pedido y el activo.

## Equipos de la empresa

Parque informatico con la asignacion de cada maquina y sus datos de acceso remoto:

| Grupo | Datos registrados |
|---|---|
| Identificacion | Codigo, nombre, tipo, marca, modelo y numero de serie |
| Caracteristicas | Sistema operativo, procesador, memoria RAM y almacenamiento |
| Conectividad | Direccion IP y MAC, ambas validadas por formato |
| Acceso remoto | Identificador de AnyDesk y contrasena |
| Asignacion | Usuario responsable, area, ubicacion, estado y fecha |

### Tratamiento de la contrasena de acceso remoto

La contrasena de AnyDesk **no se guarda en texto plano**. Se cifra con AES-256-GCM y una clave
derivada por scrypt de la variable `CLAVE_CIFRADO`; la etiqueta de autenticidad permite detectar
cualquier alteracion del dato almacenado.

- No viaja en los listados: la respuesta solo informa si existe contrasena registrada.
- Revelarla exige el permiso `equipos.credenciales` y **queda asentada en la bitacora** con el
  usuario que la consulto y la fecha.
- Ningun PDF exportable incluye contrasenas.

Si se pierde la semilla `CLAVE_CIFRADO`, las contrasenas guardadas dejan de poder descifrarse y
deben registrarse nuevamente. Conservela junto con el resto de los secretos del despliegue.

Para cargar un parque de ejemplo: `cd backend && npm run demo`.

## Codigo de los equipos

Cada equipo lleva un codigo con tres partes: **TIPO-UBICACION-NUMERO**.

| Tipo | Prefijo | Ejemplo |
|---|---|---|
| Servidor | `SRV` | `SRV-IBS-001` |
| PC | `PC` | `PC-ADM-001` |
| Laptop | `LAP` | `LAP-VTA-007` |
| Switch | `SW` | `SW-RACK01-001` |
| Router | `RTR` | `RTR-RACK01-001` |
| Telefonia | `TEL` | `TEL-ADM-001` |
| Camara | `CAM` | `CAM-ALM-001` |
| Impresora | `IMP` | `IMP-CONT-001` |
| Monitor | `MON` | `MON-ADM-014` |
| UPS | `UPS` | `UPS-RACK01-001` |
| Otro | `EQ` | `EQ-DEP-001` |

El prefijo lo define el tipo y no se escribe a mano. La ubicacion la elige quien da de alta el
equipo (ADM, ALM, RACK01, VTA, CONT) y el numero lo propone el sistema: consulta el ultimo
usado para ese tipo en esa ubicacion y sugiere el siguiente. Si se elige un prefijo que no
corresponde al tipo, la peticion se rechaza con el motivo.

## Inventario de sistemas

Catalogo de articulos con kardex de movimientos. El saldo **nunca se edita a mano**: resulta
exclusivamente de los movimientos registrados, cada uno con su saldo anterior y resultante.

| Movimiento | Efecto |
|---|---|
| Entrada | Incrementa el saldo (compras, devoluciones al deposito) |
| Salida | Descuenta el saldo; se rechaza si no alcanza el stock disponible |
| Ajuste | Fija el saldo en la cantidad indicada, para recuentos fisicos |

Cada articulo lleva ademas su **situacion**, independiente del saldo:

| Situacion | Significado |
|---|---|
| Disponible | En condiciones de uso |
| En reparacion | Enviado a servicio tecnico |
| En resguardo | Retirado de circulacion de forma temporal |
| De baja | Retirado definitivamente; no admite movimientos |

Se cambia desde la accion correspondiente del listado, dejando el motivo asentado en la
bitacora. Darlo de baja lo retira de los activos; volver a Disponible lo reactiva.

La fila del articulo se bloquea durante la transaccion (`SELECT ... FOR UPDATE`), de modo que
dos movimientos simultaneos no dejan un saldo erroneo. Un movimiento puede asociarse a un
ticket, dejando trazabilidad del consumo, y al caer por debajo del minimo definido se avisa al
equipo tecnico. La baja de un articulo es logica: conserva su kardex historico.

Para cargar un catalogo inicial de ejemplo: `cd backend && npm run demo`.

## Limites de carga

Todos los listados extensos responden paginados: tickets, usuarios, auditoria, articulos y
movimientos. El limite por defecto es de **25 registros** y el maximo admitido es de **200**,
acotado en el servidor mediante `backend/src/utils/paginacion.js`. Un cliente no puede pedir la
tabla completa, ni siquiera manipulando la consulta.

Cada respuesta paginada incluye el bloque `paginacion` con el total, la pagina vigente, la
cantidad de paginas y el rango mostrado.

## Tema claro y oscuro

La interfaz admite ambos temas. El interruptor esta en la cabecera y la preferencia queda
guardada en el navegador; sin preferencia previa se respeta la del sistema operativo.

## Conversacion y adjuntos

Cada ticket incluye un hilo de mensajes entre el solicitante y el tecnico, con envio de
capturas de pantalla y documentos: hasta cinco archivos por mensaje, de 5 MB cada uno, en
formato PNG, JPEG, WEBP, GIF o PDF. Las imagenes se muestran como miniatura y se amplian
dentro de la aplicacion.

Los archivos se guardan con un nombre opaco en `backend/storage/adjuntos/` y se entregan
unicamente a traves de `GET /adjuntos/:id`, que verifica la visibilidad del ticket antes de
responder: un solicitante no puede leer los archivos de un ticket ajeno. Cada mensaje queda
registrado en la bitacora de auditoria y avisa a la contraparte en tiempo real.

## Catalogo de categorias

La clasificacion del ticket no esta fija en el codigo: se administra desde
**Categorias** en el panel, con nombre, descripcion, color e icono propios. El backend
valida cada ticket contra el catalogo y, al renombrar una categoria, propaga el cambio a
los tickets ya registrados. La baja es logica, de modo que el historial conserva su
clasificacion aunque la categoria deje de ofrecerse.

## Seguridad aplicada

### La sesion no vive en el navegador

Al iniciar sesion el servidor deja dos cookies complementarias:

| Cookie | Visible para la pagina | Para que sirve |
|---|---|---|
| `tickets_sesion` | No (`httpOnly`) | Transporta la credencial. El navegador la envia sola y ningun script puede leerla |
| `tickets_csrf` | Si | Token de verificacion de origen que la aplicacion reenvia por cabecera |

Ambas se emiten con `SameSite=Strict` y, en produccion, con `Secure`. Toda operacion de
escritura hecha desde el navegador debe repetir el token de origen en la cabecera
`X-CSRF-Token`; el servidor lo compara con la cookie en tiempo constante. Un sitio ajeno puede
provocar que el navegador envie la cookie de sesion, pero no puede leer la segunda cookie para
reproducir la cabecera, de modo que la peticion se rechaza con 403.

La aplicacion movil conserva el esquema con cabecera `Authorization: Bearer`, que no es
explotable por peticiones forjadas entre sitios y por eso queda exento de la verificacion.

### Controles vigentes

- Contrasenas almacenadas con hash bcrypt (10 rondas).
- Identidad tomada exclusivamente del token; el cliente nunca envia el identificador de usuario.
- Guard de permisos atomicos por endpoint, con verificacion adicional de propiedad del ticket.
- Bloqueo temporal por cuenta: cinco intentos fallidos en quince minutos la bloquean otros
  quince. Detiene el ataque dirigido aunque el atacante rote de direccion de origen.
- Freno por direccion: 300 peticiones por minuto en general y 40 intentos **fallidos** de
  acceso cada diez minutos. Los ingresos correctos no consumen el cupo, para que una oficina
  entera detras de una sola direccion publica no se quede fuera.
- Retardo progresivo ante intentos fallidos: a partir del quinto, cada intento adicional
  responde medio segundo mas lento, hasta cinco segundos. Una persona no lo nota; un
  automatismo pasa de miles de pruebas por minuto a unas pocas decenas.
- Verificacion del origen declarado: toda escritura hecha con cookie debe partir de un origen
  autorizado. El navegador no permite falsear `Origin` desde la pagina, de modo que es una
  segunda barrera independiente del token de verificacion.
- La API esta **cerrada por omision**: una ruta que nadie declaro publica exige credencial
  aunque su autor haya olvidado el guardia. La unica ruta abierta es `POST /auth/login`.
- Politica de contenido restrictiva, `nosniff`, `SAMEORIGIN`, referente suprimido, HSTS en
  produccion y ocultamiento de la tecnologia del servidor.
- CORS restringido por lista de origenes, con credenciales habilitadas.
- Cuerpo de peticion limitado a 1 MB y esquemas de validacion declarativos por endpoint.
- Consultas siempre parametrizadas.
- Credenciales de acceso remoto cifradas con AES-256-GCM y clave derivada por scrypt; el
  listado nunca las expone y se revelan solo bajo peticion autorizada.
- Las respuestas del circuito de sesion y la entrega de adjuntos se marcan `no-store`.
- Bajas logicas en usuarios y areas para preservar la trazabilidad historica de los tickets.
- Bitacora de auditoria de cada operacion, exportable en PDF.

### Secretos obligatorios en produccion

Con `NODE_ENV=production` el servicio **se niega a arrancar** si `JWT_SECRET`, `CLAVE_CIFRADO`
o `DB_PASSWORD` conservan el valor del archivo de ejemplo o tienen menos de 24 caracteres.
Genere cada uno con:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

La cookie de sesion se marca `Secure` en produccion, lo que exige HTTPS. En una instalacion
interna que todavia no tiene certificado, defina `COOKIE_SECURE=false` de forma explicita; de
lo contrario el navegador nunca enviara la sesion.

### Conexiones cifradas

Con `FORZAR_HTTPS=true` toda peticion que llegue en claro se reconduce: las lecturas responden
un redireccion permanente a `https://`, y las escrituras se rechazan en lugar de redirigirse,
porque un redireccion perderia el cuerpo y el cliente no sabria que su dato viajo sin cifrar.

Detras de un balanceador la conexion interna siempre parece HTTP; la aplicacion confia en el
primer proxy y consulta `X-Forwarded-Proto` para saber como llego realmente el visitante.

**Es recomendable de cara a internet, si.** Sin HTTPS la sesion viaja legible por cualquier
punto intermedio de la red y toda la proteccion de la cookie deja de tener sentido. En una red
interna sin certificado, dejelo en `false` junto con `COOKIE_SECURE=false`.

### La API no se conecta como dueña de las tablas

Hasta la version 1.8.0 la aplicacion usaba la cuenta propietaria del esquema, capaz de borrar
o alterar cualquier tabla. Ahora existe un rol de trabajo con privilegios recortados:

```bash
cd backend
# Genere una clave y creela con las credenciales administradoras
npm run privilegios
# Luego apunte DB_USER y DB_PASSWORD de .env al rol creado
```

| Puede | No puede |
|---|---|
| Leer, insertar, modificar y borrar filas | Crear, alterar o destruir tablas |
| Usar los contadores de identidad | Vaciar tablas de un golpe (`TRUNCATE`) |
| Conectarse a la base | Crear roles, bases ni omitir politicas de seguridad |

Asi, una falla de inyeccion en cualquier consulta queda acotada a los datos: no puede llevarse
por delante la estructura. Las tablas que se creen en el futuro heredan el mismo criterio.

### Sobre la seguridad por fila (RLS): no es lo que hace falta aqui

**No la recomiendo para esta arquitectura, y la razon es concreta.** La seguridad por fila
tiene sentido cuando el cliente habla directamente con la base de datos, como en Supabase o
PostgREST: ahi es la unica frontera que queda. En este sistema la base **nunca es alcanzable
por el cliente**; la API es la unica puerta, y la autorizacion ya se decide en ella con
permisos atomicos por endpoint mas verificacion de propiedad, comprobado por 70 pruebas.

Hay ademas un detalle tecnico decisivo: **el dueño de una tabla omite las politicas de
seguridad por fila** salvo que se declaren forzadas. Mientras la API se conectara como
propietaria, activar RLS habria dado una falsa sensacion de proteccion sin efecto real. Por eso
lo que se hizo fue quitarle esa propiedad, que es el requisito previo y, por si solo, aporta
mas que la politica.

Si en el futuro se decide exponer PostgreSQL directamente a algun cliente, entonces si
corresponde: el rol `tickets_api` ya esta preparado con `NOBYPASSRLS` y bastaria agregar las
politicas y fijar la identidad del usuario por transaccion.

### Proteccion contra automatismos

No se usa un desafio visual de terceros: obligaria a cargar codigo externo, romperia la
politica de contenido y entregaria el trafico de la empresa a un tercero. En su lugar actuan
tres controles propios que no dependen de nadie:

| Control | Efecto sobre un automatismo |
|---|---|
| Retardo progresivo | Cada intento fallido adicional responde mas lento, hasta cinco segundos |
| Bloqueo por cuenta | Cinco fallos en quince minutos dejan la cuenta fuera otros quince |
| Origen obligatorio | Un guion que no imita un navegador completo no supera la verificacion |

Los tres castigan unicamente el fracaso: quien entra bien nunca los nota.

## Pruebas automatizadas

La bateria recorre el sistema de extremo a extremo contra la API en ejecucion.

```bash
cd backend
npm run qa             # las cuatro baterias, una tras otra
npm run qa:secretos    # credenciales en el codigo y en todo el historial de git
npm run qa:seguridad   # cookies, origen, cabeceras, bloqueo, cache y acceso cerrado
npm run qa:funcional   # los once accesos y todos los modulos del sistema
npm run qa:tiempo-real # canal de WebSockets y reparto por salas
npm run qa:compras     # el circuito de compras avanzando en tiempo real
npm run qa:proyectos   # peticiones de proyecto, contrasenas e inyeccion SQL
npm run qa:documentos  # que los PDF salgan al tamano pedido, sin hojas en blanco
npm run qa:navegador   # recorrido completo atravesando el servidor web
npm run qa:limpiar     # retira de la base los datos que dejan las pruebas
```

| Bateria | Que comprueba | Resultado |
|---|---|---|
| Secretos | Configuracion fuera del control de versiones, historial completo del repositorio, credenciales incrustadas y claves de ejemplo | 7 de 7 |
| Seguridad | Cookies de sesion, verificacion de origen, cabeceras, bloqueo por intentos, cache, acceso cerrado por omision y cierre de sesion | 34 de 34 |
| Funcional | Acceso de las cuentas del entorno, catalogos, ciclo completo del ticket, inventario, equipos, compras con doble aprobacion, tablero, notificaciones, auditoria, paginacion, documentos PDF, validacion de entrada, alcance de Gerencia y reporte mensual | 104 de 104 |
| Tiempo real | Ingreso al canal, reparto por salas, aviso inmediato y rechazo de conexiones sin sesion | 4 de 4 |
| Compras en tiempo real | Que Gerencia entre a la sala del circuito y vea cada cambio de estado sin recargar | 6 de 6 |
| Proyectos y claves | Circuito de las peticiones, politica de contrasenas, restablecimiento por un administrador y cargas de inyeccion SQL sobre las busquedas | 44 de 44 |
| Documentos | Que cada PDF salga al tamano de lo que se pide y sin hojas en blanco | 15 de 15 |
| Navegador | Recorrido de punta a punta contra el servidor web: portada, acceso, las doce pantallas, ciclo del ticket, descarga de PDF y cierre de sesion | 28 de 28 |

**248 comprobaciones**, todas en verde, con la API conectada por el rol de privilegios
recortados. La bateria del navegador requiere el servidor web levantado (`npm run dev` en
`frontend`); las otras cuatro solo necesitan la API.

Las baterias son autosuficientes: crean sus propias cuentas (`qa.*`), su articulo de inventario
y su equipo, y todo lo que registran lleva el prefijo `QA - `. `npm run qa:limpiar` retira las
cuentas y los registros de prueba sin tocar la informacion real de la empresa, de modo que la
suite se puede correr sobre una base recien reiniciada.

## Puntos pendientes conocidos

No son defectos del sistema construido, sino trabajo de puesta en produccion o alcances aun no
solicitados. Se enumeran para que la decision sobre cada uno quede documentada.

| Punto | Situacion actual | Prioridad |
|---|---|---|
| Aplicacion movil | El codigo esta escrito y consume la API con cabecera `Authorization`, pero no se ha compilado ni probado sobre un dispositivo real | Alta si se usara en campo |
| Certificado HTTPS | Sin certificado hay que desactivar `COOKIE_SECURE` y `FORZAR_HTTPS` de forma explicita | Alta antes de publicar |
| Respaldo de la base | No hay tarea programada de respaldo ni prueba de restauracion | Alta antes de publicar |
| Revocacion de sesiones | El token vale hasta su vencimiento; desactivar un usuario no corta la sesion ya abierta | Media |
| Estado entre instancias | Cache, bloqueo por intentos y freno por origen viven en memoria del proceso; con varias instancias haria falta un almacen comun | Media si se escala |
| Cambio de clave obligatorio | Las cuentas se entregan con una contrasena inicial conocida y el sistema no exige cambiarla al primer ingreso | Media |
| Aviso por correo | Los avisos llegan por el canal en tiempo real y la bandeja interna, no por correo | Baja |
| Pruebas unitarias | La verificacion es de extremo a extremo; no hay pruebas unitarias por funcion | Baja |
| Dependencias de la app movil | No se instalaron nunca, de modo que no se pudo auditar su arbol de dependencias | Media |
| Revision periodica de dependencias | `npm audit` esta limpio hoy; no hay revision automatica que avise de un aviso nuevo | Media |

---

**Ing. Edgar Rojas Apaza** | Desarrollo de Modulo de Tickets
Documento de referencia: Version 2.4.0
