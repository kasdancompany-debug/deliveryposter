"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle2,
  Loader2,
  Save,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhotoUploader, type LocalPhoto } from "@/components/photo-uploader";
import { DeliveryForm } from "@/components/delivery-form";
import { CaptionEditor } from "@/components/caption-editor";
import { PostPreviewCard } from "@/components/post-preview-card";
import { StatusBadge } from "@/components/status-badge";
import {
  approvePost,
  createDeliveryPost,
  generateCaptionsForPost,
  publishPost,
  saveDraft,
  savePhotoRecord,
  updateDeliveryPost,
} from "@/app/actions/posts";
import { createClient } from "@/lib/supabase/client";
import { uploadDeliveryPhoto } from "@/lib/posts/storage";
import type { DeliveryFormInput } from "@/lib/validators/delivery-post";
import { MIN_PHOTOS } from "@/lib/validators/delivery-post";
import type { DeliveryPostWithPhotos, PostStatus, PlatformChoice } from "@/types/database";

interface PostWorkflowProps {
  mode: "create" | "edit";
  post?: DeliveryPostWithPhotos;
  userId: string;
}

function mapDbToForm(post: DeliveryPostWithPhotos): Partial<DeliveryFormInput> {
  return {
    customerName: post.customer_name,
    salespersonName: post.salesperson_name,
    vehicleYear: post.vehicle_year,
    vehicleMake: post.vehicle_make,
    vehicleModel: post.vehicle_model,
    trim: post.trim ?? undefined,
    colour: post.colour ?? undefined,
    story: post.story ?? undefined,
    consentConfirmed: post.consent_confirmed ? true : undefined,
    platforms: post.platforms,
  };
}

