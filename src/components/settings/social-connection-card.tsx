"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Camera,
  CheckCircle2,
  Loader2,
  Plug,
  Share2,
  Unplug,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { tokenStatusLabel } from "@/lib/social/meta-token-status";
import type { MetaConnectionView } from "@/lib/social/meta-types";
import { cn } from "@/lib/utils";

function StatusRow({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={cn(
          "flex items-center gap-1.5 text-sm font-medium",
          ok === true && "text-emerald-400",
          ok === false && "text-muted-foreground",
          ok === undefined && "text-foreground"
        )}
      >
        {ok === true && <CheckCircle2 className="h-4 w-4 shrink-0" />}
        {ok === false && <XCircle className="h-4 w-4 shrink-0 opacity-60" />}
        {value}
      </span>
    </div>
  );
}

const EMPTY_CONNECTION: MetaConnectionView = {
  connected: false,
  facebookPageConnected: false,
  instagramBusinessConnected: false,
  pageName: null,
  instagramUsername: null,
  tokenStatus: "missing",
  pageId: null,
  instagramBusinessAccountId: null,
  tokenExpiresAt: null,
};

export function SocialConnectionCard() {
  const searchParams = useSearchParams();
  const [connection, setConnection] =
    useState<MetaConnectionView>(EMPTY_CONNECTION);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  const loadConnection = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/meta/pages");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setConnection(data.connection ?? EMPTY_CONNECTION);
    } catch {
      setConnection(EMPTY_CONNECTION);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConnection();
  }, [loadConnection]);

  useEffect(() => {
    if (searchParams.get("meta_connected") === "1") {
      toast.success("Facebook & Instagram connected");
      loadConnection();
      window.history.replaceState({}, "", "/settings/social");
    }
    const err = searchParams.get("meta_error");
    if (err) {
      toast.error(`Connection failed: ${err.replace(/_/g, " ")}`);
      window.history.replaceState({}, "", "/settings/social");
    }
  }, [searchParams, loadConnection]);

  function handleConnect() {
    window.location.href = "/api/meta/connect";
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/meta/disconnect", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Disconnect failed");
      setConnection(EMPTY_CONNECTION);
      toast.success("Disconnected from Meta");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not disconnect");
    } finally {
      setDisconnecting(false);
    }
  }

  const tokenLabel = tokenStatusLabel(connection.tokenStatus);

  return (
    <Card className="border-border/60 bg-card/50">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-pink-500/10 ring-1 ring-blue-400/30">
            <div className="flex gap-0.5">
              <Share2 className="h-4 w-4 text-blue-400" />
              <Camera className="h-4 w-4 text-pink-400" />
            </div>
          </div>
          <div>
            <CardTitle>Connect Facebook &amp; Instagram</CardTitle>
            <CardDescription className="mt-1">
              Link your dealership Facebook Page and Instagram Business account
              for delivery post publishing.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-border/50 bg-muted/20 px-4">
              <StatusRow
                label="Facebook Page connected"
                value={connection.facebookPageConnected ? "Yes" : "No"}
                ok={connection.facebookPageConnected}
              />
              <Separator className="opacity-50" />
              <StatusRow
                label="Instagram Business account connected"
                value={connection.instagramBusinessConnected ? "Yes" : "No"}
                ok={connection.instagramBusinessConnected}
              />
              <Separator className="opacity-50" />
              <StatusRow
                label="Page name"
                value={connection.pageName ?? "—"}
              />
              <Separator className="opacity-50" />
              <StatusRow
                label="Instagram username"
                value={
                  connection.instagramUsername
                    ? `@${connection.instagramUsername}`
                    : "—"
                }
              />
              <Separator className="opacity-50" />
              <StatusRow
                label="Token status"
                value={tokenLabel}
                ok={
                  connection.tokenStatus === "valid" ||
                  connection.tokenStatus === "expiring_soon"
                }
              />
            </div>

            <div className="flex flex-wrap gap-3">
              {!connection.connected ? (
                <Button
                  type="button"
                  size="lg"
                  className="bg-amber-500 text-black hover:bg-amber-400"
                  onClick={handleConnect}
                >
                  <Plug className="mr-2 h-4 w-4" />
                  Connect Facebook &amp; Instagram
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="border-destructive/40 text-destructive hover:bg-destructive/10"
                  disabled={disconnecting}
                  onClick={handleDisconnect}
                >
                  {disconnecting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Unplug className="mr-2 h-4 w-4" />
                  )}
                  Disconnect
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
