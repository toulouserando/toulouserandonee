import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    // On cible uniquement le dossier Gers
    const deptPath = path.join(process.cwd(), 'data', 'randos', 'Gers');
    
    const files = await fs.readdir(deptPath);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    let allData: any[] = [];

    for (const file of jsonFiles) {
      try {
        const content = await fs.readFile(path.join(deptPath, file), 'utf8');
        let rawData = JSON.parse(content);
        
        // Sécurité si les données sont enveloppées dans un tableau
        const data = Array.isArray(rawData) ? rawData[0] : rawData;

        if (!data) continue;

        allData.push({
          id: file.replace('.json', ''), // ID propre basé sur le nom du fichier
          departement: 'Gers (32)',
          nom: data.nom_itineraire || file.replace('.json', '').replace(/_/g, ' '),
          commune: data.commune || 'N/A',
          longueur: data.longueur || null,
          geo: data.geo_point_2d || null,
          shape: data.geo_shape || null
        });
      } catch (fileError) {
        console.error(`Erreur de lecture du fichier ${file}:`, fileError);
      }
    }

    return NextResponse.json(allData);
  } catch (error) {
    console.error("Erreur lecture dossier Gers:", error);
    return NextResponse.json([], { status: 500 });
  }
}