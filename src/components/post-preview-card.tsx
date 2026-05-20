"use client";

import { Heart, MessageCircle, Send, Share2, Camera } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PlatformChoice } from "@/types/database";

interface PostPreviewCardProps {
  caption: string;
  imageUrl?: string;
  imageUrls?: string[];
  platform: PlatformChoice;
  accountName?: string;
  className?: string;
}

export function PostPreviewCard({
  caption,
  imageUrl,
  imageUrls = [],
  platform,
  accountName = "Your Dealership",
  className,
}: PostPreviewCardProps) {
  const photos = imageUrls.length > 0 ? imageUrls : imageUrl ? [imageUrl] : [];
  const primary = photos[0];
  const showInstagram =
    platform === "instagram" || platform === "both";
  const showFacebook = platform === "facebook" || platform === "both";

  return (
    <div className={cn("space-y-4", className)}>
      {showInstagram && (
        <PreviewFrame
          label="Instagram"
          icon={<Camera className="h-4 w-4 text-pink-400" />}
        >
          <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3">
            <Avatar className="h-9 w-9 ring-2 ring-amber-500/30">
              <AvatarFallback className="bg-amber-500/20 text-xs text-amber-200">
                {accountName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">{accountName}</p>
              <p className="text-xs text-muted-foreground">Delivery celebration</p>
            </div>
          </div>
          {primary && (
            <div className="relative aspect-square w-full bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={primary}
                alt="Delivery preview"
                className="h-full w-full object-cover"
              />
              {photos.length > 1 && (
                <div className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
                  1/{photos.length}
                </div>
              )}
            </div>
          )}
          <div className="flex gap-4 px-4 py-3">
            <Heart className="h-5 w-5" />
            <MessageCircle className="h-5 w-5" />
            <Send className="h-5 w-5" />
          </div>
          <p className="whitespace-pre-wrap px-4 pb-4 text-sm leading-relaxed text-foreground/90">
            <span className="font-semibold mr-2">{accountName}</span>
            {caption || "Your caption will appear here…"}
          </p>
        </PreviewFrame>
      )}

      {showFacebook && (
        <PreviewFrame
          label="Facebook"
          icon={<Share2 className="h-4 w-4 text-blue-400" />}
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-blue-500/20 text-blue-200">
                {accountName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">{accountName}</p>
              <p className="text-xs text-muted-foreground">Just now · 🌐</p>
            </div>
          </div>
          <p className="whitespace-pre-wrap px-4 pb-3 text-sm leading-relaxed">
            {caption || "Your caption will appear here…"}
          </p>
          {primary && (
            <div className="relative aspect-[4/3] w-full bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={primary}
                alt="Delivery preview"
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div className="flex justify-around border-t border-border/50 px-4 py-2 text-xs text-muted-foreground">
            <span>Like</span>
            <span>Comment</span>
            <span>Share</span>
          </div>
        </PreviewFrame>
      )}
    </div>
  );
}

function PreviewFrame({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden border-border/60 bg-card/80 shadow-xl shadow-black/20">
      <div className="flex items-center gap-2 border-b border-border/50 bg-muted/30 px-4 py-2">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label} preview
        </span>
      </div>
      {children}
    </Card>
  );
}
