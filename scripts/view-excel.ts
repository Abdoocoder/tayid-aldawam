
import * as XLSX from 'xlsx';
import * as path from 'path';

const filePath = path.join(process.cwd(), 'public', 'الاردنيين - شهر 12-2025.xlsx');

try {
    const workbook = XLSX.readFile(filePath);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    console.log('--- Row 0 (Headers?) ---');
    console.log(JSON.stringify(data[0], null, 2));
    console.log('--- Row 1 ---');
    console.log(JSON.stringify(data[1], null, 2));
    console.log('--- Sample Data (Rows 2-5) ---');
    console.log(JSON.stringify(data.slice(2, 6), null, 2));
} catch (error) {
    console.error('Error reading Excel file:', error);
}
