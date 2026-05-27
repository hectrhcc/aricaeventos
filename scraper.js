import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

async function scrapePassline() {
  const listaEventos = [];
  try {
    console.log("Conectando a Passline con Cheerio...");
    
    // Hacemos el fetch inicial para obtener el HTML crudo
    const response = await fetch('https://www.passline.com/eventos?q=Arica&pais=1', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Error al conectar con Passline: ${response.status}`);
    }

    const html = await response.text();
    
    // Cargamos el HTML en Cheerio para poder navegar el DOM
    const $ = cheerio.load(html);
    let contador = 1;

    // Buscamos cada tarjeta de evento usando su clase real
    $('article.item').each((index, element) => {
      const $el = $(element);

      // Extractores limpios usando selectores CSS
      const titulo = $el.find('a.title').text().trim();
      let url_ticket = $el.find('a.title').attr('href') || 'https://www.passline.com/';
      
      let imagen = $el.find('img').attr('src') || '';
      if (imagen.startsWith('//')) {
        imagen = 'https:' + imagen;
      }

      const fechaTexto = $el.find('li.date').text().trim();
      const lugar = $el.find('li.location').text().trim();

      // Separamos la hora si viene con el guion clásico de Passline (Ej: "Sáb 24 May - 21:00")
      let fecha = "2026-06-01"; 
      let hora = "20:00";
      if (fechaTexto.includes('-')) {
        const partes = fechaTexto.split('-');
        hora = partes[1] ? partes[1].trim() : hora;
      }

      // Categorización automática inteligente por palabras clave
      let categoria = "En vivo";
      const tituloMinuscula = titulo.toLowerCase();
      if (tituloMinuscula.includes('fiesta') || tituloMinuscula.includes('party') || tituloMinuscula.includes('night') || tituloMinuscula.includes('noche')) {
        categoria = "Fiestas";
      } else if (tituloMinuscula.includes('deporte') || tituloMinuscula.includes('run') || tituloMinuscula.includes('surf') || tituloMinuscula.includes('maraton')) {
        categoria = "Deportes";
      } else if (tituloMinuscula.includes('teatro') || tituloMinuscula.includes('expo') || tituloMinuscula.includes('cultura') || tituloMinuscula.includes('museo')) {
        categoria = "Cultura";
      }

      // Solo agregamos el evento si realmente capturó un título válido
      if (titulo) {
        listaEventos.push({
          id: `real-pl-${contador++}`,
          titulo,
          productora: "Passline",
          fecha, 
          hora,
          lugar: lugar || "Arica",
          precio_desde: 0, 
          categoria,
          imagen,
          url_ticket
        });
      }
    });

    console.log(`[Cheerio] Se encontraron ${listaEventos.length} eventos reales en vivo.`);
    return listaEventos;

  } catch (error) {
    console.error("Error crítico en el scraper de Cheerio:", error);
    return [];
  }
}

async function main() {
  console.log("Iniciando actualización automática con datos reales...");

  const eventosReales = await scrapePassline();

  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const outputPath = path.join(publicDir, 'eventos.json');
  fs.writeFileSync(outputPath, JSON.stringify(eventosReales, null, 2), 'utf-8');

  console.log(`¡Proceso terminado con éxito! ${eventosReales.length} eventos guardados en eventos.json.`);
}

main();