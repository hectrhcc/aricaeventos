const fs = require('fs');
const path = require('path');

// 1. Función para scrapear o conectar con Passline Arica
async function scrapePassline() {
  try {
    console.log("Extrayendo eventos de Passline...");
    
    // NOTA: Aquí usarás fetch() o cheerio para parsear la web de Passline en el futuro.
    // De momento, dejamos un retorno estructurado para que tu GitHub Action no falle.
    return [
      {
        "id": "pl-1",
        "titulo": "Gran Fiesta Playera",
        "productora": "Passline",
        "fecha": "2026-06-05",
        "hora": "23:00",
        "lugar": "Playa El Laucho",
        "precio_desde": 10000,
        "categoria": "Fiestas",
        "imagen": "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=500&fit=crop",
        "url_ticket": "https://www.passline.com/"
      }
    ];
  } catch (error) {
    console.error("Error en el scraper de Passline:", error);
    return []; // Retorna un array vacío para no romper todo el flujo
  }
}

// 2. Función para la ticketera de complemento (Ej: Toliv)
async function scrapeToliv() {
  try {
    console.log("Extrayendo eventos de Toliv Market...");
    
    // Aquí puedes meter el fetch a la URL de búsqueda de Toliv en Arica
    return [
      {
        "id": "tl-2",
        "titulo": "Festival de Jazz & Blues",
        "productora": "Cultural Arica",
        "fecha": "2026-06-07",
        "hora": "20:00",
        "lugar": "Teatro Municipal de Arica",
        "precio_desde": 8000,
        "categoria": "En vivo",
        "imagen": "https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=800&h=500&fit=crop",
        "url_ticket": "https://tolivmarket.com/"
      }
    ];
  } catch (error) {
    console.error("Error en el scraper de Toliv:", error);
    return [];
  }
}

// 3. Función principal que unifica todo y escribe el archivo public/eventos.json
async function main() {
  console.log("Iniciando actualización automática de eventos...");

  const eventosPassline = await scrapePassline();
  const eventosToliv = await scrapeToliv();

  // Combinamos todos los arrays de eventos
  const todosLosEventos = [...eventosPassline, ...eventosToliv];

  // Asegurar que la carpeta 'public' exista en el servidor de GitHub
  const publicDir = path.join(__dirname, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Guardar el archivo final JSON bien formateado
  const outputPath = path.join(publicDir, 'eventos.json');
  fs.writeFileSync(outputPath, JSON.stringify(todosLosEventos, null, 2), 'utf-8');

  console.log(`¡Éxito! Se han guardado ${todosLosEventos.length} eventos en ${outputPath}`);
}

main();