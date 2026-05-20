import { resolvePlatforms } from "./types";

export { generateDeliveryCaptions, getDealershipName } from "@/lib/captions";

export function platformsLabel(ig: boolean, fb: boolean) {
  const p = resolvePlatforms(ig, fb);
  if (p === "both") return "Instagram & Facebook";
  if (p === "instagram") return "Instagram";
  return "Facebook";
}
