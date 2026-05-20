export interface DemoPostLog {
  id: string;
  postId: string;
  platform: string;
  action: string;
  status: "success" | "failure" | "pending";
  message: string | null;
  createdAt: string;
}

const STORAGE_KEY = "dps_post_logs";

function readAll(): DemoPostLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DemoPostLog[]) : [];
  } catch {
    return [];
  }
}

function writeAll(logs: DemoPostLog[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

export function listDemoPostLogs(postId: string): DemoPostLog[] {
  return readAll()
    .filter((l) => l.postId === postId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function addDemoPostLog(entry: Omit<DemoPostLog, "id" | "createdAt">): DemoPostLog {
  const log: DemoPostLog = { ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  writeAll([log, ...readAll()]);
  window.dispatchEvent(new CustomEvent("dps-posts-changed"));
  return log;
}

export function addDemoMockPublishLog(postId: string, ig: boolean, fb: boolean): DemoPostLog {
  const parts: string[] = [];
  if (ig) parts.push("Instagram");
  if (fb) parts.push("Facebook");
  const label = parts.length ? parts.join("/") : "social";
  return addDemoPostLog({
    postId,
    platform: parts.length > 1 ? "both" : parts[0]?.toLowerCase() ?? "social",
    action: "publish",
    status: "success",
    message: `Mock published to ${label}`,
  });
}

export function deleteDemoPostLogs(postId: string) {
  writeAll(readAll().filter((l) => l.postId !== postId));
}
