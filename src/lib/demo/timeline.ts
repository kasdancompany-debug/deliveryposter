import type { DemoDeliveryPost } from "./types";

export interface TimelineStep {
  id: string;
  label: string;
  description?: string;
  at: string | null;
  state: "complete" | "current" | "upcoming";
}

export function buildPostTimeline(post: DemoDeliveryPost): TimelineStep[] {
  const hasCaption =
    post.captionGeneratedAt != null ||
    post.captionOptions.length > 0 ||
    !!post.finalCaption.trim();

  const captionAt =
    post.captionGeneratedAt ??
    (hasCaption ? post.updatedAt : null);

  const isReady =
    post.status === "ready" ||
    post.status === "posted" ||
    post.status === "failed";
  const readyAt = post.markedReadyAt ?? (isReady ? post.updatedAt : null);

  const isPublished = post.status === "posted";
  const isFailed = post.status === "failed";
  const publishedAt =
    post.publishedAt ?? (isPublished || isFailed ? post.updatedAt : null);

  const steps: Omit<TimelineStep, "state">[] = [
    {
      id: "created",
      label: "Created",
      description: "Delivery post started",
      at: post.createdAt,
    },
    {
      id: "caption",
      label: "Caption generated",
      description: hasCaption
        ? `${post.captionOptions.length || 1} option(s) prepared`
        : "Awaiting caption studio",
      at: captionAt,
    },
    {
      id: "ready",
      label: "Ready for approval",
      description: isReady
        ? "Approved for publishing"
        : "Pending review",
      at: readyAt,
    },
    {
      id: "published",
      label: isFailed ? "Publish attempted" : "Published",
      description: isPublished
        ? "Live on social (mock)"
        : isFailed
          ? "Last attempt failed"
          : "Not yet published",
      at: publishedAt,
    },
  ];

  let currentFound = false;
  return steps.map((step, index) => {
    const complete = !!step.at;
    let state: TimelineStep["state"] = "upcoming";

    if (complete) {
      state = "complete";
    } else if (!currentFound) {
      state = "current";
      currentFound = true;
    }

    if (index === steps.length - 1 && (isPublished || isFailed)) {
      state = isFailed ? "current" : "complete";
    }
    if (index === steps.length - 1 && isPublished) {
      state = "complete";
    }

    return { ...step, state };
  });
}
