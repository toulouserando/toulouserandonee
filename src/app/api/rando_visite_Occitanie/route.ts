import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const baseDir = path.join(process.cwd(), 'public', 'visites');
    const jsonDir = path.join(process.cwd(), 'data', 'visites_json');
    
    const villes = await fs.readdir(baseDir);
    
    const dataVisites = await Promise.all(villes.map(async (ville) => {
      const villePath = path.join(baseDir, ville);
      const stats = await fs.stat(villePath);
      
      if (!stats.isDirectory()) return null;

      const files = await fs.readdir(villePath);
      
      // 1. Récupération des fichiers textes optionnels (.txt)
      const fichiersTextes = files.filter(f => f.endsWith('.txt'));
      const textesMap = new Map<number, string>();
      
      await Promise.all(
        fichiersTextes.map(async (f) => {
          try {
            const content = await fs.readFile(path.join(villePath, f), 'utf8');
            const idNum = parseInt(f.replace('.txt', ''));
            if (!isNaN(idNum)) {
              textesMap.set(idNum, content);
            }
          } catch (e) {
            // Erreur silencieuse pour un fichier texte illisible
          }
        })
      );

      // 2. Récupération et parsing du fichier JSON de la ville
      let pointsJson: any[] = [];
      try {
        const jsonPath = path.join(jsonDir, `${ville}.json`);
        const jsonContent = await fs.readFile(jsonPath, 'utf8');
        const parsedJson = JSON.parse(jsonContent);
        
        if (Array.isArray(parsedJson)) {
          pointsJson = parsedJson;
        } else if (parsedJson[ville] && Array.isArray(parsedJson[ville])) {
          pointsJson = parsedJson[ville];
        } else if (parsedJson.points && Array.isArray(parsedJson.points)) {
          pointsJson = parsedJson.points;
        }
      } catch (e) {
        console.warn(`Pas de fichier JSON valide trouvé pour la ville : ${ville}`);
      }

      // 3. Récupération de toutes les images cartes (jpg, jpeg, png)
      const toutesLesCartes = files.filter(f => f.match(/\.(jpg|jpeg|png)$/i));

      // 4. CONSTRUCTION DYNAMIQUE DES POINTS DE VISITE
      let pointsComplets: any[] = [];

      if (pointsJson.length > 0) {
        // S'il y a un JSON, on se base d'abord sur lui pour ne perdre aucun monument (ex: Albi, Agde)
        pointsComplets = pointsJson.map((matchJson: any, idx: number) => {
          const idNum = parseInt(matchJson.id) || (idx + 1);
          // On cherche s'il y a un texte long de secours en .txt
          const txtContent = textesMap.get(idNum);

          return {
            id: idNum,
            content: txtContent || matchJson.details || matchJson.nom || "Aucune description disponible.",
            nom: matchJson.nom || matchJson.name || `Étape ${idNum}`,
            adresse: matchJson.adresse || matchJson.address || null,
            details: matchJson.details || null,
            latitude: typeof matchJson.latitude === 'number' ? matchJson.latitude : matchJson.lat || null,
            longitude: typeof matchJson.longitude === 'number' ? matchJson.longitude : matchJson.lng || null,
          };
        });
      } else {
        // Si aucun JSON n'existe (ex: Lisle_sur_Tarn), on se rabat uniquement sur les fichiers .txt existants
        pointsComplets = Array.from(textesMap.entries()).map(([idNum, content]) => ({
          id: idNum,
          content: content,
          nom: `Étape ${idNum}`,
          adresse: null,
          details: null,
          latitude: null,
          longitude: null
        }));
      }

      // Tri final par l'ID numérique
      pointsComplets.sort((a, b) => a.id - b.id);

      return {
        ville: ville,
        cartes: toutesLesCartes,
        points: pointsComplets
      };
    }));

    return NextResponse.json(dataVisites.filter(v => v !== null));
  } catch (error) {
    console.error("Erreur API rando12visite :", error);
    return NextResponse.json({ error: "Erreur lecture visites" }, { status: 500 });
  }
}