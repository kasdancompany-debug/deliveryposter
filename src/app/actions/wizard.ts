"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { uploadDeliveryPhoto } from "@/lib/posts/storage";
import {
  dataUrlToUploadFile,
  isDataUrl,
  isRemoteUrl,
} from "@/lib/delivery-post/upload-server";
import type { DeliveryDetailsValues, WizardPhoto } from "@/lib/delivery-post/types";
import {
  platformsToFlags,
  resolvePlatforms,
  type DeliveryPostWizardState,
} from "@/lib/delivery-post/types";
import { dbPhotoToWizard } from "@/lib/delivery-post/photo-urls";
import type { PlatformChoice, PostStatus } from "@/types/database";

type ActionResult<T> = T | { error: string };

function mapRowToWizard(
  row: Record<string, unknown>,
  photos: WizardPhoto[]
): DeliveryPostWizardState {
  const platforms = row.platforms as PlatformChoice;
  const flags = platformsToFlags(platforms);
  return {
    id: row.id as string,
    customerName: (row.customer_name as string) ?? "",
    salespersonName: (row.salesperson_name as string) ?? "",
    vehicleYear: (row.vehicle_year as number) ?? new Date().getFullYear(),
    vehicleMake: (row.vehicle_make as string) ?? "",
    vehicleModel: (row.vehicle_model as string) ?? "",
    trim: (row.trim as string) ?? "",
    colour: (row.colour as string) ?? "",
    stockNumber: (row.stock_number as string) ?? "",
    vinLast6: (row.vin_last6 as string) ?? "",
    story: (row.story as string) ?? "",
    customerConsentConfirmed: Boolean(row.consent_confirmed),
    publishInstagram: flags.publishInstagram,
    publishFacebook: flags.publishFacebook,
    platforms,
    photos,
    coverPhotoId: (row.cover_photo_id as string) ?? photos[0]?.id ?? "",
    captionOptions: (row.caption_options as string[]) ?? [],
    selectedCaptionIndex: row.selected_caption_index as number | null,
    finalCaption: (row.final_caption as string) ?? "",
    status: row.status as PostStatus,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" as const, supabase: null, user: null };
  return { supabase, user, error: null };
}

async function uploadFromUrl(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  postId: string,
  url: string,
  label: string
) {
  if (!isDataUrl(url)) {
    if (isRemoteUrl(url)) return { publicUrl: url, storagePath: null as string | null };
    return { publicUrl: url, storagePath: null as string | null };
  }
  const file = dataUrlToUploadFile(url, label);
  const { storagePath, publicUrl } = await uploadDeliveryPhoto(
    supabase,
    userId,
    postId,
    file
  );
  return { publicUrl, storagePath };
}

export async function createWizardPost(): Promise<
  ActionResult<{ id: string }>
> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.user) return { error: "Unauthorized" };

  const year = new Date().getFullYear();
  const { data, error } = await auth.supabase
    .from("delivery_posts")
    .insert({
      created_by: auth.user.id,
      customer_name: "",
      salesperson_name: "",
      vehicle_year: year,
      vehicle_make: "",
      vehicle_model: "",
      status: "draft",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { id: data.id };
}

export async function getWizardPost(
  postId: string
): Promise<ActionResult<DeliveryPostWizardState>> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase) return { error: "Unauthorized" };

  const { data: row, error } = await auth.supabase
    .from("delivery_posts")
    .select("*, delivery_post_photos(*)")
    .eq("id", postId)
    .single();

  if (error || !row) return { error: "Post not found" };

  const photoRows = [...(row.delivery_post_photos ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const photos = photoRows.map((p) => dbPhotoToWizard(p));

  return mapRowToWizard(row, photos);
}

export async function saveWizardPhotos(
  postId: string,
  photos: WizardPhoto[],
  coverPhotoId: string
): Promise<ActionResult<DeliveryPostWizardState>> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.user) return { error: "Unauthorized" };

  const { data: existingPhotos } = await auth.supabase
    .from("delivery_post_photos")
    .select("id, storage_path")
    .eq("post_id", postId);

  const keptIds = new Set<string>();
  const clientToDb = new Map<string, string>();

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const sortOrder = i;
    let storagePhotoId = photo.storagePhotoId;

    const needsUpload =
      isDataUrl(photo.originalUrl) || isDataUrl(photo.editedUrl);

    if (!needsUpload && storagePhotoId && isRemoteUrl(photo.editedUrl)) {
      await auth.supabase
        .from("delivery_post_photos")
        .update({
          sort_order: sortOrder,
          plate_protected: photo.plateProtected ?? false,
        })
        .eq("id", storagePhotoId);
      keptIds.add(storagePhotoId);
      clientToDb.set(photo.id, storagePhotoId);
      continue;
    }

    if (needsUpload || !storagePhotoId) {
      const original = await uploadFromUrl(
        auth.supabase,
        auth.user.id,
        postId,
        photo.originalUrl,
        `original-${i}`
      );
      const edited =
        photo.editedUrl === photo.originalUrl
          ? original
          : await uploadFromUrl(
              auth.supabase,
              auth.user.id,
              postId,
              photo.editedUrl,
              `edited-${i}`
            );

      if (storagePhotoId) {
        const old = existingPhotos?.find((p) => p.id === storagePhotoId);
        if (old?.storage_path) {
          await auth.supabase.storage
            .from("delivery-photos")
            .remove([old.storage_path]);
        }
        await auth.supabase
          .from("delivery_post_photos")
          .update({
            storage_path: edited.storagePath ?? original.storagePath ?? "",
            public_url: edited.publicUrl,
            original_storage_path: original.storagePath,
            original_public_url: original.publicUrl,
            sort_order: sortOrder,
            plate_protected: photo.plateProtected ?? false,
          })
          .eq("id", storagePhotoId);
        keptIds.add(storagePhotoId);
        clientToDb.set(photo.id, storagePhotoId);
      } else {
        const { data: inserted, error: insErr } = await auth.supabase
          .from("delivery_post_photos")
          .insert({
            post_id: postId,
            storage_path: edited.storagePath ?? original.storagePath ?? "",
            public_url: edited.publicUrl,
            original_storage_path: original.storagePath,
            original_public_url: original.publicUrl,
            sort_order: sortOrder,
            plate_protected: photo.plateProtected ?? false,
          })
          .select("id")
          .single();
        if (insErr) return { error: insErr.message };
        storagePhotoId = inserted.id;
        keptIds.add(inserted.id);
        clientToDb.set(photo.id, inserted.id);
      }
    } else if (storagePhotoId) {
      await auth.supabase
        .from("delivery_post_photos")
        .update({
          sort_order: sortOrder,
          plate_protected: photo.plateProtected ?? false,
        })
        .eq("id", storagePhotoId);
      keptIds.add(storagePhotoId);
      clientToDb.set(photo.id, storagePhotoId);
    }
  }

  for (const row of existingPhotos ?? []) {
    if (!keptIds.has(row.id)) {
      if (row.storage_path) {
        await auth.supabase.storage
          .from("delivery-photos")
          .remove([row.storage_path]);
      }
      await auth.supabase.from("delivery_post_photos").delete().eq("id", row.id);
    }
  }

  const resolvedCover =
    clientToDb.get(coverPhotoId) ??
    (keptIds.has(coverPhotoId) ? coverPhotoId : null) ??
    [...keptIds][0] ??
    null;

  await auth.supabase
    .from("delivery_posts")
    .update({ cover_photo_id: resolvedCover })
    .eq("id", postId);

  revalidatePath(`/posts/${postId}`);
  revalidatePath("/dashboard");
  return getWizardPost(postId);
}

