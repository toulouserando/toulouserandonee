import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'rando', 'stations-thermales-2017.json');
    const fileContent = await fs.readFile(filePath, 'utf8');
    const stations = JSON.parse(fileContent);

    return NextResponse.json(stations);
  } catch (error) {
    return NextResponse.json({ error: "Erreur de chargement" }, { status: 500 });
  }
}