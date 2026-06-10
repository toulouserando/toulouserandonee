import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const baseDir = path.join(process.cwd(), 'data', 'randos');
    // Correspondance exacte avec le nom de tes dossiers sur ton disque
    const departements = [
      { folder: 'Gers', label: 'Gers (32)' },
      { folder: 'Haute_Garonne', label: 'Haute-Garonne (31)' }
    ];
    
    let allData: any[] = [];

    for (const dept of departements) {
      const deptPath = path.join(baseDir, dept.folder);
      
      try {
        const files = await fs.readdir(deptPath);
        const jsonFiles = files.filter(f => f.endsWith('.json'));

        for (const file of jsonFiles) {
          const content = await fs.readFile(path.join(deptPath, file), 'utf8');
          let rawData = JSON.parse(content);
          
          // Normalisation (tableau ou objet direct)
          const data = Array.isArray(rawData) ? rawData[0] : rawData;
          if (!data) continue;

          // Récupération ou calcul des coordonnées du point de repère principal
          let geoPoint = data.geo_point_2d || null;

          // Si geo_point_2d est absent (comme en Haute-Garonne), on extrait le premier point du tracé
          if (!geoPoint && data.geo_shape?.geometry?.coordinates) {
            try {
              const coords = data.geo_shape.geometry.coordinates;
              // Gestion des structures MultiLineString ou LineString imbriquées
              const firstLine = Array.isArray(coords[0][0]) ? coords[0][0] : coords[0];
              const firstPoint = firstLine[0]; // [lng, lat]
              
              if (firstPoint && firstPoint[0] !== undefined) {
                geoPoint = {
                  lon: firstPoint[0],
                  lat: firstPoint[1]
                };
              }
            } catch (e) {
              console.warn("Impossible de calculer un point de repli pour", file);
            }
          }

          allData.push({
            id: `${dept.folder}-${file.replace('.json', '')}`,
            departement: dept.label,
            nom: data.nom_itineraire || file.replace('.json', '').replace(/_/g, ' '),
            commune: data.commune || 'N/A',
            longueur: data.longueur ? Math.round(Number(data.longueur)) : null,
            geo: geoPoint,
            shape: data.geo_shape || null
          });
        }
      } catch (dirError) {
        console.error(`Erreur lors de la lecture du répertoire ${dept.folder}:`, dirError);
      }
    }

    return NextResponse.json(allData);
  } catch (error) {
    console.error("Erreur globale API rando10:", error);
    return NextResponse.json([], { status: 500 });
  }
}