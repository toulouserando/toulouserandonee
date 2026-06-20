// src/app/api/rando/[[...filename]]/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Fonction utilitaire pour fouiller les sous-dossiers (occitanie, gers, etc.)
async function findFileRecursive(dir: string, targetFilename: string): Promise<string | null> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    // 1. Chercher d'abord dans le dossier courant
    for (const entry of entries) {
      if (entry.isFile() && entry.name.toLowerCase() === targetFilename.toLowerCase()) {
        return path.join(dir, entry.name);
      }
    }

    // 2. Chercher dans les sous-dossiers
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subDirPath = path.join(dir, entry.name);
        const foundPath = await findFileRecursive(subDirPath, targetFilename);
        if (foundPath) return foundPath;
      }
    }
  } catch (error) {
    console.error("Erreur recherche récursive :", error);
  }
  return null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename?: string[] }> }
) {
  try {
    const { filename } = await params; 

    // Si l'URL est juste /api/rando/ sans nom de fichier
    if (!filename || filename.length === 0) {
      return NextResponse.json({ error: "Aucun nom de fichier spécifié" }, { status: 400 });
    }

    // On récupère le nom du fichier demandé (dernier élément du tableau de l'URL)
    const rawFilename = filename[filename.length - 1];
    const safeFilename = path.basename(rawFilename); 
    const baseDir = path.join(process.cwd(), 'data', 'rando');

    // Recherche automatique dans tous les sous-dossiers
    const filePath = await findFileRecursive(baseDir, safeFilename);
    
    if (!filePath) {
      return NextResponse.json({ error: `Fichier ${safeFilename} introuvable` }, { status: 404 });
    }

    const fileContent = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileContent);

    return NextResponse.json(data);

  } catch (error) {
    console.error("Erreur API rando:", error);
    return NextResponse.json(
      { error: "Erreur lors de la lecture du fichier ou JSON invalide" }, 
      { status: 500 }
    );
  }
}