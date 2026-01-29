
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

console.log('URL Length:', env.VITE_SUPABASE_URL?.length);
console.log('Key Length:', env.VITE_SUPABASE_ANON_KEY?.length);
console.log('URL Start:', env.VITE_SUPABASE_URL?.substring(0, 10));

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function test() {
    console.log('--- Testing HEAD ---');
    const { count, error: headError } = await supabase.from('customers').select('*', { count: 'exact', head: true });
    if (headError) console.log('HEAD Error:', headError);
    else console.log('HEAD Success. Count:', count);

    console.log('--- Testing GET ---');
    const { data, error: getError } = await supabase.from('customers').select('*').limit(1);
    if (getError) console.log('GET Error:', getError);
    else console.log('GET Success. Data:', data);
}

test();
