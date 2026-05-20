"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Loader2,
  Pencil,
  Rocket,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/status-badge";
import { DeletePostDialog } from "@/components/dashboard/delete-post-dialog";
import { PhotoCarousel } from "@/components/post-detail/photo-carousel";
import {
  deleteDeliveryPost,
  duplicateDeliveryPost,
  saveWizardPost,
} from "@/app/actions/wizard";
import { publishDeliveryPost } from "@/lib/publish-delivery-post";
import { platformsLabelFromChoice } from "@/lib/delivery-post/types";
import {
  getCoverUrl,
  getOrderedPhotoUrls,
} from "@/lib/delivery-post/photo-urls";
import { computePlateSafetyFromPhotos, plateSafetySummaryLabel } from "@/lib/plate-safety";
import type { DeliveryPostWizardState } from "@/lib/delivery-post/types";
import { cn } from "@/lib/utils";

interface PostLogView {
  id: string;
  platform: string;
  status: string;
  message: string;
  createdAt: string;
}

interface PostReviewViewProps {
  initialPost: DeliveryPostWizardState;
  initialLogs: PostLogView[];
}

export function PostReviewView({ initialPost, initialLogs }: PostReviewViewProps) {
  const router = useRouter();
  const [post, setPost] = useState(initialPost);
  const [logs, setLogs] = useState(initialLogs);
  const [acting, setActing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function handleMarkReady() {
    if (!post.finalCaption.trim()) {
      toast.error("Add a caption first");
      return;
    }
    if (!post.customerConsentConfirmed) {
      toast.error("Customer consent required");
      return;
    }
    setActing(true);
    const result = await saveWizardPost(post.id, { status: "ready" });
    setActing(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setPost(result);
    toast.success("Marked ready");
  }

  async function handlePublish() {
    if (post.status !== "ready") {
      toast.error("Mark ready first");
      return;
    }
    setActing(true);
    const result = await publishDeliveryPost(post.id);
    setActing(false);
    if (result.status === "posted") {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.message);
    }
  }

  async function handleDelete() {
    setActing(true);
    const result = await deleteDeliveryPost(post.id);
    setActing(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Post deleted");
    setDeleteOpen(false);
    router.push("/dashboard");
  }

  const plateStatus = computePlateSafetyFromPhotos(post.photos);
  const plateLabel = plateSafetySummaryLabel(plateStatus);
  const vehicle = [post.vehicleYear, post.vehicleMake, post.vehicleModel]
    .filter(Boolean)
    .join(" ");
  const imageUrls = getOrderedPhotoUrls(post.photos, post.coverPhotoId);
  const coverUrl = getCoverUrl(post.photos, post.coverPhotoId);

  return (
    <div className="space-y-6 pb-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-amber-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold">
              {post.customerName || "Untitled"}
            </h1>
            <StatusBadge status={post.status} />
          </div>
          <p className="mt-1 text-muted-foreground">{vehicle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/posts/${post.id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="mr-2 h-4 w-4" />
              Edit post
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            disabled={acting}
            onClick={async () => {
              const c = await duplicateDeliveryPost(post.id);
              if ("error" in c) toast.error(c.error);
              else {
                toast.success("Duplicated");
                router.push(`/posts/${c.id}/edit`);
              }
            }}
          >
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-emerald-500/40"
            disabled={
              acting || post.status === "ready" || post.status === "posted"
            }
            onClick={handleMarkReady}
          >
            {acting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            Mark Ready
          </Button>
          <Button
            size="sm"
            className="bg-amber-500 text-black"
            disabled={acting || post.status !== "ready"}
            onClick={handlePublish}
          >
            {acting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Rocket className="mr-2 h-4 w-4" />
            )}
            Publish
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <PhotoCarousel
            urls={imageUrls}
            coverUrl={coverUrl}
            alt={post.customerName}
            size="large"
          />
        </div>
        <Card className="border-border/60 bg-card/50 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Delivery summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <Row label="Customer" value={post.customerName} />
            <Row label="Vehicle" value={vehicle} />
            <Row label="Salesperson" value={post.salespersonName} />
            <Separator />
            <Row
              label="Platforms"
              value={platformsLabelFromChoice(post.platforms)}
            />
            <Row
              label="Consent"
              value={post.customerConsentConfirmed ? "Confirmed" : "Not confirmed"}
              ok={post.customerConsentConfirmed}
            />
            <Row
              label="Plate protection"
              value={plateLabel}
              ok={plateStatus === "safe"}
              warn={plateStatus === "attention"}
            />
            <Separator />
            <Row label="Status" value={<StatusBadge status={post.status} />} />
            <Row
              label="Created"
              value={format(new Date(post.createdAt), "MMM d, yyyy · h:mm a")}
            />
            <Row
              label="Updated"
              value={format(new Date(post.updatedAt), "MMM d, yyyy · h:mm a")}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 bg-card/50">
        <CardHeader>
          <CardTitle className="text-base">Selected caption</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm">
            {post.finalCaption || (
              <span className="italic text-muted-foreground">No caption</span>
            )}
          </p>
        </CardContent>
      </Card>

      {logs.length > 0 && (
        <Card className="border-border/60 bg-card/50">
          <CardHeader>
            <CardTitle className="text-base">Activity log</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {logs.map((l) => (
              <p key={l.id} className="text-sm text-muted-foreground">
                {format(new Date(l.createdAt), "MMM d · h:mm a")} — {l.message}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      <DeletePostDialog
        open={deleteOpen}
        deleting={acting}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function Row({
  label,
  value,
  ok,
  warn,
}: {
  label: string;
  value: React.ReactNode;
  ok?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-right font-medium",
          ok && "text-emerald-400",
          warn && "text-amber-300"
        )}
      >
        {value}
      </span>
    </div>
  );
}
