import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FileText, ImagePlus, Loader2, MessagesSquare, Paperclip, Send, X, ZoomIn
} from 'lucide-react';
import { api, apiFormData, urlAdjunto } from '../lib/api';
import { obtenerSocket } from '../lib/socket';
import { usarAuth } from '../context/AuthContext';
import { Alerta, Cargando, Vacio } from './Ui';
import { pesoLegible, tiempoRelativo } from '../lib/formato';
import type { Adjunto, Comentario } from '../lib/tipos';

const esImagen = (tipo: string) => tipo.startsWith('image/');

const Miniatura = ({ adjunto, alAmpliar }: { adjunto: Adjunto; alAmpliar: (url: string, nombre: string) => void }) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!esImagen(adjunto.tipo)) return;
    let vigente = true;
    let creada = '';
    void urlAdjunto(adjunto.id)
      .then((generada) => {
        creada = generada;
        if (vigente) setUrl(generada);
        else URL.revokeObjectURL(generada);
      })
      .catch(() => undefined);
    return () => {
      vigente = false;
      if (creada) URL.revokeObjectURL(creada);
    };
  }, [adjunto.id, adjunto.tipo]);

  if (!esImagen(adjunto.tipo)) {
    return (
      <button
        type="button"
        onClick={() => void urlAdjunto(adjunto.id).then((generada) => window.open(generada, '_blank'))}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs transition hover:border-institucional-300 hover:bg-institucional-50 dark:bg-noche-850 dark:border-noche-700"
      >
        <FileText className="h-4 w-4 shrink-0 text-institucional-700 dark:text-institucional-300" />
        <span className="min-w-0">
          <span className="block truncate font-medium text-slate-700 dark:text-slate-200">{adjunto.nombre}</span>
          <span className="text-slate-400 dark:text-slate-400">{pesoLegible(adjunto.tamano)}</span>
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => url && alAmpliar(url, adjunto.nombre)}
      className="group relative h-28 w-36 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:bg-noche-800 dark:border-noche-700"
      title={adjunto.nombre}
    >
      {url ? (
        <img src={url} alt={adjunto.nombre} className="h-full w-full object-cover transition group-hover:scale-105" />
      ) : (
        <span className="flex h-full items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-slate-400 dark:text-slate-400" />
        </span>
      )}
      <span className="absolute inset-0 flex items-center justify-center bg-slate-900/0 transition group-hover:bg-slate-900/40">
        <ZoomIn className="h-5 w-5 text-white opacity-0 transition group-hover:opacity-100" />
      </span>
    </button>
  );
};

