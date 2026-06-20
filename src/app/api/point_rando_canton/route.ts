import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DEPT_MAP: { [key: string]: string } = {
  "09": "Ariège", "9": "Ariège",
  "11": "Aude",
  "12": "Aveyron",
  "30": "Gard",
  "31": "Haute-Garonne",
  "32": "Gers",
  "34": "Hérault",
  "46": "Lot",
  "48": "Lozère",
  "65": "Hautes-Pyrénées",
  "66": "Pyrénées-Orientales",
  "81": "Tarn",
  "82": "Tarn-et-Garonne"
};

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'listetotalerandos.json');
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Fichier non trouvé" }, { status: 404 });
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');

    const rawData = fileContent
      .split(/\r?\n/)
      .filter(line => line.trim() !== '')
      .map(line => {
        try { return JSON.parse(line); } 
        catch (e) { return null; }
      })
      .filter(item => item !== null);

    const tree = rawData.reduce((acc: any, curr: any) => {
      // --- LOGIQUE DE DÉPARTEMENT AMÉLIORÉE ---
      let rawDept = "Autre";

      // 1. On regarde d'abord si le champ "département" existe (avec ou sans accent)
      const directDept = curr.département || curr.departement;
      
      if (directDept) {
        rawDept = directDept.toString().trim();
      } else {
        // 2. Sinon, on cherche dans les parenthèses de la commune
        const match = curr.commune?.match(/\(([^)]+)\)/);
        if (match) {
          rawDept = match[1].trim();
        }
      }

      // 3. Traduction via la MAP (ex: "81" -> "Tarn") ou garde la valeur brute
      let dept = DEPT_MAP[rawDept] || rawDept;
      if (dept === "Autre" || !dept) dept = "Hors Zone / Inconnu";

      // --- RESTE DE LA STRUCTURE ---
      const canton = curr.Canton || "Sans Canton";
      const epci = curr.epci || "Sans EPCI";
      const commune = curr.commune || "Commune Inconnue";

      if (!acc[dept]) acc[dept] = {};
      if (!acc[dept][canton]) acc[dept][canton] = {};
      if (!acc[dept][canton][epci]) acc[dept][canton][epci] = {};
      if (!acc[dept][canton][epci][commune]) acc[dept][canton][epci][commune] = [];

      acc[dept][canton][epci][commune].push(curr);
      
      return acc;
    }, {});

    // --- TRI ALPHABÉTIQUE ---
    const sortObject = (obj: any): any => {
      return Object.keys(obj)
        .sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }))
        .reduce((acc: any, key) => {
          const value = obj[key];
          acc[key] = (typeof value === 'object' && !Array.isArray(value)) 
            ? sortObject(value) 
            : value;
          return acc;
        }, {});
    };

    return NextResponse.json(sortObject(tree));

  } catch (error) {
    console.error("Erreur API:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}