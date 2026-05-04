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
export function CertificateDetail({ certificateId, certificates, onBack, session }) {
  const certificate = certificates.find((cert) => cert.id === certificateId);
  const [imageUrl, setImageUrl] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [shareMessage, setShareMessage] = useState("");

  useEffect(() => {
    if (!certificate) return undefined;

    let objectUrl = "";
    let cancelled = false;

    async function loadImage() {
      setImageLoading(true);
      setImageError("");
      setImageUrl("");
      try {
        const blob = await api(`/api/certificates/download-image/${certificate.id}`, {}, session);
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
      } catch (error) {
        if (!cancelled) setImageError(readError(error));
      } finally {
        if (!cancelled) setImageLoading(false);
      }
    }

    loadImage();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [certificate?.id, session.token]);

  async function downloadPdf() {
    if (!certificate) return;
    const blob = await api(`/api/certificates/download/${certificate.id}`, {}, session);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${certificate.uniqueCode || "certificate"}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function downloadImage() {
    if (!certificate) return;
    const blob = await api(`/api/certificates/download-image/${certificate.id}`, {}, session);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${certificate.uniqueCode || "certificate"}.png`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function shareCertificate() {
    if (!certificate?.uniqueCode) {
      setShareMessage("This certificate does not have a verification code to share.");
      return;
    }

    const verifyUrl = `${window.location.origin}${window.location.pathname}?verify=${encodeURIComponent(certificate.uniqueCode)}`;
    const text = `Verify ${certificate.recipientName || "this certificate"}'s certificate for ${certificate.courseName || "the course"} using code ${certificate.uniqueCode}.`;
    const shareData = {
      title: `${certificate.certificateTitle || "Certificate"} - ${certificate.recipientName || displayCertificateId(certificate)}`,
      text,
      url: verifyUrl,
    };

    try {
      if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
        await navigator.share(shareData);
        setShareMessage("Share sheet opened.");
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${verifyUrl}`);
      setShareMessage("Verification link copied to clipboard.");
    } catch (error) {
      if (error?.name === "AbortError") return;
      setShareMessage("Unable to share from this browser.");
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="h-4 w-4" />Back to Registry</Button>
      </div>
      {!certificate ? (
        <Panel title="Certificate not found">
          <p className="text-sm text-[#9a9a9a]">This certificate is not available in the current organization data.</p>
        </Panel>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <div className="rounded border border-[#2a2a2a] bg-[#0a0a0a] p-3">
              <div className="min-h-[520px] overflow-hidden rounded border border-[#2a2a2a] bg-[#1a1a1a]">
                {imageLoading && (
                  <div className="flex min-h-[520px] items-center justify-center text-sm text-[#739EC9]">
                    Loading certificate image...
                  </div>
                )}
                {imageError && (
                  <div className="flex min-h-[520px] items-center justify-center p-6 text-center">
                    <div>
                      <AlertCircle className="mx-auto mb-3 h-8 w-8 text-[#dc2626]" />
                      <p className="mb-2 text-sm text-[#FFE8DB]">Unable to load certificate image</p>
                      <p className="text-xs text-[#9a9a9a]">{imageError}</p>
                    </div>
                  </div>
                )}
                {imageUrl && !imageLoading && !imageError && (
                  <img
                    src={imageUrl}
                    alt={`${displayCertificateId(certificate)} certificate`}
                    className="h-[72vh] min-h-[520px] w-full bg-[#1a1a1a] object-contain"
                  />
                )}
              </div>
            </div>
            <div className="mt-4 rounded border border-[#2a2a2a] bg-[#0a0a0a] p-4">
              <div className="mb-4">
                <DetailLabel>Actions</DetailLabel>
                <p className="mt-1 text-sm text-[#9a9a9a]">Download the certificate as a PDF or PNG, or copy a public verification link.</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <Button variant="primary" fullWidth onClick={downloadPdf}><Download className="h-4 w-4" />PDF</Button>
                <Button variant="secondary" fullWidth onClick={downloadImage}><FileImage className="h-4 w-4" />PNG</Button>
                <Button variant="secondary" fullWidth onClick={shareCertificate}><Share2 className="h-4 w-4" />Share Link</Button>
              </div>
              {shareMessage && <p className="mt-3 text-xs text-[#739EC9]">{shareMessage}</p>}
            </div>
          </div>
          <aside className="space-y-4 xl:sticky xl:top-8 xl:self-start">
            <div className="rounded border border-[#2a2a2a] bg-[#0a0a0a] p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <DetailLabel>Certificate</DetailLabel>
                  <h2 className="mt-1 text-xl font-medium leading-7 text-[#FFE8DB]">{certificate.certificateTitle || "Certificate"}</h2>
                </div>
                <StatusBadge status={normalizeStatus(certificate.status)} />
              </div>

              <div className="mb-5 rounded border border-[#2a2a2a] bg-[#1a1a1a] p-4">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded border border-[#5682B1]/30 bg-[#5682B1]/10 text-[#739EC9]">
                    <Award className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#FFE8DB]">{certificate.recipientName || "Recipient unavailable"}</p>
                    <p className="truncate text-xs text-[#9a9a9a]">{certificate.courseName || "Course unavailable"}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Detail label="Certificate ID" value={displayCertificateId(certificate)} />
                {certificate.uniqueCode && certificate.uniqueCode !== displayCertificateId(certificate) && (
                  <Detail label="Verification Code" value={certificate.uniqueCode} mono />
                )}
                <Detail label="Issued Date" value={formatDate(certificate.issuedAt)} />
                <Detail label="Completion Date" value={formatDate(certificate.completionDate)} />
                <Detail label="Score / Grade" value={`${certificate.score ?? "--"} / ${certificate.grade || "--"}`} />
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

