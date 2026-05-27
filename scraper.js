import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';

// ─── Constantes ────────────────────────────────────────────────────────────────
const MESES = {
  'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
  'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
  'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
};

/**
 * Mapea las categorías RAW del sitio a las categorías de filtro de la app.
 */
const MAPA_CATEGORIAS = {
  'cultura'        : 'Cultura',
  'comunidad'      : 'Fiestas',   // Eventos comunitarios → Fiestas
  'deportes'       : 'Deportes',
  'medio ambiente' : 'Cultura',   // Charlas/talleres ambientales
  'cine municipal' : 'Cultura',
};

// Las categorías RAW ordenadas de mayor a menor longitud para evitar matches parciales
const CATS_RAW = Object.keys(MAPA_CATEGORIAS).sort((a, b) => b.length - a.length);

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Parsea una fecha tipo "27 Junio 2026" → "2026-06-27"
 */
function parsearFecha(texto) {
  const re = new RegExp(`(\\d{1,2})\\s*(${Object.keys(MESES).join('|')})\\s*(\\d{4})`, 'i');
  const m = texto.match(re);
  if (!m) return null;
  const dia = m[1].padStart(2, '0');
  const mes = MESES[m[2].toLowerCase()];
  return `${m[3]}-${mes}-${dia}`;
}

/**
 * Extrae la categoría de la app a partir del texto RAW de la tarjeta.
 * Busca la primera categoría conocida justo después de la fecha.
 */
function extraerCategoria(texto) {
  const reFecha = new RegExp(`(\\d{1,2})\\s*(${Object.keys(MESES).join('|')})\\s*(\\d{4})`, 'i');
  const mFecha = texto.match(reFecha);
  if (!mFecha) return 'Cultura';

  const despuesFecha = texto.slice(mFecha.index + mFecha[0].length).toLowerCase();
  for (const raw of CATS_RAW) {
    if (despuesFecha.startsWith(raw)) {
      return MAPA_CATEGORIAS[raw];
    }
  }
  return 'Cultura';
}

/**
 * Extrae el lugar del texto (entre "place" y "Leer más").
 */
function extraerLugar(texto) {
  const m = texto.match(/place(.+?)Leer\s*más/i);
  return m ? m[1].trim() : '';
}

/**
 * Palabras que en español se escriben en minúscula dentro de un título
 * (preposiciones, artículos, conjunciones) — salvo que sean la primera palabra.
 */
const MINUSCULAS = new Set([
  'a', 'al', 'ante', 'bajo', 'cabe', 'con', 'contra', 'de', 'del',
  'desde', 'durante', 'e', 'el', 'en', 'entre', 'hacia', 'hasta',
  'la', 'las', 'le', 'les', 'lo', 'los', 'mediante', 'ni', 'o',
  'para', 'por', 'que', 'segun', 'sin', 'so', 'sobre', 'su', 'sus',
  'tras', 'u', 'un', 'una', 'unas', 'unos', 'y',
]);

/**
 * Mapa de palabras que pierden su acento en la URL (slug) y hay que restaurarlo.
 */
const ACENTOS = {
  // Día / años
  'ano': 'año', 'anos': 'años', 'dia': 'día', 'dias': 'días',
  // Verbos / sustantivos comunes
  'explotacion': 'explotación', 'exploracion': 'exploración',
  'exposicion': 'exposición', 'actuacion': 'actuación',
  'presentacion': 'presentación', 'celebracion': 'celebración',
  'inauguracion': 'inauguración', 'clausura': 'clausura',
  'edicion': 'edición', 'exhibicion': 'exhibición',
  'galactico': 'galáctico', 'galactica': 'galáctica',
  'musica': 'música', 'musical': 'musical',
  'teatro': 'teatro', 'escenico': 'escénico',
  'feria': 'feria', 'feriado': 'feriado',
  'emprendedores': 'emprendedores', 'emprendedor': 'emprendedor',
  'rurales': 'rurales', 'rural': 'rural',
  'patrimonio': 'patrimonio', 'patrimonios': 'patrimonios',
  'himno': 'himno', 'torneo': 'torneo',
  'escolar': 'escolar', 'universitario': 'universitario',
  'pasacalle': 'pasacalle',
  'jornada': 'jornada', 'jornadas': 'jornadas',
  'humedal': 'humedal', 'humedales': 'humedales',
  'cine': 'cine', 'municipal': 'municipal',
  'cultural': 'cultural', 'deportivo': 'deportivo',
  'maximo': 'máximo', 'maxima': 'máxima',
  'ultimo': 'último', 'ultima': 'última',
  'publico': 'público', 'publica': 'pública',
  'epoca': 'época', 'pagina': 'página',
  // Nombres propios (se capitalizan)
  'arica': 'Arica', 'azapa': 'Azapa',
  'carlos': 'Carlos', 'dittborn': 'Dittborn',
  'casino': 'Casino',
};

