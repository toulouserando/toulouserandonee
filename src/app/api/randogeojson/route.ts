import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DEPT_MAP: { [key: string]: string } = {
  "09": "Ariège", "9": "Ariège", "11": "Aude", "12": "Aveyron",
  "30": "Gard", "31": "Haute-Garonne", "32": "Gers", "34": "Hérault",
  "46": "Lot", "48": "Lozère", "65": "Hautes-Pyrénées",
  "66": "Pyrénées-Orientales", "81": "Tarn", "82": "Tarn-et-Garonne"
};

export async function GET() {
  try {
    const jsonPath = path.join(process.cwd(), 'data', 'listetotalerandos.json');
    const geojsonDir = path.join(process.cwd(), 'data', 'GeoJSON');

    if (!fs.existsSync(jsonPath)) {
      return NextResponse.json({ error: "Fichier JSON non trouvé" }, { status: 404 });
    }

    // 1. Charger le JSON principal
    const fileContent = fs.readFileSync(jsonPath, 'utf8');
    const rawData = fileContent
      .split(/\r?\n/)
      .filter(line => line.trim() !== '')
      .map(line => {
        try { return JSON.parse(line); } 
        catch (e) { return null; }
      })
      .filter(item => item !== null);

    // 2. Construire l'arborescence
    const tree = rawData.reduce((acc: any, curr: any) => {
      let rawDept = curr.département || curr.departement || "Autre";
      if (rawDept === "Autre") {
        const match = curr.commune?.match(/\(([^)]+)\)/);
        if (match) rawDept = match[1].trim();
      }

      let dept = DEPT_MAP[rawDept] || rawDept;
      if (dept === "Autre" || !dept) dept = "Hors Zone / Inconnu";

      const canton = curr.Canton || "Sans Canton";
      const epci = curr.epci || "Sans EPCI";
      const commune = curr.commune || "Commune Inconnue";

      // Nettoyage du nom de la rando pour correspondre au fichier (ex: "Nom Rando" -> "Nom_Rando")
      const fileNameFriendly = curr["Nom Rando"]?.replace(/\s+/g, '_') + '.geojson';
      // Dossier attendu : "Commune_Departement" (ex: "Alban_Tarn")
      const folderName = `${commune.split(' (')[0]}_${dept}`.replace(/\s+/g, '');
      
      // On ajoute l'URL du tracé si le fichier existe
      const relativeGeojsonPath = `/api/get-trace?file=${folderName}/${fileNameFriendly}`;
      curr.traceUrl = relativeGeojsonPath;

      if (!acc[dept]) acc[dept] = {};
      if (!acc[dept][canton]) acc[dept][canton] = {};
      if (!acc[dept][canton][epci]) acc[dept][canton][epci] = {};
      if (!acc[dept][canton][epci][commune]) acc[dept][canton][epci][commune] = [];

      acc[dept][canton][epci][commune].push(curr);
      return acc;
    }, {});

    // --- TRI ---
    const sortObject = (obj: any): any => {
      return Object.keys(obj)
        .sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }))
        .reduce((acc: any, key) => {
          const value = obj[key];
          acc[key] = (typeof value === 'object' && !Array.isArray(value)) ? sortObject(value) : value;
          return acc;
        }, {});
    };

    return NextResponse.json(sortObject(tree));
  } catch (error) {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}