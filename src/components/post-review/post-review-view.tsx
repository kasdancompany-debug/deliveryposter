"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Copy, Loader2, Pencil, Rocket, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/status-badge";
import { DeletePostDialog } from "@/components/dashboard/delete-post-dialog";
import { PhotoCarousel } from "@/components/post-detail/photo-carousel";
import { deleteDemoPostLogs, listDemoPostLogs } from "@/lib/demo/post-logs-store";
import { deleteDemoPost, duplicateDemoPost, getDemoPost, getCoverUrl, getOrderedPhotoUrls, saveDemoPost } from "@/lib/demo/posts-store";
import { platformsLabel } from "@/lib/demo/mock-captions";
import { mockPublishPost } from "@/lib/demo/mock-publish";
import { demoPhotoToWizard } from "@/lib/demo/photo-urls";
import { computePlateSafetyFromPhotos, plateSafetySummaryLabel } from "@/lib/plate-safety";
import type { DemoDeliveryPost } from "@/lib/demo/types";
import { cn } from "@/lib/utils";

export function PostReviewView({ postId }: { postId: string }) {
  const router = useRouter();
  const [post, setPost] = useState<DemoDeliveryPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [logs, setLogs] = useState(() => listDemoPostLogs(postId));

  const refresh = useCallback(() => {
    setPost(getDemoPost(postId));
    setLogs(listDemoPostLogs(postId));
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    refresh();
    const h = () => refresh();
    window.addEventListener("dps-posts-changed", h);
    return () => window.removeEventListener("dps-posts-changed", h);
  }, [refresh]);

  async function handleMarkReady() {
    if (!post?.finalCaption.trim()) { toast.error("Add a caption first"); return; }
    if (!post.customerConsentConfirmed) { toast.error("Customer consent required"); return; }
    setActing(true);
    setPost(saveDemoPost({ ...post, status: "ready", markedReadyAt: new Date().toISOString() }));
    toast.success("Marked ready");
    setActing(false);
  }

  async function handleMockPublish() {
    if (!post || post.status !== "ready") { toast.error("Mark ready first"); return; }
    setActing(true);
    const result = await mockPublishPost(post);
    setPost(saveDemoPost({ ...post, status: result.status, publishedAt: result.publishedAt }));
    setLogs(listDemoPostLogs(postId));
    result.status === "posted" ? toast.success(result.message) : toast.error(result.message);
    setActing(false);
  }

  function handleDelete() {
    setActing(true);
    deleteDemoPost(postId);
    deleteDemoPostLogs(postId);
    toast.success("Post deleted");
    setDeleteOpen(false);
    router.push("/dashboard");
  }

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-amber-400" /></div>;
  if (!post) return (
    <div className="rounded-2xl border border-dashed p-12 text-center">
      <p className="font-medium">Post not found</p>
      <Link href="/dashboard" className="mt-4 inline-block text-sm text-amber-400">Back to dashboard</Link>
    </div>
  );

  const photos = post.photos.map(demoPhotoToWizard);
  const plateStatus = computePlateSafetyFromPhotos(photos);
  const plateLabel = plateSafetySummaryLabel(plateStatus);
  const vehicle = [post.vehicleYear, post.vehicleMake, post.vehicleModel].filter(Boolean).join(" ");

  return (
    <div className="space-y-6 pb-10">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-amber-300"><ArrowLeft className="h-4 w-4" />Back to dashboard</Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold">{post.customerName || "Untitled"}</h1>
            <StatusBadge status={post.status} />
          </div>
          <p className="mt-1 text-muted-foreground">{vehicle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/posts/${postId}/edit`}><Button variant="outline" size="sm"><Pencil className="mr-2 h-4 w-4" />Edit post</Button></Link>
          <Button variant="outline" size="sm" disabled={acting} onClick={() => { const c = duplicateDemoPost(postId); if (c) { toast.success("Duplicated"); router.push(`/posts/${c.id}/edit`); } }}><Copy className="mr-2 h-4 w-4" />Duplicate</Button>
          <Button variant="outline" size="sm" className="text-destructive" onClick={() => setDeleteOpen(true)}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
          <Button variant="outline" size="sm" className="border-emerald-500/40" disabled={acting || post.status === "ready" || post.status === "posted"} onClick={handleMarkReady}><CheckCircle2 className="mr-2 h-4 w-4" />Mark Ready</Button>
          <Button size="sm" className="bg-amber-500 text-black" disabled={acting || post.status !== "ready"} onClick={handleMockPublish}><Rocket className="mr-2 h-4 w-4" />Mock Publish</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <PhotoCarousel urls={getOrderedPhotoUrls(post)} coverUrl={getCoverUrl(post)} alt={post.customerName} size="large" />
        </div>
        <Card className="border-border/60 bg-card/50 lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Delivery summary</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <Row label="Customer" value={post.customerName} />
            <Row label="Vehicle" value={vehicle} />
            <Row label="Salesperson" value={post.salespersonName} />
            <Separator />
            <Row label="Platforms" value={platformsLabel(post.publishInstagram, post.publishFacebook)} />
            <Row label="Consent" value={post.customerConsentConfirmed ? "Confirmed" : "Not confirmed"} ok={post.customerConsentConfirmed} />
            <Row label="Plate protection" value={plateLabel} ok={plateStatus === "safe"} warn={plateStatus === "attention"} />
            <Separator />
            <Row label="Status" value={<StatusBadge status={post.status} />} />
            <Row label="Created" value={format(new Date(post.createdAt), "MMM d, yyyy · h:mm a")} />
            <Row label="Updated" value={format(new Date(post.updatedAt), "MMM d, yyyy · h:mm a")} />
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 bg-card/50">
        <CardHeader><CardTitle className="text-base">Selected caption</CardTitle></CardHeader>
        <CardContent><p className="whitespace-pre-wrap text-sm">{post.finalCaption || <span className="italic text-muted-foreground">No caption</span>}</p></CardContent>
      </Card>

      {logs.length > 0 && (
        <Card className="border-border/60 bg-card/50">
          <CardHeader><CardTitle className="text-base">Activity log</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {logs.map((l) => (
              <p key={l.id} className="text-sm text-muted-foreground">{format(new Date(l.createdAt), "MMM d · h:mm a")} — {l.message}</p>
            ))}
          </CardContent>
        </Card>
      )}

      <DeletePostDialog open={deleteOpen} deleting={acting} onOpenChange={setDeleteOpen} onConfirm={handleDelete} />
    </div>
  );
}

function Row({ label, value, ok, warn }: { label: string; value: React.ReactNode; ok?: boolean; warn?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium text-right", ok && "text-emerald-400", warn && "text-amber-300")}>{value}</span>
    </div>
  );
}
