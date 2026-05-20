"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateDeliveryCaptionTexts } from "@/lib/captions";
import { getSocialPublisher, resolvePublisherMode } from "@/lib/social";
import { resolvePlatforms } from "@/lib/social/types";
import type { DeliveryFormInput } from "@/lib/validators/delivery-post";
import type { PostStatus } from "@/types/database";

export async function createDeliveryPost(
  form: DeliveryFormInput
): Promise<{ postId: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { data, error } = await supabase
    .from("delivery_posts")
    .insert({
      created_by: user.id,
      customer_name: form.customerName,
      salesperson_name: form.salespersonName,
      vehicle_year: form.vehicleYear,
      vehicle_make: form.vehicleMake,
      vehicle_model: form.vehicleModel,
      trim: form.trim || null,
      colour: form.colour || null,
      story: form.story || null,
      consent_confirmed: form.consentConfirmed,
      platforms: form.platforms,
      status: "draft",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { postId: data.id };
}

export async function updateDeliveryPost(
  postId: string,
  form: Partial<DeliveryFormInput> & {
    finalCaption?: string;
    selectedCaptionIndex?: number;
    captionOptions?: string[];
    status?: PostStatus;
  }
): Promise<{ success: boolean } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const updates: Record<string, unknown> = {};

  if (form.customerName !== undefined) updates.customer_name = form.customerName;
  if (form.salespersonName !== undefined)
    updates.salesperson_name = form.salespersonName;
  if (form.vehicleYear !== undefined) updates.vehicle_year = form.vehicleYear;
  if (form.vehicleMake !== undefined) updates.vehicle_make = form.vehicleMake;
  if (form.vehicleModel !== undefined) updates.vehicle_model = form.vehicleModel;
  if (form.trim !== undefined) updates.trim = form.trim || null;
  if (form.colour !== undefined) updates.colour = form.colour || null;
  if (form.story !== undefined) updates.story = form.story || null;
  if (form.consentConfirmed !== undefined)
    updates.consent_confirmed = form.consentConfirmed;
  if (form.platforms !== undefined) updates.platforms = form.platforms;
  if (form.finalCaption !== undefined) updates.final_caption = form.finalCaption;
  if (form.selectedCaptionIndex !== undefined)
    updates.selected_caption_index = form.selectedCaptionIndex;
  if (form.captionOptions !== undefined)
    updates.caption_options = form.captionOptions;
  if (form.status !== undefined) updates.status = form.status;

  const { error } = await supabase
    .from("delivery_posts")
    .update(updates)
    .eq("id", postId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath(`/posts/${postId}`);
  return { success: true };
}

export async function savePhotoRecord(
  postId: string,
  storagePath: string,
  publicUrl: string,
  sortOrder: number
) {
  const supabase = await createClient();
  const { error } = await supabase.from("delivery_post_photos").insert({
    post_id: postId,
    storage_path: storagePath,
    public_url: publicUrl,
    sort_order: sortOrder,
  });

  if (error) throw new Error(error.message);
}

export async function deletePhotoRecord(photoId: string) {
  const supabase = await createClient();
  const { data: photo } = await supabase
    .from("delivery_post_photos")
    .select("storage_path")
    .eq("id", photoId)
    .single();

  if (photo?.storage_path) {
    await supabase.storage.from("delivery-photos").remove([photo.storage_path]);
  }

  await supabase.from("delivery_post_photos").delete().eq("id", photoId);
  return { success: true };
}

export async function generateCaptionsForPost(
  postId: string
): Promise<{ captions: string[] } | { error: string }> {
  const supabase = await createClient();
  const { data: post, error } = await supabase
    .from("delivery_posts")
    .select("*")
    .eq("id", postId)
    .single();

  if (error || !post) return { error: "Post not found" };

  const captions = await generateDeliveryCaptionTexts({
    customerName: post.customer_name,
    salespersonName: post.salesperson_name,
    vehicleYear: post.vehicle_year,
    vehicleMake: post.vehicle_make,
    vehicleModel: post.vehicle_model,
    trim: post.trim ?? undefined,
    colour: post.colour ?? undefined,
    story: post.story ?? undefined,
  });

  await supabase
    .from("delivery_posts")
    .update({ caption_options: captions })
    .eq("id", postId);

  revalidatePath(`/posts/${postId}`);
  return { captions };
}

export async function saveDraft(
  postId: string,
  data: {
    finalCaption?: string;
    selectedCaptionIndex?: number;
    form?: Partial<DeliveryFormInput>;
  }
) {
  return updateDeliveryPost(postId, {
    ...data.form,
    finalCaption: data.finalCaption,
    selectedCaptionIndex: data.selectedCaptionIndex,
    status: "draft",
  });
}

export async function approvePost(
  postId: string,
  finalCaption: string,
  selectedCaptionIndex?: number
) {
  if (!finalCaption.trim()) return { error: "Caption is required" };

  return updateDeliveryPost(postId, {
    finalCaption,
    selectedCaptionIndex,
    status: "ready",
  });
}

export async function publishPost(
  postId: string
): Promise<{ success: boolean } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { data: post, error: postError } = await supabase
    .from("delivery_posts")
    .select("*, delivery_post_photos(*)")
    .eq("id", postId)
    .single();

  if (postError || !post) return { error: "Post not found" };

  if (post.status !== "ready") {
    return { error: "Post must be approved (Ready) before publishing" };
  }

  if (!post.consent_confirmed) {
    return { error: "Customer consent must be confirmed" };
  }

  if (!post.final_caption?.trim()) {
    return { error: "Final caption is required" };
  }

  const photos = (post.delivery_post_photos ?? []).sort(
    (a: { sort_order: number }, b: { sort_order: number }) =>
      a.sort_order - b.sort_order
  );

  if (photos.length < 1) {
    return { error: "At least one photo is required" };
  }

  const imageUrls = photos.map(
    (p: { public_url: string | null; storage_path: string }) =>
      p.public_url ?? ""
  ).filter(Boolean);

  const publisher = getSocialPublisher(resolvePublisherMode());
  const summary = await publisher.publish({
    postId,
    caption: post.final_caption,
    imageUrls,
    platforms: post.platforms,
  });

  const platforms = resolvePlatforms(post.platforms);

  for (let i = 0; i < summary.results.length; i++) {
    const result = summary.results[i];
    await supabase.from("post_logs").insert({
      post_id: postId,
      platform: result.platform,
      action: "publish",
      status: result.success ? "success" : "failure",
      response: result.rawResponse ?? null,
      error_message: result.errorMessage ?? null,
    });
  }

  const newStatus: PostStatus = summary.allSucceeded ? "posted" : "failed";

  await supabase
    .from("delivery_posts")
    .update({
      status: newStatus,
      published_at: summary.allSucceeded ? new Date().toISOString() : null,
    })
    .eq("id", postId);

  revalidatePath("/dashboard");
  revalidatePath(`/posts/${postId}`);

  if (!summary.allSucceeded) {
    const failed = summary.results
      .filter((r) => !r.success)
      .map((r) => `${r.platform}: ${r.errorMessage}`)
      .join("; ");
    return { error: `Publish failed: ${failed}` };
  }

  return { success: true };
}

export async function getPost(postId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("delivery_posts")
    .select("*, delivery_post_photos(*)")
    .eq("id", postId)
    .single();

  if (error) return null;
  return data;
}

export async function listPosts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("delivery_posts")
    .select("*, delivery_post_photos(id, public_url, sort_order)")
    .order("created_at", { ascending: false });

  if (error) return [];
  return data;
}
