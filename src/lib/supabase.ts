// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

// ดึงค่าจากไฟล์ .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// สร้าง Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
