
const preparar = (doc, color, tam) => {
  doc.save();
  doc.lineWidth(Math.max(0.8, tam * 0.08));
  doc.strokeColor(color);
  doc.fillColor(color);
};

const cerrar = (doc) => doc.restore();

export const iconos = {
  ticket(doc, x, y, s, color) {
    preparar(doc, color, s);
    doc.roundedRect(x, y + s * 0.2, s, s * 0.6, s * 0.08).stroke();
    doc.circle(x, y + s * 0.5, s * 0.09).fillColor('white').fill();
    doc.circle(x + s, y + s * 0.5, s * 0.09).fillColor('white').fill();
    doc.strokeColor(color);
    doc.moveTo(x + s * 0.35, y + s * 0.32).lineTo(x + s * 0.35, y + s * 0.68).dash(1.5, { space: 1.5 }).stroke();
    doc.undash();
    cerrar(doc);
  },
  usuario(doc, x, y, s, color) {
    preparar(doc, color, s);
    doc.circle(x + s * 0.5, y + s * 0.32, s * 0.2).stroke();
    doc.moveTo(x + s * 0.15, y + s * 0.85)
      .bezierCurveTo(x + s * 0.15, y + s * 0.55, x + s * 0.85, y + s * 0.55, x + s * 0.85, y + s * 0.85)
      .stroke();
    cerrar(doc);
  },
  escudo(doc, x, y, s, color) {
    preparar(doc, color, s);
    doc.moveTo(x + s * 0.5, y + s * 0.08)
      .lineTo(x + s * 0.88, y + s * 0.25)
      .lineTo(x + s * 0.88, y + s * 0.55)
      .bezierCurveTo(x + s * 0.88, y + s * 0.78, x + s * 0.7, y + s * 0.88, x + s * 0.5, y + s * 0.95)
      .bezierCurveTo(x + s * 0.3, y + s * 0.88, x + s * 0.12, y + s * 0.78, x + s * 0.12, y + s * 0.55)
      .lineTo(x + s * 0.12, y + s * 0.25)
      .closePath().stroke();
    cerrar(doc);
  },
  reloj(doc, x, y, s, color) {
    preparar(doc, color, s);
    doc.circle(x + s * 0.5, y + s * 0.5, s * 0.42).stroke();
    doc.moveTo(x + s * 0.5, y + s * 0.5).lineTo(x + s * 0.5, y + s * 0.25).stroke();
    doc.moveTo(x + s * 0.5, y + s * 0.5).lineTo(x + s * 0.68, y + s * 0.6).stroke();
    cerrar(doc);
  },
  check(doc, x, y, s, color) {
    preparar(doc, color, s);
    doc.circle(x + s * 0.5, y + s * 0.5, s * 0.42).stroke();
    doc.moveTo(x + s * 0.28, y + s * 0.52).lineTo(x + s * 0.45, y + s * 0.68).lineTo(x + s * 0.74, y + s * 0.33).stroke();
    cerrar(doc);
  },
  alerta(doc, x, y, s, color) {
    preparar(doc, color, s);
    doc.moveTo(x + s * 0.5, y + s * 0.08).lineTo(x + s * 0.95, y + s * 0.88).lineTo(x + s * 0.05, y + s * 0.88).closePath().stroke();
    doc.moveTo(x + s * 0.5, y + s * 0.35).lineTo(x + s * 0.5, y + s * 0.62).stroke();
    doc.circle(x + s * 0.5, y + s * 0.75, s * 0.045).fill();
    cerrar(doc);
  },
  engranaje(doc, x, y, s, color) {
    preparar(doc, color, s);
    const cx = x + s * 0.5, cy = y + s * 0.5, r = s * 0.28;
    doc.circle(cx, cy, r).stroke();
    doc.circle(cx, cy, s * 0.11).stroke();
    for (let i = 0; i < 8; i += 1) {
      const a = (Math.PI / 4) * i;
      doc.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
        .lineTo(cx + Math.cos(a) * (r + s * 0.14), cy + Math.sin(a) * (r + s * 0.14))
        .stroke();
    }
    cerrar(doc);
  },
  documento(doc, x, y, s, color) {
    preparar(doc, color, s);
    doc.moveTo(x + s * 0.18, y + s * 0.06)
      .lineTo(x + s * 0.64, y + s * 0.06)
      .lineTo(x + s * 0.84, y + s * 0.26)
      .lineTo(x + s * 0.84, y + s * 0.94)
      .lineTo(x + s * 0.18, y + s * 0.94)
      .closePath().stroke();
    doc.moveTo(x + s * 0.64, y + s * 0.06).lineTo(x + s * 0.64, y + s * 0.26).lineTo(x + s * 0.84, y + s * 0.26).stroke();
    [0.45, 0.6, 0.75].forEach((f) => doc.moveTo(x + s * 0.3, y + s * f).lineTo(x + s * 0.72, y + s * f).stroke());
    cerrar(doc);
  },
  grafico(doc, x, y, s, color) {
    preparar(doc, color, s);
    doc.moveTo(x + s * 0.1, y + s * 0.1).lineTo(x + s * 0.1, y + s * 0.9).lineTo(x + s * 0.92, y + s * 0.9).stroke();
    doc.rect(x + s * 0.24, y + s * 0.58, s * 0.14, s * 0.32).stroke();
    doc.rect(x + s * 0.45, y + s * 0.38, s * 0.14, s * 0.52).stroke();
    doc.rect(x + s * 0.66, y + s * 0.22, s * 0.14, s * 0.68).stroke();
    cerrar(doc);
  },
  baseDatos(doc, x, y, s, color) {
    preparar(doc, color, s);
    doc.ellipse(x + s * 0.5, y + s * 0.2, s * 0.36, s * 0.12).stroke();
    doc.moveTo(x + s * 0.14, y + s * 0.2).lineTo(x + s * 0.14, y + s * 0.78).stroke();
    doc.moveTo(x + s * 0.86, y + s * 0.2).lineTo(x + s * 0.86, y + s * 0.78).stroke();
    doc.ellipse(x + s * 0.5, y + s * 0.5, s * 0.36, s * 0.12).stroke();
    doc.ellipse(x + s * 0.5, y + s * 0.78, s * 0.36, s * 0.12).stroke();
    cerrar(doc);
  },
  flujo(doc, x, y, s, color) {
    preparar(doc, color, s);
    doc.moveTo(x + s * 0.1, y + s * 0.5).lineTo(x + s * 0.78, y + s * 0.5).stroke();
    doc.moveTo(x + s * 0.6, y + s * 0.32).lineTo(x + s * 0.86, y + s * 0.5).lineTo(x + s * 0.6, y + s * 0.68).stroke();
    cerrar(doc);
  },
  red(doc, x, y, s, color) {
    preparar(doc, color, s);
    doc.circle(x + s * 0.5, y + s * 0.16, s * 0.11).stroke();
    doc.circle(x + s * 0.16, y + s * 0.82, s * 0.11).stroke();
    doc.circle(x + s * 0.84, y + s * 0.82, s * 0.11).stroke();
    doc.moveTo(x + s * 0.44, y + s * 0.26).lineTo(x + s * 0.22, y + s * 0.72).stroke();
    doc.moveTo(x + s * 0.56, y + s * 0.26).lineTo(x + s * 0.78, y + s * 0.72).stroke();
    doc.moveTo(x + s * 0.27, y + s * 0.82).lineTo(x + s * 0.73, y + s * 0.82).stroke();
    cerrar(doc);
  }
};

export const dibujarIcono = (doc, nombre, x, y, tam, color) => {
  const fn = iconos[nombre] ?? iconos.documento;
  fn(doc, x, y, tam, color);
};
