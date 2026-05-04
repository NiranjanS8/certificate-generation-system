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
export function Recipients({ data, session, refresh, onViewCertificate, confirmAction, notify }) {
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [certificateFilter, setCertificateFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingRecipient, setEditingRecipient] = useState(null);
  const [generatingFor, setGeneratingFor] = useState(null);
  const [busyRecipientId, setBusyRecipientId] = useState("");
  const generatePanelRef = useRef(null);

  useEffect(() => {
    if (!generatingFor) return undefined;
    const timeout = window.setTimeout(() => {
      generatePanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      generatePanelRef.current?.focus({ preventScroll: true });
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [generatingFor]);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage("");
    try {
      await api(
        "/api/recipients",
        {
          method: "POST",
          body: JSON.stringify({
            fullName: form.get("fullName"),
            email: form.get("email"),
            courseId: form.get("courseId"),
            score: Number(form.get("score") || 0),
            grade: form.get("grade"),
            completionDate: form.get("completionDate"),
          }),
        },
        session,
      );
      setShowForm(false);
      await refresh();
      notify("Recipient added.");
    } catch (error) {
      setMessage(readError(error));
    }
  }

  async function handleEdit(event) {
    event.preventDefault();
    if (!editingRecipient) return;
    const form = new FormData(event.currentTarget);
    setMessage("");
    setBusyRecipientId(editingRecipient.id);
    try {
      await api(
        `/api/recipients/${editingRecipient.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            fullName: form.get("fullName"),
            email: form.get("email"),
            courseId: form.get("courseId"),
            score: Number(form.get("score") || 0),
            grade: form.get("grade"),
            completionDate: form.get("completionDate"),
          }),
        },
        session,
      );
      setEditingRecipient(null);
      await refresh();
      notify("Recipient updated.");
    } catch (error) {
      notify(readError(error), "error");
    } finally {
      setBusyRecipientId("");
    }
  }

  async function handleDelete(recipient) {
    setOpenMenuId(null);
    const confirmed = await confirmAction({
      title: "Delete recipient?",
      message: `${recipient.fullName} will be permanently removed. Existing generated certificates are not revoked, but this recipient record will no longer be available for editing.`,
      confirmLabel: "Delete",
      tone: "danger",
    });
    if (!confirmed) return;
    setMessage("");
    setBusyRecipientId(recipient.id);
    try {
      await api(`/api/recipients/${recipient.id}`, { method: "DELETE" }, session);
      await refresh();
      notify("Recipient deleted.");
    } catch (error) {
      notify(readError(error), "error");
    } finally {
      setBusyRecipientId("");
    }
  }

  async function handleGenerate(event) {
    event.preventDefault();
    if (!generatingFor) return;
    const form = new FormData(event.currentTarget);
    setMessage("");
    setBusyRecipientId(generatingFor.id);
    try {
      const certificate = await api(
        "/api/certificates/generate",
        {
          method: "POST",
          body: JSON.stringify({
            recipientId: generatingFor.id,
            signatoryId: form.get("signatoryId"),
            certificateTitle: form.get("certificateTitle"),
          }),
        },
        session,
      );
      setGeneratingFor(null);
      await refresh();
      notify({
        title: "Certificate generated.",
        description: `${certificate.recipientName || generatingFor.fullName}'s certificate is ready.`,
        actions: [
          {
            label: "View certificate",
            onClick: () => onViewCertificate(certificate.id),
          },
        ],
      });
    } catch (error) {
      notify(readError(error), "error");
    } finally {
      setBusyRecipientId("");
    }
  }

  function startEdit(recipient) {
    setOpenMenuId(null);
    setShowForm(false);
    setGeneratingFor(null);
    setEditingRecipient(recipient);
    setMessage("");
  }

  function startGenerate(recipient) {
    setOpenMenuId(null);
    setShowForm(false);
    setEditingRecipient(null);
    setGeneratingFor(recipient);
    setMessage("");
  }

  function viewCertificate(certificateId) {
    setOpenMenuId(null);
    setShowForm(false);
    setEditingRecipient(null);
    setGeneratingFor(null);
    setMessage("");
    onViewCertificate(certificateId);
  }

  const certificateByRecipientId = useMemo(() => {
    const lookup = new Map();
    data.certificates.forEach((certificate) => {
      if (certificate.recipientId && !lookup.has(String(certificate.recipientId))) {
        lookup.set(String(certificate.recipientId), certificate);
      }
    });
    return lookup;
  }, [data.certificates]);
  const editingRecipientCertificate = editingRecipient ? certificateByRecipientId.get(String(editingRecipient.id)) : null;

  const rows = filterRows(data.recipients, searchQuery, ["fullName", "email", "courseName"]).filter((recipient) => {
    const certificate = certificateByRecipientId.get(String(recipient.id));
    const certificateStatus = certificate ? normalizeStatus(certificate.status) : "not issued";
    const matchesCourse = courseFilter === "all" || String(recipient.courseId) === String(courseFilter);
    const matchesCertificate = certificateFilter === "all" || certificateStatus === certificateFilter;

    return matchesCourse && matchesCertificate;
  });
  const hasActiveRecipientFilters = Boolean(searchQuery.trim()) || courseFilter !== "all" || certificateFilter !== "all";

  function clearRecipientFilters() {
    setSearchQuery("");
    setCourseFilter("all");
    setCertificateFilter("all");
  }

  function openNewRecipientForm() {
    setShowForm(true);
    setEditingRecipient(null);
    setGeneratingFor(null);
    setMessage("");
  }

  const courseOptions = [
    { value: "all", label: "All courses" },
    ...data.courses.map((course) => ({ value: course.id, label: course.name })),
  ];
  const certificateOptions = [
    { value: "all", label: "All certificate statuses" },
    { value: "issued", label: "Issued" },
    { value: "not issued", label: "Not issued" },
    { value: "revoked", label: "Revoked" },
  ];

  const columns = [
    { key: "name", label: "Full Name", width: "18%" },
    { key: "email", label: "Email", width: "18%" },
    { key: "course", label: "Course", width: "18%" },
    { key: "score", label: "Score", width: "8%" },
    { key: "grade", label: "Grade", width: "8%" },
    { key: "completion", label: "Completion Date", width: "14%" },
    { key: "certificate", label: "Certificate", width: "11%" },
    { key: "actions", label: "", width: "5%" },
  ];

  return (
    <div>
      <PageHeader title="Recipients" description="Manage certificate recipients and their course completion records" action={<Button onClick={() => {
        if (showForm) {
          setShowForm(false);
        } else {
          openNewRecipientForm();
        }
      }}><Plus className="h-4 w-4" />Add Recipient</Button>} />
      {showForm && (
        <Panel title="New Recipient">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Full Name" helper="Use the recipient name exactly as it should appear on the certificate." required><Input name="fullName" placeholder="John Doe" required /></FormField>
              <FormField label="Email" helper="Certificate delivery and verification details will use this address." required><Input name="email" type="email" placeholder="john@example.com" required /></FormField>
              <FormField label="Course" helper="Only recipients attached to a course can receive certificates." required>
                <Select name="courseId" required options={[{ value: "", label: "Select a course" }, ...data.courses.map((course) => ({ value: course.id, label: course.name }))]} />
              </FormField>
              <FormField label="Score" helper="Must meet the course eligibility score before generation." required><Input name="score" type="number" placeholder="95" required /></FormField>
              <FormField label="Grade" helper="Short grade label, for example A, Pass, or Distinction." required><Input name="grade" placeholder="A" required /></FormField>
              <FormField label="Completion Date" helper="This date appears on generated certificates." required><DateInput name="completionDate" required /></FormField>
            </div>
            <FormError message={message} className="mt-4" />
            <FormActions onCancel={() => setShowForm(false)} submitLabel="Add Recipient" />
          </form>
        </Panel>
      )}
      {editingRecipient && (
        <Panel title={`Edit ${editingRecipient.fullName}`}>
          <form key={editingRecipient.id} onSubmit={handleEdit}>
            {editingRecipientCertificate && (
              <div className="mb-4 rounded border border-[#5682B1]/30 bg-[#5682B1]/10 p-3 text-xs text-[#739EC9]">
                Course, score, grade, and completion date are locked because this recipient already has a certificate.
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Full Name" required><Input name="fullName" defaultValue={editingRecipient.fullName} required /></FormField>
              <FormField label="Email" required><Input name="email" type="email" defaultValue={editingRecipient.email} required /></FormField>
              <FormField label="Course" required>
                <Select name="courseId" required disabled={Boolean(editingRecipientCertificate)} defaultValue={editingRecipient.courseId} options={[{ value: "", label: "Select a course" }, ...data.courses.map((course) => ({ value: course.id, label: course.name }))]} />
              </FormField>
              <FormField label="Score" required><Input name="score" type="number" defaultValue={editingRecipient.score} readOnly={Boolean(editingRecipientCertificate)} required /></FormField>
              <FormField label="Grade" required><Input name="grade" defaultValue={editingRecipient.grade} readOnly={Boolean(editingRecipientCertificate)} required /></FormField>
              <FormField label="Completion Date" required><DateInput name="completionDate" defaultValue={formatDate(editingRecipient.completionDate)} readOnly={Boolean(editingRecipientCertificate)} required /></FormField>
            </div>
            <FormActions onCancel={() => setEditingRecipient(null)} submitLabel={busyRecipientId === editingRecipient.id ? "Saving..." : "Save Changes"} disabled={busyRecipientId === editingRecipient.id} />
          </form>
        </Panel>
      )}
      {generatingFor && (
        <div ref={generatePanelRef} tabIndex={-1} className="scroll-mt-20 outline-none">
          <Panel title={`Generate certificate for ${generatingFor.fullName}`}>
            <form key={generatingFor.id} onSubmit={handleGenerate}>
              <div className="mb-4 grid gap-4 md:grid-cols-2">
                <Detail label="Recipient" value={generatingFor.fullName} />
                <Detail label="Course" value={generatingFor.courseName || courseName(data.courses, generatingFor.courseId)} />
              </div>
              <FormField label="Certificate Title" helper="This becomes the headline of the issued certificate." required><Input name="certificateTitle" defaultValue="Certificate of Completion" required /></FormField>
              <FormField label="Signatory" helper="Choose the authorized person whose signature should appear." required>
                <Select name="signatoryId" required options={[{ value: "", label: "Select a signatory" }, ...data.signatories.map((signatory) => ({ value: signatory.id, label: `${signatory.name} - ${signatory.title}` }))]} />
              </FormField>
              <FormActions onCancel={() => setGeneratingFor(null)} submitLabel={busyRecipientId === generatingFor.id ? "Generating..." : "Generate Certificate"} disabled={busyRecipientId === generatingFor.id} />
            </form>
          </Panel>
        </div>
      )}
      <SearchBox value={searchQuery} onChange={setSearchQuery} placeholder="Search recipients by name, email, or course..." />
      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <Select value={courseFilter} onChange={setCourseFilter} options={courseOptions} />
        <Select value={certificateFilter} onChange={setCertificateFilter} options={certificateOptions} />
      </div>
      <div className="mb-4 flex flex-col gap-3 text-xs text-[#9a9a9a] sm:flex-row sm:items-center sm:justify-between">
        <p>
          Showing <span className="text-[#FFE8DB]">{rows.length}</span> of <span className="text-[#FFE8DB]">{data.recipients.length}</span> recipients
        </p>
        <Button variant="ghost" size="sm" disabled={!hasActiveRecipientFilters} onClick={clearRecipientFilters}>
          Clear filters
        </Button>
      </div>
      <Table
        columns={columns}
        data={rows}
        emptyIcon={Users}
        emptyTitle={data.recipients.length === 0 ? "No recipients yet" : "No recipients match these filters"}
        emptyMessage={data.recipients.length === 0 ? "Add a recipient with course completion details before generating certificates." : "Adjust the search, course, or certificate status filters to widen the results."}
        emptyAction={
          data.recipients.length === 0 ? (
            <Button variant="secondary" size="sm" onClick={openNewRecipientForm}>Add Recipient</Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={clearRecipientFilters}>Clear filters</Button>
          )
        }
        renderRow={(recipient) => {
          const certificate = certificateByRecipientId.get(String(recipient.id));
          return (
            <tr key={recipient.id} className="transition-colors hover:bg-[#1a1a1a]">
              <td className="px-4 py-3 text-sm text-[#FFE8DB]">{recipient.fullName}</td>
              <td className="px-4 py-3 text-sm text-[#9a9a9a]">{recipient.email}</td>
              <td className="px-4 py-3 text-sm text-[#9a9a9a]">{recipient.courseName || courseName(data.courses, recipient.courseId)}</td>
              <td className="px-4 py-3 text-sm text-[#FFE8DB]">{recipient.score}</td>
              <td className="px-4 py-3 text-sm text-[#FFE8DB]">{recipient.grade}</td>
              <td className="px-4 py-3 text-sm text-[#9a9a9a]">{formatDate(recipient.completionDate)}</td>
              <td className="px-4 py-3">
                <StatusBadge status={certificate ? normalizeStatus(certificate.status) : "not issued"} />
              </td>
              <td className="px-4 py-3">
                <RowActionMenu
                  open={openMenuId === recipient.id}
                  onToggle={() => setOpenMenuId((current) => (current === recipient.id ? null : recipient.id))}
                  onClose={() => setOpenMenuId(null)}
                  onEdit={() => startEdit(recipient)}
                  onGenerate={certificate ? undefined : () => startGenerate(recipient)}
                  onSecondaryAction={certificate ? () => viewCertificate(certificate.id) : undefined}
                  secondaryActionLabel={certificate ? "View certificate" : "Generate certificate"}
                  secondaryActionIcon={certificate ? Eye : Award}
                  onDelete={() => handleDelete(recipient)}
                  disabled={busyRecipientId === recipient.id}
                />
              </td>
            </tr>
          );
        }}
      />
    </div>
  );
}

