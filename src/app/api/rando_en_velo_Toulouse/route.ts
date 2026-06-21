import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const dirPath = path.join(process.cwd(), 'data', 'randos', 'Balades_en_velo_Toulouse');
    
    try {
      await fs.access(dirPath);
    } catch {
      console.error(`Le dossier n'existe pas : ${dirPath}`);
      return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
    }

    const files = await fs.readdir(dirPath);
    
    const jsonFiles = files
      .filter(file => file.endsWith('.json'))
      .sort((a, b) => a.localeCompare(b, 'fr', { numeric: true, sensitivity: 'base' }));

    const allCircuits = await Promise.all(
      jsonFiles.map(async (file) => {
        const filePath = path.join(dirPath, file);
        const content = await fs.readFile(filePath, 'utf8');
        const fileData = JSON.parse(content);

        // --- FIX DE LA GÉOMÉTRIE POUR LES NOUVEAUX JSON ---
        // Si le fichier a une clé 'geometry' directe (GeoJSON pur), on l'extrait proprement.
        let finalGeometry = null;
        if (fileData.geometry) {
          finalGeometry = fileData.geometry;
        } else if (fileData.geo_shape?.geometry) {
          finalGeometry = fileData.geo_shape.geometry;
        } else if (fileData.geo_shape) {
          finalGeometry = fileData.geo_shape;
        } else {
          finalGeometry = fileData;
        }

        // On crée la Feature GeoJSON standard attendue par ton <GeoJSON /> de Leaflet
        const validGeoJSONFeature = {
          type: "Feature",
          geometry: finalGeometry,
          properties: fileData.properties || {}
        };

        // Gestion propre du titre
        const joliNom = fileData.properties?.nom || fileData.properties?.name || file
          .replace('.json', '')
          .replace(/_/g, ' ')
          .replace(/-/g, ' ')
          .replace(/^circuit\s\d+[a-z]?\s/i, '');

        return {
          id: file, 
          title: joliNom,
          category: "Balades en Vélo",
          // Attention : on passe direct la Feature nettoyée, sans emboîtement foireux
          geometry: finalGeometry, 
          properties: fileData.properties || {}
        };
      })
    );

    return NextResponse.json(allCircuits);
  } catch (error) {
    console.error("Erreur API Rando2 :", error);
    return NextResponse.json({ error: "Erreur de lecture des circuits vélo" }, { status: 500 });
  }
}