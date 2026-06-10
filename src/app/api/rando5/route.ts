import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const randoName = searchParams.get('rando');

  // Chemin absolu vers votre dossier Lot
  const dirPath = path.join(process.cwd(), 'data', 'randos', 'Lot');

  try {
    // 1. Si aucun nom n'est spécifié, on renvoie la liste de toutes les randos dispo
    if (!randoName) {
      if (!fs.existsSync(dirPath)) {
        return NextResponse.json([], { status: 404 });
      }
      const files = fs.readdirSync(dirPath);
      const randosList = files
        .filter(file => file.endsWith('.geojson'))
        .map(file => file.replace('.geojson', ''));
      
      return NextResponse.json(randosList);
    }

    // 2. Si une rando est demandée, on lit et on renvoie son GeoJSON
    const filePath = path.join(dirPath, `${randoName}.geojson`);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Randonnée introuvable' }, { status: 404 });
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const geojsonData = JSON.parse(fileContent);

    return NextResponse.json(geojsonData);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la lecture des données' }, { status: 500 });
  }
}