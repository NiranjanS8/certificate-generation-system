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
export function Courses({ data, session, refresh, confirmAction, notify }) {
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [busyCourseId, setBusyCourseId] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage("");
    try {
      await api(
        "/api/courses",
        {
          method: "POST",
          body: JSON.stringify({
            name: form.get("name"),
            description: form.get("description"),
            minScore: Number(form.get("minScore") || 0),
          }),
        },
        session,
      );
      setShowForm(false);
      await refresh();
      notify("Course added.");
    } catch (error) {
      setMessage(readError(error));
    }
  }

  async function handleEdit(event) {
    event.preventDefault();
    if (!editingCourse) return;
    const form = new FormData(event.currentTarget);
    setMessage("");
    setBusyCourseId(editingCourse.id);
    try {
      await api(
        `/api/courses/${editingCourse.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            name: form.get("name"),
            description: form.get("description"),
            minScore: Number(form.get("minScore") || 0),
          }),
        },
        session,
      );
      setEditingCourse(null);
      await refresh();
      notify("Course updated.");
    } catch (error) {
      notify(readError(error), "error");
    } finally {
      setBusyCourseId("");
    }
  }

  async function handleDelete(course) {
    setOpenMenuId(null);
    const confirmed = await confirmAction({
      title: "Deactivate course?",
      message: `${course.name} will be removed from active course lists. Existing recipients and certificates will keep their current course history.`,
      confirmLabel: "Deactivate",
      tone: "danger",
    });
    if (!confirmed) return;
    setMessage("");
    setBusyCourseId(course.id);
    try {
      await api(`/api/courses/${course.id}`, { method: "DELETE" }, session);
      await refresh();
      notify("Course deactivated.");
    } catch (error) {
      notify(readError(error), "error");
    } finally {
      setBusyCourseId("");
    }
  }

  function startEdit(course) {
    setOpenMenuId(null);
    setShowForm(false);
    setEditingCourse(course);
    setMessage("");
  }

  function openNewCourseForm() {
    setShowForm(true);
    setEditingCourse(null);
    setMessage("");
  }

  const rows = filterRows(data.courses, searchQuery, ["name", "description"]);
  const enrolledByCourseId = useMemo(() => {
    const counts = new Map();
    data.recipients.forEach((recipient) => {
      if (!recipient.courseId) return;
      const key = String(recipient.courseId);
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }, [data.recipients]);
  const columns = [
    { key: "name", label: "Course Name", width: "28%" },
    { key: "description", label: "Description", width: "44%" },
    { key: "score", label: "Min. Score", width: "12%" },
    { key: "enrolled", label: "Enrolled", width: "11%" },
    { key: "actions", label: "", width: "5%" },
  ];

  return (
    <div>
      <PageHeader title="Courses" description="Manage available courses and certificate requirements" action={<Button onClick={() => {
        if (showForm) {
          setShowForm(false);
        } else {
          openNewCourseForm();
        }
      }}><Plus className="h-4 w-4" />Add Course</Button>} />
      {showForm && (
        <Panel title="New Course">
          <form onSubmit={handleSubmit}>
            <FormField label="Course Name" helper="Use a clear title recipients will recognize on certificates." required><Input name="name" placeholder="Web Development Fundamentals" required /></FormField>
            <FormField label="Description" helper="Summarize what the recipient completed. Keep it concise for scanning." required><Textarea name="description" rows={3} placeholder="Comprehensive introduction to web development..." required /></FormField>
            <FormField label="Eligibility Score" helper="Recipients must meet or exceed this score before a certificate can be generated." required><Input name="minScore" type="number" placeholder="70" required /></FormField>
            <FormError message={message} className="mt-4" />
            <FormActions onCancel={() => setShowForm(false)} submitLabel="Add Course" />
          </form>
        </Panel>
      )}
      {editingCourse && (
        <Panel title={`Edit ${editingCourse.name}`}>
          <form key={editingCourse.id} onSubmit={handleEdit}>
            <FormField label="Course Name" helper="Use a clear title recipients will recognize on certificates." required><Input name="name" defaultValue={editingCourse.name} required /></FormField>
            <FormField label="Description" helper="Optional edits will not change already issued certificate records."><Textarea name="description" rows={3} defaultValue={editingCourse.description || ""} /></FormField>
            <FormField label="Eligibility Score" helper="Changing this affects future eligibility checks." required><Input name="minScore" type="number" defaultValue={editingCourse.minScore ?? 0} required /></FormField>
            <FormActions onCancel={() => setEditingCourse(null)} submitLabel={busyCourseId === editingCourse.id ? "Saving..." : "Save Changes"} disabled={busyCourseId === editingCourse.id} />
          </form>
        </Panel>
      )}
      <SearchBox value={searchQuery} onChange={setSearchQuery} placeholder="Search courses by name or description..." />
      <Table
        columns={columns}
        data={rows}
        emptyIcon={BookOpen}
        emptyTitle={data.courses.length === 0 ? "No courses yet" : "No courses match this search"}
        emptyMessage={data.courses.length === 0 ? "Create a course with an eligibility score before enrolling recipients." : "Clear the search term to return to the full course list."}
        emptyAction={
          data.courses.length === 0 ? (
            <Button variant="secondary" size="sm" onClick={openNewCourseForm}>Add Course</Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setSearchQuery("")}>Clear search</Button>
          )
        }
        renderRow={(course) => (
          <tr key={course.id} className="transition-colors hover:bg-[#1a1a1a]">
            <td className="px-4 py-3 text-sm text-[#FFE8DB]">{course.name}</td>
            <td className="px-4 py-3 text-sm text-[#9a9a9a]">{course.description}</td>
            <td className="px-4 py-3 text-sm text-[#FFE8DB]">{course.minScore ?? "--"}</td>
            <td className="px-4 py-3 text-sm text-[#9a9a9a]">{enrolledByCourseId.get(String(course.id)) || 0}</td>
            <td className="px-4 py-3">
              <RowActionMenu
                menuTitle="Course actions"
                open={openMenuId === course.id}
                onToggle={() => setOpenMenuId((current) => (current === course.id ? null : course.id))}
                onClose={() => setOpenMenuId(null)}
                editLabel="Edit course"
                onEdit={() => startEdit(course)}
                deleteLabel="Deactivate course"
                onDelete={() => handleDelete(course)}
                disabled={busyCourseId === course.id}
              />
            </td>
          </tr>
        )}
      />
    </div>
  );
}

