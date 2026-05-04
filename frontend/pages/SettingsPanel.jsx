import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Award,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileCheck,
  FileImage,
  FileSignature,
  FileText,
  Github,
  LayoutDashboard,
  Linkedin,
  LogOut,
  Menu,
  MoreVertical,
  PenTool,
  Plus,
  PlusCircle,
  RotateCcw,
  Search,
  Settings,
  Share2,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Upload,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { api } from "../api/client.js";
import { Button } from "../components/Button.jsx";
import { PageHeader, MetricCard, FormField, FormError, Input, Textarea, Select, DateInput, FileUpload, Table, StatusBadge, Panel, FormActions, SearchBox, IconButton, RowActionMenu, SignaturePreview, Detail, DetailLabel, StatBlock, inputClass } from "../components/AppUi.jsx";
import { capitalize, courseName, displayCertificateId, filterRows, formatDate, formatNumber, normalizeStatus, readError } from "../utils/format.js";
export function SettingsPanel({ data, session, refresh, notify, onNavigate }) {
  const [saving, setSaving] = useState(false);
  const [logoName, setLogoName] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [message, setMessage] = useState("");
  const profile = data.profile || {};
  const defaultSignatory = data.signatories.find((signatory) => signatory.isDefault);

  useEffect(() => {
    let objectUrl = "";
    let cancelled = false;

    async function loadLogoPreview() {
      setLogoPreview("");
      if (logoFile) {
        objectUrl = URL.createObjectURL(logoFile);
        if (!cancelled) setLogoPreview(objectUrl);
        return;
      }
      if (!profile.logoUrl) return;

      try {
        const blob = await api("/api/org/logo", {}, session);
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setLogoPreview(objectUrl);
      } catch {
        if (!cancelled) setLogoPreview("");
      }
    }

    loadLogoPreview();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [profile.logoUrl, logoFile, session.token]);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setMessage("");
    try {
      await api(
        "/api/org/profile",
        {
          method: "PUT",
          body: JSON.stringify({
            name: form.get("name"),
            website: form.get("website"),
          }),
        },
        session,
      );
      if (logoFile) {
        const logoForm = new FormData();
        logoForm.append("file", logoFile);
        await api(
          "/api/org/logo",
          {
            method: "POST",
            body: logoForm,
          },
          session,
        );
      }
      setLogoFile(null);
      setLogoName("");
      await refresh();
      notify("Organization profile updated.");
    } catch (error) {
      setMessage(readError(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader title="Organization Settings" description="Manage your organization profile and preferences" />
      <div>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <Panel title="Organization Profile">
              <FormField label="Organization Name" helper="This name is used across certificates, verification, and public views." required><Input name="name" defaultValue={profile.name} required /></FormField>
              <Detail label="Contact Email" value={profile.email || "--"} />
              <div className="mt-4" />
              <FormField label="Website" helper="Add a public URL for recipients and verifiers who need more context."><Input name="website" type="url" defaultValue={profile.website} /></FormField>
              <div className="rounded border border-[#2a2a2a] bg-[#1a1a1a] p-4">
                <p className="mb-2 text-xs uppercase tracking-wider text-[#9a9a9a]">Certificate use</p>
                <p className="text-sm leading-6 text-[#FFE8DB]">
                  Organization name, website, logo, and default signatory appear on generated certificate PDFs and public verification details.
                </p>
              </div>
            </Panel>

            <Panel title="Certificate Logo">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <DetailLabel>{logoFile ? "Selected logo" : "Current logo"}</DetailLabel>
                  <p className="text-sm text-[#FFE8DB]">{logoPreview ? "Ready for certificates" : "No logo uploaded"}</p>
                </div>
                <StatusBadge status={logoPreview ? "active" : "inactive"} />
              </div>
              <div className={`mb-4 flex h-36 items-center justify-center rounded border p-4 ${logoPreview ? "border-[#2a2a2a] bg-[#FFE8DB]" : "border-dashed border-[#2a2a2a] bg-[#1a1a1a]"}`}>
                {logoPreview ? (
                  <img src={logoPreview} alt={`${profile.name || "Organization"} logo`} className="max-h-full max-w-full object-contain" />
                ) : (
                  <div className="text-center">
                    <Award className="mx-auto mb-3 h-8 w-8 text-[#739EC9]" />
                    <p className="text-sm text-[#FFE8DB]">Certificate logo preview</p>
                    <p className="mt-1 text-xs text-[#9a9a9a]">Upload a PNG, JPG, or WebP logo.</p>
                  </div>
                )}
              </div>
              <FileUpload label="Upload Organization Logo" accept="image/png,image/jpeg,image/webp" onFileSelect={(file) => {
                setLogoFile(file || null);
                setLogoName(file?.name || "");
              }} />
              <p className="mt-2 text-xs text-[#9a9a9a]">Used on every generated certificate PDF.</p>
              {logoName && <p className="mt-1 text-xs text-[#739EC9]">{logoName}</p>}
            </Panel>
          </div>

          <FormError message={message} className="mb-4" />
          <div className="mb-6 border-t border-[#2a2a2a] pt-6">
            <Button type="submit" variant="primary" loading={saving}>{saving ? "Saving Changes..." : "Save Changes"}</Button>
          </div>
        </form>

        <Panel title="Certificate Signature">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px] md:items-center">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <StatusBadge status={defaultSignatory ? "active" : "inactive"} />
                <p className="text-sm text-[#FFE8DB]">{defaultSignatory ? "Default signatory configured" : "No default signatory selected"}</p>
              </div>
              {defaultSignatory ? (
                <div className="space-y-3">
                  <Detail label="Signatory" value={defaultSignatory.name} />
                  <Detail label="Title" value={defaultSignatory.title || "--"} />
                </div>
              ) : (
                <p className="text-sm leading-6 text-[#9a9a9a]">
                  Add a signatory, upload their signature image, and mark one as default before generating production certificates.
                </p>
              )}
            </div>
            <div className="rounded border border-[#2a2a2a] bg-[#1a1a1a] p-4">
              <DetailLabel>Signature preview</DetailLabel>
              <div className="mt-3">
                {defaultSignatory ? (
                  <SignaturePreview signatory={defaultSignatory} session={session} />
                ) : (
                  <div className="flex h-10 w-36 items-center justify-center rounded border border-dashed border-[#2a2a2a]">
                    <span className="text-xs text-[#9a9a9a]">Not configured</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="mt-5 border-t border-[#2a2a2a] pt-5">
            <Button type="button" variant="secondary" onClick={() => onNavigate("signatories")}>
              <PenTool className="h-4 w-4" />
              Manage Signatories
            </Button>
          </div>
        </Panel>

        <div className="mt-6 rounded border border-[#2a2a2a] bg-[#0a0a0a] p-6">
          <h3 className="mb-4 text-lg font-medium text-[#FFE8DB]">Organization Statistics</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <StatBlock label="Total Certificates" value={formatNumber(data.certificates.length)} />
            <StatBlock label="Active Recipients" value={formatNumber(data.recipients.length)} />
            <StatBlock label="Total Courses" value={formatNumber(data.courses.length)} />
            <StatBlock label="Account Created" value={formatDate(profile.createdAt)} />
          </div>
        </div>
      </div>
    </div>
  );
}

