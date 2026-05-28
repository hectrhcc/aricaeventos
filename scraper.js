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

const MAPA_CATEGORIAS = {
  'cultura'        : 'Cultura',
  'comunidad'      : 'Fiestas',
  'deportes'       : 'Deportes',
  'medio ambiente' : 'Cultura',
  'cine municipal' : 'Cultura',
};

const CATS_RAW = Object.keys(MAPA_CATEGORIAS).sort((a, b) => b.length - a.length);

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Parsea una fecha tipo "27 Junio 2026" o "27/06/2026" → "2026-06-27"
 */
function parsearFecha(texto) {
  if (!texto) return null;

  // 1. Formato con texto: "27 Junio 2026"
  const rePalabras = new RegExp(`(\\d{1,2})\\s*(${Object.keys(MESES).join('|')})\\s*(\\d{4})`, 'i');
  const mPalabras = texto.match(rePalabras);
  if (mPalabras) {
    const dia = mPalabras[1].padStart(2, '0');
    const mes = MESES[mPalabras[2].toLowerCase()];
    return `${mPalabras[3]}-${mes}-${dia}`;
  }

  // 2. Formato numérico: "27/06/2026" o "27-06-2026"
  const reNumeros = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/;
  const mNumeros = texto.match(reNumeros);
  if (mNumeros) {
    const dia = mNumeros[1].padStart(2, '0');
    const mes = mNumeros[2].padStart(2, '0');
    return `${mNumeros[3]}-${mes}-${dia}`;
  }

  return null;
}

/**
 * Extrae números de un string de precio (ej: "Desde $30.000 CLP" → 30000)
 */
function parsearPrecio(texto) {
  if (!texto) return 0;
  const limpio = texto.replace(/[^\d]/g, ''); // Deja solo los dígitos
  return parseInt(limpio, 10) || 0;
}

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

function extraerLugar(texto) {
  const m = texto.match(/place(.+?)Leer\s*más/i);
  return m ? m[1].trim() : '';
}

const MINUSCULAS = new Set([
  'a', 'al', 'ante', 'bajo', 'cabe', 'con', 'contra', 'de', 'del',
  'desde', 'durante', 'e', 'el', 'en', 'entre', 'hacia', 'hasta',
  'la', 'las', 'le', 'les', 'lo', 'los', 'mediante', 'ni', 'o',
  'para', 'por', 'que', 'segun', 'sin', 'so', 'sobre', 'su', 'sus',
  'tras', 'u', 'un', 'una', 'unas', 'unos', 'y',
]);

const ACENTOS = {
  'ano': 'año', 'anos': 'años', 'dia': 'día', 'dias': 'días',
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
  'pasacalle': 'pasacalle', 'jornada': 'jornada', 'jornadas': 'jornadas',
  'humedal': 'humedal', 'humedales': 'humedales',
  'cine': 'cine', 'municipal': 'municipal', 'cultural': 'cultural',
  'deportivo': 'deportivo', 'maximo': 'máximo', 'maxima': 'máxima',
  'ultimo': 'último', 'ultima': 'última', 'publico': 'público',
  'publica': 'pública', 'epoca': 'época', 'pagina': 'página',
  'arica': 'Arica', 'azapa': 'Azapa', 'carlos': 'Carlos',
  'dittborn': 'Dittborn', 'casino': 'Casino',
};

const ROMANO = /^(?:i{1,3}|iv|v|vi{1,3}|ix|x|xi{1,3}|xiv|xv|xvi{1,3}|xix|xx|xxx|xl|l|lx|lxx|lxxx|xc|c)$/i;

function slugATitulo(url) {
  const slug = (url.split('/').pop() || '').toLowerCase();
  if (!slug) return 'Evento Municipal';

  const palabras = slug.split('-');
  const resultado = palabras.map((p, i) => {
    if (!p) return '';
    if (/^\d+$/.test(p)) return p;
    if (ROMANO.test(p)) return p.toUpperCase();
    if (i > 0 && MINUSCULAS.has(p)) return p;
    const conAcento = ACENTOS[p] || p;
    return conAcento.charAt(0).toUpperCase() + conAcento.slice(1);
  });

  return resultado.filter(Boolean).join(' ');
}

// ─── Scrapers por Sitio Web ───────────────────────────────────────────────────

/**
 * SCRAPER 1: Municipalidad de Arica
 */
