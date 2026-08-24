import type { FormEvent } from 'react';
import { Etiqueta } from '../../../components/Ui';
import { ESTADOS, TIPOS, type FormularioArticulo as Articulo } from '../constantes';
import { ESTILO_ESTADO } from '../constantes';
import type { MovimientoEnCurso } from '../usarInventario';
import type { EstadoArticulo, TipoArticulo } from '../../../lib/tipos';

export const FormularioArticulo = ({ formulario, setFormulario, alEnviar }: {
  formulario: Articulo;
  setFormulario: (actualizar: (previo: Articulo) => Articulo) => void;
  alEnviar: (evento: FormEvent) => void;
}) => (
  <form id="form-articulo" onSubmit={alEnviar} className="space-y-4">
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="etiqueta">Codigo</label>
        <input
          className="campo font-mono uppercase"
          required
          minLength={2}
          maxLength={40}
          placeholder="TON26A"
          value={formulario.codigo}
          onChange={(e) => setFormulario((previo) => ({ ...previo, codigo: e.target.value }))}
        />
      </div>
      <div>
        <label className="etiqueta">Tipo</label>
        <select
          className="campo"
          value={formulario.tipo}
          onChange={(e) => setFormulario((previo) => ({ ...previo, tipo: e.target.value as TipoArticulo }))}
        >
          {TIPOS.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="etiqueta">Nombre</label>
        <input
          className="campo"
          required
          minLength={3}
          maxLength={150}
          value={formulario.nombre}
          onChange={(e) => setFormulario((previo) => ({ ...previo, nombre: e.target.value }))}
        />
      </div>
      <div className="sm:col-span-2">
        <label className="etiqueta">Descripcion</label>
        <input
          className="campo"
          maxLength={255}
          value={formulario.descripcion}
          onChange={(e) => setFormulario((previo) => ({ ...previo, descripcion: e.target.value }))}
        />
      </div>
      <div>
        <label className="etiqueta">Unidad de medida</label>
        <input
          className="campo"
          required
          maxLength={20}
          value={formulario.unidad}
          onChange={(e) => setFormulario((previo) => ({ ...previo, unidad: e.target.value }))}
        />
      </div>
      <div>
        <label className="etiqueta">Stock minimo</label>
        <input
          type="number"
          min={0}
          className="campo"
          value={formulario.stock_minimo}
          onChange={(e) => setFormulario((previo) => ({ ...previo, stock_minimo: e.target.value }))}
        />
      </div>
      <div>
        <label className="etiqueta">Situacion</label>
        <select
          className="campo"
          value={formulario.estado}
          onChange={(e) => setFormulario((previo) => ({ ...previo, estado: e.target.value as EstadoArticulo }))}
        >
          {ESTADOS.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
        </select>
      </div>
      <div>
        <label className="etiqueta">Ubicacion</label>
        <input
          className="campo"
          maxLength={100}
          placeholder="Deposito TI - Estante B"
          value={formulario.ubicacion}
          onChange={(e) => setFormulario((previo) => ({ ...previo, ubicacion: e.target.value }))}
        />
      </div>
    </div>

    {formulario.id === null && (
      <p className="superficie p-3 text-xs text-slate-600 dark:text-slate-200">
        El articulo se crea con stock cero. El saldo solo cambia mediante entradas, salidas o ajustes.
      </p>
    )}

  </form>
);

export const FormularioMovimiento = ({ movimiento, datos, setDatos, alEnviar }: {
  movimiento: MovimientoEnCurso;
  datos: { cantidad: string; motivo: string };
  setDatos: (actualizar: (previos: { cantidad: string; motivo: string }) => { cantidad: string; motivo: string }) => void;
  alEnviar: (evento: FormEvent) => void;
}) => {
  const { articulo, tipo } = movimiento;
  const cantidad = Number(datos.cantidad) || 0;
  const resultante = tipo === 'Salida' ? articulo.stock_actual - cantidad : articulo.stock_actual + cantidad;

  return (
    <form id="form-movimiento" onSubmit={alEnviar} className="space-y-4">
      <div className="superficie p-4">
        <p className="font-semibold text-institucional-900 dark:text-slate-100">{articulo.nombre}</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
          Codigo {articulo.codigo} - Stock actual: <strong>{articulo.stock_actual} {articulo.unidad}</strong>
        </p>
      </div>

      <div>
        <label className="etiqueta">Cantidad</label>
        <input
          type="number"
          min={1}
          max={tipo === 'Salida' ? articulo.stock_actual : undefined}
          className="campo"
          required
          autoFocus
          value={datos.cantidad}
          onChange={(e) => setDatos((previos) => ({ ...previos, cantidad: e.target.value }))}
        />
        {tipo === 'Salida' && (
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-400">
            Maximo disponible: {articulo.stock_actual} {articulo.unidad}
          </p>
        )}
      </div>

      <div>
        <label className="etiqueta">Motivo</label>
        <input
          className="campo"
          maxLength={255}
          placeholder={tipo === 'Salida' ? 'Entrega a Contabilidad' : 'Compra segun factura 001-234'}
          value={datos.motivo}
          onChange={(e) => setDatos((previos) => ({ ...previos, motivo: e.target.value }))}
        />
      </div>

      <div className="superficie p-3 text-xs">
        Saldo resultante:{' '}
        <strong className="text-institucional-900 dark:text-slate-100">{resultante} {articulo.unidad}</strong>
      </div>

    </form>
  );
};

export const FormularioSituacion = ({ articulo, datos, setDatos, alEnviar }: {
  articulo: { codigo: string; nombre: string; estado: EstadoArticulo };
  datos: { estado: EstadoArticulo; motivo: string };
  setDatos: (actualizar: (previos: { estado: EstadoArticulo; motivo: string }) => { estado: EstadoArticulo; motivo: string }) => void;
  alEnviar: (evento: FormEvent) => void;
}) => (
  <form id="form-situacion" onSubmit={alEnviar} className="space-y-4">
    <div className="superficie p-4">
      <p className="font-semibold text-institucional-900 dark:text-slate-100">{articulo.nombre}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Codigo {articulo.codigo} - Situacion actual: <strong>{articulo.estado}</strong>
      </p>
    </div>

    <div>
      <span className="etiqueta">Nueva situacion</span>
      <div className="grid gap-2 sm:grid-cols-2">
        {ESTADOS.map((estado) => (
          <button
            key={estado}
            type="button"
            onClick={() => setDatos((previos) => ({ ...previos, estado }))}
            className={`rounded-lg border-2 p-3 text-left transition ${datos.estado === estado
              ? 'border-institucional-700 bg-institucional-50 dark:border-institucional-400 dark:bg-noche-800'
              : 'border-slate-200 bg-white hover:border-slate-300 dark:border-noche-700 dark:bg-noche-800 dark:hover:border-noche-600'}`}
          >
            <Etiqueta texto={estado} clase={ESTILO_ESTADO[estado]} />
          </button>
        ))}
      </div>
    </div>

    <div>
      <label className="etiqueta">Motivo</label>
      <input
        className="campo"
        maxLength={255}
        placeholder="Por ejemplo: enviado a servicio tecnico"
        value={datos.motivo}
        onChange={(e) => setDatos((previos) => ({ ...previos, motivo: e.target.value }))}
      />
    </div>

    {datos.estado === 'De baja' && (
      <p className="superficie p-3 text-xs text-slate-600 dark:text-slate-200">
        Al darlo de baja el articulo deja de figurar entre los activos y no admite movimientos.
        Su kardex historico se conserva.
      </p>
    )}

  </form>
);
