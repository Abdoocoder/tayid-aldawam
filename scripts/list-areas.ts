
import { supabase } from '@/lib/supabase';

async function listAreas() {
    const { data: areas, error } = await supabase.from('areas').select('*');
    if (error) {
        console.error('Error fetching areas:', error);
        return;
    }
    console.log(JSON.stringify(areas, null, 2));
}

listAreas();
