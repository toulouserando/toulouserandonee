import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'MesRandosWeb.geojson');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileContents);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur lecture GeoJSON:", error);
    return NextResponse.json({ error: "Fichier introuvable ou corrompu" }, { status: 500 });
  }
}