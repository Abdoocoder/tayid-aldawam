
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4cXB6ZGZmYm9jYmdjc2F4bGxuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk2MDY0NCwiZXhwIjoyMDgxNTM2NjQ0fQ.VPas713cqOR-mS_SFtGBL33RmBRqe3CPBI2QwQHi3ko";

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function describeTables() {
    console.log('👷 Describing workers table...');
    const { data: cols, error } = await supabase.rpc('get_table_columns', { table_name: 'workers' });
    if (error) {
        console.error('RPC Error:', error);
        // Fallback: try to get one row
        const { data: sample, error: sErr } = await supabase.from('workers').select('*').limit(1);
        if (sErr) console.error('Sample Error:', sErr);
        else console.log('Workers Sample Keys:', Object.keys(sample[0] || {}));
    } else {
        console.log('Workers Columns:', JSON.stringify(cols, null, 2));
    }

    console.log('📋 Describing attendance_records table...');
    const { data: attCols, error: attErr } = await supabase.rpc('get_table_columns', { table_name: 'attendance_records' });
    if (attErr) {
        console.warn('RPC Error for attendance_records, falling back to sample query.');
        const { data: attSample, error: asErr } = await supabase.from('attendance_records').select('*').limit(1);
        if (asErr) console.error('Attendance Sample Error:', asErr);
        else console.log('Attendance Sample Keys:', Object.keys(attSample[0] || {}));
    } else {
        console.log('Attendance Columns:', JSON.stringify(attCols, null, 2));
    }
}

describeTables();
