import { normalizeDemoPhoto } from "./photo-urls";
import type { DemoDeliveryPost } from "./types";

const STORAGE_KEY = "dps_delivery_posts";

function readAll(): DemoDeliveryPost[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DemoDeliveryPost[];
  } catch {
    return [];
  }
}

function writeAll(posts: DemoDeliveryPost[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

export function listDemoPosts(): DemoDeliveryPost[] {
  return readAll()
    .map((p) => normalizePost(p))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function listAllDemoPosts(): DemoDeliveryPost[] {
  return readAll().map((p) => normalizePost(p));
}

function normalizePost(post: DemoDeliveryPost): DemoDeliveryPost {
  return {
    ...post,
    photos: post.photos.map((p) => normalizeDemoPhoto(p)),
    captionGeneratedAt: post.captionGeneratedAt ?? null,
    markedReadyAt: post.markedReadyAt ?? null,
    publishedAt: post.publishedAt ?? null,
  };
}

export function getDemoPost(id: string): DemoDeliveryPost | null {
  const post = readAll().find((p) => p.id === id);
  return post ? normalizePost(post) : null;
}

export function saveDemoPost(post: DemoDeliveryPost): DemoDeliveryPost {
  const posts = readAll();
  const idx = posts.findIndex((p) => p.id === post.id);
  const updated = { ...post, updatedAt: new Date().toISOString() };
  if (idx >= 0) posts[idx] = updated;
  else posts.push(updated);
  writeAll(posts);
  window.dispatchEvent(new CustomEvent("dps-posts-changed"));
  return updated;
}

export function deleteDemoPost(id: string) {
  writeAll(readAll().filter((p) => p.id !== id));
  window.dispatchEvent(new CustomEvent("dps-posts-changed"));
}

export function createEmptyDemoPost(): DemoDeliveryPost {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    customerName: "",
    salespersonName: "",
    vehicleYear: new Date().getFullYear(),
    vehicleMake: "Nissan",
    vehicleModel: "",
    trim: "",
    colour: "",
    stockNumber: "",
    vinLast6: "",
    story: "",
    customerConsentConfirmed: false,
    publishInstagram: true,
    publishFacebook: true,
    platforms: "both",
    photos: [],
    coverPhotoId: "",
    captionOptions: [],
    selectedCaptionIndex: null,
    finalCaption: "",
    status: "draft",
    captionGeneratedAt: null,
    markedReadyAt: null,
    publishedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function duplicateDemoPost(id: string): DemoDeliveryPost | null {
  const source = getDemoPost(id);
  if (!source) return null;
  const now = new Date().toISOString();
  const idMap = new Map<string, string>();
  const photos = source.photos.map((p) => {
    const newId = crypto.randomUUID();
    idMap.set(p.id, newId);
    return { ...p, id: newId };
  });
  const copy: DemoDeliveryPost = {
    ...source,
    id: crypto.randomUUID(),
    status: "draft",
    markedReadyAt: null,
    publishedAt: null,
    photos,
    coverPhotoId: idMap.get(source.coverPhotoId) ?? photos[0]?.id ?? "",
    createdAt: now,
    updatedAt: now,
  };
  return saveDemoPost(copy);
}

export function getCoverUrl(post: DemoDeliveryPost): string | null {
  if (!post.photos.length) return null;
  const cover = post.photos.find((p) => p.id === post.coverPhotoId);
  const sorted = [...post.photos].sort((a, b) => a.sortOrder - b.sortOrder);
  return (cover ?? sorted[0])?.editedUrl ?? null;
}

export function getOrderedPhotoUrls(post: DemoDeliveryPost): string[] {
  const sorted = [...post.photos].sort((a, b) => a.sortOrder - b.sortOrder);
  const coverIdx = sorted.findIndex((p) => p.id === post.coverPhotoId);
  if (coverIdx > 0) {
    const [cover] = sorted.splice(coverIdx, 1);
    sorted.unshift(cover);
  }
  return sorted.map((p) => p.editedUrl);
}
