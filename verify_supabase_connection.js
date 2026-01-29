
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module dirname simulation
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env.local manually
const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');

const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

console.log(`Connecting to Supabase at ${supabaseUrl}...`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    try {
        // 1. Check connection by selecting count
        const { count, error } = await supabase.from('customers').select('*', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Connection Failed:', error.message);
            if (error.code === 'PGRST204') {
                console.error('   Hint: The table "customers" does not exist. Did you run the SQL script?');
            }
            return;
        }

        console.log(`✅ Connection Successful! Found ${count !== null ? count : 0} customers.`);

        // 2. Check other tables existence
        const tables = ['projects', 'contracts', 'payments', 'app_users'];
        for (const table of tables) {
            const { error: tableError } = await supabase.from(table).select('*', { count: 'exact', head: true });
            if (tableError) {
                console.error(`❌ Table verification failed for "${table}":`, tableError.message);
            } else {
                console.log(`✅ Table "${table}" is ready.`);
            }
        }

    } catch (err) {
        console.error('❌ Unexpected error:', err);
    }
}

verify();
