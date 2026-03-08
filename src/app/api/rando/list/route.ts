import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Force Next.js à ne pas mettre en cache la liste de manière statique
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dirPath = path.join(process.cwd(), 'data', 'rando');
    
    // 1. Vérification sécurisée du dossier
    try {
      await fs.access(dirPath);
    } catch {
      console.warn("Dossier /data/rando non trouvé.");
      return NextResponse.json([]);
    }

    // 2. Lecture des fichiers
    const files = await fs.readdir(dirPath);

    const randoFiles = files
      .filter(f => f.endsWith('.json') || f.endsWith('.geojson'))
      .map(f => {
        // Extraction de l'extension pour déterminer le format
        const extension = path.extname(f).toLowerCase();
        const isGeoJson = extension === '.geojson';

        return {
          id: f, // Utilisé comme clé unique (key)
          fileName: f,
          // Titre propre pour l'affichage (ex: "gr-65-lot" -> "Gr 65 lot")
          title: f.replace(/\.(json|geojson)$/, '').replace(/-/g, ' '),
          // Information cruciale pour le Frontend
          format: isGeoJson ? 'geojson' : 'json',
          source: 'official'
        };
      })
      // 3. Tri alphabétique par titre
      .sort((a, b) => a.title.localeCompare(b.title));

    return NextResponse.json(randoFiles);

  } catch (error) {
    console.error("Erreur API /api/rando/list :", error);
    return NextResponse.json(
      { error: "Impossible de lire la liste des fichiers" },
      { status: 500 }
    );
  }
}