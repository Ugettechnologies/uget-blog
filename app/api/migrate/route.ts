import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export async function GET() {
  try {
    const sql = getSql();

    console.log("Starting database migrations...");

    // 1. Create live_events table
    await sql`
      CREATE TABLE IF NOT EXISTS public.live_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        title text NOT NULL,
        description text,
        status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
        author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      )
    `;
    console.log("✓ Live events table created/checked");

    // 2. Create live_updates table
    await sql`
      CREATE TABLE IF NOT EXISTS public.live_updates (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id uuid REFERENCES public.live_events(id) ON DELETE CASCADE NOT NULL,
        content text NOT NULL,
        image_url text,
        created_at timestamptz DEFAULT now()
      )
    `;
    console.log("✓ Live updates table created/checked");

    // 3. Add theme column to profiles table
    try {
      await sql`
        ALTER TABLE public.profiles 
        ADD COLUMN IF NOT EXISTS theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system'))
      `;
      console.log("✓ Profiles theme column added/checked");
    } catch (colErr: any) {
      console.warn("Could not alter profiles table directly, check if column exists:", colErr.message);
    }

    return NextResponse.json({
      success: true,
      message: "Database migrations completed successfully!",
      tables: ["live_events", "live_updates"],
      columns: ["profiles.theme"]
    });
  } catch (err: any) {
    console.error("Migration failed:", err);
    return NextResponse.json({
      success: false,
      error: err.message || "Unknown migration error"
    }, { status: 500 });
  }
}
