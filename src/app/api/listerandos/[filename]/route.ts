import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(filename);

    if (isUUID) {
      const { data: hike, error } = await supabase
        .from('hikes')
        .select('*')
        .eq('id', filename)
        .single();

      if (error || !hike) throw new Error("Randonnée Supabase introuvable");

      // --- LOGIQUE D'EXTRACTION UNIFIÉE ---
      let finalGeometry = hike.route_geometry;

      // Cas 1 : C'est une FeatureCollection (ex: Saint-Alban)
      if (hike.route_geometry?.type === 'FeatureCollection' && hike.route_geometry.features?.length > 0) {
        finalGeometry = hike.route_geometry.features[0].geometry;
      } 
      // Cas 2 : C'est déjà un LineString (ex: Saint-Sauveur), on ne fait rien, finalGeometry est déjà bon.

      /**
       * CALCUL DU CENTRE
       * On extrait le premier point pour centrer la carte au chargement
       */
      let center: [number, number] = [43.60, 1.44]; // Toulouse par défaut

      if (finalGeometry?.coordinates && finalGeometry.coordinates.length > 0) {
        const firstPoint = finalGeometry.coordinates[0];
        // firstPoint[0] = Lon, firstPoint[1] = Lat
        if (Array.isArray(firstPoint) && firstPoint.length >= 2) {
          center = [firstPoint[1], firstPoint[0]]; 
        }
      }

      return NextResponse.json([{
        id: hike.id,
        title: hike.title,
        location: hike.location || "N/A",
        difficulty: hike.difficulty || "N/A",
        distance: hike.distance || "N/A",
        duration: hike.duration || "N/A",
        geometry: finalGeometry, 
        center: center 
      }]);
    }

    // --- CAS FICHIERS LOCAUX (inchangé mais nettoyé) ---
    const filePath = path.join(process.cwd(), 'data', 'rando', path.basename(filename));
    const fileContent = await fs.readFile(filePath, 'utf8');
    const rawData = JSON.parse(fileContent);
    
    const items = rawData.features ? rawData.features : (Array.isArray(rawData) ? rawData : [rawData]);

    const normalized = items.map((item: any, idx: number) => {
      const geometry = item.geometry || item.geo_shape?.geometry;
      let lat = null, lon = null;

      if (item.geo_point_2d) {
        lat = item.geo_point_2d.lat;
        lon = item.geo_point_2d.lon;
      } else if (geometry?.coordinates) {
        const coords = Array.isArray(geometry.coordinates[0]) 
          ? geometry.coordinates[0] 
          : geometry.coordinates;
        lat = coords[1];
        lon = coords[0];
      }

      return {
        id: item.id || `local-${idx}`,
        title: item.nom || item.properties?.nom || item.adresse || "Sans titre",
        geometry: geometry,
        distance: item.distance || item.properties?.distance || "N/A",
        duration: item.duree || item.properties?.duree || "N/A",
        center: lat ? [lat, lon] : null
      };
    });

    return NextResponse.json(normalized);

  } catch (err: any) {
    console.error("Erreur API listerandos [filename]:", err.message);
    return NextResponse.json({ error: "Erreur de chargement des données" }, { status: 500 });
  }
}