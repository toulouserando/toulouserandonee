import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const dirPath = path.join(process.cwd(), 'data', 'randos', 'Randos_en_Occitanie');
    const files = await fs.readdir(dirPath);
    const geoFiles = files.filter(f => f.endsWith('.geojson'));

    const allLines = await Promise.all(
      geoFiles.map(async (file) => {
        const content = await fs.readFile(path.join(dirPath, file), 'utf8');
        const data = JSON.parse(content);
        const feature = data.features?.[0];
        const props = feature?.properties;

        return {
          id: props?.id || file,
          nom: props?.local_name || data.name,
          ville: props?.city || "Non spécifiée",
          coords_site: {
            lat: props?.latitude,
            lon: props?.longitude
          },
          has_path: feature?.geometry?.coordinates?.length > 0,
          raw_geometry: feature?.geometry
        };
      })
    );

    return NextResponse.json(allLines);
  } catch (error) {
    return NextResponse.json({ error: "Erreur lecture Randoligne" }, { status: 500 });
  }
}