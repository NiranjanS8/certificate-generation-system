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
export function Generate({ data, session, refresh, onViewCertificate, notify }) {
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [generatedCertificate, setGeneratedCertificate] = useState(null);
  const certificateRecipientIds = useMemo(
    () => new Set(data.certificates.map((certificate) => String(certificate.recipientId)).filter(Boolean)),
    [data.certificates],
  );
  const availableRecipients = useMemo(
    () => data.recipients.filter((recipient) => !certificateRecipientIds.has(String(recipient.id))),
    [data.recipients, certificateRecipientIds],
  );
  const hasAvailableRecipients = availableRecipients.length > 0;

  async function handleSubmit(event) {
    event.preventDefault();
    if (!hasAvailableRecipients) {
      setMessage("All recipients already have certificates.");
      return;
    }
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setGenerating(true);
    setMessage("");
    setGeneratedCertificate(null);
    try {
      const certificate = await api(
        "/api/certificates/generate",
        {
          method: "POST",
          body: JSON.stringify({
            recipientId: form.get("recipientId"),
            signatoryId: form.get("signatoryId"),
            certificateTitle: form.get("certificateTitle"),
          }),
        },
        session,
      );
      formElement.reset();
      await refresh();
      setGeneratedCertificate(certificate);
      notify({
        title: "Certificate generated.",
        description: `${certificate.recipientName || "The certificate"} is ready.`,
        actions: [
          {
            label: "View certificate",
            onClick: () => onViewCertificate(certificate.id),
          },
        ],
      });
    } catch (error) {
      setMessage(readError(error));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <PageHeader title="Generate Certificate" description="Create a new certificate for a recipient" />
      <div>
        <div className="mb-6 rounded border border-[#2a2a2a] bg-[#0a0a0a] p-6">
          <form onSubmit={handleSubmit}>
            <FormField label="Recipient" required>
              <Select
                name="recipientId"
                required
                searchable
                searchPlaceholder="Search recipients..."
                disabled={!hasAvailableRecipients}
                options={[{ value: "", label: hasAvailableRecipients ? "Select a recipient" : "No recipients available" }, ...availableRecipients.map((recipient) => ({ value: recipient.id, label: `${recipient.fullName} - ${recipient.courseName || recipient.email}` }))]}
              />
            </FormField>
            <FormField label="Certificate Title" helper="This becomes the headline of the issued certificate." required><Input name="certificateTitle" placeholder="Certificate of Completion" required /></FormField>
            <FormField label="Signatory" helper="Choose the authorized person whose signature should appear." required>
              <Select name="signatoryId" required options={[{ value: "", label: "Select a signatory" }, ...data.signatories.map((signatory) => ({ value: signatory.id, label: `${signatory.name} - ${signatory.title}` }))]} />
            </FormField>
            {(message || generatedCertificate) && (
              <div className={`mb-4 rounded border p-3 text-xs ${generatedCertificate && !message ? "border-[#5682B1]/30 bg-[#5682B1]/10 text-[#739EC9]" : "border-[#dc2626]/30 bg-[#dc2626]/10 text-[#dc2626]"}`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p>{message || "Certificate is ready."}</p>
                  {generatedCertificate?.id && (
                    <Button type="button" variant="secondary" size="sm" onClick={() => onViewCertificate(generatedCertificate.id)}>
                      <Eye className="h-4 w-4" />
                      View Certificate
                    </Button>
                  )}
                </div>
              </div>
            )}
            <div className="mt-6">
              <Button type="submit" variant="primary" disabled={generating || !hasAvailableRecipients}>
                {generating ? "Generating Certificate..." : "Generate Certificate"}
              </Button>
            </div>
          </form>
        </div>
        <div className="rounded border border-[#5682B1]/30 bg-[#5682B1]/10 p-4">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#5682B1]" />
            <div>
              <p className="mb-1 text-sm text-[#FFE8DB]">Certificate Generation Requirements</p>
              <ul className="space-y-1 text-xs text-[#9a9a9a]">
                <li>Recipient must have completed their assigned course</li>
                <li>Score must meet or exceed the course eligibility threshold</li>
                <li>All required fields must be completed</li>
                <li>A unique verification code will be automatically generated</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

