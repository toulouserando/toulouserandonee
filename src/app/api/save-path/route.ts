import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { id, points, targetFolder } = await request.json();

    if (!id || !points || !targetFolder) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    // --- 1. NORMALISATION UNIVERSELLE DES COORDONNÉES ---
    // On convertit toutes les structures possibles en un format pivot unique : { lat, lng }
    const normalizedPoints = points.map((p: any) => {
      let lat = 0;
      let lng = 0;

      if (Array.isArray(p)) {
        // Cas du tableau simple : [lat, lng]
        lat = p[0];
        lng = p[1];
      } else if (typeof p === 'object' && p !== null) {
        // Cas de l'objet : gestion de toutes les variantes de clés possibles
        lat = p.lat !== undefined ? p.lat : p.latitude;
        lng = p.lng !== undefined ? p.lng : (p.long !== undefined ? p.long : p.longitude);
      }
      
      return { lat, lng };
    });

    // --- 2. ADAPTATEUR DE FORMAT DE SORTIE ---
    let finalDataToSave: any;

    switch (targetFolder.toLowerCase()) {
      
      // Cas 1 : Format GeoJSON Standard (Attention : le GeoJSON exige STRICTEMENT [Longitude, Latitude])
      case 'geojson':
      case 'mes_traces_geojson':
        finalDataToSave = {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: { id: id },
              geometry: {
                type: "LineString",
                coordinates: normalizedPoints.map(p => [p.lng, p.lat]) // [Lng, Lat] obligatoire ici
              }
            }
          ]
        };
        break;

      // Cas 2 : Tableau brut de coordonnées classiques [[lat, lng], [lat, lng]]
      case 'rando':
      case 'randos':
        finalDataToSave = normalizedPoints.map(p => [p.lat, p.lng]);
        break;

      // Cas 3 : Tableau d'objets avec clés courtes [{lat, lng}, ...]
      case 'mes_traces_json':
        finalDataToSave = normalizedPoints.map(p => ({ lat: p.lat, lng: p.lng }));
        break;

      // Cas 4 : Tableau d'objets avec clés longues [{latitude, longitude}, ...]
      case 'visites_json':
        finalDataToSave = normalizedPoints.map(p => ({ latitude: p.lat, longitude: p.lng }));
        break;

      // Cas 5 : Objet personnalisé avec géométrie imbriquée
      case 'balade':
        finalDataToSave = {
          id: id,
          nom: "Nouvelle balade",
          geometry: {
            type: "LineString",
            coordinates: normalizedPoints.map(p => [p.lng, p.lat]) // Format géo souvent calqué sur GeoJSON [Lng, Lat]
          }
        };
        break;

      // Cas par défaut : On enregistre le format pivot standardisé
      default:
        finalDataToSave = {
          id: id,
          coordinates: normalizedPoints
        };
    }

    // --- 3. ÉCRITURE ET ENREGISTREMENT ---
    // Détermination de l'extension (.geojson ou .json)
    const extension = ['geojson', 'mes_traces_geojson'].includes(targetFolder.toLowerCase()) ? '.geojson' : '.json';
    const fileName = `${id}${extension}`;

    // Chemin absolu vers le sous-dossier de destination (ex: D:\RandoToulousePWA\data\rando)
    const dirPath = path.join(process.cwd(), 'data', targetFolder);
    
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Écriture du fichier formaté sur le disque
    fs.writeFileSync(path.join(dirPath, fileName), JSON.stringify(finalDataToSave, null, 2));

    // Chemin relatif propre pour ta colonne Supabase (ex: "rando/mon-id.json")
    const dbFilePath = `${targetFolder}/${fileName}`;

    return NextResponse.json({ success: true, filePath: dbFilePath });
  } catch (error) {
    console.error("Erreur écriture fichier:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}