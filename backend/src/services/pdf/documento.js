import PDFDocument from 'pdfkit';
import { dibujarIcono } from './iconos.js';

export const PALETA = {
  primario: '#0F2A47',
  acento: '#1D6FB8',
  texto: '#1B2430',
  suave: '#5A6675',
  linea: '#D6DEE7',
  fondo: '#F3F6FA',
  ok: '#1F7A4D',
  advertencia: '#B4740B',
  critico: '#B32D2D'
};

const MARGEN = 48;
const ALTO_FOOTER = 46;

/**
 * Constructor de documentos PDF institucionales.
 * Reglas del sistema: sin emojis, iconografia vectorial y pie de pagina
 * fijo con la autoria del modulo en todas las paginas.
 */
export class DocumentoPDF {
  constructor({ titulo, subtitulo = '', codigo = 'STD-2026-TI', icono = 'documento', orientacion = 'portrait' }) {
    this.titulo = titulo;
    this.subtitulo = subtitulo;
    this.codigo = codigo;
    this.icono = icono;

    this.doc = new PDFDocument({
      size: 'A4',
      layout: orientacion,
      margins: { top: MARGEN, bottom: MARGEN + ALTO_FOOTER, left: MARGEN, right: MARGEN },
      bufferPages: true,
      info: {
        Title: titulo,
        Author: 'Ing. Edgar Rojas Apaza',
        Subject: subtitulo || 'Sistema de Gestion de Tickets TI',
        Creator: 'Sistema de Tickets TI - Modulo de Documentacion'
      }
    });

    this.ancho = this.doc.page.width - MARGEN * 2;
    this.doc.on('pageAdded', () => this.encabezadoContinuacion());
    this.portadaEncabezado();
  }

  get x() { return MARGEN; }

  get limiteInferior() { return this.doc.page.height - MARGEN - ALTO_FOOTER; }

