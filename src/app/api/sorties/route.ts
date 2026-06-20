import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// ⭐ Helper pour calculer le centroïde d'un polygone / multipolygon
function calculateCentroid(geometry: any): { lat: number; lon: number } | null {
  if (!geometry || !geometry.coordinates) return null;

  const flattenCoords = (coords: any[]): number[][] =>
    coords.flat(Infinity).filter(c => Array.isArray(c) && c.length >= 2);

  const points = flattenCoords(geometry.coordinates);
  if (points.length === 0) return null;

  const sum = points.reduce(
    (acc, [lon, lat]) => {
      acc.lat += lat;
      acc.lon += lon;
      return acc;
    },
    { lat: 0, lon: 0 }
  );

  return {
    lat: sum.lat / points.length,
    lon: sum.lon / points.length
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id'); 

    const dataDir = path.join(process.cwd(), 'public');
    const baladeDir = path.join(dataDir, 'balade');
    const indexPath = path.join(dataDir, 'liste_circuits_balade.json');

    // --- Cas 1 : Détail d'un fichier spécifique ---
    if (id) {
      const filePath = path.join(baladeDir, id);
      if (!fs.existsSync(filePath))
        return NextResponse.json({ error: "Fichier non trouvé" }, { status: 404 });

      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      if (Array.isArray(content.data)) {
        content.data = content.data.map((item: any) => {
          if (!item.geo_point_2d) {
            const geom = item.geometry || item.geo_shape?.geometry;
            if (geom) {
              const centroid = calculateCentroid(geom);
              if (centroid) item.geo_point_2d = centroid;
            }
          }
          return item;
        });
      }

      return NextResponse.json({
        id: id,
        name: content.nom || content.name || id.replace(/\.(json|geojson)$/, ''),
        data: content.data || content
      });
    }

    // --- Cas 2 : Liste des circuits (Comportement par défaut) ---
    if (!fs.existsSync(indexPath)) return NextResponse.json([]);

    const indexContent = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));

    const listeSimple = indexContent.fichiers.map((item: any) => {
      // Si l'item est un objet (votre nouveau format avec description)
      if (typeof item === 'object' && item !== null) {
        return {
          id: item.fichier,           // Utilisé pour le fetch au clic
          name: item.nom_affichage,   // Titre principal
          description: item.description || "" // La nouvelle ligne de description
        };
      }
      
      // Sécurité : Ancien format (string simple)
      const cleanName = item.replace(/\.(json|geojson)$/, '').replace(/-/g, ' ');
      return {
        id: item,
        name: cleanName,
        description: ""
      };
    });

    return NextResponse.json(listeSimple);

  } catch (error) {
    console.error("Erreur API:", error);
    return NextResponse.json([]);
  }
}