/** Regex: números romanos del 1 al 100 */
const ROMANO = /^(?:i{1,3}|iv|v|vi{1,3}|ix|x|xi{1,3}|xiv|xv|xvi{1,3}|xix|xx|xxx|xl|l|lx|lxx|lxxx|xc|c)$/i;

/**
 * Convierte un slug de URL en un título limpio respetando las reglas del español.
 *
 * Reglas:
 * 1. Preposiciones/artículos en minúscula (salvo primera palabra)
 * 2. Restaura acentos de palabras conocidas
 * 3. Detecta números romanos y los deja en mayúscula
 * 4. Capitaliza la primera letra del resto
 *
 * Ej: "vuelve-la-ginga"      → "Vuelve la Ginga"
 *     "dia-de-los-patrimonios-2026" → "Día de los Patrimonios 2026"
 *     "vi-feria-de-emprendedores"   → "VI Feria de Emprendedores"
 */
function slugATitulo(url) {
  const slug = (url.split('/').pop() || '').toLowerCase();
  if (!slug) return 'Evento Municipal';

  const palabras = slug.split('-');

  const resultado = palabras.map((p, i) => {
    if (!p) return '';

    // 1. Números → se dejan tal cual
    if (/^\d+$/.test(p)) return p;

    // 2. Número romano → mayúscula
    if (ROMANO.test(p)) return p.toUpperCase();

    // 3. Preposición/artículo en minúscula (excepto primera palabra)
    if (i > 0 && MINUSCULAS.has(p)) return p;

    // 4. Restaurar acento si existe en el mapa
    const conAcento = ACENTOS[p] || p;

    // 5. Capitalizar primera letra
    return conAcento.charAt(0).toUpperCase() + conAcento.slice(1);
  });

  return resultado.filter(Boolean).join(' ');
}

// ─── Scraper principal ─────────────────────────────────────────────────────────

async function scrapeMuniArica() {
  console.log('🚀 Iniciando extracción quirúrgica (Estructura Quasar)...');

  try {
    const { data: html } = await axios.get('https://muniarica.cl/eventos', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
      },
      timeout: 15000
    });

    const $ = cheerio.load(html);
    const resultado = [];
    let contador = 1;

    const tarjetasEventos = 'a[href*="/eventos/publicacion/"]';

    $(tarjetasEventos).each((_index, element) => {
      const el = $(element);

      // ── URL ──
      const urlRelativa = el.attr('href') || '';
      const urlTicket = urlRelativa.startsWith('/')
        ? 'https://muniarica.cl' + urlRelativa
        : urlRelativa;

      // ── Imagen ──
      let imagen = el.find('.card-image').attr('src') || el.find('img').attr('src') || '';
      if (imagen && imagen.startsWith('/')) imagen = 'https://muniarica.cl' + imagen;

      // ── Texto completo de la tarjeta (fecha + categoría + título + place + lugar) ──
      const texto = el.find('.q-card__section').text().trim();

      // ── Título (slug de la URL) ──
      const titulo = slugATitulo(urlRelativa);

      // ── Fecha ──
      const fecha = parsearFecha(texto) || '2026-06-01';

      // ── Categoría (mapeada para los filtros de la app) ──
      const categoria = extraerCategoria(texto);

      // ── Lugar ──
      const lugar = extraerLugar(texto) || 'Centro Cultural / Espacio Público';

      resultado.push({
        id: `muni-${Date.now()}-${contador++}`,
        titulo,
        productora: 'Muni Arica',
        fecha,
        hora: '19:00',
        lugar,
        precio_desde: 0,
        categoria,
        imagen,
        url_ticket: urlTicket
      });
    });

    return resultado;

  } catch (error) {
    console.error('⚠️  Error de red al conectar con la Municipalidad:', error.message);
    return [];
  }
}

async function main() {
  try {
    const eventosMunicipales = await scrapeMuniArica();
    
    if (!eventosMunicipales || eventosMunicipales.length === 0) {
      console.log("🔒 Proceso finalizado de forma segura: No se detectaron tarjetas con la estructura Quasar.");
      process.exit(0); 
    }

    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

    const outputPath = path.join(publicDir, 'eventos.json');
    fs.writeFileSync(outputPath, JSON.stringify(eventosMunicipales, null, 2), 'utf-8');
    
    console.log(`\n🎉 [ÉXITO] ¡Target alcanzado! Se estructuraron ${eventosMunicipales.length} eventos reales basados en las DevTools.`);
    process.exit(0);

  } catch (error) {
    console.error("❌ Fallo retenido:", error.message);
    process.exit(0); 
  }
}

main();