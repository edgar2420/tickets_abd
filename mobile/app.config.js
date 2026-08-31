// La direccion de la API cambia segun donde se abra la aplicacion:
//   emulador de Android : http://10.0.2.2:4000       (alias del anfitrion)
//   telefono real       : http://192.168.0.37:4000   (la IP de la maquina en la red)
//
// Se define sin tocar el codigo, al levantar Expo:
//   API_URL=http://192.168.0.37:4000 npx expo start
const servidor = process.env.API_URL ?? 'http://10.0.2.2:4000';

module.exports = {
  expo: {
    name: 'Tickets TI',
    slug: 'tickets-ti',
    version: '2.17.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    backgroundColor: '#0F2A47',
    splash: {
      resizeMode: 'contain',
      backgroundColor: '#0F2A47'
    },
    assetBundlePatterns: ['**/*'],
    ios: { supportsTablet: true, bundleIdentifier: 'bo.empresa.ticketsti' },
    android: {
      package: 'bo.empresa.ticketsti',
      adaptiveIcon: { backgroundColor: '#0F2A47' }
    },
    extra: {
      apiUrl: `${servidor}/api/v1`,
      socketUrl: servidor
    }
  }
};