function mapPhotosFromDb(post: DeliveryPostWithPhotos): LocalPhoto[] {
  return [...(post.delivery_post_photos ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((p) => ({
      id: p.id,
      dbId: p.id,
      previewUrl: p.public_url ?? "",
      publicUrl: p.public_url ?? undefined,
      storagePath: p.storage_path,
      sortOrder: p.sort_order,
    }));
}

export function PostWorkflow({ mode, post, userId }: PostWorkflowProps) {
  const router = useRouter();
  const [postId, setPostId] = useState<string | undefined>(post?.id);
  const [photos, setPhotos] = useState<LocalPhoto[]>(
    post ? mapPhotosFromDb(post) : []
  );
  const [captionOptions, setCaptionOptions] = useState<string[]>(
    (post?.caption_options as string[]) ?? []
  );
  const [selectedIndex, setSelectedIndex] = useState<number | null>(
    post?.selected_caption_index ?? null
  );
  const [finalCaption, setFinalCaption] = useState(post?.final_caption ?? "");
  const [status, setStatus] = useState<PostStatus>(post?.status ?? "draft");
  const [platforms, setPlatforms] = useState<PlatformChoice>(
    post?.platforms ?? "both"
  );
  const [pending, startTransition] = useTransition();
  const [generating, setGenerating] = useState(false);

  const supabase = createClient();
  const isLocked = status === "posted";
  const canPublish = status === "ready";

  async function ensurePostId(form: DeliveryFormInput): Promise<string | null> {
    if (postId) {
      await updateDeliveryPost(postId, form);
      setPlatforms(form.platforms);
      return postId;
    }
    const result = await createDeliveryPost(form);
    if ("error" in result) {
      toast.error(result.error);
      return null;
    }
    setPostId(result.postId);
    setPlatforms(form.platforms);
    router.replace(`/posts/${result.postId}`);
    return result.postId;
  }

  async function handleUpload(file: File, sortOrder: number) {
    let id = postId;
    if (!id) {
      toast.error("Save delivery details first");
      throw new Error("No post id");
    }
    const result = await uploadDeliveryPhoto(supabase, userId, id, file);
    await savePhotoRecord(id, result.storagePath, result.publicUrl, sortOrder);
    return result;
  }

  async function handleFormSubmit(form: DeliveryFormInput) {
    startTransition(async () => {
      const id = await ensurePostId(form);
      if (id) toast.success("Details saved");
    });
  }

  async function handleGenerate() {
    if (!postId) {
      toast.error("Save delivery details first");
      return;
    }
    setGenerating(true);
    const result = await generateCaptionsForPost(postId);
    setGenerating(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setCaptionOptions(result.captions);
    toast.success("3 caption options ready");
  }

  function handleSelectOption(index: number) {
    setSelectedIndex(index);
    setFinalCaption(captionOptions[index] ?? "");
  }

  function handleSaveDraft() {
    if (!postId) {
      toast.error("Complete delivery details first");
      return;
    }
    startTransition(async () => {
      const result = await saveDraft(postId, {
        finalCaption,
        selectedCaptionIndex: selectedIndex ?? undefined,
      });
      if ("error" in result) toast.error(result.error);
      else {
        setStatus("draft");
        toast.success("Saved as draft");
        router.refresh();
      }
    });
  }

  function handleApprove() {
    if (!postId) return;
    if (photos.length < MIN_PHOTOS) {
      toast.error(`Add at least ${MIN_PHOTOS} photo`);
      return;
    }
    if (!finalCaption.trim()) {
      toast.error("Add or edit a caption first");
      return;
    }
    startTransition(async () => {
      const result = await approvePost(
        postId,
        finalCaption,
        selectedIndex ?? undefined
      );
      if ("error" in result) toast.error(result.error);
      else {
        setStatus("ready");
        toast.success("Approved — ready to publish");
        router.refresh();
      }
    });
  }

  function handlePublish() {
    if (!postId) return;
    startTransition(async () => {
      const result = await publishPost(postId);
      if ("error" in result) {
        toast.error(result.error);
        setStatus("failed");
      } else {
        setStatus("posted");
        toast.success("Published successfully (mock)");
        router.refresh();
      }
    });
  }

  const imageUrls = photos
    .map((p) => p.publicUrl ?? p.previewUrl)
    .filter(Boolean);

  const dealership =
    process.env.NEXT_PUBLIC_DEALERSHIP_NAME ?? "Your Dealership";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "create" ? "New delivery post" : "Edit delivery post"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload photos, add details, generate captions, preview, and publish.
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
              1. Photos
            </h2>
            <PhotoUploader
              photos={photos}
              onChange={setPhotos}
              onUpload={postId ? handleUpload : undefined}
              disabled={isLocked || (!postId && mode === "create")}
            />
            {!postId && (
              <p className="mt-2 text-xs text-amber-400/80">
                Save delivery details below to enable photo uploads.
              </p>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
              2. Details
            </h2>
            <DeliveryForm
              id="delivery-form"
              defaultValues={post ? mapDbToForm(post) : undefined}
              onSubmit={handleFormSubmit}
              disabled={isLocked || pending}
            />
            <Button
              type="submit"
              form="delivery-form"
              className="mt-4 w-full bg-amber-500 text-black hover:bg-amber-400"
              disabled={isLocked || pending}
            >
              {pending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Save details
            </Button>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
              3. Caption
            </h2>
            <CaptionEditor
              options={captionOptions}
              selectedIndex={selectedIndex}
              finalCaption={finalCaption}
              onSelectOption={handleSelectOption}
              onCaptionChange={setFinalCaption}
              onGenerate={handleGenerate}
              generating={generating}
              disabled={isLocked || !postId}
            />
          </section>

          <section className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-border/80"
              onClick={handleSaveDraft}
              disabled={!postId || isLocked || pending}
            >
              <Save className="mr-2 h-4 w-4" />
              Save draft
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-emerald-500/30 text-emerald-200"
              onClick={handleApprove}
              disabled={!postId || isLocked || pending}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Approve (Ready)
            </Button>
            <Button
              type="button"
              className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:from-amber-400 hover:to-amber-500"
              onClick={handlePublish}
              disabled={!postId || !canPublish || pending}
            >
              {pending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Publish
            </Button>
          </section>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Live preview
          </h2>
          <PostPreviewCard
            caption={finalCaption}
            imageUrls={imageUrls}
            platform={platforms}
            accountName={dealership}
          />
        </div>
      </div>
    </div>
  );
}
