import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * BASE_PATH pointe maintenant vers le dossier à la racine de votre projet.
 * process.cwd() permet de fonctionner aussi bien sur votre PC que sur GitHub.
 */
const BASE_PATH = path.join(process.cwd(), 'data', 'MES_TRACES_GEOJSON');

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('id');

  try {
    // 1. Vérification de l'existence du dossier racine
    if (!fs.existsSync(BASE_PATH)) {
      console.error(`❌ Dossier introuvable : ${BASE_PATH}`);
      return NextResponse.json({ 
        locaux: {}, 
        message: "Le dossier data/MES_TRACES_GEOJSON est manquant à la racine du projet." 
      });
    }

    // CAS 1 : Si un ID est fourni (ex: Alban_Tarn/Boucle_de_Paulinet.geojson)
    if (fileId) {
      const filePath = path.join(BASE_PATH, fileId);
      
      if (!fs.existsSync(filePath) || !filePath.toLowerCase().endsWith('.geojson')) {
        return NextResponse.json({ error: "Fichier non trouvé" }, { status: 404 });
      }
      
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      return NextResponse.json(JSON.parse(fileContent));
    }

    // CAS 2 : Liste l'arborescence pour le menu (Dossiers communes -> Fichiers)
    const locaux: Record<string, any[]> = {};
    const items = fs.readdirSync(BASE_PATH);

    for (const item of items) {
      // On ignore les dossiers cachés (.git, etc.)
      if (item.startsWith('.')) continue;

      const fullPath = path.join(BASE_PATH, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // On lit les fichiers GeoJSON à l'intérieur de chaque dossier (ex: Alban_Tarn)
        const files = fs.readdirSync(fullPath)
          .filter(f => f.toLowerCase().endsWith('.geojson'));
        
        if (files.length > 0) {
          locaux[item] = files.map(file => ({
            // L'ID contient le dossier pour pouvoir le relire plus tard
            id: `${item}/${file}`, 
            title: file.replace('.geojson', '').replace(/_/g, ' '),
            commune: item
          }));
        }
      }
    }

    // Gestion des fichiers qui seraient directement à la racine de MES_TRACES_GEOJSON
    const rootFiles = items.filter(f => 
      f.toLowerCase().endsWith('.geojson') && 
      fs.statSync(path.join(BASE_PATH, f)).isFile()
    );

    if (rootFiles.length > 0) {
      locaux["Autres"] = rootFiles.map(file => ({
        id: file,
        title: file.replace('.geojson', '').replace(/_/g, ' '),
        commune: "Autres"
      }));
    }

    return NextResponse.json({ locaux });

  } catch (error: any) {
    console.error("❌ Erreur API Rando:", error.message);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}