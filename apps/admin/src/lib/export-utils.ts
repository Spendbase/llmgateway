import * as XLSX from "xlsx";

type Row = Record<string, string | number | boolean | null | undefined>;

export interface ExportSheet {
	name: string;
	rows: Row[];
}

function buildWorkbook(rows: Row[], sheetName = "Sheet1"): XLSX.WorkBook {
	const ws = XLSX.utils.json_to_sheet(rows);
	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, sheetName);
	return wb;
}

export function exportToCsv(filename: string, rows: Row[]): void {
	const wb = buildWorkbook(rows);
	XLSX.writeFile(wb, `${filename}.csv`, { bookType: "csv" });
}

export function exportToXlsx(filename: string, rows: Row[]): void {
	const wb = buildWorkbook(rows);
	XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportMultiSheetXlsx(
	filename: string,
	sheets: ExportSheet[],
): void {
	const wb = XLSX.utils.book_new();
	for (const sheet of sheets) {
		const ws = XLSX.utils.json_to_sheet(sheet.rows);
		XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31));
	}
	XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportAllSectionsCsv(
	filename: string,
	sheets: ExportSheet[],
): void {
	const aoa: unknown[][] = [];

	for (const sheet of sheets) {
		if (sheet.rows.length === 0) {
			continue;
		}

		// Section header
		aoa.push([`=== ${sheet.name} ===`]);

		// Column headers
		const headers = Object.keys(sheet.rows[0]);
		aoa.push(headers);

		// Data rows
		for (const row of sheet.rows) {
			aoa.push(headers.map((h) => row[h] ?? ""));
		}

		// Blank separator
		aoa.push([]);
	}

	const ws = XLSX.utils.aoa_to_sheet(aoa);
	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, "Export");
	XLSX.writeFile(wb, `${filename}.csv`, { bookType: "csv" });
}
