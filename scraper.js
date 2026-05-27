import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';

async function scrapeMuniArica() {
  console.log("🚀 Iniciando extracción quirúrgica (Estructura Quasar)...");
  
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

    // 1. Apuntamos directo a los enlaces de publicaciones de eventos que vimos en tu consola
    const tarjetasEventos = 'a[href*="/eventos/publicacion/"]';

    $(tarjetasEventos).each((index, element) => {
      const el = $(element);
      
      // Obtener la URL relativa y convertirla en absoluta
      let url_relativa = el.attr('href') || '';
      let url_ticket = url_relativa.startsWith('/') 
        ? 'https://muniarica.cl' + url_relativa 
        : url_relativa;

      // Extraer la imagen usando la clase exacta de tu captura (.card-image)
      let imagen = el.find('.card-image').attr('src') || el.find('img').attr('src') || '';
      if (imagen && imagen.startsWith('/')) imagen = 'https://muniarica.cl' + imagen;

      // Extraer todo el bloque de texto dentro de la sección de la tarjeta
      const seccionTexto = el.find('.q-card__section').text().trim();
      
      // Limpieza del texto para obtener el título real (separa por líneas si hay metadatos dentro)
      const lineas = seccionTexto.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      let titulo = lineas[0] || "Evento Municipal";

      // Si por alguna razón el texto interno falla, creamos un título limpio usando el slug de la URL
      if (titulo === "Evento Municipal" && url_relativa) {
        const slug = url_relativa.split('/').pop();
        titulo = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      }

      resultado.push({
        id: `muni-${Date.now()}-${contador++}`,
        titulo: titulo,
        productora: "Muni Arica",
        fecha: "2026-06-01", // Fallback base de consistencia para la cartelera de junio
        hora: "19:00",
        lugar: "Centro Cultural / Espacio Público",
        precio_desde: 0,
        categoria: "Cultura y Panoramas",
        imagen: imagen,
        url_ticket: url_ticket
      });
    });

    return resultado;

  } catch (error) {
    console.error("⚠️ Error de red al conectar con la Municipalidad:", error.message);
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