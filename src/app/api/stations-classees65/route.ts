import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Table de correspondance pour ajouter les coordonnées manquantes
const COORDONNEES_COMMUNES: Record<string, { lat: number; lng: number }> = {
  "82155": { lat: 44.15142, lng: 1.74981 },  // Saint-Antonin-Noble-Val
  "82121": { lat: 44.01667, lng: 1.35000 },  // Montauban
  "82112": { lat: 44.10000, lng: 1.08333 },  // Moissac
};

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'balade', 'stations-classees-et-communes-touristiques-france_65.json');
    const fileContent = await fs.readFile(filePath, 'utf8');
    const stations = JSON.parse(fileContent);

    // On ajoute les coordonnées à chaque station basée sur son code commune
    const enrichedData = stations.map((s: any) => ({
      ...s,
      latitude: COORDONNEES_COMMUNES[s.com_code_source]?.lat,
      longitude: COORDONNEES_COMMUNES[s.com_code_source]?.lng,
    }));

    return NextResponse.json(enrichedData);
  } catch (error) {
    return NextResponse.json({ error: "Fichier non trouvé" }, { status: 404 });
  }
}