export const Conversacion = ({ ticketId }: { ticketId: number }) => {
  const { usuario } = usarAuth();
  const [comentarios, setComentarios] = useState<Comentario[] | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [archivos, setArchivos] = useState<File[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ampliada, setAmpliada] = useState<{ url: string; nombre: string } | null>(null);
  const entradaArchivos = useRef<HTMLInputElement>(null);
  const finHilo = useRef<HTMLDivElement>(null);

  const cargar = useCallback(async () => {
    try {
      const { datos } = await api<{ datos: Comentario[] }>(`/tickets/${ticketId}/comentarios`);
      setComentarios(datos);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No fue posible cargar la conversacion');
    }
  }, [ticketId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useEffect(() => {
    const socket = obtenerSocket();
    if (!socket) return;
    const alRecibir = (evento: { ticket_id: number; comentario: Comentario }) => {
      if (evento.ticket_id !== ticketId) return;
      setComentarios((previos) => {
        if (!previos) return previos;
        if (previos.some((c) => c.id === evento.comentario.id)) return previos;
        return [...previos, evento.comentario];
      });
    };
    socket.on('comentario:nuevo', alRecibir);
    return () => {
      socket.off('comentario:nuevo', alRecibir);
    };
  }, [ticketId]);

  useEffect(() => {
    finHilo.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [comentarios?.length]);

  const agregarArchivos = (lista: FileList | null) => {
    if (!lista) return;
    setArchivos((previos) => [...previos, ...Array.from(lista)].slice(0, 5));
  };

  const enviar = async () => {
    if (!mensaje.trim() && archivos.length === 0) return;
    setEnviando(true);
    setError(null);
    try {
      const formulario = new FormData();
      formulario.append('mensaje', mensaje.trim());
      archivos.forEach((archivo) => formulario.append('archivos', archivo));
      const { datos } = await apiFormData<{ datos: Comentario }>(`/tickets/${ticketId}/comentarios`, formulario);
      setComentarios((previos) => (previos ? [...previos, datos] : [datos]));
      setMensaje('');
      setArchivos([]);
      if (entradaArchivos.current) entradaArchivos.current.value = '';
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No fue posible enviar el mensaje');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="panel animar-entrada flex flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5 dark:border-noche-700">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-institucional-900 dark:text-slate-100">
          <MessagesSquare className="h-4 w-4 text-institucional-700 dark:text-institucional-300" />
          Conversacion
        </h2>
        {comentarios && comentarios.length > 0 && (
          <span className="text-xs text-slate-400 dark:text-slate-400">{comentarios.length} mensajes</span>
        )}
      </header>

      <div className="max-h-[26rem] space-y-4 overflow-y-auto p-5">
        {!comentarios && <Cargando texto="Cargando conversacion" />}
        {comentarios && comentarios.length === 0 && (
          <Vacio
            icono={MessagesSquare}
            texto="Todavia no hay mensajes. Escriba aqui los detalles del error o adjunte una captura de pantalla."
          />
        )}

        {(comentarios ?? []).map((comentario) => {
          const propio = comentario.usuario_id === usuario?.id;
          const iniciales = comentario.usuario_nombre
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((parte) => parte[0])
            .join('')
            .toUpperCase();

          return (
            <article key={comentario.id} className={`flex gap-3 ${propio ? 'flex-row-reverse' : ''}`}>
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  propio ? 'bg-institucional-900 text-white' : 'bg-slate-200 text-slate-600'
                }`}
                title={comentario.usuario_nombre}
              >
                {iniciales}
              </span>

              <div className={`max-w-[80%] ${propio ? 'items-end text-right' : ''}`}>
                <p className="mb-1 text-xs text-slate-400 dark:text-slate-400">
                  <span className="font-semibold text-slate-600 dark:text-slate-200">
                    {propio ? 'Usted' : comentario.usuario_nombre}
                  </span>
                  <span className="mx-1.5">-</span>
                  {comentario.usuario_rol}
                  <span className="mx-1.5">-</span>
                  {tiempoRelativo(comentario.fecha)}
                </p>

                <div
                  className={`inline-block rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    propio
                      ? 'rounded-tr-sm bg-institucional-900 text-white'
                      : 'rounded-tl-sm border border-slate-200 bg-slate-50 text-slate-700 dark:border-noche-700 dark:bg-noche-800 dark:text-slate-200'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-left">{comentario.mensaje}</p>
                </div>

                {comentario.adjuntos.length > 0 && (
                  <div className={`mt-2 flex flex-wrap gap-2 ${propio ? 'justify-end' : ''}`}>
                    {comentario.adjuntos.map((adjunto) => (
                      <Miniatura
                        key={adjunto.id}
                        adjunto={adjunto}
                        alAmpliar={(url, nombre) => setAmpliada({ url, nombre })}
                      />
                    ))}
                  </div>
                )}
              </div>
            </article>
          );
        })}
        <div ref={finHilo} />
      </div>

      <footer className="border-t border-slate-200 bg-slate-50 p-4 dark:bg-noche-800 dark:border-noche-700">
        {error && <div className="mb-3"><Alerta mensaje={error} /></div>}

        {archivos.length > 0 && (
          <ul className="mb-3 flex flex-wrap gap-2">
            {archivos.map((archivo, indice) => (
              <li
                key={`${archivo.name}-${indice}`}
                className="flex items-center gap-2 rounded-full border border-slate-300 bg-white py-1 pl-3 pr-1.5 text-xs dark:bg-noche-850 dark:border-noche-700"
              >
                <Paperclip className="h-3 w-3 text-slate-400 dark:text-slate-400" />
                <span className="max-w-40 truncate text-slate-600 dark:text-slate-200">{archivo.name}</span>
                <span className="text-slate-400 dark:text-slate-400">{pesoLegible(archivo.size)}</span>
                <button
                  type="button"
                  onClick={() => setArchivos((previos) => previos.filter((_, i) => i !== indice))}
                  className="rounded-full p-0.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 dark:text-slate-400"
                  aria-label={`Quitar ${archivo.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-end gap-2">
          <textarea
            className="campo max-h-32 min-h-11 flex-1 resize-y py-2.5"
            rows={1}
            placeholder="Describa el error o consulte al tecnico. Enter para enviar, Mayus+Enter para saltar de linea."
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void enviar();
              }
            }}
          />
          <input
            ref={entradaArchivos}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
            className="hidden"
            onChange={(e) => agregarArchivos(e.target.files)}
          />
          <button
            type="button"
            className="boton-icono h-11 w-11"
            title="Adjuntar imagen o PDF (hasta 5 archivos de 5 MB)"
            onClick={() => entradaArchivos.current?.click()}
          >
            <ImagePlus className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="boton-primario h-11"
            disabled={enviando || (!mensaje.trim() && archivos.length === 0)}
            onClick={() => void enviar()}
          >
            {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Enviar
          </button>
        </div>
      </footer>

      {}
      {ampliada && (
        <div
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-slate-900/85 p-6 backdrop-blur-sm"
          onClick={() => setAmpliada(null)}
        >
          <div className="mb-3 flex w-full max-w-5xl items-center justify-between text-white">
            <p className="truncate text-sm font-medium">{ampliada.nombre}</p>
            <button
              type="button"
              className="rounded-lg p-2 transition hover:bg-white/15"
              onClick={() => setAmpliada(null)}
              aria-label="Cerrar imagen"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <img
            src={ampliada.url}
            alt={ampliada.nombre}
            className="max-h-[80vh] max-w-full rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
};
