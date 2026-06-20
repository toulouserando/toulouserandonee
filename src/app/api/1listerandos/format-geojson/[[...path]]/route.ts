// \src\app\api\testrandos\format-geojson\[[...path]]\route.ts
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const resolvedParams = await params;
    
    if (!resolvedParams.path) {
      return NextResponse.json({ error: "Chemin manquant" }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'data', 'rando', ...resolvedParams.path);
    const fileContent = await fs.readFile(filePath, 'utf8');
    const jsonData = JSON.parse(fileContent);

    const features = jsonData.features || (Array.isArray(jsonData) ? jsonData : [jsonData]);

    const formatted = features.map((f: any) => {
      let geometry = f.geometry;
      const lat = f.properties?.latitude;
      const lon = f.properties?.longitude;
      
      // --- CORRECTION UNIVERSELLE (POLYGON, LINESTRING, etc.) ---
      // On considère la géométrie vide si elle n'existe pas OU si son tableau coordinates est vide
      const isGeometryEmpty = !geometry || 
                              !geometry.coordinates || 
                              geometry.coordinates.length === 0;
      
      if (isGeometryEmpty && lat && lon) {
        geometry = {
          type: "Point",
          coordinates: [lon, lat] // Format GeoJSON standard [Lon, Lat]
        };
      }

      // Extraction du centre pour le zoom/marqueur
      let center = null;
      if (lat && lon) {
        center = [lat, lon];
      } else if (geometry?.type === "Point") {
        center = [geometry.coordinates[1], geometry.coordinates[0]];
      } else if (geometry?.type === "MultiLineString" || geometry?.type === "LineString") {
        try {
          const firstCoord = geometry.type === "MultiLineString" 
            ? geometry.coordinates[0][0] 
            : geometry.coordinates[0];
          if (firstCoord) center = [firstCoord[1], firstCoord[0]];
        } catch (e) {
          center = null;
        }
      }

      return {
        title: f.properties?.local_name || f.properties?.nom || f.properties?.city || "Site",
        center: center,
        geometry: geometry,
        properties: f.properties,
        id: f.properties?.id || Math.random().toString(36)
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Erreur API GeoJSON:", error);
    return NextResponse.json({ error: "Fichier GeoJSON introuvable ou mal formé" }, { status: 404 });
  }
}