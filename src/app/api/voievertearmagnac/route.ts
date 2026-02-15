import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(
      process.cwd(), 
      'data', 'rando', 'trace-de-la-voie-verte-de-larmagnac.json'
    );
    const fileContent = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileContent);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur lecture Voie Verte:", error);
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }
}