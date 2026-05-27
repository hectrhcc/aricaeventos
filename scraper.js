import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import { gotScraping } from 'got-scraping';

async function scrapePassline() {
  const listaEventos = [];
  try {
    console.log("Conectando a Passline burlando el TLS Fingerprint...");
    
    // got-scraping emula automáticamente la huella digital de un navegador real
    const response = await gotScraping.get('https://www.passline.com/eventos?q=Arica&pais=1');

    const html = response.body;
    const $ = cheerio.load(html);

    let contador = 1;
    const tarjetas = $('article.item');
    console.log(`--> Cantidad de tarjetas 'article.item' encontradas: ${tarjetas.length}`);

    tarjetas.each((index, element) => {
      const $el = $(element);
      const titulo = $el.find('a.title').text().trim();
      let url_ticket = $el.find('a.title').attr('href') || 'https://www.passline.com/';
      let imagen = $el.find('img').attr('src') || '';
      if (imagen.startsWith('//')) imagen = 'https:' + imagen;

      const fechaTexto = $el.find('li.date').text().trim();
      const lugar = $el.find('li.location').text().trim();

      let fecha = "2026-06-01"; 
      let hora = "20:00";
      if (fechaTexto.includes('-')) {
        const partes = fechaTexto.split('-');
        hora = partes[1] ? partes[1].trim() : hora;
      }

      let categoria = "En vivo";
      const tMin = titulo.toLowerCase();
      if (tMin.includes('fiesta') || tMin.includes('party') || tMin.includes('night')) categoria = "Fiestas";
      else if (tMin.includes('deporte') || tMin.includes('run')) categoria = "Deportes";
      else if (tMin.includes('teatro') || tMin.includes('cultura')) categoria = "Cultura";

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

    return listaEventos;

  } catch (error) {
    console.error("❌ Error crítico en el scraper:", error.message);
    return [];
  }
}

async function main() {
  const eventosReales = await scrapePassline();
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  const outputPath = path.join(publicDir, 'eventos.json');
  fs.writeFileSync(outputPath, JSON.stringify(eventosReales, null, 2), 'utf-8');
  console.log(`[Resultado] Proceso terminado. Guardados ${eventosReales.length} eventos reales.`);
}

main();