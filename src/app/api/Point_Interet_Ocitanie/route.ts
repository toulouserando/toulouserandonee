import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const dirPath = path.join(process.cwd(), 'data', 'randos', 'Point_Interet_Ocitanie');
    const files = await fs.readdir(dirPath);
    const geoFiles = files.filter(f => f.endsWith('.geojson'));

    const allSites = await Promise.all(
      geoFiles.map(async (file) => {
        const content = await fs.readFile(path.join(dirPath, file), 'utf8');
        const data = JSON.parse(content);
        const props = data.features?.[0]?.properties;

        return {
          id: props?.id || file,
          nom: props?.local_name || data.name,
          ville: props?.city || "Inconnue",
          cp: props?.postcode || "",
          adresse: props?.street || "",
          coords: {
            lat: props?.latitude,
            lon: props?.longitude
          },
          type: props?.type || "SITE"
        };
      })
    );

    return NextResponse.json(allSites);
  } catch (error) {
    return NextResponse.json({ error: "Erreur lecture sites POI" }, { status: 500 });
  }
}