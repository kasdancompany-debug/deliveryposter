"use client";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function DeletePostDialog({ open, deleting, onOpenChange, onConfirm }: { open: boolean; deleting?: boolean; onOpenChange: (o: boolean) => void; onConfirm: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!deleting}>
        <DialogHeader>
          <DialogTitle>Delete this delivery post?</DialogTitle>
          <DialogDescription>This cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter className="border-0 bg-transparent p-0 pt-2">
          <Button variant="outline" disabled={deleting} onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" disabled={deleting} onClick={onConfirm}>{deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
