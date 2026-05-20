"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { WizardProgress } from "./wizard-progress";
import { PhotoUploadStep } from "./photo-upload-step";
import { PhotoPolishStep } from "./photo-polish-step";
import { DeliveryDetailsStep } from "./delivery-details-step";
import { CaptionStudioStep } from "./caption-studio-step";
import { PreviewApprovalStep } from "./preview-approval-step";
import {
  createEmptyDemoPost,
  getDemoPost,
  getOrderedPhotoUrls,
  saveDemoPost,
} from "@/lib/demo/posts-store";
import {
  fetchAllCaptions,
  fetchRegeneratedCaption,
} from "@/lib/captions-client";
import {
  CAPTION_STYLES,
  CAPTION_STYLE_LABELS,
} from "@/lib/captions";
import type { GeneratedCaption } from "@/lib/captions";
import { publishDeliveryPost } from "@/lib/publish-delivery-post";
import type {
  DeliveryDetailsValues,
  DemoDeliveryPost,
  WizardPhoto,
} from "@/lib/demo/types";
import { resolvePlatforms } from "@/lib/demo/types";
import { demoPhotoToWizard, wizardPhotoToDemo } from "@/lib/demo/photo-urls";
import { computePlateSafetyFromPhotos } from "@/lib/plate-safety";
import { MIN_PHOTOS } from "@/lib/validators/delivery-wizard";
import type { PostStatus } from "@/types/database";

const DETAILS_FORM_ID = "wizard-details-form";

function captionTextsFromGenerated(captions: GeneratedCaption[]): string[] {
  return captions.map((c) => c.text);
}

function demoToWizardPhotos(post: DemoDeliveryPost): {
  photos: WizardPhoto[];
  coverPhotoId: string;
} {
  return {
    photos: post.photos.map((p) => demoPhotoToWizard(p)),
    coverPhotoId: post.coverPhotoId,
  };
}

function buildDemoPost(
  existing: DemoDeliveryPost,
  photos: WizardPhoto[],
  coverPhotoId: string,
  details: DeliveryDetailsValues,
  captionOptions: string[],
  selectedCaptionIndex: number | null,
  finalCaption: string,
  status: PostStatus
): DemoDeliveryPost {
  return {
    ...existing,
    customerName: details.customerName,
    salespersonName: details.salespersonName,
    vehicleYear: details.vehicleYear,
    vehicleMake: details.vehicleMake,
    vehicleModel: details.vehicleModel,
    trim: details.trim,
    colour: details.colour,
    stockNumber: details.stockNumber,
    vinLast6: details.vinLast6,
    story: details.story,
    customerConsentConfirmed: details.customerConsentConfirmed,
    publishInstagram: details.publishInstagram,
    publishFacebook: details.publishFacebook,
    platforms: resolvePlatforms(
      details.publishInstagram,
      details.publishFacebook
    ),
    photos: photos.map((p, i) => wizardPhotoToDemo(p, i)),
    coverPhotoId,
    captionOptions,
    selectedCaptionIndex,
    finalCaption,
    status,
    captionGeneratedAt:
      captionOptions.length > 0
        ? existing.captionGeneratedAt ?? new Date().toISOString()
        : existing.captionGeneratedAt,
    markedReadyAt:
      status === "ready"
        ? existing.markedReadyAt ?? new Date().toISOString()
        : existing.markedReadyAt,
    updatedAt: new Date().toISOString(),
  };
}

interface DeliveryWizardProps {
  postId?: string;
}

