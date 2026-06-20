import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const baseDir = path.join(process.cwd(), 'data', 'visites_json');
    const files = await fs.readdir(baseDir);
    
    // Filtrer uniquement les fichiers JSON
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    const toutesLesVisites = await Promise.all(
      jsonFiles.map(async (file) => {
        const filePath = path.join(baseDir, file);
        const nomVille = file.replace('.json', '').replace(/_/g, ' ');

        try {
          const content = await fs.readFile(filePath, 'utf8');
          const pois = JSON.parse(content);

          let pointsFinaux: any[] = [];

          if (Array.isArray(pois)) {
            // ⭐ Détection du format Montpellier (Tableau d'objets avec "points_interet")
            if (pois.length > 0 && 'points_interet' in pois[0]) {
              // On "aplatit" tous les points_interet de tous les quartiers en un seul tableau
              pointsFinaux = pois.flatMap((quartier: any) => quartier.points_interet || []);
            } else {
              // Format standard (Tableau direct de points, comme Lisle-sur-Tarn)
              pointsFinaux = pois;
            }
          }

          return {
            ville: nomVille,
            points: pointsFinaux
          };
        } catch (jsonError) {
          console.error(`⚠️ Erreur de syntaxe JSON détectée dans le fichier [${file}] :`, jsonError);
          return null; // On renvoie null pour ce fichier cassé
        }
      })
    );

    // On élimine les fichiers qui ont échoué (les null) et ceux qui n'ont pas de points
    const resultatsValides = toutesLesVisites.filter(
      (v): v is { ville: string; points: any[] } => v !== null && v.points.length > 0
    );

    return NextResponse.json(resultatsValides);
  } catch (error) {
    console.error("Erreur globale API visites_json :", error);
    return NextResponse.json({ error: "Erreur lors de la lecture des JSON" }, { status: 500 });
  }
}