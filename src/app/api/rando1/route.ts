import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    // 💡 CRUCIAL POUR VERCEL : path.resolve force le compilateur à lier et embarquer
    // le dossier 'data' dans le bundle de la fonction Serverless de production.
    const dirPath = path.resolve(process.cwd(), 'data', 'randos', 'balades_Toulouse');
    
    // Vérification de sécurité pour le log en production si le dossier est introuvable
    try {
      await fs.access(dirPath);
    } catch {
      console.error(`Le dossier n'existe pas ou est inaccessible sur le serveur : ${dirPath}`);
      return NextResponse.json({ error: "Dossier de données introuvable en production" }, { status: 404 });
    }

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

        // Extraction standardisée de la géométrie gérée par Toulouse
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
          id: file, // Ton ID unique et stable (ex: "circuit_1_st_cyprien.json")
          title: joliNom,
          category: "Balades Toulouse",
          geometry: validGeoJSONFeature,
          properties: fileData.properties || {}
        };
      })
    );

    return NextResponse.json(allCircuits);
  } catch (error: any) {
    console.error("Erreur API Rando complète :", error);
    return NextResponse.json(
      { error: "Erreur de lecture des circuits", details: error.message }, 
      { status: 500 }
    );
  }
}