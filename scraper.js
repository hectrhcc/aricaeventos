import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';

// ─── CONSTANTES Y DICCIONARIOS ────────────────────────────────────────────────
const MESES = {
  'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
  'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
  'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
};

const MAPA_CATEGORIAS = {
  'cultura'        : 'Cultura',
  'comunidad'      : 'Cultura',    // comunidad es un tag genérico municipal, no implica fiesta
  'deportes'       : 'Deportes',
  'deporte'        : 'Deportes',
  'medio ambiente' : 'Cultura',
  'cine municipal' : 'Cine',       // cine municipal → categoría específica Cine
  'salud'          : 'Cultura',
  'educacion'      : 'Cultura',
  'educación'      : 'Cultura',
  'taller'         : 'Taller',     // taller → categoría específica Taller
  'arte'           : 'Cultura',
  'patrimonio'     : 'Cultura',
};

// Palabras clave en el SLUG/TÍTULO que indican Cine
const KEYWORDS_CINE = [
  'cine', 'pelicula', 'película', 'film', 'documental', 'cortometraje',
  'animacion', 'animación', 'proyeccion', 'proyección', 'cinema'
];

// Palabras clave en el SLUG/TÍTULO que indican Taller
const KEYWORDS_TALLER = [
  'taller', 'workshop', 'capacitacion', 'capacitación', 'curso',
  'seminario', 'charla', 'clase', 'yoga', 'diagnostico', 'diagnóstico',
  'formacion', 'formación'
];

// Palabras clave en el SLUG/TÍTULO que sí indican una fiesta o celebración
const KEYWORDS_FIESTAS = [
  'fiesta', 'carnaval', 'aniversario', 'celebracion', 'celebración',
  'noche', 'cumpleanos', 'cumpleaños', 'halloween', 'nochevieja',
  'verbena', 'baile', 'disco', 'cocktail', 'coctel', 'brindis',
  'gala', 'festejo'
];

// Palabras clave en el SLUG/TÍTULO que indican deporte
const KEYWORDS_DEPORTES = [
  'cup', 'torneo', 'campeonato', 'olimpiada', 'deporte', 'deportivo',
  'futbol', 'fútbol', 'running', 'maraton', 'maratón', 'ciclismo',
  'parapente', 'paragliding', 'tenis', 'voleibol', 'basquetbol'
];

const CATS_RAW = Object.keys(MAPA_CATEGORIAS).sort((a, b) => b.length - a.length);

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

// ─── HELPERS DE PARSEO ─────────────────────────────────────────────────────────

function parsearFecha(texto) {
  if (!texto) return null;
  
  const rePalabras = new RegExp(`(\\d{1,2})\\s*(${Object.keys(MESES).join('|')})\\s*(\\d{4})`, 'i');
  const mPalabras = texto.match(rePalabras);
  if (mPalabras) {
    const dia = mPalabras[1].padStart(2, '0');
    const mes = MESES[mPalabras[2].toLowerCase()];
    return `${mPalabras[3]}-${mes}-${dia}`;
  }

  const reNumeros = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/;
  const mNumeros = texto.match(reNumeros);
  if (mNumeros) {
    const dia = mNumeros[1].padStart(2, '0');
    const mes = mNumeros[2].padStart(2, '0');
    return `${mNumeros[3]}-${mes}-${dia}`;
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(texto)) {
    return texto.substring(0, 10);
  }

  return null;
}

// Tags genéricos del municipio que no definen bien la categoría → dejar pasar a keywords
const TAGS_GENERICOS = new Set(['comunidad', 'cultura', 'arte', 'patrimonio']);

function extraerCategoria(texto, slug = '') {
  // 1) Intentar extraer la categoría del texto que viene después de la fecha
  const reFecha = new RegExp(`(\\d{1,2})\\s*(${Object.keys(MESES).join('|')})\\s*(\\d{4})`, 'i');
  const mFecha = texto.match(reFecha);

  if (mFecha) {
    const despuesFecha = texto.slice(mFecha.index + mFecha[0].length).toLowerCase().trim();
    for (const raw of CATS_RAW) {
      if (despuesFecha.startsWith(raw)) {
        const cat = MAPA_CATEGORIAS[raw];
        // Si el tag es genérico, no retornar aún — dejar que el slug refine
        if (!TAGS_GENERICOS.has(raw)) return cat;
        break; // tag genérico encontrado, salir del loop y continuar con keywords
      }
    }
  }

  // 2) Keywords del slug/título tienen prioridad sobre tags genéricos
  const textoLower = (slug + ' ' + texto).toLowerCase();

  for (const kw of KEYWORDS_CINE) {
    if (textoLower.includes(kw)) return 'Cine';
  }

  for (const kw of KEYWORDS_TALLER) {
    if (textoLower.includes(kw)) return 'Taller';
  }

  for (const kw of KEYWORDS_DEPORTES) {
    if (textoLower.includes(kw)) return 'Deportes';
  }

  for (const kw of KEYWORDS_FIESTAS) {
    if (textoLower.includes(kw)) return 'Fiestas';
  }

  // 3) Default seguro: Cultura
  return 'Cultura';
}

