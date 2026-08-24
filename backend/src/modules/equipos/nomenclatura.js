export const TIPOS = [
  'Servidor', 'PC', 'Laptop', 'Switch', 'Router', 'Telefonia',
  'Camara', 'Impresora', 'Monitor', 'UPS', 'Otro'
];

export const PREFIJOS = {
  Servidor: 'SRV',
  PC: 'PC',
  Laptop: 'LAP',
  Switch: 'SW',
  Router: 'RTR',
  Telefonia: 'TEL',
  Camara: 'CAM',
  Impresora: 'IMP',
  Monitor: 'MON',
  UPS: 'UPS',
  Otro: 'EQ'
};

export const FORMATO_CODIGO = /^[A-Z]{2,4}-[A-Z0-9]{2,10}-\d{3}$/;

export const FORMATO_UBICACION = /^[A-Z0-9]{2,10}$/;

export const partesDelCodigo = (codigo) => {
  const [prefijo, ubicacion, correlativo] = String(codigo ?? '').toUpperCase().split('-');
  return { prefijo, ubicacion, correlativo };
};

export const componer = (tipo, ubicacion, numero) =>
  `${PREFIJOS[tipo] ?? 'EQ'}-${String(ubicacion).toUpperCase()}-${String(numero).padStart(3, '0')}`;

export const revisarCodigo = (codigo, tipo) => {
  const valor = String(codigo ?? '').toUpperCase();
  if (!FORMATO_CODIGO.test(valor)) {
    return 'El codigo debe seguir el formato TIPO-UBICACION-NUMERO, por ejemplo PC-ADM-001';
  }
  const { prefijo } = partesDelCodigo(valor);
  const esperado = PREFIJOS[tipo];
  if (esperado && prefijo !== esperado) {
    return `Un equipo de tipo ${tipo} debe llevar el prefijo ${esperado}, no ${prefijo}`;
  }
  return null;
};
