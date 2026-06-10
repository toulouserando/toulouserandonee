import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const dirPath = path.join(process.cwd(), 'data', 'randos', 'balades_Toulouse');
    const files = await fs.readdir(dirPath);
    
    // Tri alphabétique strict pour éviter les inversions d'index selon l'OS
    const jsonFiles = files
      .filter(file => file.endsWith('.json'))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    const allCircuits = await Promise.all(
      jsonFiles.map(async (file) => {
        const filePath = path.join(dirPath, file);
        const content = await fs.readFile(filePath, 'utf8');
        const fileData = JSON.parse(content);

        // Extraction standardisée de la géométrie gérait par Toulouse
        const rawGeometry = fileData.geo_shape?.geometry || fileData.geo_shape || fileData;

        // On enveloppe systématiquement dans une Feature propre pour Leaflet
        const validGeoJSONFeature = {
          type: "Feature",
          geometry: rawGeometry.geometry ? rawGeometry.geometry : rawGeometry,
          properties: fileData.properties || {}
        };

        const joliNom = file
          .replace('.json', '')
          .replace(/_/g, ' ')
          .replace(/^circuit\s\d+[a-z]?\s/i, ''); 

        return {
          id: file, // Ton ID unique et stable
          title: joliNom,
          category: "Balades Toulouse",
          geometry: validGeoJSONFeature,
          properties: fileData.properties || {}
        };
      })
    );

    return NextResponse.json(allCircuits);
  } catch (error) {
    console.error("Erreur API Rando:", error);
    return NextResponse.json({ error: "Erreur de lecture des circuits" }, { status: 500 });
  }
}