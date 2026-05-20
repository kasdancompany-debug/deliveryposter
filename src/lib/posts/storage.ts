import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "delivery-photos";

export function buildPhotoPath(userId: string, postId: string, fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${userId}/${postId}/${Date.now()}-${safeName}`;
}

export async function uploadDeliveryPhoto(
  supabase: SupabaseClient,
  userId: string,
  postId: string,
  file: File
): Promise<{ storagePath: string; publicUrl: string }> {
  const path = buildPhotoPath(userId, postId, file.name);

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw new Error(error.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return { storagePath: path, publicUrl };
}

export function getPublicUrl(supabase: SupabaseClient, storagePath: string) {
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return publicUrl;
}
