
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4cXB6ZGZmYm9jYmdjc2F4bGxuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk2MDY0NCwiZXhwIjoyMDgxNTM2NjQ0fQ.VPas713cqOR-mS_SFtGBL33RmBRqe3CPBI2QwQHi3ko";

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function checkWorker() {
    console.log('🔍 Checking for worker 290...');
    const { data, error } = await supabase.from('workers').select('*').eq('id', '290');
    if (error) console.error(error);
    else console.log('Worker 290 Result:', JSON.stringify(data, null, 2));

    const { data: areas, error: aErr } = await supabase.from('areas').select('*');
    if (aErr) console.error(aErr);
    else console.log(`📍 Found ${areas?.length || 0} areas.`);
}

checkWorker();
