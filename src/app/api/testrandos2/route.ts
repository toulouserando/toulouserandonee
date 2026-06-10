import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const dirPath = path.join(process.cwd(), 'data', 'randos', 'balades_Toulouse');
    const files = await fs.readdir(dirPath);
    
    const jsonFiles = files.filter(file => file.endsWith('.json'));

    const allCircuits = await Promise.all(
      jsonFiles.map(async (file) => {
        const filePath = path.join(dirPath, file);
        const content = await fs.readFile(filePath, 'utf8');
        const fileData = JSON.parse(content);

        // 1. Extraction de la géométrie pure
        const rawGeometry = fileData.geo_shape?.geometry || fileData.geo_shape || fileData;
        
        // 2. SÉCURISATION : On reconstruit une Feature GeoJSON standard et propre pour Leaflet
        const validGeoJSONFeature = {
          type: "Feature",
          geometry: rawGeometry.geometry ? rawGeometry.geometry : rawGeometry, // Évite la double imbrication
          properties: fileData.properties || {}
        };

        // 3. Nettoyage esthétique du nom à partir du fichier
        const joliNom = file
          .replace('.json', '')
          .replace(/_/g, ' ')
          .replace(/^circuit\s\d+[a-z]?\s/i, ''); // Enlève "circuit 1..."

        return {
          id: file, 
          title: joliNom,
          category: "Balades Toulouse",
          geometry: validGeoJSONFeature, // Leaflet va adorer ce format standardisé !
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