  encabezadoContinuacion() {
    const d = this.doc;
    d.save();
    d.rect(0, 0, d.page.width, 34).fill(PALETA.primario);
    d.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9)
      .text(this.titulo.toUpperCase(), MARGEN, 12, { width: this.ancho * 0.7, lineBreak: false });
    d.font('Helvetica').fontSize(8)
      .text(this.codigo, MARGEN, 13, { width: this.ancho, align: 'right' });
    d.restore();
    d.y = 58;
  }

  portadaEncabezado() {
    const d = this.doc;
    d.save();
    d.rect(0, 0, d.page.width, 108).fill(PALETA.primario);
    d.rect(0, 108, d.page.width, 4).fill(PALETA.acento);
    dibujarIcono(d, this.icono, MARGEN, 26, 34, '#FFFFFF');
    d.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(18)
      .text(this.titulo, MARGEN + 50, 30, { width: this.ancho - 50 });
    if (this.subtitulo) {
      d.font('Helvetica').fontSize(10).fillColor('#B9D2E8')
        .text(this.subtitulo, MARGEN + 50, d.y + 2, { width: this.ancho - 50 });
    }
    d.font('Helvetica').fontSize(8).fillColor('#8FB2CE')
      .text('Documento: ' + this.codigo + '   |   Generado: ' + new Date().toLocaleString('es-BO'),
        MARGEN + 50, 88, { width: this.ancho - 50 });
    d.restore();
    d.y = 132;
  }

  /** Salta de pagina si el bloque siguiente no entra en el espacio restante. */
  asegurarEspacio(alto) {
    if (this.doc.y + alto > this.limiteInferior) this.doc.addPage();
    return this;
  }

  titulo1(texto, icono = null) {
    this.asegurarEspacio(48);
    const d = this.doc;
    const y = d.y + 8;
    if (icono) dibujarIcono(d, icono, this.x, y - 1, 14, PALETA.acento);
    d.font('Helvetica-Bold').fontSize(13).fillColor(PALETA.primario)
      .text(texto, this.x + (icono ? 22 : 0), y, { width: this.ancho - (icono ? 22 : 0) });
    d.moveTo(this.x, d.y + 4).lineTo(this.x + this.ancho, d.y + 4).lineWidth(1).strokeColor(PALETA.acento).stroke();
    d.y += 12;
    return this;
  }

  titulo2(texto) {
    this.asegurarEspacio(30);
    this.doc.font('Helvetica-Bold').fontSize(10.5).fillColor(PALETA.primario)
      .text(texto, this.x, this.doc.y + 8, { width: this.ancho });
    this.doc.y += 4;
    return this;
  }

  parrafo(texto, opciones = {}) {
    this.asegurarEspacio(26);
    this.doc.font('Helvetica').fontSize(9.5).fillColor(PALETA.texto)
      .text(texto, this.x, this.doc.y + 4, { width: this.ancho, align: 'justify', lineGap: 1.6, ...opciones });
    return this;
  }

  lista(items, icono = 'flujo') {
    items.forEach((item) => {
      this.asegurarEspacio(18);
      const y = this.doc.y + 5;
      dibujarIcono(this.doc, icono, this.x + 2, y, 9, PALETA.acento);
      this.doc.font('Helvetica').fontSize(9.5).fillColor(PALETA.texto)
        .text(item, this.x + 18, y, { width: this.ancho - 18, lineGap: 1.4 });
      this.doc.y += 2;
    });
    return this;
  }

  /** Bloque resaltado para notas, reglas de negocio o advertencias. */
  nota(texto, opciones = {}) {
    const icono = opciones.icono ?? 'alerta';
    const color = opciones.color ?? PALETA.acento;
    const d = this.doc;
    const alturaTexto = d.font('Helvetica').fontSize(9).heightOfString(texto, { width: this.ancho - 46 });
    const alto = alturaTexto + 18;
    this.asegurarEspacio(alto + 10);
    const y = d.y + 6;
    d.save();
    d.rect(this.x, y, this.ancho, alto).fill(PALETA.fondo);
    d.rect(this.x, y, 3, alto).fill(color);
    dibujarIcono(d, icono, this.x + 14, y + 9, 13, color);
    d.fillColor(PALETA.texto).font('Helvetica').fontSize(9)
      .text(texto, this.x + 36, y + 9, { width: this.ancho - 46, lineGap: 1.4 });
    d.restore();
    d.y = y + alto + 8;
    return this;
  }

  /** Bloque de codigo o DDL en tipografia monoespaciada. */
  codigoFuente(texto) {
    const lineas = String(texto).split('\n');
    const alturaLinea = 10.5;
    lineas.forEach((linea, indice) => {
      if (indice === 0) this.asegurarEspacio(alturaLinea * Math.min(lineas.length, 6) + 12);
      if (this.doc.y + alturaLinea > this.limiteInferior) this.doc.addPage();
      const y = this.doc.y;
      this.doc.save().rect(this.x, y - 1, this.ancho, alturaLinea).fill('#F7F9FC').restore();
      this.doc.font('Courier').fontSize(8).fillColor('#22303F')
        .text(linea.length ? linea : ' ', this.x + 8, y + 0.5, { width: this.ancho - 16, lineBreak: false });
      this.doc.y = y + alturaLinea;
    });
    this.doc.y += 6;
    return this;
  }

  /** Pares etiqueta/valor distribuidos en columnas. */
  camposClaveValor(pares, columnas = 2) {
    const anchoCol = this.ancho / columnas;
    const anchoTexto = anchoCol - 12;

    const textoDe = (par) => {
      const vacio = par.valor === null || par.valor === undefined || par.valor === '';
      return { vacio, texto: vacio ? 'No registrado' : String(par.valor) };
    };

    for (let i = 0; i < pares.length; i += columnas) {
      const grupo = pares.slice(i, i + columnas);

      // El alto lo fija el valor mas extenso del grupo, para que ninguno se solape
      const altoValor = grupo.reduce((mayor, par) => {
        const alto = this.doc.font('Helvetica-Bold').fontSize(9.5)
          .heightOfString(textoDe(par).texto, { width: anchoTexto });
        return Math.max(mayor, alto);
      }, 0);
      const altoBloque = Math.ceil(altoValor) + 22;

      this.asegurarEspacio(altoBloque + 8);
      const y = this.doc.y + 6;
      grupo.forEach((par, c) => {
        const cx = this.x + anchoCol * c;
        const { vacio, texto } = textoDe(par);
        this.doc.font('Helvetica').fontSize(7.5).fillColor(PALETA.suave)
          .text(String(par.etiqueta).toUpperCase(), cx, y, { width: anchoTexto, lineBreak: false });
        this.doc.font('Helvetica-Bold').fontSize(9.5).fillColor(vacio ? PALETA.suave : PALETA.texto)
          .text(texto, cx, y + 11, { width: anchoTexto });
      });
      this.doc.y = y + altoBloque;
    }
    return this;
  }

  /**
   * Tabla con encabezado repetido en cada pagina.
   * columnas: [{ titulo, campo, ancho (proporcion 0-1), alineacion, render, color }]
   */
  tabla(columnas, filas, opciones = {}) {
    const d = this.doc;
    const anchos = columnas.map((c) => c.ancho * this.ancho);
    const relleno = 8;              // margen interno horizontal de la celda
    const margenVertical = 6;       // aire arriba y abajo del texto
    const alturaMinima = opciones.alturaFila ?? 20;
    // Una columna angosta se trunca; el resto ajusta el alto de la fila al texto
    const ajustar = opciones.ajustarAltura ?? true;

    const valorDe = (col, fila) => {
      const bruto = typeof col.render === 'function' ? col.render(fila) : fila[col.campo];
      return bruto === null || bruto === undefined || bruto === '' ? '-' : String(bruto);
    };

    /** Alto que necesita la fila para mostrar completo su contenido. */
    const altoDe = (fila) => {
      if (!ajustar) return alturaMinima;
      const alto = columnas.reduce((mayor, col, i) => {
        if (col.truncar) return mayor;
        const necesario = d.font('Helvetica').fontSize(8)
          .heightOfString(valorDe(col, fila), { width: anchos[i] - relleno * 2, lineGap: 1 });
        return Math.max(mayor, necesario);
      }, 0);
      return Math.max(alturaMinima, Math.ceil(alto) + margenVertical * 2);
    };

    const encabezado = () => {
      const y = d.y;
      d.save().rect(this.x, y, this.ancho, alturaMinima).fill(PALETA.primario).restore();
      let cx = this.x;
      columnas.forEach((col, i) => {
        d.font('Helvetica-Bold').fontSize(8).fillColor('#FFFFFF')
          .text(col.titulo.toUpperCase(), cx + relleno, y + (alturaMinima - 8) / 2,
            { width: anchos[i] - relleno * 2, align: col.alineacion ?? 'left', lineBreak: false });
        cx += anchos[i];
      });
      d.y = y + alturaMinima;
    };

    this.asegurarEspacio(alturaMinima * 3);
    encabezado();

    filas.forEach((fila, indice) => {
      const alturaFila = altoDe(fila);
      // La fila no se parte entre paginas: si no entra, se lleva entera a la siguiente
      if (d.y + alturaFila > this.limiteInferior) {
        d.addPage();
        encabezado();
      }
      const y = d.y;
      if (indice % 2 === 1) d.save().rect(this.x, y, this.ancho, alturaFila).fill(PALETA.fondo).restore();

      let cx = this.x;
      columnas.forEach((col, i) => {
        const valor = valorDe(col, fila);
        const opcionesTexto = {
          width: anchos[i] - relleno * 2,
          align: col.alineacion ?? 'left',
          lineGap: 1,
          ...(col.truncar ? { lineBreak: false, ellipsis: true } : {})
        };
        d.font('Helvetica').fontSize(8).fillColor(col.color ? col.color(fila) : PALETA.texto)
          .text(valor, cx + relleno, y + margenVertical, opcionesTexto);
        cx += anchos[i];
      });

      d.save().moveTo(this.x, y + alturaFila).lineTo(this.x + this.ancho, y + alturaFila)
        .lineWidth(0.4).strokeColor(PALETA.linea).stroke().restore();
      d.y = y + alturaFila;
    });
    d.y += 12;
    return this;
  }

  /** Tarjetas de indicadores numericos. */
  indicadores(tarjetas) {
    const d = this.doc;
    const separacion = 10;
    const anchoTarjeta = (this.ancho - separacion * (tarjetas.length - 1)) / tarjetas.length;
    this.asegurarEspacio(70);
    const y = d.y + 6;
    tarjetas.forEach((t, i) => {
      const cx = this.x + (anchoTarjeta + separacion) * i;
      d.save();
      d.roundedRect(cx, y, anchoTarjeta, 54, 4).lineWidth(0.8).fillAndStroke(PALETA.fondo, PALETA.linea);
      dibujarIcono(d, t.icono ?? 'grafico', cx + 10, y + 10, 14, t.color ?? PALETA.acento);
      d.fillColor(PALETA.suave).font('Helvetica').fontSize(7.5)
        .text(String(t.etiqueta).toUpperCase(), cx + 30, y + 13, { width: anchoTarjeta - 38, lineBreak: false });
      d.fillColor(t.color ?? PALETA.primario).font('Helvetica-Bold').fontSize(18)
        .text(String(t.valor), cx + 10, y + 28, { width: anchoTarjeta - 20, lineBreak: false });
      d.restore();
    });
    d.y = y + 64;
    return this;
  }

  saltoPagina() {
    this.doc.addPage();
    return this;
  }

  /** Aplica el pie de pagina institucional a todas las paginas y cierra el documento. */
  finalizar() {
    const d = this.doc;
    const rango = d.bufferedPageRange();
    for (let i = rango.start; i < rango.start + rango.count; i += 1) {
      d.switchToPage(i);
      const yPie = d.page.height - MARGEN - 22;
      d.save();
      d.moveTo(MARGEN, yPie).lineTo(d.page.width - MARGEN, yPie).lineWidth(0.7).strokeColor(PALETA.linea).stroke();
      dibujarIcono(d, 'escudo', MARGEN, yPie + 6, 11, PALETA.acento);
      d.font('Helvetica-Bold').fontSize(7.5).fillColor(PALETA.primario)
        .text('Ing. Edgar Rojas Apaza', MARGEN + 16, yPie + 7, { width: 220, lineBreak: false });
      d.font('Helvetica').fontSize(7.5).fillColor(PALETA.suave)
        .text('Desarrollo de Modulo de Tickets', MARGEN + 16, yPie + 16, { width: 240, lineBreak: false });
      d.font('Helvetica').fontSize(7.5).fillColor(PALETA.suave)
        .text('Pagina ' + (i + 1) + ' de ' + rango.count, d.page.width - MARGEN - 160, yPie + 11,
          { width: 160, align: 'right', lineBreak: false });
      d.restore();
    }
    d.flushPages();
    d.end();
    return d;
  }

  /** Devuelve el PDF completo como Buffer. */
  aBuffer() {
    return new Promise((resolve, reject) => {
      const partes = [];
      this.doc.on('data', (c) => partes.push(c));
      this.doc.on('end', () => resolve(Buffer.concat(partes)));
      this.doc.on('error', reject);
      this.finalizar();
    });
  }

  /** Escribe el PDF en disco creando el directorio destino si no existe. */
  async aArchivo(ruta) {
    const buffer = await this.aBuffer();
    const { writeFile, mkdir } = await import('node:fs/promises');
    const { dirname } = await import('node:path');
    await mkdir(dirname(ruta), { recursive: true });
    await writeFile(ruta, buffer);
    return ruta;
  }
}
