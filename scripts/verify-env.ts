
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

const optionalVars = [
    'SUPABASE_SERVICE_ROLE_KEY'
];

console.log("🔍 Verifying Environment Variables...");

let missingCount = 0;

requiredVars.forEach(key => {
    if (!process.env[key]) {
        console.error(`❌ Missing REQUIRED variable: ${key}`);
        missingCount++;
    } else {
        console.log(`✅ ${key} is set.`);
    }
});

optionalVars.forEach(key => {
    if (!process.env[key]) {
        console.warn(`⚠️  Missing OPTIONAL variable: ${key}`);
    } else {
        console.log(`✅ ${key} is set.`);
    }
});

if (missingCount > 0) {
    console.error(`\n❌ Validation Failed: ${missingCount} required variables are missing.`);
    process.exit(1);
} else {
    console.log("\n✅ Environment validation successful! System is ready for launch.");
    process.exit(0);
}