async function scrapeMuniArica() {
  console.log('🚀 Iniciando extracción en Muni Arica (Estructura Quasar)...');
  try {
    const { data: html } = await axios.get('https://muniarica.cl/eventos', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 15000
    });

    const $ = cheerio.load(html);
    const resultado = [];
    let contador = 1;

    $('a[href*="/eventos/publicacion/"]').each((_index, element) => {
      const el = $(element);
      const urlRelativa = el.attr('href') || '';
      const urlTicket = urlRelativa.startsWith('/') ? 'https://muniarica.cl' + urlRelativa : urlRelativa;

      let imagen = el.find('.card-image').attr('src') || el.find('img').attr('src') || '';
      if (imagen && imagen.startsWith('/')) imagen = 'https://muniarica.cl' + imagen;

      const texto = el.find('.q-card__section').text().trim();
      const titulo = slugATitulo(urlRelativa);
      const fecha = parsearFecha(texto) || '2026-06-01';
      const categoria = extraerCategoria(texto);
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

    console.log(`✅ Muni Arica finalizado. Encontrados: ${resultado.length} eventos.`);
    return resultado;
  } catch (error) {
    console.error('⚠️ Error de red en Municipalidad:', error.message);
    return [];
  }
}

/**
 * SCRAPER 2: Panoramas Arica
 */
async function scrapePanoramasArica() {
  console.log('🚀 Iniciando extracción en Panoramas Arica (Búsqueda por Queries)...');
  
  // Definimos las URLs de búsqueda y la categoría final en tu app
  const fuentes = [
    { url: 'https://www.panoramasarica.cl/?q=Eventos%20deportivos', categoria: 'Deportes' },
    { url: 'https://www.panoramasarica.cl/?q=Eventos%20culturales', categoria: 'Cultura' }
  ];

  const resultado = [];
  let contador = 1;

  for (const fuente of fuentes) {
    try {
      console.log(`🔎 Buscando resultados para: ${fuente.categoria}...`);
      const { data: html } = await axios.get(fuente.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        timeout: 15000
      });

      const $ = cheerio.load(html);

      // ───────────────────────────────────────────────────────────────────────
      // ⚠️ ATENCIÓN AQUÍ: Debes inspeccionar la web con tus DevTools 
      // y ajustar estos selectores CSS según la estructura real de Panoramas Arica.
      // ───────────────────────────────────────────────────────────────────────
      const tarjetaSelector = '.card, .product-card, div[class*="item"]'; // Ajustar clase de la tarjeta contenedora
      
      $(tarjetaSelector).each((_index, element) => {
        const el = $(element);

        // Extraer título del panorama
        const titulo = el.find('h3, h4, .title, .titulo').text().trim();
        if (!titulo) return; // Si no hay título en este contenedor, saltamos al siguiente

        // URL del detalle / inscripción
        let urlRelativa = el.find('a').attr('href') || '';
        const urlTicket = urlRelativa.startsWith('/') ? 'https://www.panoramasarica.cl' + urlRelativa : urlRelativa || fuente.url;

        // Imagen promocional
        let imagen = el.find('img').attr('src') || '';
        if (imagen && imagen.startsWith('/')) imagen = 'https://www.panoramasarica.cl' + imagen;

        // Fecha y Lugar (PanoramasArica suele mostrar rangos o fechas en texto)
        const textoFecha = el.find('.fecha, .date, span:contains("/")').text().trim();
        const fecha = parsearFecha(textoFecha) || '2026-06-15'; // Fallback si no logra parsearla

        const lugar = el.find('.ubicacion, .lugar, .location').text().trim() || 'Arica, Región de Arica y Parinacota';

        // Precio (esta web vende tours/entradas, ej: "Desde $30.000")
        const textoPrecio = el.find('.precio, .price, :contains("$")').text().trim();
        const precio_desde = parsearPrecio(textoPrecio);

        resultado.push({
          id: `panoramas-${Date.now()}-${contador++}`,
          titulo,
          productora: 'Panoramas Arica',
          fecha,
          hora: '10:00', // Valor por defecto si no viene explícito
          lugar,
          precio_desde,
          categoria: fuente.categoria,
          imagen,
          url_ticket: urlTicket
        });
      });

    } catch (error) {
      console.error(`⚠️ Error al buscar en Panoramas Arica (${fuente.categoria}):`, error.message);
    }
  }

  console.log(`✅ Panoramas Arica finalizado. Encontrados: ${resultado.length} eventos.`);
  return resultado;
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  try {
    // Ejecutamos ambos scrapers en paralelo
    const [eventosMunicipales, eventosPanoramas] = await Promise.all([
      scrapeMuniArica(),
      scrapePanoramasArica()
    ]);

    // Combinamos todos los eventos en una sola lista
    const todosLosEventos = [...eventosMunicipales, ...eventosPanoramas];
    
    if (todosLosEventos.length === 0) {
      console.log("🔒 Proceso finalizado: No se logró recolectar ningún evento de las fuentes.");
      process.exit(0); 
    }

    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

    const outputPath = path.join(publicDir, 'eventos.json');
    fs.writeFileSync(outputPath, JSON.stringify(todosLosEventos, null, 2), 'utf-8');
    
    console.log(`\n🎉 [ÉXITO] Archivo generado con un total de ${todosLosEventos.length} eventos combinados.`);
    process.exit(0);

  } catch (error) {
    console.error("❌ Fallo crítico en el proceso general:", error.message);
    process.exit(0); 
  }
}

main();