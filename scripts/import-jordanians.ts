
import * as XLSX from 'xlsx';
import * as path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use the provided service role key
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4cXB6ZGZmYm9jYmdjc2F4bGxuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk2MDY0NCwiZXhwIjoyMDgxNTM2NjQ0fQ.VPas713cqOR-mS_SFtGBL33RmBRqe3CPBI2QwQHi3ko";

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing environment variables");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runImport() {
    console.log('🚀 Starting Jordanian workers import...');

    // 0. Find an Admin user to associate with migration
    const { data: adminUser, error: adminError } = await supabase
        .from('users')
        .select('auth_user_id')
        .eq('role', 'ADMIN')
        .eq('is_active', true)
        .limit(1)
        .single();

    if (adminError || !adminUser) {
        console.warn('⚠️ No active ADMIN user found. Migration might hit RLS/Audit issues.');
    } else {
        console.log(`👤 Using Admin context: ${adminUser.auth_user_id}`);
        // We cannot easily mock auth.uid() in a simple script without service role or proper auth
        // But let's try to proceed.
    }

    const filePath = path.join(process.cwd(), 'public', 'الاردنيين - شهر 12-2025.xlsx');
    const workbook = XLSX.readFile(filePath);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (string | number | undefined)[][];

    // Data rows start from index 2
    const rows = data.slice(2).filter(row => row[1] && row[2]); // Must have ID and Name

    console.log(`📊 Found ${rows.length} rows to process.`);

    // 1. Collect unique areas
    const excelAreas = Array.from(new Set(rows.map(row => String(row[4] || 'غير محدد').trim())));
    console.log(`📍 Found ${excelAreas.length} unique areas in Excel.`);

    // 2. Ensure areas exist in DB
    const { data: existingAreas, error: areasError } = await supabase.from('areas').select('*');
    if (areasError) throw areasError;

    const areaMap = new Map(existingAreas?.map(a => [a.name, a.id]));

    for (const areaName of excelAreas) {
        if (!areaMap.has(areaName)) {
            console.log(`➕ Adding new area: ${areaName}`);
            const { data: newArea, error: createError } = await supabase
                .from('areas')
                .insert({ name: areaName })
                .select()
                .single();
            if (createError) {
                console.error(`❌ Failed to create area ${areaName}:`, JSON.stringify(createError, null, 2));
                continue;
            }
            areaMap.set(areaName, newArea.id);
        }
    }

    // 3. Prepare workers
    const workersToUpsert = rows.map(row => ({
        id: String(row[1]),
        name: String(row[2]),
        area_id: areaMap.get(String(row[4] || 'غير محدد').trim()),
        nationality: 'أردني',
        base_salary: Number(row[6]) * 30,
        day_value: Number(row[6])
    }));

    // 4. Upsert workers
    console.log(`👷 Upserting ${workersToUpsert.length} workers...`);
    if (workersToUpsert.length > 0) {
        console.log('Sample worker data:', JSON.stringify(workersToUpsert[0], null, 2));
    }

    const { error: workersError, data: workersResult } = await supabase
        .from('workers')
        .upsert(workersToUpsert, { onConflict: 'id' })
        .select();

    if (workersError) {
        console.error('❌ Workers import failed:', JSON.stringify(workersError, null, 2));
    } else {
        console.log(`✅ Workers import completed successfully! Persisted ${workersResult?.length || 0} workers.`);
    }

    // 5. Initialize Dec 2025 records
    const attendanceRecords = rows.map(row => {
        const workerId = String(row[1]);
        const month = 12;
        const year = 2025;
        const normalDays = Number(row[3]) || 0;
        return {
            id: `${workerId}-${month}-${year}`,
            worker_id: workerId,
            month,
            year,
            normal_days: normalDays,
            overtime_normal_days: 0,
            overtime_holiday_days: 0,
            overtime_eid_days: 0,
            status: 'PENDING_GS',
            total_calculated_days: normalDays,
            updated_at: new Date().toISOString()
        };
    });

    console.log(`📋 Upserting ${attendanceRecords.length} attendance records for 12/2025...`);
    const { error: attError } = await supabase
        .from('attendance_records')
        .upsert(attendanceRecords, { onConflict: 'id' });

    if (attError) {
        console.error('❌ Attendance records import failed:', JSON.stringify(attError, null, 2));
    } else {
        console.log('✅ Attendance records imported successfully!');
    }
}

runImport().catch(console.error);
