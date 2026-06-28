import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Fonction utilitaire pour extraire les coordonnées du contenu JSON/GeoJSON
function extractCoords(data: any) {
  // Cas 1 : GeoJSON avec géométrie (point)
  if (data.type === 'Feature' && data.geometry?.type === 'Point') {
    return { latitude: data.geometry.coordinates[1], longitude: data.geometry.coordinates[0] };
  }
  // Cas 2 : Propriétés directes (lat/lon ou latitude/longitude)
  const lat = data.latitude || data.lat || data.properties?.latitude || data.properties?.lat;
  const lon = data.longitude || data.lon || data.properties?.longitude || data.properties?.lon;
  
  return { latitude: lat, longitude: lon };
}

async function getFilesFromDir(subDir: string, category: string) {
  const dirPath = path.join(process.cwd(), 'data', 'randos', subDir);
  
  try {
    const files = await fs.readdir(dirPath);
    const validFiles = files.filter(f => f.endsWith('.json') || f.endsWith('.geojson'));

    return await Promise.all(validFiles.map(async (file) => {
      const content = await fs.readFile(path.join(dirPath, file), 'utf8');
      const data = JSON.parse(content);
      
      const coords = extractCoords(data);
      let nom = data.properties?.nom || data.name || data.local_name || file;

      return {
        id: `${category}-${file}`,
        nom: nom.replace(/_/g, ' ').replace('.json', '').replace('.geojson', ''),
        categorie: category,
        type: data.type || 'Object',
        ...data, // On retourne aussi les données brutes (utile pour le GeoJSON)
        ...coords // On ajoute les coordonnées extraites ici
      };
    }));
  } catch (e) {
    console.error(`[RandoHub] Échec d'accès sur : ${dirPath}`);
    return [];
  }
}

export async function GET() {
  try {
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
    return NextResponse.json({ error: "Erreur globale" }, { status: 500 });
  }
}