export async function saveWizardPost(
  postId: string,
  input: {
    details?: DeliveryDetailsValues;
    photos?: WizardPhoto[];
    coverPhotoId?: string;
    captionOptions?: string[];
    selectedCaptionIndex?: number | null;
    finalCaption?: string;
    status?: PostStatus;
  }
): Promise<ActionResult<DeliveryPostWizardState>> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase) return { error: "Unauthorized" };

  if (input.photos) {
    const photoResult = await saveWizardPhotos(
      postId,
      input.photos,
      input.coverPhotoId ?? input.photos[0]?.id ?? ""
    );
    if ("error" in photoResult) return photoResult;
  }

  const updates: Record<string, unknown> = {};
  const d = input.details;
  if (d) {
    updates.customer_name = d.customerName;
    updates.salesperson_name = d.salespersonName;
    updates.vehicle_year = d.vehicleYear;
    updates.vehicle_make = d.vehicleMake;
    updates.vehicle_model = d.vehicleModel;
    updates.trim = d.trim || null;
    updates.colour = d.colour || null;
    updates.stock_number = d.stockNumber || null;
    updates.vin_last6 = d.vinLast6 || null;
    updates.story = d.story || null;
    updates.consent_confirmed = d.customerConsentConfirmed;
    updates.platforms = resolvePlatforms(
      d.publishInstagram,
      d.publishFacebook
    );
  }
  if (input.captionOptions !== undefined)
    updates.caption_options = input.captionOptions;
  if (input.selectedCaptionIndex !== undefined)
    updates.selected_caption_index = input.selectedCaptionIndex;
  if (input.finalCaption !== undefined) updates.final_caption = input.finalCaption;
  if (input.status !== undefined) updates.status = input.status;

  if (Object.keys(updates).length > 0) {
    const { error } = await auth.supabase
      .from("delivery_posts")
      .update(updates)
      .eq("id", postId);
    if (error) return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/posts/${postId}`);
  return getWizardPost(postId);
}

export async function deleteDeliveryPost(
  postId: string
): Promise<ActionResult<{ success: true }>> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase) return { error: "Unauthorized" };

  const { data: photos } = await auth.supabase
    .from("delivery_post_photos")
    .select("storage_path")
    .eq("post_id", postId);

  const paths = (photos ?? [])
    .map((p) => p.storage_path)
    .filter(Boolean) as string[];
  if (paths.length) {
    await auth.supabase.storage.from("delivery-photos").remove(paths);
  }

  const { error } = await auth.supabase
    .from("delivery_posts")
    .delete()
    .eq("id", postId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { success: true };
}

export async function duplicateDeliveryPost(
  postId: string
): Promise<ActionResult<{ id: string }>> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.user) return { error: "Unauthorized" };

  const loaded = await getWizardPost(postId);
  if ("error" in loaded) return loaded;

  const { data: created, error } = await auth.supabase
    .from("delivery_posts")
    .insert({
      created_by: auth.user.id,
      customer_name: `${loaded.customerName} (copy)`.trim(),
      salesperson_name: loaded.salespersonName,
      vehicle_year: loaded.vehicleYear,
      vehicle_make: loaded.vehicleMake,
      vehicle_model: loaded.vehicleModel,
      trim: loaded.trim || null,
      colour: loaded.colour || null,
      stock_number: loaded.stockNumber || null,
      vin_last6: loaded.vinLast6 || null,
      story: loaded.story || null,
      consent_confirmed: false,
      platforms: loaded.platforms,
      status: "draft",
      caption_options: loaded.captionOptions,
      selected_caption_index: loaded.selectedCaptionIndex,
      final_caption: loaded.finalCaption,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const { data: sourcePhotos } = await auth.supabase
    .from("delivery_post_photos")
    .select("*")
    .eq("post_id", postId)
    .order("sort_order");

  if (sourcePhotos?.length) {
    await auth.supabase.from("delivery_post_photos").insert(
      sourcePhotos.map((p, i) => ({
        post_id: created.id,
        storage_path: p.storage_path,
        public_url: p.public_url,
        original_storage_path: p.original_storage_path,
        original_public_url: p.original_public_url,
        sort_order: i,
        plate_protected: p.plate_protected ?? false,
      }))
    );
    const { data: newPhotos } = await auth.supabase
      .from("delivery_post_photos")
      .select("id")
      .eq("post_id", created.id)
      .order("sort_order")
      .limit(1);
    if (newPhotos?.[0]) {
      await auth.supabase
        .from("delivery_posts")
        .update({ cover_photo_id: newPhotos[0].id })
        .eq("id", created.id);
    }
  }

  revalidatePath("/dashboard");
  return { id: created.id };
}

export async function listPostLogs(postId: string) {
  const auth = await requireUser();
  if (auth.error || !auth.supabase) return [];

  const { data } = await auth.supabase
    .from("post_logs")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((l) => ({
    id: l.id,
    platform: l.platform,
    status: l.status,
    message:
      l.status === "success"
        ? `Published to ${l.platform}`
        : (l.error_message as string) ?? `Failed on ${l.platform}`,
    createdAt: l.created_at as string,
  }));
}