function extraerLugar(texto) {
  const m = texto.match(/place(.+?)Leer\s*más/i);
  return m ? m[1].trim() : '';
}

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

// ─── FUENTE 1: MUNICIPALIDAD DE ARICA (HTML) ───────────────────────────────────

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

    $('a[href*="/eventos/publicacion/"]').each((_index, element) => {
      const el = $(element);

      const urlRelativa = el.attr('href') || '';
      const urlTicket = urlRelativa.startsWith('/') ? 'https://muniarica.cl' + urlRelativa : urlRelativa;

      let imagen = el.find('.card-image').attr('src') || el.find('img').attr('src') || '';
      if (imagen && imagen.startsWith('/')) imagen = 'https://muniarica.cl' + imagen;

      const texto = el.find('.q-card__section').text().trim();
      const titulo = slugATitulo(urlRelativa);
      const fecha = parsearFecha(texto) || '2026-06-01';
      const categoria = extraerCategoria(texto, urlRelativa); // pasamos el slug para mejor clasificación
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

// ─── FUENTE 2: PANORAMAS ARICA (API JSON ACTUALIZADO) ──────────────────────────

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
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        timeout: 15000
      });

      const data = response.data;
      let listaEventos = [];

      if (Array.isArray(data)) {
        listaEventos = data;
      } else if (data && typeof data === 'object') {
        listaEventos = data.data || data.actividades || data.items || data.resultados || [];
      }

      listaEventos.forEach((item) => {
        const titulo = item.nombre || item.titulo || 'Panorama Regional';
        const slug = item.slug || item.actividad_slug || '';
        const urlTicket = slug ? `https://www.panoramasarica.cl/actividad/${slug}` : fuente.urlOriginal;

        // Mapeo exacto de la URL S3 descubierta gracias a tu log
        const imagen = item.ruta_del_archivo || '';

        // Extracción inteligente de Fecha e ISO string
        const fechaRaw = item.fecha_proxima_minima || '';
        const fecha = parsearFecha(fechaRaw) || '2026-06-15';
        
        // Extracción dinámica de la hora
        let hora = '10:00';
        if (fechaRaw && fechaRaw.includes('T')) {
          hora = fechaRaw.split('T')[1].substring(0, 5); // "16:00"
        }

        // El objeto raíz no posee campo directo de dirección, se asigna ubicación global
        const lugar = 'Arica, Región de Arica y Parinacota';
        
        // Mapeo directo del valor numérico real entregado por su DB
        const precio_desde = item.precio_minimo_participante || 0;

        resultado.push({
          id: `panoramas-${Date.now()}-${contador++}`,
          titulo,
          productora: 'Panoramas Arica',
          fecha,
          hora,
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

// ─── CONSOLIDACIÓN Y ORQUESTACIÓN PRINCIPAL ───────────────────────────────────

async function main() {
  try {
    const [eventosMunicipales, eventosPanoramas] = await Promise.all([
      scrapeMuniArica(),
      scrapePanoramasArica()
    ]);

    // ── Rescatar eventos manuales del archivo existente ──────────────────────
    const outputPath = path.join(process.cwd(), 'public', 'eventos.json');
    let eventosManuales = [];
    if (fs.existsSync(outputPath)) {
      try {
        const raw = fs.readFileSync(outputPath, 'utf-8');
        const existentes = JSON.parse(raw);
        eventosManuales = existentes.filter(e => String(e.id).startsWith('manual-'));
        if (eventosManuales.length > 0) {
          console.log(`📌 [Manual] Conservando ${eventosManuales.length} evento(s) manual(es).`);
        }
      } catch (_) {
        console.warn('⚠️ No se pudo leer eventos.json existente; se omiten manuales.');
      }
    }

    const listaConsolidada = [...eventosMunicipales, ...eventosPanoramas, ...eventosManuales];
    
    if (listaConsolidada.length === 0) {
      console.log("🔒 Proceso terminado: No se encontraron registros vigentes en ningún portal.");
      process.exit(0); 
    }

    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

    fs.writeFileSync(outputPath, JSON.stringify(listaConsolidada, null, 2), 'utf-8');
    
    console.log(`\n🎉 [ÉXITO TOTAL] Base de datos sincronizada: ${listaConsolidada.length} eventos consolidados en ${outputPath}`);
    process.exit(0);

  } catch (error) {
    console.error("❌ Error crítico en el flujo unificado del script:", error.message);
    process.exit(0); 
  }
}

main();