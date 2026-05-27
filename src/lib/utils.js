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
  'Fiestas'  : { bg: '#f43f5e22', text: '#f43f5e', border: '#f43f5e44' },
  'En vivo'  : { bg: '#06b6d422', text: '#06b6d4', border: '#06b6d444' },
  'Deportes' : { bg: '#10b98122', text: '#10b981', border: '#10b98144' },
  'Cultura'  : { bg: '#f59e0b22', text: '#f59e0b', border: '#f59e0b44' },
};

export function colorCategoria(cat) {
  return COLORES_CAT[cat] ?? { bg: '#8b5cf622', text: '#8b5cf6', border: '#8b5cf644' };
}
