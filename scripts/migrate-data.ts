import { supabase } from '@/lib/supabase';
import { workerToDb, attendanceToDb } from '@/lib/data-transformer';
import initialData from '@/data/initialData.json';
import { Worker as FrontendWorker } from '@/context/AttendanceContext';

/**
 * Migration script to import initial data from JSON to Supabase
 */
async function migrateData() {
    console.log('🚀 Starting data migration to Supabase...\n');

    try {
        // Test connection first
        console.log('📡 Testing Supabase connection...');
        const { error: testError } = await supabase
            .from('workers')
            .select('count', { count: 'exact', head: true });

        if (testError) {
            throw new Error(`Connection failed: ${testError.message}`);
        }
        console.log('✅ Connection successful!\n');

        // Migrate Workers
        console.log('👷 Migrating workers...');
        const workersToInsert = initialData.workers.map(w => workerToDb({ ...w, nationality: 'مصري' } as unknown as FrontendWorker));

        const { data: workersData, error: workersError } = await supabase
            .from('workers')
            .upsert(workersToInsert, { onConflict: 'id' })
            .select();

        if (workersError) {
            throw new Error(`Workers migration failed: ${workersError.message}`);
        }
        console.log(`✅ Migrated ${workersData?.length || 0} workers\n`);

        // Migrate Attendance Records
        console.log('📋 Migrating attendance records...');
        const attendanceToInsert = initialData.attendance.map((record: Record<string, unknown>) => {
            const dbRecord = attendanceToDb({
                workerId: record.workerId as string,
                month: record.month as number,
                year: record.year as number,
                normalDays: record.normalDays as number,
                overtimeNormalDays: record.overtimeNormalDays as number,
                overtimeHolidayDays: record.overtimeHolidayDays as number,
                overtimeEidDays: (record.overtimeEidDays as number) || 0,
                status: (record.status as 'PENDING_GS' | 'PENDING_HR' | 'APPROVED') || 'PENDING_GS',
                updatedAt: (record.updatedAt as string) || new Date().toISOString(),
                id: `${record.workerId}-${record.month}-${record.year}`,
                totalCalculatedDays: (record.totalCalculatedDays as number) || 0
            });
            // Calculate total_calculated_days (will be auto-calculated by trigger, but we include it)
            return {
                ...dbRecord,
                total_calculated_days: record.totalCalculatedDays,
            };
        });

        const { data: attendanceData, error: attendanceError } = await supabase
            .from('attendance_records')
            .upsert(attendanceToInsert, { onConflict: 'id' })
            .select();

        if (attendanceError) {
            throw new Error(`Attendance migration failed: ${attendanceError.message}`);
        }
        console.log(`✅ Migrated ${attendanceData?.length || 0} attendance records\n`);

        // Summary
        console.log('🎉 Migration completed successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📊 Summary:`);
        console.log(`   Workers: ${workersData?.length || 0}`);
        console.log(`   Attendance Records: ${attendanceData?.length || 0}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run migration
migrateData();
