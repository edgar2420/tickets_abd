export const cachearEnCliente = (segundos = 60) => (_req, res, next) => {
  res.set('Cache-Control', `private, max-age=${segundos}, must-revalidate`);
  next();
};

export const sinCache = (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
};
