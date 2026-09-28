import type { NewCard } from "./schema";

// Moxfield CSV columns (case-insensitive header matching):
// Count, Name, Edition, Condition, Language, Foil, Collector Number, Alter, Proxy, Purchase Price
export type MoxfieldRow = {
  name: string;
  edition: string;
  quantity: number;
  foil: boolean;
  condition: string;
  language: string;
  collectorNumber: string;
};

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, " ");
}

export function parseMoxfieldCSV(raw: string): MoxfieldRow[] {
  const lines = raw.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map(normalizeHeader);

  const col = (name: string) => headers.indexOf(name);
  const countIdx = col("count");
  const nameIdx = col("name");
  const editionIdx = col("edition");
  const conditionIdx = col("condition");
  const languageIdx = col("language");
  const foilIdx = col("foil");
  const collectorIdx = col("collector number");

  if (nameIdx === -1) {
    throw new Error('CSV is missing a "Name" column. Make sure you\'re uploading a Moxfield export.');
  }

  const rows: MoxfieldRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    // Handle quoted fields with commas inside
    const fields = parseCSVLine(lines[i]);
    if (fields.length === 0) continue;

    const name = fields[nameIdx]?.trim();
    if (!name) continue;

    const rawFoil = foilIdx !== -1 ? fields[foilIdx]?.trim().toLowerCase() : "";
    const foil = rawFoil === "true" || rawFoil === "foil" || rawFoil === "yes" || rawFoil === "1";

    rows.push({
      name,
      edition: editionIdx !== -1 ? fields[editionIdx]?.trim() ?? "" : "",
      quantity: countIdx !== -1 ? parseInt(fields[countIdx] ?? "1", 10) || 1 : 1,
      foil,
      condition: conditionIdx !== -1 ? fields[conditionIdx]?.trim() ?? "" : "",
      language: languageIdx !== -1 ? fields[languageIdx]?.trim() ?? "" : "",
      collectorNumber: collectorIdx !== -1 ? fields[collectorIdx]?.trim() ?? "" : "",
    });
  }

  return rows;
}

// RFC 4180-compliant CSV line parser (handles quoted fields)
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

export function moxfieldRowsToCards(
  rows: MoxfieldRow[],
  userId: number,
  listType: "inventory" | "wishlist"
): NewCard[] {
  return rows.map((row) => ({
    userId,
    listType,
    name: row.name,
    edition: row.edition || null,
    quantity: row.quantity,
    foil: row.foil,
    condition: row.condition || null,
    language: row.language || null,
    collectorNumber: row.collectorNumber || null,
  }));
}
