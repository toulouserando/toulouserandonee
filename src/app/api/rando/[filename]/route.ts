import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params; 

    // 1. Sécurité : Empêcher l'accès à des fichiers en dehors du dossier rando
    // (Protection contre les attaques de type "../")
    const safeFilename = path.basename(filename);
    const filePath = path.join(process.cwd(), 'data', 'rando', safeFilename);
    
    // 2. Vérification de l'existence du fichier avant lecture
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
    }

    // 3. Lecture du fichier
    const fileContent = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileContent);

    // 4. (Optionnel) Ajout d'une métadonnée pour aider le frontend
    // On renvoie la donnée brute, mais on pourrait l'envelopper si besoin.
    return NextResponse.json(data);

  } catch (error) {
    console.error(`Erreur API rando [${error}]:`, error);
    return NextResponse.json(
      { error: "Erreur lors de la lecture du fichier" }, 
      { status: 500 }
    );
  }
}