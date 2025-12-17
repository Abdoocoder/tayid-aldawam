const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(process.cwd(), 'Nov.xlsx');
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Get headers and first few rows
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
console.log("Headers:", data[0]);
console.log("First 3 rows:", data.slice(1, 4));
