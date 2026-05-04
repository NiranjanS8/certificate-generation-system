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
export function Certificates({ data, session, refresh, onViewCertificate, onNavigate, confirmAction, notify }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingCertificate, setEditingCertificate] = useState(null);
  const [busyCertificateId, setBusyCertificateId] = useState("");
  const certificates = data.certificates;

  const filtered = certificates.filter((cert) => {
    const status = normalizeStatus(cert.status);
    const matchesStatus = filterStatus === "all" || status === filterStatus;
    const haystack = [displayCertificateId(cert), cert.recipientName, cert.courseName, cert.uniqueCode].join(" ").toLowerCase();
    return matchesStatus && haystack.includes(searchQuery.toLowerCase());
  });

  const columns = [
    { key: "id", label: "Certificate ID", width: "12%" },
    { key: "recipient", label: "Recipient", width: "18%" },
    { key: "course", label: "Course", width: "18%" },
    { key: "verification", label: "Verification Code", width: "20%" },
    { key: "status", label: "Status", width: "10%" },
    { key: "issued", label: "Issued", width: "12%" },
    { key: "actions", label: "Actions", width: "10%" },
  ];

  async function download(id, code, format = "pdf") {
    if (String(id).startsWith("CERT-")) return;
    const isImage = format === "png";
    const blob = await api(`/api/certificates/${isImage ? "download-image" : "download"}/${id}`, {}, session);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${code || "certificate"}.${isImage ? "png" : "pdf"}`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleEdit(event) {
    event.preventDefault();
    if (!editingCertificate) return;
    const form = new FormData(event.currentTarget);
    setBusyCertificateId(editingCertificate.id);
    try {
      await api(
        `/api/certificates/${editingCertificate.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            recipientId: form.get("recipientId"),
            signatoryId: form.get("signatoryId"),
            certificateTitle: form.get("certificateTitle"),
          }),
        },
        session,
      );
      setEditingCertificate(null);
      await refresh();
      notify("Certificate updated.");
    } catch (error) {
      notify(readError(error), "error");
    } finally {
      setBusyCertificateId("");
    }
  }

  async function handleRevoke(cert) {
    setOpenMenuId(null);
    const confirmed = await confirmAction({
      title: "Revoke certificate?",
      message: `${displayCertificateId(cert)} will stop verifying publicly and remain in the registry with revoked status.`,
      confirmLabel: "Revoke",
      tone: "danger",
    });
    if (!confirmed) return;
    setBusyCertificateId(cert.id);
    try {
      await api(`/api/certificates/${cert.id}/revoke`, { method: "PATCH" }, session);
      await refresh();
      notify("Certificate revoked.");
    } catch (error) {
      notify(readError(error), "error");
    } finally {
      setBusyCertificateId("");
    }
  }

  function startEdit(cert) {
    setOpenMenuId(null);
    setEditingCertificate(cert);
  }

  const hasActiveCertificateFilters = Boolean(searchQuery.trim()) || filterStatus !== "all";

  function clearCertificateFilters() {
    setSearchQuery("");
    setFilterStatus("all");
  }

  return (
    <div>
      <PageHeader title="Certificate Registry" description="Complete registry of issued and revoked certificates" />
      {editingCertificate && (
        <Panel title={`Edit ${displayCertificateId(editingCertificate)}`}>
          <form key={editingCertificate.id} onSubmit={handleEdit}>
            <FormField label="Recipient" helper="Only eligible recipients without an active certificate can be selected." required>
              <Select name="recipientId" required defaultValue={editingCertificate.recipientId} options={[{ value: "", label: "Select a recipient" }, ...data.recipients.map((recipient) => ({ value: recipient.id, label: `${recipient.fullName} - ${recipient.email}` }))]} />
            </FormField>
            <FormField label="Certificate Title" helper="This becomes the headline of the issued certificate." required><Input name="certificateTitle" defaultValue={editingCertificate.certificateTitle} required /></FormField>
            <FormField label="Signatory" helper="Choose the authorized person whose signature should appear." required>
              <Select name="signatoryId" required defaultValue={editingCertificate.signatoryId} options={[{ value: "", label: "Select a signatory" }, ...data.signatories.map((signatory) => ({ value: signatory.id, label: `${signatory.name} - ${signatory.title}` }))]} />
            </FormField>
            <FormActions onCancel={() => setEditingCertificate(null)} submitLabel={busyCertificateId === editingCertificate.id ? "Saving..." : "Save Changes"} disabled={busyCertificateId === editingCertificate.id} />
          </form>
        </Panel>
      )}
      <div className="mb-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a9a9a]" />
          <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search by ID, recipient, course, or verification code..." className={inputClass("pl-10")} />
        </div>
        <Select
          value={filterStatus}
          onChange={setFilterStatus}
          className="w-44"
          options={[
            { value: "all", label: "All Status" },
            { value: "issued", label: "Issued" },
            { value: "revoked", label: "Revoked" },
          ]}
        />
      </div>
      <Table
        columns={columns}
        data={filtered}
        emptyIcon={FileText}
        emptyTitle={certificates.length === 0 ? "No certificates generated" : "No certificates match these filters"}
        emptyMessage={certificates.length === 0 ? "Generate a certificate for an eligible recipient to populate the registry." : "Adjust the search or status filter to widen the certificate registry results."}
        emptyAction={
          certificates.length === 0 ? (
            <Button variant="secondary" size="sm" onClick={() => onNavigate("generate")}>Generate Certificate</Button>
          ) : hasActiveCertificateFilters ? (
            <Button variant="ghost" size="sm" onClick={clearCertificateFilters}>Clear filters</Button>
          ) : null
        }
        renderRow={(cert) => (
          <tr key={cert.id} className="transition-colors hover:bg-[#1a1a1a]">
            <td className="px-4 py-3 text-sm text-[#FFE8DB]">{displayCertificateId(cert)}</td>
            <td className="px-4 py-3 text-sm text-[#FFE8DB]">{cert.recipientName}</td>
            <td className="px-4 py-3 text-sm text-[#9a9a9a]">{cert.courseName}</td>
            <td className="px-4 py-3 font-mono text-xs text-[#739EC9]">{cert.uniqueCode}</td>
            <td className="px-4 py-3"><StatusBadge status={normalizeStatus(cert.status)} /></td>
            <td className="px-4 py-3 text-sm text-[#9a9a9a]">{formatDate(cert.issuedAt)}</td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                <IconButton title="View certificate" icon={Eye} onClick={() => onViewCertificate(cert.id)} />
                <IconButton title="Download PDF" icon={Download} onClick={() => download(cert.id, cert.uniqueCode)} />
                <IconButton title="Download image" icon={FileImage} onClick={() => download(cert.id, cert.uniqueCode, "png")} />
                <RowActionMenu
                  menuTitle="Certificate actions"
                  open={openMenuId === cert.id}
                  onToggle={() => setOpenMenuId((current) => (current === cert.id ? null : cert.id))}
                  onClose={() => setOpenMenuId(null)}
                  editLabel="Edit certificate"
                  onEdit={() => startEdit(cert)}
                  secondaryActionLabel="View certificate"
                  secondaryActionIcon={Eye}
                  onSecondaryAction={() => {
                    setOpenMenuId(null);
                    onViewCertificate(cert.id);
                  }}
                  deleteLabel="Revoke certificate"
                  onDelete={() => handleRevoke(cert)}
                  disabled={busyCertificateId === cert.id || normalizeStatus(cert.status) === "revoked"}
                />
              </div>
            </td>
          </tr>
        )}
      />
    </div>
  );
}

