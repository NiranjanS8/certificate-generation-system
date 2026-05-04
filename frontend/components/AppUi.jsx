import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Award,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  MoreVertical,
  PenTool,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { api } from "../api/client.js";
import { Button } from "./Button.jsx";
import { capitalize } from "../utils/format.js";
export function PageHeader({ title, description, action }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="mb-1 text-2xl font-medium tracking-tight text-[#FFE8DB]">{title}</h1>
        {description && <p className="text-sm text-[#9a9a9a]">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function MetricCard({ label, value, icon, trend }) {
  return (
    <div className="rounded border border-[#2a2a2a] bg-[#0a0a0a] p-4">
      <div className="mb-2 flex items-start justify-between">
        <p className="text-xs uppercase tracking-wider text-[#9a9a9a]">{label}</p>
        {icon && <div className="text-[#5682B1]">{icon}</div>}
      </div>
      <p className="mb-1 text-2xl font-medium text-[#FFE8DB]">{value}</p>
      {trend && <p className="text-xs text-[#739EC9]">{trend}</p>}
    </div>
  );
}

export function FormField({ label, error, helper, required, children }) {
  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="block text-sm font-medium text-[#FFE8DB]">
          {label}
          {required && <span className="ml-1 text-[#dc2626]">*</span>}
        </label>
        {!required && <span className="text-[0.65rem] uppercase tracking-wider text-[#6f6f6f]">Optional</span>}
      </div>
      {children}
      {helper && !error && <p className="mt-2 text-xs leading-5 text-[#8f8f8f]">{helper}</p>}
      {error && <p className="mt-2 text-xs leading-5 text-[#dc2626]">{error}</p>}
    </div>
  );
}

export function FormError({ message, className = "" }) {
  if (!message) return null;
  return (
    <div className={`flex items-start gap-2 rounded border border-[#dc2626]/35 bg-[#dc2626]/10 p-3 text-sm leading-5 text-[#fecaca] ${className}`}>
      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#dc2626]" />
      <span>{message}</span>
    </div>
  );
}

export function Input(props) {
  const { className = "", ...rest } = props;
  return <input {...rest} className={inputClass(className)} />;
}

export function Textarea({ className = "", ...props }) {
  return <textarea {...props} className={`w-full resize-none rounded border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-[#FFE8DB] placeholder:text-[#5a5a5a] focus:border-[#5682B1] focus:outline-none ${className}`} />;
}

export function Select({ options, className = "", value, defaultValue = "", onChange, name, required, disabled, searchable = false, searchPlaceholder = "Search..." }) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(value ?? defaultValue ?? "");
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef(null);
  const searchInputRef = useRef(null);
  const selectedValue = value ?? internalValue;
  const selectedOption = options.find((option) => String(option.value) === String(selectedValue)) || options[0];
  const filteredOptions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!searchable || !query) return options;
    return options.filter((option) => String(option.value) === "" || String(option.label || "").toLowerCase().includes(query));
  }, [options, searchTerm, searchable]);

  useEffect(() => {
    if (value !== undefined) setInternalValue(value);
  }, [value]);

  useEffect(() => {
    if (!open) {
      setSearchTerm("");
      return;
    }
    if (searchable) setTimeout(() => searchInputRef.current?.focus(), 0);
  }, [open, searchable]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function choose(option) {
    if (disabled) return;
    setInternalValue(option.value);
    onChange?.(option.value);
    setOpen(false);
    setSearchTerm("");
  }

  function handleKeyDown(event) {
    if (disabled) return;
    const activeOptions = filteredOptions.length ? filteredOptions : options;
    const currentIndex = Math.max(0, activeOptions.findIndex((option) => String(option.value) === String(selectedValue)));
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen((current) => !current);
    }
    if (event.key === "Escape") setOpen(false);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      const nextIndex = (currentIndex + direction + activeOptions.length) % activeOptions.length;
      choose(activeOptions[nextIndex]);
    }
  }

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      {name && <input type="hidden" name={name} value={selectedValue} required={required} />}
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleKeyDown}
        className={`flex w-full items-center justify-between gap-3 rounded border px-3 py-2 text-left text-sm transition-colors ${
          open ? "border-[#5682B1] bg-[#1a1a1a]" : "border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#5682B1]/60"
        } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
      >
        <span className={selectedOption?.value === "" ? "text-[#5a5a5a]" : "text-[#FFE8DB]"}>
          {selectedOption?.label || "Select"}
        </span>
        <ChevronDown className={`h-4 w-4 text-[#739EC9] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded border border-[#2a2a2a] bg-[#0a0a0a] py-1 shadow-[0_12px_30px_rgba(0,0,0,0.45)]" role="listbox">
          {searchable && (
            <div className="sticky top-0 z-10 border-b border-[#2a2a2a] bg-[#0a0a0a] p-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#739EC9]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") setOpen(false);
                    event.stopPropagation();
                  }}
                  placeholder={searchPlaceholder}
                  className={inputClass("h-9 pl-9")}
                />
              </div>
            </div>
          )}
          {filteredOptions.map((option) => {
            const selected = String(option.value) === String(selectedValue);
            return (
              <button
                type="button"
                key={option.value}
                role="option"
                aria-selected={selected}
                onClick={() => choose(option)}
                className={`flex w-full items-center px-3 py-2 text-left text-sm transition-colors ${
                  selected ? "bg-[#5682B1] text-[#000000]" : "text-[#FFE8DB] hover:bg-[#1a1a1a]"
                }`}
              >
                {option.label}
              </button>
            );
          })}
          {filteredOptions.length === 0 && (
            <div className="px-3 py-4 text-center text-sm text-[#9a9a9a]">No matches found</div>
          )}
        </div>
      )}
    </div>
  );
}

