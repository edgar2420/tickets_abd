# Arquitectura del sistema

Guia para saber donde va cada cosa. Si va a agregar una pantalla, un endpoint o un
modulo nuevo, esta pagina dice exactamente que archivos tocar.

---

## Regla unica

**Todo lo de un tema vive en la carpeta de ese tema.** Compras no toca archivos de
inventario, inventario no toca archivos de equipos. Lo que comparten los tres esta en
las carpetas compartidas, y solo ahi.

---

## Frontend

```
frontend/src/
├── App.tsx                 Arranque: proveedores y enrutado
├── rutas.tsx               Tabla de rutas: una linea por pantalla
├── components/             Compartido por todos los modulos
├── context/                Sesion, tema y notificaciones
├── lib/                    api, socket, formato, tipos
└── modulos/
    ├── acceso/
    ├── tablero/
    ├── tickets/
    ├── inventario/
    ├── equipos/
    ├── compras/
    ├── proyectos/
    ├── auditoria/
    └── administracion/
```

### Anatomia de un modulo

Los modulos grandes siguen siempre la misma forma. Compras es la referencia:

```
modulos/compras/
├── index.ts                Lo que el modulo expone hacia afuera
├── Compras.tsx             Composicion: arma la pantalla con las piezas
├── constantes.ts           Estados, estilos, formulario vacio, cuerpos de peticion
├── recorrido.ts            Reglas propias del circuito de aprobacion
├── acciones.ts             Que acciones existen, con que permiso y en que estado
├── usarCompras.ts          Estado, peticiones, filtros, paginacion, tiempo real
└── componentes/
    ├── Indicadores.tsx
    ├── Filtros.tsx
    ├── Tabla.tsx
    ├── Recorrido.tsx
    ├── Ficha.tsx
    ├── FormularioSolicitud.tsx
    └── FormularioAccion.tsx
```

| Archivo | Responsabilidad |
|---|---|
| `Pantalla.tsx` | Solo compone. No consulta ni calcula |
| `usarX.ts` | Todo lo que habla con el servidor y guarda estado |
| `constantes.ts` | Valores fijos: listas, estilos, formularios vacios |
| `acciones.ts` | Reglas de que se puede hacer y quien puede hacerlo |
| `componentes/` | Piezas visuales. Reciben datos por props, no consultan |

Ningun archivo pasa de unas 250 lineas. Si uno crece, se parte.

### Agregar una pantalla

1. Cree `modulos/<tema>/MiPantalla.tsx`.
2. Expórtela en `modulos/<tema>/index.ts`.
3. Agregue **una linea** en `rutas.tsx`:

```tsx
{ path: '/mi-pantalla', elemento: <MiPantalla />, permisos: ['mi.permiso'] }
```

El menu lateral y el guardia de permisos toman esa entrada solos. No hay nada mas
que tocar en `App.tsx`.

### Agregar una accion a un circuito

En `modulos/compras/acciones.ts`, agregue una entrada al catalogo:

```ts
{
  tipo: 'anular',
  rotulo: 'Anular la solicitud',
  icono: XCircle,
  tono: 'peligro',
  permisos: ['compras.gestionar'],
  estados: ['Comprada']
}
```

El boton aparece solo en la tabla, con el permiso y el estado correctos. Despues se
agrega su cuerpo en `cuerpoDeAccion()` y su formulario en `FormularioAccion.tsx`.

---

## Backend

```
backend/src/
├── server.js               Arranque HTTP y WebSockets
├── app.js                  Middlewares y montaje de los routers
├── config/                 Entorno y conexion a la base
├── middleware/             Autenticacion, permisos, CSRF, origen, cache, errores
├── realtime/               Salas y difusion de eventos
├── services/               Auditoria, notificaciones, cache, PDF, cifrado
├── scripts/                migrate, seed, demo, privilegios
└── modules/
    └── <tema>/
        ├── <tema>.routes.js
        ├── <tema>.controller.js
        └── <tema>.service.js
```

### Agregar un modulo

1. Cree `modules/<tema>/<tema>.routes.js`.
2. Impórtelo y móntelo en `app.js`:

```js
api.use('/<tema>', <tema>Router);
```

Queda protegido por omision: la API exige credencial salvo en las rutas declaradas
abiertas en `middleware/accesoCerrado.js`.

3. Si necesita tabla, agregue `db/NN_<tema>.sql`. Las migraciones se aplican en orden
   alfabetico y deben ser idempotentes (`IF NOT EXISTS`).

---

## Base de datos

Dos roles distintos, a proposito:

| Rol | Para que | Puede |
|---|---|---|
| `postgres` (o el dueño) | Migraciones | Crear y alterar estructuras |
| `tickets_api` | La aplicacion en marcha | Solo leer y escribir filas |

`npm run migrate` usa las credenciales administradoras; la API usa el rol recortado.
Asi una falla en la aplicacion no alcanza a la estructura.

---

## Pruebas

```
backend/qa/
├── secretos.mjs            Credenciales en el codigo y en el historial de git
├── seguridad.mjs           Cookies, origen, cabeceras, bloqueo, cache
├── funcional.mjs           Todos los modulos de extremo a extremo
├── tiempo-real.mjs         Canal de WebSockets
├── compras-tiempo-real.mjs Circuito de compras avanzando en vivo
├── proyectos.mjs           Peticiones de proyecto, contrasenas e inyeccion SQL
├── documentos.mjs          Tamano de los PDF y ausencia de hojas en blanco
├── navegador.mjs           Recorrido completo atravesando el servidor web
├── preparar.mjs            Crea las cuentas de prueba que usan las demas baterias
└── limpiar.mjs             Retira los datos y las cuentas que dejan las pruebas
```

Las baterias no dependen de datos preexistentes: `preparar.mjs` da de alta las cuentas `qa.*`
que necesitan y cada bateria crea los registros que va a usar. La suite corre igual sobre una
base recien reiniciada.

Todo lo que crean las pruebas lleva el prefijo `QA - ` en el titulo.

---

## Convenciones

- **Nombres en español**, como el resto del sistema.
- **Sin comentarios en el codigo.** Si un bloque necesita explicacion, se parte en
  funciones con nombre propio hasta que se lea solo.
- **Sin emojis** en ningun archivo.
- Los hooks se llaman `usarAlgo`. Los manejadores de evento, `alHacerAlgo`.

---

**Ing. Edgar Rojas Apaza** | Desarrollo de Modulo de Tickets
