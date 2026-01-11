
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4cXB6ZGZmYm9jYmdjc2F4bGxuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk2MDY0NCwiZXhwIjoyMDgxNTM2NjQ0fQ.VPas713cqOR-mS_SFtGBL33RmBRqe3CPBI2QwQHi3ko";

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function checkCols() {
    console.log('👷 Checking nationality column...');
    const { data, error } = await supabase.from('workers').select('nationality').limit(1);
    if (error) console.error('Nationality check error:', JSON.stringify(error, null, 2));
    else console.log('Nationality column exists!');
}

checkCols();
