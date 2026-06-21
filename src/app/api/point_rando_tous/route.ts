// src/app/api/rando11balrand/route.ts
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Fonction utilitaire pour lire un dossier et normaliser les données
async function getFilesFromDir(subDir: string, category: string) {
  // 🎯 FORCE LE CHEMIN STRICT : D:\RandoToulousePWA \ data \ randos \ subDir
  const dirPath = path.join(process.cwd(), 'data', 'randos', subDir);
  
  try {
    const files = await fs.readdir(dirPath);
    const validFiles = files.filter(f => f.endsWith('.json') || f.endsWith('.geojson'));

    return await Promise.all(validFiles.map(async (file) => {
      const content = await fs.readFile(path.join(dirPath, file), 'utf8');
      const data = JSON.parse(content);
      
      let nom = "Sans nom";
      if (Array.isArray(data)) nom = data[0]?.nom || data[0]?.nom_itineraire || file;
      else nom = data.properties?.nom || data.name || data.local_name || data.features?.[0]?.properties?.nom || file;

      return {
        id: `${category}-${file}`,
        nom: nom.replace(/_/g, ' ').replace('.json', '').replace('.geojson', ''),
        categorie: category,
        type: Array.isArray(data) ? 'Liste' : (data.type || 'Object'),
        file: file
      };
    }));
  } catch (e) {
    // Ce log te confirmera si le chemin construit est désormais le bon
    console.error(`[RandoHub] Échec d'accès sur : ${dirPath}`);
    return [];
  }
}

export async function GET() {
  try {
    // Alignement strict sur l'orthographe exacte de tes dossiers Windows dans data/randos
    const results = await Promise.all([
      getFilesFromDir('balades_Toulouse', 'Balade Toulouse'),
      getFilesFromDir('Gers', 'Randos Gers (32)'),
      getFilesFromDir('Haute_Garonne', 'Randos Haute-Garonne (31)'),
      getFilesFromDir('crues_toulouse', 'Crue Toulouse'),
      getFilesFromDir('Lot_en_Velo', 'Lot Velo'),
      getFilesFromDir('Lot', 'Randos Lot (46)'),
      getFilesFromDir('Point_Interet_Ocitanie', 'Patrimoine (POI)'),
      getFilesFromDir('Randos_en_Occitanie', 'Randos Occitanie'),
      getFilesFromDir('Balades_en_velo_Toulouse', 'Vélo Toulouse'),
    ]);

    return NextResponse.json(results.flat());
  } catch (error) {
    console.error("Erreur globale API rando11balrand:", error);
    return NextResponse.json({ error: "Erreur globale" }, { status: 500 });
  }
}