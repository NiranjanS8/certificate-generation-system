import { useEffect } from "react";
import { AlertCircle, CheckCircle, ShieldAlert, X } from "lucide-react";
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
  const Icon = isDanger ? ShieldAlert : CheckCircle;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" role="presentation" onMouseDown={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-title"
        aria-describedby="confirmation-message"
        className="w-full max-w-lg overflow-hidden rounded-xl border border-[#3a3a3a] bg-[#222222]/95 shadow-[0_26px_90px_rgba(0,0,0,0.72)] ring-1 ring-white/5 backdrop-blur"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={`h-1 ${isDanger ? "bg-[#dc2626]" : "bg-[#5682B1]"}`} />
        <div className="p-5 sm:p-6">
          <div className="mb-5 flex items-start gap-4">
            <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border ${isDanger ? "border-[#dc2626]/35 bg-[#dc2626]/12 text-[#ef4444]" : "border-[#5682B1]/35 bg-[#5682B1]/12 text-[#739EC9]"}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1 pr-8">
              <p className={`mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] ${isDanger ? "text-[#ef4444]" : "text-[#739EC9]"}`}>
                {isDanger ? "Destructive action" : "Confirmation required"}
              </p>
              <h2 id="confirmation-title" className="text-xl font-medium leading-7 text-[#FFE8DB]">{title}</h2>
              <p id="confirmation-message" className="mt-2 text-sm leading-6 text-[#b9b1ad]">{message}</p>
            </div>
            <button type="button" onClick={onCancel} className="rounded p-1 text-[#8d8885] transition-colors hover:bg-white/5 hover:text-[#FFE8DB]" aria-label="Dismiss confirmation">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex flex-col-reverse gap-3 border-t border-[#3a3a3a] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[#8f8f8f]">Press Esc to cancel or Enter to confirm.</p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={onCancel}>Cancel</Button>
              <Button variant={isDanger ? "danger" : "primary"} onClick={onConfirm}>{confirmLabel}</Button>
            </div>
          </div>
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
