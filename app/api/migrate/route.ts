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

    // 1.5 Add video_active column to live_events table
    try {
      await sql`
        ALTER TABLE public.live_events 
        ADD COLUMN IF NOT EXISTS video_active boolean DEFAULT false
      `;
      console.log("✓ Live events video_active column added/checked");
    } catch (colErr: any) {
      console.warn("Could not alter live_events table for video_active:", colErr.message);
    }

    // 1.6 Add video_url column to live_events table
    try {
      await sql`
        ALTER TABLE public.live_events 
        ADD COLUMN IF NOT EXISTS video_url text
      `;
      console.log("✓ Live events video_url column added/checked");
    } catch (colErr: any) {
      console.warn("Could not alter live_events table for video_url:", colErr.message);
    }

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

    // 3.5 Add interests column to profiles table
    try {
      await sql`
        ALTER TABLE public.profiles 
        ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}'
      `;
      console.log("✓ Profiles interests column added/checked");
    } catch (colErr: any) {
      console.warn("Could not alter profiles table directly for interests:", colErr.message);
    }

    // 3.6 Add role column to profiles table
    try {
      await sql`
        ALTER TABLE public.profiles 
        ADD COLUMN IF NOT EXISTS role text DEFAULT 'user'
      `;
      console.log("✓ Profiles role column added/checked");
    } catch (colErr: any) {
      console.warn("Could not alter profiles table directly for role:", colErr.message);
    }

    // 4. Create follows table
    await sql`
      CREATE TABLE IF NOT EXISTS public.follows (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        follower_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
        following_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
        created_at timestamptz DEFAULT now(),
        UNIQUE(follower_id, following_id)
      )
    `;
    console.log("✓ Follows table created/checked");

    // 5. Create notifications table
    await sql`
      CREATE TABLE IF NOT EXISTS public.notifications (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
        type text NOT NULL,
        actor_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
        post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
        content text NOT NULL,
        read boolean DEFAULT false NOT NULL,
        created_at timestamptz DEFAULT now()
      )
    `;
    console.log("✓ Notifications table created/checked");

    // 6. Create subscriptions table
    await sql`
      CREATE TABLE IF NOT EXISTS public.subscriptions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
        plan_name text NOT NULL,
        amount text NOT NULL,
        status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending_approval', 'expired')),
        payment_method text NOT NULL CHECK (payment_method IN ('stripe', 'bank_transfer')),
        payment_proof_url text,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      )
    `;
    console.log("✓ Subscriptions table created/checked");

    try {
      await sql`
        CREATE OR REPLACE TRIGGER subscriptions_updated_at 
        BEFORE UPDATE ON public.subscriptions 
        FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at()
      `;
      console.log("✓ Subscriptions trigger created/checked");
    } catch (trigErr: any) {
      console.warn("Could not create subscriptions trigger:", trigErr.message);
    }

    // Create indexes
    try {
      await sql`CREATE INDEX IF NOT EXISTS follows_follower_idx ON public.follows(follower_id)`;
      await sql`CREATE INDEX IF NOT EXISTS follows_following_idx ON public.follows(following_id)`;
      await sql`CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications(user_id, created_at desc)`;
      console.log("✓ Performance indexes created/checked");
    } catch (idxErr: any) {
      console.warn("Could not create indexes:", idxErr.message);
    }

    return NextResponse.json({
      success: true,
      message: "Database migrations completed successfully!",
      tables: ["live_events", "live_updates", "follows", "notifications", "subscriptions"],
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
