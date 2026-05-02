import { useEffect } from "react";
import { AlertCircle, CheckCircle, X } from "lucide-react";
import { Button } from "./Button.jsx";

export function ConfirmationDialog({ open, title, message, confirmLabel = "Confirm", tone = "danger", onCancel, onConfirm }) {
  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") onCancel();
      if (event.key === "Enter") onConfirm();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel, onConfirm]);

  if (!open) return null;

  const isDanger = tone === "danger";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="presentation" onMouseDown={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-title"
        className="w-full max-w-md rounded border border-[#2a2a2a] bg-[#0a0a0a] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.65)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start gap-4">
          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded border ${isDanger ? "border-[#dc2626]/30 bg-[#dc2626]/10 text-[#dc2626]" : "border-[#5682B1]/30 bg-[#5682B1]/10 text-[#739EC9]"}`}>
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h2 id="confirmation-title" className="mb-2 text-lg font-medium text-[#FFE8DB]">{title}</h2>
            <p className="text-sm leading-6 text-[#9a9a9a]">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-[#2a2a2a] pt-5">
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button variant={isDanger ? "danger" : "primary"} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}

export function Toast({ toast, onClose }) {
  if (!toast) return null;
  const isError = toast.tone === "error";
  const Icon = isError ? AlertCircle : CheckCircle;
  const title = toast.title || toast.message || (isError ? "Action failed" : "Changes saved");
  const description = toast.description || (isError ? "Please review the issue and try again." : "Details have been successfully updated.");
  const actions = Array.isArray(toast.actions) ? toast.actions : [];

  return (
    <div className="fixed right-4 top-4 z-[250] w-[calc(100vw-2rem)] max-w-md sm:right-6 sm:top-6" role="status" aria-live="polite">
      <div className="toast-pop rounded-xl border border-[#3a3a3a] bg-[#222222]/95 p-4 shadow-[0_20px_70px_rgba(0,0,0,0.7)] ring-1 ring-white/5 backdrop-blur">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${isError ? "text-[#ef4444]" : "text-[#22c55e]"}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1 pr-6">
            <p className="text-base font-medium leading-6 text-[#FFE8DB]">{title}</p>
            <p className="mt-1 text-sm leading-5 text-[#b9b1ad]">{description}</p>
            {actions.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-4">
                {actions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => {
                      action.onClick?.();
                      if (action.closeOnClick !== false) onClose();
                    }}
                    className="text-sm font-medium text-[#d8d0cb] transition-colors hover:text-[#FFE8DB]"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button type="button" onClick={onClose} className="rounded p-1 text-[#8d8885] transition-colors hover:bg-white/5 hover:text-[#FFE8DB]" aria-label="Dismiss notification">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
