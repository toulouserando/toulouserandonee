import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Cache mémoire hors de la fonction GET
const cache: Record<string, any> = {};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  if (type !== 'poi' && type !== 'rando') {
    return NextResponse.json({ error: "Type invalide" }, { status: 400 });
  }

  const fileName = type === 'poi' 
    ? 'poi_occitanie_clean.json.geojson' 
    : 'rando_occitanie_geo.geojson';

  // Si le fichier est déjà en cache, on le sert immédiatement
  if (cache[fileName]) {
    return NextResponse.json(cache[fileName]);
  }

  try {
    // 🎯 CORRECTION : Ajout de 'occitanie' dans le chemin pour coller à ton arborescence
    const filePath = path.join(process.cwd(), 'data', 'rando', 'occitanie', fileName);
    const fileContent = await fs.readFile(filePath, 'utf8');
    const jsonData = JSON.parse(fileContent);

    // Stockage en cache
    cache[fileName] = jsonData;

    return NextResponse.json(jsonData);
  } catch (error) {
    console.error("Erreur lecture fichier:", error);
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }
}