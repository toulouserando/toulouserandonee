import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// ⭐ Helper pour calculer le centroïde d'un polygone / multipolygon
function calculateCentroid(geometry: any): { lat: number; lon: number } | null {
  if (!geometry || !geometry.coordinates) return null;

  // Flatten tous les points en cas de MultiPolygon ou Polygon
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
    const id = searchParams.get('id'); // On récupère l'id si présent

    const dataDir = path.join(process.cwd(), 'data');
    const baladeDir = path.join(dataDir, 'balade');
    const indexPath = path.join(dataDir, 'liste_circuits_balade.json');

    // Cas 1 : L'utilisateur veut le contenu d'un fichier spécifique
    if (id) {
      const filePath = path.join(baladeDir, id);
      if (!fs.existsSync(filePath))
        return NextResponse.json({ error: "Fichier non trouvé" }, { status: 404 });

      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      // Si c'est un GeoJSON, ajouter geo_point_2d si absent
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

    // Cas 2 : L'utilisateur veut juste la LISTE (comportement par défaut)
    if (!fs.existsSync(indexPath)) return NextResponse.json([]);

    const indexContent = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));

    // On ne renvoie que l'ID et le Nom, PAS les données 'data'
    const listeSimple = indexContent.fichiers.map((file: string) => ({
      id: file,
      name: file.replace(/\.(json|geojson)$/, '').replace(/-/g, ' ')
    }));

    return NextResponse.json(listeSimple);
  } catch (error) {
    console.error("Erreur API:", error);
    return NextResponse.json([]);
  }
}