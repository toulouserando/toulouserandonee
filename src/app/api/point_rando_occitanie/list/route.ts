import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Fonction utilitaire pour chercher un fichier de manière récursive dans data/rando
async function findFileRecursive(dir: string, targetFilename: string): Promise<string | null> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    // 1. Chercher d'abord parmi les fichiers du dossier courant
    for (const entry of entries) {
      if (entry.isFile() && entry.name.toLowerCase() === targetFilename.toLowerCase()) {
        return path.join(dir, entry.name);
      }
    }

    // 2. Chercher dans les sous-dossiers (gers, occitanie, toulouse, etc.)
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subDirPath = path.join(dir, entry.name);
        const foundPath = await findFileRecursive(subDirPath, targetFilename);
        if (foundPath) return foundPath; // Trouvé !
      }
    }
  } catch (error) {
    console.error("Erreur lors de la recherche récursive :", error);
  }
  return null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params; 

    // Sécurité de base
    const safeFilename = path.basename(filename);
    const baseDir = path.join(process.cwd(), 'data', 'rando');

    // 🎯 Cherche le fichier partout dans data/rando et ses sous-dossiers
    const filePath = await findFileRecursive(baseDir, safeFilename);
    
    if (!filePath) {
      console.warn(`[API Rando] Fichier introuvable sur le disque : ${safeFilename}`);
      return NextResponse.json({ error: `Fichier ${safeFilename} introuvable` }, { status: 404 });
    }

    // Lecture sécurisée du fichier trouvé
    const fileContent = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileContent);

    return NextResponse.json(data);

  } catch (error) {
    console.error(`Erreur API rando [${error}]:`, error);
    return NextResponse.json(
      { error: "Erreur lors de la lecture du fichier ou JSON invalide" }, 
      { status: 500 }
    );
  }
}