import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// On crée un petit cache en dehors de la fonction GET
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

  // Si on a déjà lu le fichier, on le renvoie directement
  if (cache[fileName]) {
    return NextResponse.json(cache[fileName]);
  }

  try {
    const filePath = path.join(process.cwd(), 'data', 'rando', fileName);
    const fileContent = await fs.readFile(filePath, 'utf8');
    const jsonData = JSON.parse(fileContent);

    // On stocke dans le cache pour la prochaine fois
    cache[fileName] = jsonData;

    return NextResponse.json(jsonData);
  } catch (error) {
    console.error("Erreur lecture fichier:", error);
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }
}