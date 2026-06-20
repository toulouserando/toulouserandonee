// src/app/api/testrandos/format-tableau/[[...path]]/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(req: Request, { params }: { params: Promise<{ path?: string[] }> }) {
  try {
    // ÉTAPE CRUCIALE POUR NEXT.JS 15 : On attend les params
    const resolvedParams = await params;
    const pathSegments = resolvedParams.path || [];

    // Construction du chemin du fichier
    const filePath = path.join(process.cwd(), 'data', 'rando', ...pathSegments);
    
    const fileContent = await fs.readFile(filePath, 'utf8');
    const jsonData = JSON.parse(fileContent);

    // Si c'est un tableau (format Gers / Toulouse)
    if (Array.isArray(jsonData)) {
      const formatted = jsonData.map((item: any) => {
        // Détection flexible de la géométrie
        const geo = item.geo_shape?.geometry || item.geometry || item.route_geometry;
        
        return {
          id: item.id || Math.random().toString(),
          title: item.nom || item.nom_itineraire || item.toponyme || "Randonnée",
          geometry: geo,
          center: item.geo_point_2d ? [item.geo_point_2d.lat, item.geo_point_2d.lon] : null,
          properties: {
            commune: item.nom_comm || item.commune || "",
            distance: item.longueur || item.distance || "N/A",
            difficulty: item.difficulte || "moyen"
          }
        };
      });
      return NextResponse.json(formatted);
    }

    // Si c'est un GeoJSON simple (Objet unique)
    return NextResponse.json(jsonData);

  } catch (error) {
    console.error("Erreur API:", error);
    return NextResponse.json({ error: "Fichier non trouvé ou invalide" }, { status: 404 });
  }
}