export function DeliveryWizard({ postId }: DeliveryWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [post, setPost] = useState<DemoDeliveryPost | null>(null);
  const [photos, setPhotos] = useState<WizardPhoto[]>([]);
  const [coverPhotoId, setCoverPhotoId] = useState("");
  const [details, setDetails] = useState<DeliveryDetailsValues | null>(null);
  const [generatedCaptions, setGeneratedCaptions] = useState<GeneratedCaption[]>(
    []
  );
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [finalCaption, setFinalCaption] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (postId) {
      const existing = getDemoPost(postId);
      if (!existing) {
        toast.error("Post not found");
        router.push("/dashboard");
        return;
      }
      setPost(existing);
      const { photos: p, coverPhotoId: c } = demoToWizardPhotos(existing);
      setPhotos(p);
      setCoverPhotoId(c);
      setDetails({
        customerName: existing.customerName,
        salespersonName: existing.salespersonName,
        vehicleYear: existing.vehicleYear,
        vehicleMake: existing.vehicleMake,
        vehicleModel: existing.vehicleModel,
        trim: existing.trim,
        colour: existing.colour,
        stockNumber: existing.stockNumber,
        vinLast6: existing.vinLast6,
        story: existing.story,
        customerConsentConfirmed: existing.customerConsentConfirmed,
        publishInstagram: existing.publishInstagram,
        publishFacebook: existing.publishFacebook,
      });
      if (existing.captionOptions.length > 0) {
        setGeneratedCaptions(
          existing.captionOptions.map((text, i) => {
            const style = CAPTION_STYLES[i] ?? "warm";
            return {
              style,
              label: CAPTION_STYLE_LABELS[style],
              text,
            };
          })
        );
      }
      setSelectedIndex(existing.selectedCaptionIndex);
      setFinalCaption(existing.finalCaption);
    } else {
      setPost(createEmptyDemoPost());
    }
    setLoaded(true);
  }, [postId, router]);

  const handlePhotosChange = useCallback(
    (next: WizardPhoto[], cover: string) => {
      setPhotos(next);
      setCoverPhotoId(cover);
    },
    []
  );

  const persist = useCallback(
    (status: PostStatus, redirect?: "dashboard" | "detail") => {
      if (!post || !details) return null;

      const updated = buildDemoPost(
        post,
        photos,
        coverPhotoId,
        details,
        captionTextsFromGenerated(generatedCaptions),
        selectedIndex,
        finalCaption,
        status
      );

      const saved = saveDemoPost(updated);
      setPost(saved);

      if (redirect === "dashboard") {
        router.push("/dashboard");
        router.refresh();
      } else if (redirect === "detail") {
        router.push(`/posts/${saved.id}`);
        router.refresh();
      }

      return saved;
    },
    [
      post,
      details,
      photos,
      coverPhotoId,
      generatedCaptions,
      selectedIndex,
      finalCaption,
      postId,
      router,
    ]
  );

  function validateStep1(): boolean {
    if (photos.length < MIN_PHOTOS) {
      toast.error(`Add at least ${MIN_PHOTOS} photo`);
      return false;
    }
    if (!coverPhotoId && photos[0]) {
      setCoverPhotoId(photos[0].id);
    }
    return true;
  }

  function savePhotosProgress() {
    if (!post) return;
    const partial: DemoDeliveryPost = {
      ...post,
      photos: photos.map((p, i) => wizardPhotoToDemo(p, i)),
      coverPhotoId: coverPhotoId || photos[0]?.id || "",
    };
    const saved = saveDemoPost(partial);
    setPost(saved);
    if (!postId) router.replace(`/posts/${saved.id}`);
  }

  function goNext() {
    if (step === 1) {
      if (!validateStep1()) return;
      savePhotosProgress();
      setStep(2);
      return;
    }
    if (step === 2) {
      savePhotosProgress();
      setStep(3);
      return;
    }
    if (step === 3) {
      const form = document.getElementById(
        DETAILS_FORM_ID
      ) as HTMLFormElement | null;
      form?.requestSubmit();
      return;
    }
    if (step === 4) {
      if (!finalCaption.trim()) {
        toast.error("Add or select a caption before continuing");
        return;
      }
    }
    setStep((s) => Math.min(5, s + 1));
  }

  function goBack() {
    setStep((s) => Math.max(1, s - 1));
  }

  async function handleGenerateCaptions() {
    if (!details) {
      toast.error("Complete delivery details first");
      setStep(3);
      return;
    }
    setGenerating(true);
    try {
      const generated = await fetchAllCaptions({
        customerName: details.customerName,
        salespersonName: details.salespersonName,
        vehicleYear: details.vehicleYear,
        vehicleMake: details.vehicleMake,
        vehicleModel: details.vehicleModel,
        trim: details.trim || undefined,
        colour: details.colour || undefined,
        story: details.story || undefined,
      });
      setGeneratedCaptions(generated);
      const texts = captionTextsFromGenerated(generated);
      if (post) {
        const saved = saveDemoPost({
          ...buildDemoPost(
            post,
            photos,
            coverPhotoId,
            details,
            texts,
            selectedIndex,
            finalCaption,
            post.status
          ),
          captionOptions: texts,
          captionGeneratedAt: new Date().toISOString(),
        });
        setPost(saved);
      }
      toast.success("4 caption options ready");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Caption generation failed"
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveDraft() {
    if (!details) return;
    setSaving(true);
    persist("draft", postId ? "detail" : "dashboard");
    toast.success("Saved as draft");
    setSaving(false);
  }

  async function handleMarkReady() {
    if (!details) return;
    if (!finalCaption.trim()) {
      toast.error("Caption is required");
      setStep(4);
      return;
    }
    if (!details.customerConsentConfirmed) {
      toast.error("Customer consent is required");
      setStep(3);
      return;
    }
    setSaving(true);
    persist("ready", postId ? "detail" : "dashboard");
    toast.success("Marked ready for publishing");
    setSaving(false);
  }

  async function handleRegenerateCaption(index: number) {
    if (!details) return;
    const style = generatedCaptions[index]?.style ?? CAPTION_STYLES[index];
    const input = {
      customerName: details.customerName,
      salespersonName: details.salespersonName,
      vehicleYear: details.vehicleYear,
      vehicleMake: details.vehicleMake,
      vehicleModel: details.vehicleModel,
      trim: details.trim || undefined,
      colour: details.colour || undefined,
      story: details.story || undefined,
      tone: style,
    };
    const refreshed = await fetchRegeneratedCaption(input, style);
    if (selectedIndex === index) {
      setFinalCaption(refreshed.text);
    }
    setGeneratedCaptions((prev) => {
      const next = [...prev];
      next[index] = refreshed;
      if (post && details) {
        const texts = captionTextsFromGenerated(next);
        saveDemoPost({
          ...buildDemoPost(
            post,
            photos,
            coverPhotoId,
            details,
            texts,
            selectedIndex,
            selectedIndex === index ? refreshed.text : finalCaption,
            post.status
          ),
          captionOptions: texts,
        });
      }
      return next;
    });
  }

  async function handleApprovePublish() {
    if (!post || !details) return;
    setSaving(true);
    const ready = buildDemoPost(
      post,
      photos,
      coverPhotoId,
      details,
      captionTextsFromGenerated(generatedCaptions),
      selectedIndex,
      finalCaption,
      "ready"
    );
    saveDemoPost(ready);

    const result = await publishDeliveryPost(ready);
    const final = saveDemoPost({
      ...ready,
      status: result.status,
      publishedAt: result.publishedAt,
    });
    setPost(final);

    if (result.status === "posted") toast.success(result.message);
    else toast.error(result.message);

    setSaving(false);
    router.push("/dashboard");
    router.refresh();
  }

  if (!loaded || !post) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  const detailsDefaults: DeliveryDetailsValues = details ?? {
    customerName: post.customerName,
    salespersonName: post.salespersonName,
    vehicleYear: post.vehicleYear,
    vehicleMake: post.vehicleMake,
    vehicleModel: post.vehicleModel,
    trim: post.trim,
    colour: post.colour,
    stockNumber: post.stockNumber,
    vinLast6: post.vinLast6,
    story: post.story,
    customerConsentConfirmed: post.customerConsentConfirmed,
    publishInstagram: post.publishInstagram,
    publishFacebook: post.publishFacebook,
  };

  const previewPost = details
    ? buildDemoPost(
        post,
        photos,
        coverPhotoId,
        details,
        captionTextsFromGenerated(generatedCaptions),
        selectedIndex,
        finalCaption,
        post.status
      )
    : post;

  const imageUrls = getOrderedPhotoUrls(previewPost);
  const readOnly = post.status === "posted";

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {postId ? "Edit delivery" : "New delivery"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Step {step} of 5
          </p>
          {postId && (
            <Link
              href={`/posts/${postId}`}
              className="mt-2 inline-block text-xs text-amber-400/90 hover:text-amber-300"
            >
              ← Back to post details
            </Link>
          )}
        </div>
        <StatusBadge status={post.status} />
      </div>

      <WizardProgress
        currentStep={step}
        onStepClick={(s) => {
          if (s < step) setStep(s);
          if (s === 2 && step > 1 && validateStep1()) setStep(2);
          if (s === 3 && step > 2) setStep(3);
        }}
      />

      <div className="min-h-[320px]">
        {step === 1 && (
          <PhotoUploadStep
            photos={photos}
            coverPhotoId={coverPhotoId}
            onChange={handlePhotosChange}
            disabled={readOnly}
          />
        )}

        {step === 2 && (
          <PhotoPolishStep
            photos={photos}
            coverPhotoId={coverPhotoId}
            onChange={(next) => {
              setPhotos(next);
              if (post) {
                saveDemoPost({
                  ...post,
                  photos: next.map((p, i) => wizardPhotoToDemo(p, i)),
                  coverPhotoId: coverPhotoId || next[0]?.id || "",
                });
              }
            }}
            disabled={readOnly}
          />
        )}

        {step === 3 && (
          <DeliveryDetailsStep
            formId={DETAILS_FORM_ID}
            defaultValues={detailsDefaults}
            onValid={(data) => {
              setDetails(data);
              if (!post) return;
              const saved = saveDemoPost(
                buildDemoPost(
                  post,
                  photos,
                  coverPhotoId || photos[0]?.id || "",
                  data,
                  captionTextsFromGenerated(generatedCaptions),
                  selectedIndex,
                  finalCaption,
                  post.status === "posted" ? "posted" : "draft"
                )
              );
              setPost(saved);
              setStep(4);
            }}
          />
        )}

        {step === 4 && (
            <CaptionStudioStep
              captions={generatedCaptions}
              selectedIndex={selectedIndex}
              finalCaption={finalCaption}
              generating={generating}
              onGenerateAll={handleGenerateCaptions}
              onSelect={(i) => {
                setSelectedIndex(i);
                setFinalCaption(generatedCaptions[i]?.text ?? "");
              }}
              onRegenerate={handleRegenerateCaption}
              onCaptionChange={setFinalCaption}
            />
        )}

        {step === 5 && details && (
          <PreviewApprovalStep
            caption={finalCaption}
            imageUrls={imageUrls}
            platforms={previewPost.platforms}
            status={post.status}
            plateSafety={computePlateSafetyFromPhotos(photos)}
            saving={saving}
            readOnly={readOnly}
            onSaveDraft={handleSaveDraft}
            onMarkReady={handleMarkReady}
            onApprovePublish={handleApprovePublish}
          />
        )}
      </div>

      {step < 5 && (
        <div className="sticky bottom-0 z-10 -mx-4 mt-8 flex gap-3 border-t border-border/60 bg-background/95 px-4 py-4 backdrop-blur-md sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
          <Button
            type="button"
            variant="outline"
            className="flex-1 sm:flex-none"
            onClick={goBack}
            disabled={step === 1}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {step === 3 ? (
            <Button
              type="submit"
              form={DETAILS_FORM_ID}
              className="flex-1 bg-amber-500 text-black hover:bg-amber-400 sm:flex-none"
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              className="flex-1 bg-amber-500 text-black hover:bg-amber-400 sm:flex-none"
              onClick={goNext}
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {step === 3 && (
        <p className="mt-2 text-center text-xs text-muted-foreground sm:hidden">
          Tap Continue to validate and proceed
        </p>
      )}
    </div>
  );
}
