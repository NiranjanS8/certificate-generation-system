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
export function Signatories({ data, session, refresh, confirmAction, notify }) {
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [signatureName, setSignatureName] = useState("");
  const [signatureFile, setSignatureFile] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingSignatory, setEditingSignatory] = useState(null);
  const [editSignatureFile, setEditSignatureFile] = useState(null);
  const [busySignatoryId, setBusySignatoryId] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage("");
    setBusySignatoryId("new");
    try {
      const signatory = await api(
        "/api/signatories",
        {
          method: "POST",
          body: JSON.stringify({ name: form.get("name"), title: form.get("title") }),
        },
        session,
      );
      if (signatureFile) {
        const signatureForm = new FormData();
        signatureForm.append("file", signatureFile);
        await api(
          `/api/signatories/${signatory.id}/signature`,
          {
            method: "POST",
            body: signatureForm,
          },
          session,
        );
      }
      setShowForm(false);
      setSignatureFile(null);
      setSignatureName("");
      await refresh();
      notify("Signatory added.");
    } catch (error) {
      setMessage(readError(error));
    } finally {
      setBusySignatoryId("");
    }
  }

  async function handleEdit(event) {
    event.preventDefault();
    if (!editingSignatory) return;
    const form = new FormData(event.currentTarget);
    setMessage("");
    setBusySignatoryId(editingSignatory.id);
    try {
      await api(
        `/api/signatories/${editingSignatory.id}`,
        {
          method: "PUT",
          body: JSON.stringify({ name: form.get("name"), title: form.get("title") }),
        },
        session,
      );
      if (editSignatureFile) {
        const signatureForm = new FormData();
        signatureForm.append("file", editSignatureFile);
        await api(
          `/api/signatories/${editingSignatory.id}/signature`,
          {
            method: "POST",
            body: signatureForm,
          },
          session,
        );
      }
      setEditingSignatory(null);
      setEditSignatureFile(null);
      await refresh();
      notify("Signatory updated.");
    } catch (error) {
      notify(readError(error), "error");
    } finally {
      setBusySignatoryId("");
    }
  }

  async function handleSetDefault(signatory) {
    setOpenMenuId(null);
    setMessage("");
    setBusySignatoryId(signatory.id);
    try {
      await api(`/api/signatories/${signatory.id}/default`, { method: "PATCH" }, session);
      await refresh();
      notify("Default signatory updated.");
    } catch (error) {
      notify(readError(error), "error");
    } finally {
      setBusySignatoryId("");
    }
  }

  async function handleDelete(signatory) {
    setOpenMenuId(null);
    const confirmed = await confirmAction({
      title: "Delete signatory?",
      message: `${signatory.name} will be permanently removed and can no longer be selected for new certificates. Existing generated PDFs are not changed.`,
      confirmLabel: "Delete",
      tone: "danger",
    });
    if (!confirmed) return;
    setMessage("");
    setBusySignatoryId(signatory.id);
    try {
      await api(`/api/signatories/${signatory.id}`, { method: "DELETE" }, session);
      await refresh();
      notify("Signatory deleted.");
    } catch (error) {
      notify(readError(error), "error");
    } finally {
      setBusySignatoryId("");
    }
  }

  function startEdit(signatory) {
    setOpenMenuId(null);
    setShowForm(false);
    setEditingSignatory(signatory);
    setEditSignatureFile(null);
    setMessage("");
  }

  function openNewSignatoryForm() {
    setShowForm(true);
    setEditingSignatory(null);
    setSignatureFile(null);
    setSignatureName("");
    setEditSignatureFile(null);
    setMessage("");
  }

  const rows = filterRows(data.signatories, searchQuery, ["name", "title"]);
  const columns = [
    { key: "name", label: "Name", width: "32%" },
    { key: "title", label: "Title", width: "32%" },
    { key: "signature", label: "Signature", width: "28%" },
    { key: "actions", label: "", width: "5%" },
  ];

  return (
    <div>
      <PageHeader title="Signatories" description="Manage authorized signatories for certificate validation" action={<Button onClick={() => {
        if (showForm) {
          setShowForm(false);
        } else {
          openNewSignatoryForm();
        }
      }}><Plus className="h-4 w-4" />Add Signatory</Button>} />
      {showForm && (
        <Panel title="New Signatory">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Full Name" helper="Enter the name exactly as it should appear near the signature." required><Input name="name" placeholder="Dr. Sarah Johnson" required /></FormField>
              <FormField label="Title" helper="For example Dean of Education, Program Director, or Head of Training." required><Input name="title" placeholder="Dean of Education" required /></FormField>
            </div>
            <div className="mt-4">
              <FileUpload label="Signature Image" accept="image/png,image/jpeg,image/webp" onFileSelect={(file) => {
                setSignatureFile(file || null);
                setSignatureName(file?.name || "");
              }} />
              {signatureName && <p className="mt-2 text-xs text-[#9a9a9a]">{signatureName}</p>}
            </div>
            <FormError message={message} className="mt-4" />
            <FormActions onCancel={() => {
              setShowForm(false);
              setSignatureFile(null);
              setSignatureName("");
            }} submitLabel={busySignatoryId === "new" ? "Adding..." : "Add Signatory"} disabled={busySignatoryId === "new"} />
          </form>
        </Panel>
      )}
      {editingSignatory && (
        <Panel title={`Edit ${editingSignatory.name}`}>
          <form key={editingSignatory.id} onSubmit={handleEdit}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Full Name" helper="Enter the name exactly as it should appear near the signature." required><Input name="name" defaultValue={editingSignatory.name} required /></FormField>
              <FormField label="Title" helper="For example Dean of Education, Program Director, or Head of Training." required><Input name="title" defaultValue={editingSignatory.title} required /></FormField>
            </div>
            <div className="mt-4">
              <FileUpload label="Signature Image" accept="image/png,image/jpeg,image/webp" onFileSelect={(file) => setEditSignatureFile(file || null)} />
              {editingSignatory.signatureUrl && !editSignatureFile && <p className="mt-2 text-xs text-[#9a9a9a]">Current signature is already uploaded.</p>}
              {editSignatureFile && <p className="mt-2 text-xs text-[#739EC9]">{editSignatureFile.name}</p>}
            </div>
            <FormActions onCancel={() => {
              setEditingSignatory(null);
              setEditSignatureFile(null);
            }} submitLabel={busySignatoryId === editingSignatory.id ? "Saving..." : "Save Changes"} disabled={busySignatoryId === editingSignatory.id} />
          </form>
        </Panel>
      )}
      <SearchBox value={searchQuery} onChange={setSearchQuery} placeholder="Search signatories by name or title..." />
      <Table
        columns={columns}
        data={rows}
        emptyIcon={PenTool}
        emptyTitle={data.signatories.length === 0 ? "No signatories yet" : "No signatories match this search"}
        emptyMessage={data.signatories.length === 0 ? "Add an authorized signatory and upload a signature image for generated certificates." : "Clear the search term to return to the full signatory list."}
        emptyAction={
          data.signatories.length === 0 ? (
            <Button variant="secondary" size="sm" onClick={openNewSignatoryForm}>Add Signatory</Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setSearchQuery("")}>Clear search</Button>
          )
        }
        renderRow={(signatory) => (
          <tr key={signatory.id} className="transition-colors hover:bg-[#1a1a1a]">
            <td className="px-4 py-3 text-sm text-[#FFE8DB]">{signatory.name}</td>
            <td className="px-4 py-3 text-sm text-[#9a9a9a]">
              <div className="flex items-center gap-2">
                <span>{signatory.title}</span>
                {signatory.isDefault && <StatusBadge status="active" />}
              </div>
            </td>
            <td className="px-4 py-3">
              <SignaturePreview signatory={signatory} session={session} />
            </td>
            <td className="px-4 py-3">
              <RowActionMenu
                menuTitle="Signatory actions"
                open={openMenuId === signatory.id}
                onToggle={() => setOpenMenuId((current) => (current === signatory.id ? null : signatory.id))}
                onClose={() => setOpenMenuId(null)}
                editLabel="Edit signatory"
                onEdit={() => startEdit(signatory)}
                secondaryActionLabel="Set as default"
                secondaryActionIcon={CheckCircle}
                onSecondaryAction={signatory.isDefault ? null : () => handleSetDefault(signatory)}
                deleteLabel="Delete signatory"
                onDelete={() => handleDelete(signatory)}
                disabled={busySignatoryId === signatory.id}
              />
            </td>
          </tr>
        )}
      />
    </div>
  );
}

