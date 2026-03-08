import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Force Next.js à ne pas mettre en cache la liste de manière statique 
// (utile si tu ajoutes des fichiers JSON sans redéployer)
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dirPath = path.join(process.cwd(), 'data', 'balade');
    
    // Vérification si le dossier existe pour éviter un crash
    try {
      await fs.access(dirPath);
    } catch {
      console.warn("Dossier /data/balade non trouvé.");
      return NextResponse.json([]);
    }

    const files = await fs.readdir(dirPath);

    const randoFiles = files
      .filter(f => f.endsWith('.json') || f.endsWith('.geojson'))
      .map(f => ({
        // L'id sert de clé dans ton Select
        id: f, 
        // Nettoyage du titre pour l'affichage (ex: "D31-circuit" -> "D31 circuit")
        title: f.replace(/\.(json|geojson)$/, '').replace(/-/g, ' '),
        fileName: f,
        source: 'official'
      }))
      // Optionnel : Trier par titre alphabétique
      .sort((a, b) => a.title.localeCompare(b.title));

    return NextResponse.json(randoFiles);

  } catch (error) {
    console.error("Erreur API /api/rando/list :", error);
    return NextResponse.json(
      { error: "Impossible de lire les fichiers rando" },
      { status: 500 }
    );
  }
}