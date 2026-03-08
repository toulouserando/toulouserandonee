import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> } // 1. On définit params comme une Promise
) {
  try {
    // 2. On attend la résolution de la promesse pour récupérer le nom du fichier
    const { filename } = await params; 

    // 3. Construction du chemin sécurisé
    const filePath = path.join(process.cwd(), 'data', 'balade', filename);
    
    // 4. Lecture et parsing du fichier
    const fileContent = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileContent);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur API balade:", error);
    return NextResponse.json(
      { error: "Fichier non trouvé ou erreur de lecture" }, 
      { status: 404 }
    );
  }
}