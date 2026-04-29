import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Note l'utilisation de Promise pour les types de params (Standard Next.js 15)
export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    // 1. On attend la résolution des paramètres dynamiques
    const resolvedParams = await params;
    
    // 2. Sécurité : on vérifie que path existe pour éviter l'erreur sur le spread (...)
    const pathSegments = resolvedParams.path || [];
    
    const filePath = path.join(process.cwd(), 'data', 'rando', ...pathSegments);
    
    const fileContent = await fs.readFile(filePath, 'utf8');
    const jsonData = JSON.parse(fileContent);

    // 3. Formatage des données
    const formatted = jsonData.map((item: any, index: number) => ({
      // On garde l'adresse en titre
      title: item.adresse || "Point d'intérêt",
      
      // Leaflet utilise [Lat, Lon] pour le centre
      center: [item.lat, item.lon],
      
      // GeoJSON standard utilise [Lon, Lat] pour les coordonnées
      geometry: { 
        type: "Point", 
        coordinates: [item.lon, item.lat] 
      },
      
      // On ajoute les propriétés pour les retrouver dans le Popup si besoin
      properties: {
        adresse: item.adresse || "",
        index: index
      },
      
      // Utilisation d'un ID string unique (plus stable pour React)
      id: `point-${index}`
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Erreur API format-points:", error);
    return NextResponse.json(
      { error: "Fichier points introuvable ou mal formé" }, 
      { status: 404 }
    );
  }
}