import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const dirPath = path.join(process.cwd(), 'data', 'randos', 'crues_toulouse');
    
    try {
      await fs.access(dirPath);
    } catch {
      return NextResponse.json({ error: "Le dossier data/randos/crues_toulouse n'existe pas" }, { status: 404 });
    }

    const files = await fs.readdir(dirPath);
    const jsonFiles = files.filter(file => file.endsWith('.json'));

    const allItineraires: any[] = [];

    for (const file of jsonFiles) {
      const filePath = path.join(dirPath, file);
      const content = await fs.readFile(filePath, 'utf8');
      const fileData = JSON.parse(content);

      if (Array.isArray(fileData)) {
        fileData.forEach((route: any, index: number) => {
          const generatedId = `${file}-${route.id || index}`;
          allItineraires.push(normalizeRoute(route, generatedId, route.id || index, file));
        });
      } else if (fileData && typeof fileData === 'object') {
        const generatedId = `${file}-${fileData.id || 0}`;
        allItineraires.push(normalizeRoute(fileData, generatedId, fileData.id || 0, file));
      }
    }

    return NextResponse.json(allItineraires);
  } catch (error) {
    console.error("Erreur API Rando3:", error);
    return NextResponse.json({ error: "Erreur lors de la lecture des fichiers Cruetou" }, { status: 500 });
  }
}

/**
 * Normalise un itinéraire et ajuste l'intitulé selon sa structure interne
 */
function normalizeRoute(route: any, uniqueId: string, originalId: any, fileName: string) {
  const pointsNormalized: { lat: number; lon: number; adresse?: string }[] = [];
  const accumulatedGpsLines: any[] = [];
  
  // On récupère le nom de base du fichier ou de l'itinéraire
  const baseName = route.nom || `Itinéraire de découverte ${originalId}`;
  let finalNom = baseName;

  // FORMAT A : Détection des Points simples (ex: cruetou.json)
  if (Array.isArray(route.points_reference)) {
    finalNom = `${baseName} (Points uniquement)`; // <-- Ajout de l'intitulé personnalisé
    
    route.points_reference.forEach((pt: any) => {
      if (pt && typeof pt.lat === 'number' && typeof pt.lon === 'number') {
        pointsNormalized.push({ lat: pt.lat, lon: pt.lon });
      }
    });
  } 
  
  // FORMAT B : Détection des Tracés complexes (ex: cruetou_complet.json)
  else if (Array.isArray(route.points_interet)) {
    finalNom = `${baseName} (Parcours complet)`; // <-- Ajout de l'intitulé personnalisé
    
    route.points_interet.forEach((poi: any) => {
      if (poi.coordonnees && typeof poi.coordonnees.lat === 'number' && typeof poi.coordonnees.lon === 'number') {
        pointsNormalized.push({ 
          lat: poi.coordonnees.lat, 
          lon: poi.coordonnees.lon,
          adresse: poi.adresse || "Repère sans adresse"
        });
      }
      
      if (Array.isArray(poi.trace_gps)) {
        poi.trace_gps.forEach((line: any) => {
          if (Array.isArray(line)) {
            accumulatedGpsLines.push(line);
          }
        });
      }
    });
  }

  // Configuration de la géométrie GeoJSON
  let geojsonTrace: any = null;

  if (accumulatedGpsLines.length > 0) {
    geojsonTrace = {
      type: "MultiLineString",
      coordinates: accumulatedGpsLines
    };
  } else if (pointsNormalized.length > 0) {
    geojsonTrace = {
      type: "LineString",
      coordinates: pointsNormalized.map(pt => [pt.lon, pt.lat])
    };
  }

  return {
    id: uniqueId, 
    originalId: originalId, 
    sourceFile: fileName, 
    nom: finalNom, // Contient maintenant le suffixe descriptif automatique !
    points_reference: pointsNormalized,
    geometry: geojsonTrace
  };
}