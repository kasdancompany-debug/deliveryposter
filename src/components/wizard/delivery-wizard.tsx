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
  createWizardPost,
  getWizardPost,
  saveWizardPhotos,
  saveWizardPost,
} from "@/app/actions/wizard";
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
  DeliveryPostWizardState,
  WizardPhoto,
} from "@/lib/delivery-post/types";
import { platformsToFlags } from "@/lib/delivery-post/types";
import { getOrderedPhotoUrls } from "@/lib/delivery-post/photo-urls";
import { computePlateSafetyFromPhotos } from "@/lib/plate-safety";
import { MIN_PHOTOS } from "@/lib/validators/delivery-wizard";
import type { PostStatus } from "@/types/database";

const DETAILS_FORM_ID = "wizard-details-form";

function captionTextsFromGenerated(captions: GeneratedCaption[]): string[] {
  return captions.map((c) => c.text);
}

function postToDetails(post: DeliveryPostWizardState): DeliveryDetailsValues {
  return {
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
}

interface DeliveryWizardProps {
  postId?: string;
}

export function DeliveryWizard({ postId }: DeliveryWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [post, setPost] = useState<DeliveryPostWizardState | null>(null);
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
    async function load() {
      if (postId) {
        const existing = await getWizardPost(postId);
        if ("error" in existing) {
          toast.error(existing.error);
          router.push("/dashboard");
          return;
        }
        setPost(existing);
        setPhotos(existing.photos);
        setCoverPhotoId(
          existing.coverPhotoId || (existing.photos[0]?.id ?? "")
        );
        setDetails(postToDetails(existing));
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
      }
      setLoaded(true);
    }
    load();
  }, [postId, router]);

  const handlePhotosChange = useCallback(
    (next: WizardPhoto[], cover: string) => {
      setPhotos(next);
      setCoverPhotoId(cover);
    },
    []
  );

  async function persist(
    status: PostStatus,
    redirect?: "dashboard" | "detail"
  ): Promise<DeliveryPostWizardState | null> {
    if (!post || !details) return null;

    setSaving(true);
    const texts = captionTextsFromGenerated(generatedCaptions);
    const result = await saveWizardPost(post.id, {
      details,
      photos,
      coverPhotoId: coverPhotoId || photos[0]?.id || "",
      captionOptions: texts,
      selectedCaptionIndex: selectedIndex,
      finalCaption,
      status,
    });
    setSaving(false);

    if ("error" in result) {
      toast.error(result.error);
      return null;
    }

    setPost(result);
    setPhotos(result.photos);
    setCoverPhotoId(result.coverPhotoId);

    if (redirect === "dashboard") {
      window.location.href = "/dashboard";
    } else if (redirect === "detail") {
      window.location.href = `/posts/${result.id}`;
    }

    return result;
  }

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

  async function savePhotosProgress() {
    setSaving(true);
    let id = post?.id;

    if (!id) {
      const created = await createWizardPost();
      if ("error" in created) {
        toast.error(created.error);
        setSaving(false);
        return;
      }
      id = created.id;
      const loaded = await getWizardPost(id);
      if ("error" in loaded) {
        toast.error(loaded.error);
        setSaving(false);
        return;
      }
      setPost(loaded);
    }

    const saved = await saveWizardPhotos(
      id!,
      photos,
      coverPhotoId || photos[0]?.id || ""
    );
    setSaving(false);

    if ("error" in saved) {
      toast.error(saved.error);
      return;
    }

    setPost(saved);
    setPhotos(saved.photos);
    setCoverPhotoId(saved.coverPhotoId);
    if (!postId) router.replace(`/posts/${saved.id}/edit`);
  }

  function goNext() {
    if (step === 1) {
      if (!validateStep1()) return;
      void savePhotosProgress().then(() => setStep(2));
      return;
    }
    if (step === 2) {
      void savePhotosProgress().then(() => setStep(3));
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
        const result = await saveWizardPost(post.id, {
          details,
          photos,
          coverPhotoId,
          captionOptions: texts,
          selectedCaptionIndex: selectedIndex,
          finalCaption,
          status: post.status,
        });
        if (!("error" in result)) setPost(result);
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
    if (!details || !post) return;
    const saved = await persist("draft", postId ? "detail" : "dashboard");
    if (saved) toast.success("Saved as draft");
  }

  async function handleMarkReady() {
    if (!details || !post) return;
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
    const saved = await persist("ready", postId ? "detail" : "dashboard");
    if (saved) toast.success("Marked ready for publishing");
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
      return next;
    });
    if (post) {
      const texts = captionTextsFromGenerated(
        generatedCaptions.map((c, i) => (i === index ? refreshed : c))
      );
      await saveWizardPost(post.id, {
        details,
        photos,
        coverPhotoId,
        captionOptions: texts,
        selectedCaptionIndex: selectedIndex,
        finalCaption:
          selectedIndex === index ? refreshed.text : finalCaption,
        status: post.status,
      });
    }
  }

  async function handleApprovePublish() {
    if (!post || !details) return;
    setSaving(true);
    const ready = await saveWizardPost(post.id, {
      details,
      photos,
      coverPhotoId,
      captionOptions: captionTextsFromGenerated(generatedCaptions),
      selectedCaptionIndex: selectedIndex,
      finalCaption,
      status: "ready",
    });

    if ("error" in ready) {
      toast.error(ready.error);
      setSaving(false);
      return;
    }

    const result = await publishDeliveryPost(ready.id);
    if (result.status === "posted") toast.success(result.message);
    else toast.error(result.message);

    setSaving(false);
    window.location.href = "/dashboard";
  }

  if (!loaded) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (!post && postId) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        Post not found.
      </div>
    );
  }

  const detailsDefaults: DeliveryDetailsValues = details ?? {
    customerName: post?.customerName ?? "",
    salespersonName: post?.salespersonName ?? "",
    vehicleYear: post?.vehicleYear ?? new Date().getFullYear(),
    vehicleMake: post?.vehicleMake ?? "",
    vehicleModel: post?.vehicleModel ?? "",
    trim: post?.trim ?? "",
    colour: post?.colour ?? "",
    stockNumber: post?.stockNumber ?? "",
    vinLast6: post?.vinLast6 ?? "",
    story: post?.story ?? "",
    customerConsentConfirmed: post?.customerConsentConfirmed ?? false,
    publishInstagram: post?.publishInstagram ?? true,
    publishFacebook: post?.publishFacebook ?? true,
  };

  const imageUrls = getOrderedPhotoUrls(photos, coverPhotoId);
  const readOnly = post?.status === "posted";
  const platforms = post?.platforms ?? "both";

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
        {post && <StatusBadge status={post.status} />}
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
            }}
            disabled={readOnly}
          />
        )}

        {step === 3 && (
          <DeliveryDetailsStep
            formId={DETAILS_FORM_ID}
            defaultValues={detailsDefaults}
            onValid={async (data) => {
              setDetails(data);
              if (post) {
                const result = await saveWizardPost(post.id, {
                  details: data,
                  photos,
                  coverPhotoId: coverPhotoId || photos[0]?.id || "",
                  captionOptions: captionTextsFromGenerated(generatedCaptions),
                  selectedCaptionIndex: selectedIndex,
                  finalCaption,
                  status: post.status === "posted" ? "posted" : "draft",
                });
                if (!("error" in result)) setPost(result);
              }
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
            platforms={platforms}
            status={post?.status ?? "draft"}
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
            disabled={step === 1 || saving}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {step === 3 ? (
            <Button
              type="submit"
              form={DETAILS_FORM_ID}
              className="flex-1 bg-amber-500 text-black hover:bg-amber-400 sm:flex-none"
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              className="flex-1 bg-amber-500 text-black hover:bg-amber-400 sm:flex-none"
              onClick={goNext}
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
