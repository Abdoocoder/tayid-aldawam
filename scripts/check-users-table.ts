
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4cXB6ZGZmYm9jYmdjc2F4bGxuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk2MDY0NCwiZXhwIjoyMDgxNTM2NjQ0fQ.VPas713cqOR-mS_SFtGBL33RmBRqe3CPBI2QwQHi3ko";

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function checkUsersTable() {
    console.log('👤 Checking users table columns...');
    const { data: sample, error } = await supabase.from('users').select('*').limit(1);
    if (error) console.error(error);
    else console.log('Users Sample Keys:', Object.keys(sample[0] || {}));
}

checkUsersTable();
