import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input, Label } from "@/components/ui/input";
import { useInterviewStore } from "@/lib/interviews/store";

export function ConnectSarvam({ children }: { children: ReactNode }) {
  const sarvam = useInterviewStore((s) => s.sarvam);
  const setSarvam = useInterviewStore((s) => s.setSarvam);
  const clearSarvam = useInterviewStore((s) => s.clearSarvam);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(sarvam);

  const onOpen = (next: boolean) => {
    if (next) {
      const s = useInterviewStore.getState().sarvam;
      setForm({
        apiKey: s.apiKey ?? "",
        orgId: s.orgId ?? "",
        workspaceId: s.workspaceId ?? "",
        appId: s.appId ?? "",
      });
    }
    setOpen(next);
  };

  const save = () => {
    if (!form.apiKey.trim() || !form.orgId.trim() || !form.workspaceId.trim() || !form.appId.trim()) {
      toast.error("All four fields are required.");
      return;
    }
    setSarvam({
      apiKey: form.apiKey.trim(),
      orgId: form.orgId.trim(),
      workspaceId: form.workspaceId.trim(),
      appId: form.appId.trim(),
    });
    setOpen(false);
    toast.success("Agent saved on this device.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Your agent</DialogTitle>
          <DialogDescription>
            Paste values from Voice Agents → Deploy with Code. Must be a committed{" "}
            <strong>Voice</strong> agent (not text-only).
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {(
            [
              ["API key", "apiKey", "password"],
              ["Organization ID", "orgId", "text"],
              ["Workspace ID", "workspaceId", "text"],
              ["Agent ID", "appId", "text"],
            ] as const
          ).map(([label, key, type]) => (
            <div key={key} className="flex flex-col gap-1.5">
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                type={type}
                autoComplete="off"
                value={form[key] ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}
          <p className="text-xs leading-relaxed text-subtle">
            Prefer setting <code className="text-[10px]">VITE_SARVAM_*</code> in{" "}
            <code className="text-[10px]">.env</code> for local use. This dialog overrides env
            on this browser only.
          </p>
          <p className="text-xs leading-relaxed text-subtle">
            Error &quot;App not found for the interaction type&quot; usually means wrong IDs, a
            text agent, or an uncommitted draft.
          </p>
          <div className="flex flex-wrap justify-end gap-2 pt-1">
            {sarvam.apiKey ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  clearSarvam();
                  setForm({ apiKey: "", orgId: "", workspaceId: "", appId: "" });
                  toast.message("Disconnected agent.");
                }}
              >
                Disconnect
              </Button>
            ) : null}
            <Button type="button" onClick={save}>
              Save agent
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
