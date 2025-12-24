
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log("--- Users (Roles & Names) ---");
    const { data: users, error: uErr } = await supabase.from('users').select('name, role, username, is_active');
    if (uErr) console.error(uErr);
    else console.table(users);

    console.log("\n--- Areas ---");
    const { data: areas, error: aErr } = await supabase.from('areas').select('name, id');
    if (aErr) console.error(aErr);
    else console.table(areas);

    console.log("\n--- Workers (Sample 5) ---");
    const { data: workers, error: wErr } = await supabase.from('workers').select('name, base_salary').limit(5);
    if (wErr) console.error(wErr);
    else console.table(workers);

    console.log("\n--- Recent Attendance (Sample 5) ---");
    const { data: att, error: atErr } = await supabase.from('attendance_records').select('month, year, status, worker_id').limit(5);
    if (atErr) console.error(atErr);
    else console.table(att);
}

inspect();
