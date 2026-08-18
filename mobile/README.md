# Aplicacion Movil - Sistema de Gestion de Tickets TI

Aplicacion Expo / React Native que consume la misma API REST y el mismo canal de
WebSockets que la aplicacion web.

## Puesta en marcha

```
npm install
npm start
```

## Configuracion del servidor

La direccion de la API se define en `app.json`, seccion `expo.extra`:

- Emulador Android: `http://10.0.2.2:4000`
- Dispositivo fisico: la IP del equipo que ejecuta la API, por ejemplo `http://192.168.1.20:4000`

## Funcionalidades

- Autenticacion JWT con sesion persistente en el dispositivo.
- Listado de tickets con alcance segun los permisos del rol.
- Registro de nuevos tickets.
- Atencion, resolucion y cierre de tickets segun permisos.
- Notificaciones en tiempo real por WebSockets.

---

Ing. Edgar Rojas Apaza - Desarrollo de Modulo de Tickets
