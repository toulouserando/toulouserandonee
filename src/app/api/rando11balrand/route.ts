import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Fonction utilitaire pour lire un dossier et normaliser les données
async function getFilesFromDir(subDir: string, category: string) {
  const dirPath = path.join(process.cwd(), 'randos', subDir);
  try {
    const files = await fs.readdir(dirPath);
    const validFiles = files.filter(f => f.endsWith('.json') || f.endsWith('.geojson'));

    return await Promise.all(validFiles.map(async (file) => {
      const content = await fs.readFile(path.join(dirPath, file), 'utf8');
      const data = JSON.parse(content);
      
      // Normalisation de base pour l'affichage en liste
      // On s'adapte aux structures variées que vous avez présentées
      let nom = "Sans nom";
      if (Array.isArray(data)) nom = data[0]?.nom || data[0]?.nom_itineraire || file;
      else nom = data.properties?.nom || data.name || data.local_name || data.features?.[0]?.properties?.nom || file;

      return {
        id: `${category}-${file}`,
        nom: nom.replace(/_/g, ' ').replace('.json', '').replace('.geojson', ''),
        categorie: category,
        type: Array.isArray(data) ? 'Liste' : (data.type || 'Object'),
        file: file
      };
    }));
  } catch (e) {
    console.error(`Erreur sur ${subDir}:`, e);
    return [];
  }
}

export async function GET() {
  try {
    // On lance toutes les lectures en parallèle pour plus de rapidité
    const results = await Promise.all([
      getFilesFromDir('balades_Toulouse', 'Baladetou'),
      getFilesFromDir('Gers', 'Gers (32)'),
      getFilesFromDir('Haute_Garonne', 'Haute-Garonne (31)'),
      getFilesFromDir('crues_toulouse', 'Cruetou'),
      getFilesFromDir('Lot_en_Velo', 'Lot Velo'),
      getFilesFromDir('Lot', 'Lot (46)'),
      getFilesFromDir('Point_Interet_Ocitanie', 'Patrimoine (POI)'),
      getFilesFromDir('Randos_en_Occitanie', 'Randoligne'),
      getFilesFromDir('Balades_en_velo_Toulouse', 'Velotou'),
    ]);

    return NextResponse.json(results.flat());
  } catch (error) {
    return NextResponse.json({ error: "Erreur globale" }, { status: 500 });
  }
}