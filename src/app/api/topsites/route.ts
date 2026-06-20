import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Coordonnées approximatives pour les principales communes du top
const GEO_DATA: Record<string, { lat: number; lng: number }> = {
  "UZES": { lat: 44.0121, lng: 4.4196 },
  "CARCASSONNE": { lat: 43.2130, lng: 2.3519 },
  "TOULOUSE": { lat: 43.6047, lng: 1.4442 },
  "LOURDES": { lat: 43.0915, lng: -0.0457 },
  "NIMES": { lat: 43.8367, lng: 4.3601 },
  "ALBI": { lat: 43.9289, lng: 2.1464 },
  "MONTPELLIER": { lat: 43.6108, lng: 3.8767 },
  "BEZIERS": { lat: 43.3442, lng: 3.2158 },
  "NARBONNE": { lat: 43.1833, lng: 3.0000 },
  "MOISSAC": { lat: 44.1035, lng: 1.0839 },
  "AIGUES MORTES": { lat: 43.5661, lng: 4.1915 },
  "PORT VENDRES": { lat: 42.5205, lng: 3.1077 },
  "VERS PONT DU GARD": { lat: 43.9469, lng: 4.5348 },
  "SAINT CYPRIEN": { lat: 42.6163, lng: 3.0004 },
};

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'balade', 'top-des-sites-touristiques-2021.json');
    const fileContent = await fs.readFile(filePath, 'utf8');
    const sites = JSON.parse(fileContent);

    const enriched = sites.map((s: any) => ({
      ...s,
      // On cherche la commune dans notre table (en majuscules)
      lat: GEO_DATA[s.commune.toUpperCase()]?.lat || null,
      lng: GEO_DATA[s.commune.toUpperCase()]?.lng || null,
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}