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
 * Parsea una fecha tipo "27 Junio 2026" o formatos numéricos "27/06/2026" → "2026-06-27"
 */
function parsearFecha(texto) {
  if (!texto) return null;
  
  // 1. Formato original con texto: "27 Junio 2026"
  const rePalabras = new RegExp(`(\\d{1,2})\\s*(${Object.keys(MESES).join('|')})\\s*(\\d{4})`, 'i');
  const mPalabras = texto.match(rePalabras);
  if (mPalabras) {
    const dia = mPalabras[1].padStart(2, '0');
    const mes = MESES[mPalabras[2].toLowerCase()];
    return `${mPalabras[3]}-${mes}-${dia}`;
  }

  // 2. Formato numérico por si la API envía "DD/MM/YYYY" o "DD-MM-YYYY"
  const reNumeros = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/;
  const mNumeros = texto.match(reNumeros);
  if (mNumeros) {
    const dia = mNumeros[1].padStart(2, '0');
    const mes = mNumeros[2].padStart(2, '0');
    return `${mNumeros[3]}-${mes}-${dia}`;
  }

  // 3. Si ya viene en formato ISO corto de la API (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}/.test(texto)) {
    return texto.substring(0, 10);
  }

  return null;
}

/**
 * Extrae la categoría de la app a partir del texto RAW de la tarjeta (para MuniArica).
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
 * Extrae el lugar del texto (entre "place" y "Leer más") (para MuniArica).
 */
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

// ─── Scrapers de Fuentes ───────────────────────────────────────────────────────

/**
 * FUENTE 1: Municipalidad de Arica (Scraping HTML con Cheerio)
 */
async function scrapeMuniArica() {
  console.log('🚀 [Muni Arica] Iniciando extracción quirúrgica (Estructura Quasar)...');

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

      const urlRelativa = el.attr('href') || '';
      const urlTicket = urlRelativa.startsWith('/')
        ? 'https://muniarica.cl' + urlRelativa
        : urlRelativa;

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

    console.log(`✅ [Muni Arica] Éxito. Encontrados: ${resultado.length} eventos.`);
    return resultado;

  } catch (error) {
    console.error('⚠️ [Muni Arica] Error de red:', error.message);
    return [];
  }
}

/**
 * FUENTE 2: Panoramas Arica (Consumo directo de API JSON)
 */
async function scrapePanoramasArica() {
  console.log('🚀 [Panoramas Arica] Conectando directamente con la API externa...');

  const fuentes = [
    { 
      url: 'https://api.panoramasarica.cl/vitrina/listar-actividades?&filtro_destino=&pagina=1&entradas=9&sitio_slug=&nombre_tipo_actividad=Eventos%20culturales', 
      categoria: 'Cultura',
      urlOriginal: 'https://www.panoramasarica.cl/?q=Eventos%20culturales'
    },
    { 
      url: 'https://api.panoramasarica.cl/vitrina/listar-actividades?&filtro_destino=&pagina=1&entradas=9&sitio_slug=&nombre_tipo_actividad=Eventos%20deportivos', 
      categoria: 'Deportes',
      urlOriginal: 'https://www.panoramasarica.cl/?q=Eventos%20deportivos'
    }
  ];

  const resultado = [];
  let contador = 1;

  for (const fuente of fuentes) {
    try {
      console.log(`🔎 [Panoramas Arica] Solicitando JSON para: ${fuente.categoria}`);
      
      const response = await axios.get(fuente.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      });

      const data = response.data;

      // Estabilizador preventivo: Verifica si la API devuelve el array directo o viene dentro de una propiedad
      let listaEventos = [];
      if (Array.isArray(data)) {
        listaEventos = data;
      } else if (data && typeof data === 'object') {
        // En Next.js / Strapi suele venir en .data, .actividades, o .items
        listaEventos = data.data || data.actividades || data.items || data.resultados || [];
      }

      listaEventos.forEach((item) => {
        // Mapeamos los campos dinámicamente con fallbacks por si cambian de nombre en la API interna
        const titulo = item.nombre || item.titulo || item.title || 'Panorama Regional';
        
        // Creamos la URL para que el usuario vaya a la web real a comprar/ver, no a la API
        const slug = item.slug || '';
        const urlTicket = slug ? `https://www.panoramasarica.cl/actividad/${slug}` : fuente.urlOriginal;

        let imagen = item.imagen || item.foto || item.imagen_url || '';
        if (imagen && imagen.startsWith('/')) imagen = 'https://www.panoramasarica.cl' + imagen;

        // Limpieza de datos numéricos y de texto
        const fechaRaw = item.fecha || item.fecha_inicio || '';
        const fecha = parsearFecha(fechaRaw) || '2026-06-15';

        const lugar = item.lugar || item.ubicacion || item.direccion || 'Arica, Región de Arica y Parinacota';
        
        // Parsear el precio a número entero limpio
        const precioRaw = item.precio || item.valor || item.precio_desde || 0;
        const precio_desde = typeof precioRaw === 'number' ? precioRaw : parseInt(String(precioRaw).replace(/[^\d]/g, ''), 10) || 0;

        resultado.push({
          id: `panoramas-${Date.now()}-${contador++}`,
          titulo,
          productora: 'Panoramas Arica',
          fecha,
          hora: item.hora || '10:00',
          lugar,
          precio_desde,
          categoria: fuente.categoria,
          imagen,
          url_ticket: urlTicket
        });
      });

    } catch (error) {
      console.error(`⚠️ [Panoramas Arica] Error al consultar API de ${fuente.categoria}:`, error.message);
    }
  }

  console.log(`✅ [Panoramas Arica] Éxito. Encontrados: ${resultado.length} eventos.`);
  return resultado;
}

// ─── Función Principal (Orquestador) ───────────────────────────────────────────

async function main() {
  try {
    // Ejecutamos ambos procesos en paralelo de forma asíncrona para ahorrar tiempo
    const [eventosMunicipales, eventosPanoramas] = await Promise.all([
      scrapeMuniArica(),
      scrapePanoramasArica()
    ]);

    // Unificamos las dos colecciones en una sola
    const listaConsolidada = [...eventosMunicipales, ...eventosPanoramas];
    
    if (listaConsolidada.length === 0) {
      console.log("🔒 Proceso finalizado de forma segura: No se recolectaron eventos de ninguna plataforma.");
      process.exit(0); 
    }

    // Aseguramos que la carpeta public exista
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

    // Guardamos todo el JSON final listo para tu FrontEnd
    const outputPath = path.join(publicDir, 'eventos.json');
    fs.writeFileSync(outputPath, JSON.stringify(listaConsolidada, null, 2), 'utf-8');
    
    console.log(`\n🎉 [ÉXITO TOTAL] ¡Base de datos actualizada! Se estructuraron ${listaConsolidada.length} eventos en total en ${outputPath}`);
    process.exit(0);

  } catch (error) {
    console.error("❌ Fallo general en el proceso principal:", error.message);
    process.exit(0); 
  }
}

main();