/**
 * utils.js — Funciones de utilidad para Eventos Arica
 * Formateo de fechas, precios y lógica de filtros de fecha.
 */

// ─── Formateo de fecha amigable ───────────────────────────────────────────────
const DIAS   = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const MESES  = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

/**
 * Convierte "2026-06-05" → { diaNombre, dia, mes, hora }
 * Usa UTC+offset local para evitar el off-by-one del timezone.
 */
export function formatearFecha(fechaStr, horaStr = '') {
  // Parseamos como fecha local (sin zona horaria) añadiendo T00:00
  const fecha = new Date(`${fechaStr}T00:00:00`);
  return {
    diaNombre : DIAS[fecha.getDay()],
    dia       : fecha.getDate(),
    mes       : MESES[fecha.getMonth()],
    anio      : fecha.getFullYear(),
    hora      : horaStr,
  };
}

/**
 * Retorna una cadena legible tipo "Vie 5 Jun • 23:00 hrs"
 */
export function fechaCorta(fechaStr, horaStr = '') {
  const { diaNombre, dia, mes, hora } = formatearFecha(fechaStr, horaStr);
  const diaAbr = diaNombre.slice(0, 3);
  return hora
    ? `${diaAbr} ${dia} ${mes} • ${hora} hrs`
    : `${diaAbr} ${dia} ${mes}`;
}

// ─── Formateo de precio ───────────────────────────────────────────────────────

/**
 * Formatea un precio en CLP. Si es 0 → "Gratis 🎉"
 */
export function formatearPrecio(precio) {
  if (!precio || precio === 0) return 'Gratis 🎉';
  return `Desde $${precio.toLocaleString('es-CL')}`;
}

// ─── Filtros de fecha ─────────────────────────────────────────────────────────

/**
 * Retorna true si la fecha del evento ya pasó (fecha < hoy).
 */
export function esEventoPasado(fechaStr) {
  return fechaStr < hoyStr();
}

/** Obtiene la fecha local de hoy como "YYYY-MM-DD" */
function hoyStr() {
  const hoy = new Date();
  return hoy.toLocaleDateString('en-CA'); // 'en-CA' produce YYYY-MM-DD
}

/** Obtiene inicio y fin del fin de semana próximo/actual */
function finDeSemana() {
  const hoy     = new Date();
  const diaSem  = hoy.getDay(); // 0=Dom, 6=Sab
  const difSab  = (6 - diaSem + 7) % 7 || 7; // días hasta próx sábado
  const difDom  = (0 - diaSem + 7) % 7 || 7; // días hasta próx domingo

  const sab = new Date(hoy); sab.setDate(hoy.getDate() + (diaSem === 6 ? 0 : diaSem === 0 ? -1 : difSab));
  const dom = new Date(hoy); dom.setDate(hoy.getDate() + (diaSem === 0 ? 0 : diaSem === 6 ? 1  : difSab + 1));

  const fmt = (d) => d.toLocaleDateString('en-CA');
  return { sab: fmt(sab), dom: fmt(dom) };
}

/**
 * Filtra un array de eventos según el filtro de fecha seleccionado.
 * @param {Array}  eventos
 * @param {string} filtro — 'todos' | 'hoy' | 'finde'
 */
export function filtrarPorFecha(eventos, filtro) {
  if (filtro === 'todos') return eventos;

  if (filtro === 'hoy') {
    const hoy = hoyStr();
    return eventos.filter(e => e.fecha === hoy);
  }

  if (filtro === 'finde') {
    const { sab, dom } = finDeSemana();
    return eventos.filter(e => e.fecha === sab || e.fecha === dom);
  }

  return eventos;
}

// ─── Color de badge por categoría ────────────────────────────────────────────
const COLORES_CAT = {
  'Fiestas'  : { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5' },
  'En vivo'  : { bg: '#e0f2fe', text: '#0284c7', border: '#7dd3fc' },
  'Deportes' : { bg: '#dcfce7', text: '#16a34a', border: '#86efac' },
  'Cultura'  : { bg: '#fef3c7', text: '#d97706', border: '#fcd34d' },
  'Cine'     : { bg: '#ede9fe', text: '#7c3aed', border: '#c4b5fd' },
  'Taller'   : { bg: '#ccfbf1', text: '#0f766e', border: '#5eead4' },
};

export function colorCategoria(cat) {
  return COLORES_CAT[cat] ?? { bg: '#f3e8ff', text: '#9333ea', border: '#d8b4fe' };
}
