import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const dirPath = path.join(process.cwd(), 'data', 'randos', 'Lot_en_Velo');
    const files = await fs.readdir(dirPath);
    
    // Filtrer les fichiers .geojson ou .json
    const geoFiles = files.filter(f => f.endsWith('.geojson') || f.endsWith('.json'));

    const allGR = await Promise.all(
      geoFiles.map(async (file) => {
        const content = await fs.readFile(path.join(dirPath, file), 'utf8');
        const data = JSON.parse(content);
        
        // On extrait les infos de la première feature pour l'aperçu
        const firstFeature = data.features?.[0];
        
        return {
          filename: file,
          name: data.name || firstFeature?.properties?.nom || file.replace('.geojson', ''),
          type: firstFeature?.geometry?.type || 'Unknown',
          // Nombre de segments dans le MultiLineString
          segments: firstFeature?.geometry?.coordinates?.length || 0,
          raw: data // On renvoie tout le GeoJSON pour l'affichage cartographique
        };
      })
    );

    return NextResponse.json(allGR);
  } catch (error) {
    return NextResponse.json({ error: "Erreur lecture Lot Velo" }, { status: 500 });
  }
}