export function DateInput({ name, defaultValue = "", value, onChange, required, disabled, readOnly }) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue || "");
  const wrapperRef = useRef(null);
  const selectedValue = value ?? internalValue;
  const selectedDate = parseDateValue(selectedValue);
  const [viewDate, setViewDate] = useState(selectedDate || new Date());
  const isLocked = disabled || readOnly;
  const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const monthLabel = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(monthStart);
  const firstDay = monthStart.getDay();
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const cells = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => new Date(viewDate.getFullYear(), viewDate.getMonth(), index + 1)),
  ];

  useEffect(() => {
    if (value !== undefined) setInternalValue(value || "");
  }, [value]);

  useEffect(() => {
    if (selectedDate) setViewDate(selectedDate);
  }, [selectedValue]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (wrapperRef.current?.contains(event.target)) return;
      setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function commit(nextDate) {
    const nextValue = formatDateValue(nextDate);
    setInternalValue(nextValue);
    onChange?.(nextValue);
    setOpen(false);
  }

  function moveMonth(direction) {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
  }

  const displayValue = selectedDate
    ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(selectedDate)
    : "Select date";

  return (
    <div className="relative" ref={wrapperRef}>
      {name && <input type="hidden" name={name} value={selectedValue} />}
      <button
        type="button"
        disabled={isLocked}
        onClick={() => setOpen((current) => !current)}
        className={`flex w-full items-center justify-between gap-3 rounded border px-3 py-2 text-left text-sm transition-colors ${
          open ? "border-[#5682B1] bg-[#1a1a1a]" : "border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#5682B1]/60"
        } ${isLocked ? "cursor-not-allowed opacity-50" : ""}`}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className={selectedDate ? "text-[#FFE8DB]" : "text-[#5a5a5a]"}>{displayValue}</span>
        <Calendar className="h-4 w-4 text-[#739EC9]" />
      </button>
      {open && !isLocked && (
        <div className="absolute z-50 mt-2 w-full min-w-[18rem] rounded border border-[#2a2a2a] bg-[#0a0a0a] p-3 shadow-[0_16px_40px_rgba(0,0,0,0.55)]">
          <div className="mb-3 flex items-center justify-between">
            <button type="button" onClick={() => moveMonth(-1)} className="rounded p-2 text-[#9a9a9a] hover:bg-[#1a1a1a] hover:text-[#FFE8DB]" aria-label="Previous month">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-medium text-[#FFE8DB]">{monthLabel}</p>
            <button type="button" onClick={() => moveMonth(1)} className="rounded p-2 text-[#9a9a9a] hover:bg-[#1a1a1a] hover:text-[#FFE8DB]" aria-label="Next month">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="mb-2 grid grid-cols-7 gap-1">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
              <div key={`${day}-${index}`} className="py-1 text-center text-[0.65rem] uppercase tracking-wider text-[#9a9a9a]">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((date, index) => {
              if (!date) return <div key={`blank-${index}`} />;
              const dateValue = formatDateValue(date);
              const selected = dateValue === selectedValue;
              const today = dateValue === formatDateValue(new Date());
              return (
                <button
                  type="button"
                  key={dateValue}
                  onClick={() => commit(date)}
                  className={`flex h-9 items-center justify-center rounded text-sm transition-colors ${
                    selected
                      ? "bg-[#5682B1] text-[#000000]"
                      : today
                        ? "border border-[#5682B1]/50 text-[#FFE8DB] hover:bg-[#1a1a1a]"
                        : "text-[#FFE8DB] hover:bg-[#1a1a1a]"
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-[#2a2a2a] pt-3">
            <button type="button" onClick={() => commit(new Date())} className="text-xs text-[#739EC9] hover:text-[#FFE8DB]">Today</button>
            {!required && (
              <button type="button" onClick={() => {
                setInternalValue("");
                onChange?.("");
                setOpen(false);
              }} className="text-xs text-[#9a9a9a] hover:text-[#FFE8DB]">Clear</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function FileUpload({ label, accept, onFileSelect, preview }) {
  const [dragActive, setDragActive] = useState(false);

  function handleDrag(event) {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(event.type === "dragenter" || event.type === "dragover");
  }

  function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    if (event.dataTransfer.files && event.dataTransfer.files[0]) onFileSelect(event.dataTransfer.files[0]);
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#FFE8DB]">{label}</label>
      <div
        className={`relative rounded border-2 border-dashed p-6 text-center transition-colors ${dragActive ? "border-[#5682B1] bg-[#5682B1]/10" : "border-[#2a2a2a] hover:border-[#5682B1]/50"}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input type="file" accept={accept} onChange={(event) => onFileSelect(event.target.files?.[0] || null)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
        {preview ? <img src={preview} alt="Preview" className="mx-auto mb-2 max-h-32" /> : <Upload className="mx-auto mb-2 h-8 w-8 text-[#9a9a9a]" />}
        <p className="mb-1 text-sm text-[#FFE8DB]">Drop file here or click to browse</p>
        <p className="text-xs text-[#9a9a9a]">{accept.split(",").join(", ")}</p>
      </div>
    </div>
  );
}

export function Table({
  columns,
  data,
  renderRow,
  emptyIcon: EmptyIcon = FileText,
  emptyTitle = "No data available",
  emptyMessage = "There are no records to show yet.",
  emptyAction,
  pageSize = 10,
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const pageStart = (page - 1) * pageSize;
  const visibleRows = data.slice(pageStart, pageStart + pageSize);
  const showingStart = data.length === 0 ? 0 : pageStart + 1;
  const showingEnd = Math.min(pageStart + pageSize, data.length);
  const canPaginate = data.length > pageSize;

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  if (data.length === 0) {
    return (
      <div className="rounded border border-[#2a2a2a] bg-[#0a0a0a]">
        <div className="flex flex-col items-center p-12 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded border border-[#5682B1]/30 bg-[#5682B1]/10 text-[#739EC9]">
            <EmptyIcon className="h-5 w-5" />
          </div>
          <h3 className="mb-2 text-sm font-medium text-[#FFE8DB]">{emptyTitle}</h3>
          <p className="max-w-md text-sm leading-6 text-[#9a9a9a]">{emptyMessage}</p>
          {emptyAction && <div className="mt-5">{emptyAction}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded border border-[#2a2a2a] bg-[#0a0a0a]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead className="border-b border-[#2a2a2a] bg-[#1a1a1a]">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#9a9a9a]" style={{ width: column.width }}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a2a2a]">{visibleRows.map((item, index) => renderRow(item, pageStart + index))}</tbody>
        </table>
      </div>
      {canPaginate && (
        <div className="flex flex-col gap-3 border-t border-[#2a2a2a] px-4 py-3 text-xs text-[#9a9a9a] sm:flex-row sm:items-center sm:justify-between">
          <p>
            Showing <span className="text-[#FFE8DB]">{showingStart}-{showingEnd}</span> of <span className="text-[#FFE8DB]">{data.length}</span>
          </p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="min-w-16 text-center text-[#FFE8DB]">Page {page} / {totalPages}</span>
            <Button variant="secondary" size="sm" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function StatusBadge({ status }) {
  const styles = {
    issued: "bg-[#5682B1] text-[#000000]",
    active: "bg-[#5682B1] text-[#000000]",
    revoked: "bg-[#dc2626] text-[#FFE8DB]",
    inactive: "bg-[#2a2a2a] text-[#9a9a9a]",
    "not issued": "bg-[#2a2a2a] text-[#9a9a9a]",
  };
  return <span className={`inline-flex rounded px-2 py-1 text-xs ${styles[status] || styles.inactive}`}>{capitalize(status)}</span>;
}

export function Panel({ title, children }) {
  return (
    <div className="mb-6 rounded border border-[#2a2a2a] bg-[#0a0a0a] p-6">
      <h3 className="mb-4 text-lg font-medium text-[#FFE8DB]">{title}</h3>
      {children}
    </div>
  );
}

export function FormActions({ onCancel, submitLabel, disabled = false }) {
  return (
    <div className="mt-6 flex gap-3">
      <Button type="submit" variant="primary" disabled={disabled}>{submitLabel}</Button>
      <Button variant="secondary" onClick={onCancel}>Cancel</Button>
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="mb-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a9a9a]" />
        <input type="text" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={inputClass("pl-10")} />
      </div>
    </div>
  );
}

export function IconButton({ title, icon: Icon, onClick }) {
  return (
    <button onClick={onClick} className="text-[#9a9a9a] hover:text-[#5682B1]" title={title} aria-label={title}>
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function RowActionMenu({
  menuTitle = "Recipient actions",
  open,
  onToggle,
  onClose,
  onEdit,
  onGenerate,
  onDelete,
  disabled,
  editLabel = "Edit recipient",
  secondaryActionLabel = "Generate certificate",
  secondaryActionIcon: SecondaryActionIcon = Award,
  onSecondaryAction,
  deleteLabel = "Delete recipient",
}) {
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const secondaryAction = onSecondaryAction || onGenerate;

  useEffect(() => {
    if (!open) return undefined;

    function updatePosition() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const menuWidth = 192;
      const gap = 8;
      setMenuPosition({
        top: rect.bottom + gap,
        left: Math.min(window.innerWidth - menuWidth - 12, Math.max(12, rect.right - menuWidth)),
      });
    }

    function handlePointerDown(event) {
      if (menuRef.current?.contains(event.target) || buttonRef.current?.contains(event.target)) return;
      onClose();
    }

    updatePosition();
    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, onClose]);

  return (
    <div className="flex justify-end">
      <span ref={buttonRef}>
        <IconButton title={menuTitle} icon={MoreVertical} onClick={onToggle} />
      </span>
      {open && (
        <div
          ref={menuRef}
          className="fixed z-[100] w-48 overflow-hidden rounded border border-[#2a2a2a] bg-[#0a0a0a] shadow-[0_16px_32px_rgba(0,0,0,0.45)]"
          style={{ top: menuPosition.top, left: menuPosition.left }}
        >
          <button type="button" disabled={disabled} onClick={onEdit} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#FFE8DB] hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50">
            <PenTool className="h-4 w-4 text-[#739EC9]" />{editLabel}
          </button>
          {secondaryAction && (
            <button type="button" disabled={disabled} onClick={secondaryAction} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#FFE8DB] hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50">
              <SecondaryActionIcon className="h-4 w-4 text-[#739EC9]" />{secondaryActionLabel}
            </button>
          )}
          <button type="button" disabled={disabled} onClick={onDelete} className="flex w-full items-center gap-2 border-t border-[#2a2a2a] px-3 py-2 text-left text-sm text-[#dc2626] hover:bg-[#dc2626]/10 disabled:cursor-not-allowed disabled:opacity-50">
            <Trash2 className="h-4 w-4" />{deleteLabel}
          </button>
        </div>
      )}
    </div>
  );
}

export function SignaturePreview({ signatory, session }) {
  const [imageUrl, setImageUrl] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl = "";
    let cancelled = false;

    async function loadSignature() {
      setFailed(false);
      setImageUrl("");
      try {
        const blob = await api(`/api/signatories/${signatory.id}/signature`, {}, session);
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    loadSignature();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [signatory.id, session.token]);

  if (failed) {
    return (
      <div className="flex h-10 w-36 items-center justify-center rounded border border-[#2a2a2a] bg-[#1a1a1a]">
        <span className="text-xs text-[#9a9a9a]">No signature</span>
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="flex h-10 w-36 items-center justify-center rounded border border-[#2a2a2a] bg-[#1a1a1a]">
        <span className="text-xs text-[#739EC9]">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex h-10 w-36 items-center justify-center overflow-hidden rounded border border-[#2a2a2a] bg-[#FFE8DB] px-2">
      <img src={imageUrl} alt={`${signatory.name} signature`} className="max-h-8 max-w-full object-contain" />
    </div>
  );
}

export function Detail({ label, value, mono, accent }) {
  return (
    <div>
      <DetailLabel>{label}</DetailLabel>
      <p className={`text-sm ${mono ? "font-mono" : ""} ${accent || mono ? "text-[#739EC9]" : "text-[#FFE8DB]"}`}>{value}</p>
    </div>
  );
}

export function DetailLabel({ children }) {
  return <p className="mb-1 text-xs uppercase tracking-wider text-[#9a9a9a]">{children}</p>;
}

export function StatBlock({ label, value }) {
  return (
    <div className="rounded border border-[#2a2a2a] bg-[#1a1a1a] p-4">
      <p className="mb-1 text-xs uppercase tracking-wider text-[#9a9a9a]">{label}</p>
      <p className="text-[#FFE8DB]">{value}</p>
    </div>
  );
}

export function inputClass(extra = "") {
  return `themed-input w-full rounded border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-[#FFE8DB] placeholder:text-[#5a5a5a] focus:border-[#5682B1] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${extra}`;
}

export function parseDateValue(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return null;
  const [year, month, day] = String(value).split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

