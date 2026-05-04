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
export function Dashboard({ data, loading, onNavigate }) {
  const recentCertificates = useMemo(
    () => [...data.certificates]
      .sort((a, b) => new Date(b.issuedAt || 0).getTime() - new Date(a.issuedAt || 0).getTime())
      .slice(0, 5),
    [data.certificates],
  );
  const issued = data.certificates.filter((cert) => cert.status === "ISSUED" || cert.status === "issued").length;
  const revoked = data.certificates.filter((cert) => cert.status === "REVOKED" || cert.status === "revoked").length;
  const issuedThisWeek = data.certificates.filter((cert) => {
    if (!(cert.status === "ISSUED" || cert.status === "issued") || !cert.issuedAt) return false;
    const issuedAt = new Date(cert.issuedAt);
    if (Number.isNaN(issuedAt.getTime())) return false;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return issuedAt >= sevenDaysAgo;
  }).length;

  const columns = [
    { key: "id", label: "ID", width: "15%" },
    { key: "recipient", label: "Recipient", width: "25%" },
    { key: "course", label: "Course", width: "25%" },
    { key: "status", label: "Status", width: "15%" },
    { key: "date", label: "Date", width: "20%" },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of certificate operations and activity" />

      <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Certificates" value={formatNumber(data.certificates.length)} icon={<FileText className="h-4 w-4" />} />
        <MetricCard label="Active Recipients" value={formatNumber(data.recipients.length)} icon={<Users className="h-4 w-4" />} />
        <MetricCard label="Revoked Certificates" value={formatNumber(revoked)} icon={<AlertCircle className="h-4 w-4" />} />
        <MetricCard label="Issued This Week" value={formatNumber(issuedThisWeek)} icon={<Award className="h-4 w-4" />} />
      </div>

      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium text-[#FFE8DB]">Quick Actions</h3>
          {loading && <span className="text-xs text-[#5682B1]">Syncing...</span>}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Button variant="secondary" onClick={() => onNavigate("generate")}>Generate Certificate</Button>
          <Button variant="secondary" onClick={() => onNavigate("recipients")}>Add Recipient</Button>
          <Button variant="secondary" onClick={() => onNavigate("courses")}>Add Course</Button>
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium text-[#FFE8DB]">Recent Certificate Activity</h3>
          <Button variant="ghost" size="sm" onClick={() => onNavigate("certificates")}>View All</Button>
        </div>
        <Table
          columns={columns}
          data={recentCertificates}
          emptyIcon={FileText}
          emptyTitle="No certificates yet"
          emptyMessage="Generate your first certificate to start tracking recent activity here."
          emptyAction={<Button variant="secondary" size="sm" onClick={() => onNavigate("generate")}>Generate Certificate</Button>}
          renderRow={(cert) => (
            <tr key={cert.id} className="transition-colors hover:bg-[#1a1a1a]">
              <td className="px-4 py-3 text-sm text-[#FFE8DB]">{displayCertificateId(cert)}</td>
              <td className="px-4 py-3 text-sm text-[#FFE8DB]">{cert.recipientName}</td>
              <td className="px-4 py-3 text-sm text-[#9a9a9a]">{cert.courseName}</td>
              <td className="px-4 py-3"><StatusBadge status={normalizeStatus(cert.status)} /></td>
              <td className="px-4 py-3 text-sm text-[#9a9a9a]">{formatDate(cert.issuedAt)}</td>
            </tr>
          )}
        />
      </div>
    </div>
  );
}

