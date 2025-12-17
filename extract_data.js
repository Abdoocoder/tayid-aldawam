const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'Nov.xlsx');
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

// Row 1 (index 1) has headers usually, based on previous inspect
// But let's verify. Row 0 was title. Row 1 was headers.
// Data starts at index 2.

const workers = [];
const attendance = [];

const timestamp = new Date().toISOString();

// Start from row index 2
for (let i = 2; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || !row[1]) continue; // Skip empty rows or rows without ID

    const id = String(row[1]);
    const name = row[2];
    const normalDays = Number(row[3]) || 0;
    const otNormal = Number(row[4]) || 0;
    const otHoliday = Number(row[5]) || 0;
    const otEid = Number(row[6]) || 0;
    const supervisorArea = row[7] || "غير محدد";
    const dayValue = Number(row[8]) || 0;

    // Worker Entity
    workers.push({
        id: id,
        name: name,
        areaId: supervisorArea,
        baseSalary: dayValue * 30, // Estimating base or leaving generic
        dayValue: dayValue
    });

    // Attendance Record for Nov 2025
    attendance.push({
        id: `${id}-11-2025`,
        workerId: id,
        month: 11,
        year: 2025,
        normalDays: normalDays,
        overtimeNormalDays: otNormal,
        overtimeHolidayDays: otHoliday + otEid,
        totalCalculatedDays: normalDays + (otNormal * 0.5) + ((otHoliday + otEid) * 1.0),
        updatedAt: timestamp
    });
}

const output = {
    workers,
    attendance
};

fs.writeFileSync(path.join(process.cwd(), 'src', 'data', 'initialData.json'), JSON.stringify(output, null, 2));
console.log(`Imported ${workers.length} workers and records.`);
