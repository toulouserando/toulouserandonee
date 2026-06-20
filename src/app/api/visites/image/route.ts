import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ville = searchParams.get('ville');
  const file = searchParams.get('file');

  if (!ville || !file) {
    return new NextResponse("Paramètres manquants", { status: 400 });
  }

  try {
    // Sécurisation du chemin d'accès pour éviter les failles de traversée de répertoire
    const safeVille = path.basename(ville);
    const safeFile = path.basename(file);
    
    const imagePath = path.join(process.cwd(), 'public', 'visites', safeVille, safeFile);
    const imageBuffer = await fs.readFile(imagePath);

    // Détermination automatique du Content-Type
    const ext = path.extname(safeFile).toLowerCase();
    const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';

    return new NextResponse(imageBuffer, {
      headers: { 'Content-Type': contentType }
    });
  } catch (error) {
    return new NextResponse("Image non trouvée", { status: 404 });
  }
}