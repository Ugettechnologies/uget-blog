import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromSession } from "@/lib/auth-server";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary as optional fallback
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const user = await getUserFromSession(cookieStore);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Check if Supabase Storage is configured (Primary storage)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_KEY;

    if (supabaseUrl && supabaseKey) {
      const bucket = process.env.SUPABASE_STORAGE_BUCKET || "uploads";
      const cleanFileName = file.name
        ? file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
        : "file";
      const filePath = `${user.id}/${Date.now()}-${cleanFileName}`;

      const uploadEndpoint = `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/${bucket}/${filePath}`;

      const res = await fetch(uploadEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          apikey: supabaseKey,
          "Content-Type": file.type || "application/octet-stream",
          "x-upsert": "true",
        },
        body: buffer,
      });

      if (res.ok) {
        const publicUrl = `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/${bucket}/${filePath}`;
        return NextResponse.json({ path: publicUrl });
      }

      const errText = await res.text();
      console.warn("Supabase Storage upload warning, falling back if available:", errText);
    }

    // 2. Fallback to Cloudinary if configured
    if (
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    ) {
      const uploadResult = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `echo-gist/${user.id}`,
            resource_type: "auto",
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
        uploadStream.end(buffer);
      });

      return NextResponse.json({ path: uploadResult.secure_url });
    }

    return NextResponse.json(
      { error: "No storage service configured. Please configure Supabase Storage." },
      { status: 500 }
    );
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}

