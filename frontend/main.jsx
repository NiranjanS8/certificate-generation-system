import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertCircle,
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle,
  ChevronDown,
  Clock,
  Download,
  Eye,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreVertical,
  PenTool,
  Plus,
  PlusCircle,
  Search,
  Settings,
  Share2,
  Trash2,
  Upload,
  Users,
  X,
  XCircle,
} from "lucide-react";
import "./styles.css";

const storageKey = "certificate-authority-session";
const appName = "CertifyX";
const appTagline = "Certificate Authority System";

const emptySession = {
  token: "",
  refreshToken: "",
  email: "",
  orgId: "",
};

async function api(path, options = {}, session = emptySession) {
  const headers = {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(session.token ? { Authorization: `Bearer ${session.token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(path, { ...options, headers });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with ${response.status}`);
  }
  if (response.status === 204) return null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/pdf")) return response.blob();
  return response.json();
}

function App() {
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || emptySession;
    } catch {
      return emptySession;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(session.token));
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [authView, setAuthView] = useState("login");
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [apiError, setApiError] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [data, setData] = useState({
    profile: null,
    certificates: [],
    recipients: [],
    courses: [],
    signatories: [],
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(session));
    setIsAuthenticated(Boolean(session.token));
  }, [session]);

  useEffect(() => {
    if (isAuthenticated) loadWorkspace();
  }, [isAuthenticated]);

  async function loadWorkspace() {
    setLoading(true);
    setApiError("");
    try {
      const [profile, certificates, recipients, courses, signatories] = await Promise.all([
        api("/api/org/profile", {}, session),
        api("/api/certificates", {}, session),
        api("/api/recipients", {}, session),
        api("/api/courses", {}, session),
        api("/api/signatories", {}, session),
      ]);
      setData({ profile, certificates, recipients, courses, signatories });
    } catch (error) {
      setApiError(readError(error));
    } finally {
      setLoading(false);
    }
  }

  async function handleAuth(event) {
    event.preventDefault();
    setLoading(true);
    setAuthError("");
    const form = new FormData(event.currentTarget);
    const payload =
      authView === "login"
        ? { email: form.get("email"), password: form.get("password") }
        : {
            name: form.get("name"),
            email: form.get("email"),
            website: form.get("website"),
            password: form.get("password"),
          };

    try {
      if (authView === "register") {
        await api("/api/org/register", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      const auth = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: payload.email, password: payload.password }),
      });
      setSession({
        token: auth.token,
        refreshToken: auth.refreshToken,
        email: auth.email,
        orgId: auth.orgId,
      });
    } catch (error) {
      setAuthError(readError(error));
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setSession(emptySession);
    setData({ profile: null, certificates: [], recipients: [], courses: [], signatories: [] });
    setCurrentPage("dashboard");
    localStorage.removeItem(storageKey);
  }

  function confirmAction(options) {
    return new Promise((resolve) => {
      setConfirmation({ ...options, resolve });
    });
  }

  function closeConfirmation(confirmed) {
    confirmation?.resolve(confirmed);
    setConfirmation(null);
  }

  if (!isAuthenticated && currentPage === "verify") {
    return <Verify onBack={() => setCurrentPage("dashboard")} />;
  }

  if (!isAuthenticated) {
    return authView === "login" ? (
      <Login
        error={authError}
        loading={loading}
        onSubmit={handleAuth}
        onNavigateToRegister={() => setAuthView("register")}
        onNavigateToVerify={() => setCurrentPage("verify")}
      />
    ) : (
      <Register
        error={authError}
        loading={loading}
        onSubmit={handleAuth}
        onNavigateToLogin={() => setAuthView("login")}
      />
    );
  }

  if (currentPage === "verify") {
    return <Verify onBack={() => setCurrentPage("dashboard")} />;
  }

  return (
    <div className="flex min-h-screen bg-[#000000]">
      <Sidebar
        currentPage={currentPage}
        onNavigate={(page) => {
          setSelectedCertificate(null);
          setCurrentPage(page);
          setMobileNavOpen(false);
        }}
        profile={data.profile}
        email={session.email}
        onLogout={logout}
        mobileOpen={mobileNavOpen}
      />
      <button
        className="fixed right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded border border-[#2a2a2a] bg-[#0a0a0a] text-[#FFE8DB] lg:hidden"
        onClick={() => setMobileNavOpen((open) => !open)}
        aria-label="Toggle navigation"
      >
        {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      <main className="min-w-0 flex-1 p-4 pt-16 lg:ml-64 lg:p-8">
        {apiError && (
          <div className="mb-4 rounded border border-[#5682B1]/30 bg-[#5682B1]/10 p-3 text-sm text-[#739EC9]">
            {apiError}
          </div>
        )}
        {selectedCertificate ? (
          <CertificateDetail
            certificateId={selectedCertificate}
            certificates={data.certificates || []}
            onBack={() => setSelectedCertificate(null)}
            session={session}
          />
        ) : (
          <Workspace
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            data={data}
            loading={loading}
            session={session}
            refresh={loadWorkspace}
            onViewCertificate={setSelectedCertificate}
            confirmAction={confirmAction}
          />
        )}
      </main>
      <ConfirmationDialog
        open={Boolean(confirmation)}
        title={confirmation?.title}
        message={confirmation?.message}
        confirmLabel={confirmation?.confirmLabel}
        tone={confirmation?.tone}
        onCancel={() => closeConfirmation(false)}
        onConfirm={() => closeConfirmation(true)}
      />
    </div>
  );
}

function Login({ error, loading, onSubmit, onNavigateToRegister, onNavigateToVerify }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#000000] p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-medium tracking-tight text-[#FFE8DB]">{appName}</h1>
          <p className="text-sm text-[#9a9a9a]">{appTagline}</p>
        </div>

        <div className="rounded border border-[#2a2a2a] bg-[#0a0a0a] p-6">
          <h2 className="mb-6 text-xl font-medium text-[#FFE8DB]">Sign In</h2>
          <form onSubmit={onSubmit}>
            <FormField label="Email" required>
              <Input name="email" type="email" placeholder="admin@example.com" required />
            </FormField>
            <FormField label="Password" required>
              <Input name="password" type="password" placeholder="Password" required />
            </FormField>
            {error && <p className="mb-4 text-xs text-[#dc2626]">{error}</p>}
            <Button type="submit" variant="primary" fullWidth disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-6 border-t border-[#2a2a2a] pt-6 text-center">
            <p className="text-sm text-[#9a9a9a]">
              Don't have an organization?{" "}
              <button onClick={onNavigateToRegister} className="text-[#5682B1] hover:text-[#739EC9]">
                Register here
              </button>
            </p>
            <button onClick={onNavigateToVerify} className="mt-4 text-xs text-[#5682B1] hover:text-[#739EC9]">
              Verify a certificate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Register({ error, loading, onSubmit, onNavigateToLogin }) {
  const [logoName, setLogoName] = useState("");

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#000000] p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-medium tracking-tight text-[#FFE8DB]">{appName}</h1>
          <p className="text-sm text-[#9a9a9a]">{appTagline}</p>
        </div>

        <div className="rounded border border-[#2a2a2a] bg-[#0a0a0a] p-6">
          <h2 className="mb-6 text-xl font-medium text-[#FFE8DB]">Register Organization</h2>
          <form onSubmit={onSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Organization Name" required>
                <Input name="name" placeholder="Acme Corporation" required />
              </FormField>
              <FormField label="Email" required>
                <Input name="email" type="email" placeholder="admin@acme.com" required />
              </FormField>
              <FormField label="Website">
                <Input name="website" type="url" placeholder="https://acme.com" />
              </FormField>
              <FormField label="Password" required>
                <Input name="password" type="password" placeholder="Password" required />
              </FormField>
            </div>
            <div className="mt-4">
              <FileUpload label="Organization Logo" accept="image/png,image/jpeg" onFileSelect={(file) => setLogoName(file?.name || "")} />
              {logoName && <p className="mt-2 text-xs text-[#9a9a9a]">{logoName}</p>}
            </div>
            {error && <p className="mt-4 text-xs text-[#dc2626]">{error}</p>}
            <div className="mt-6 flex gap-3">
              <Button type="submit" variant="primary" fullWidth disabled={loading}>
                {loading ? "Registering..." : "Register Organization"}
              </Button>
            </div>
          </form>
          <div className="mt-6 border-t border-[#2a2a2a] pt-6 text-center">
            <p className="text-sm text-[#9a9a9a]">
              Already have an account?{" "}
              <button onClick={onNavigateToLogin} className="text-[#5682B1] hover:text-[#739EC9]">
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ currentPage, onNavigate, profile, email, onLogout, mobileOpen }) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "recipients", label: "Recipients", icon: Users },
    { id: "courses", label: "Courses", icon: BookOpen },
    { id: "signatories", label: "Signatories", icon: PenTool },
    { id: "certificates", label: "Certificates", icon: FileText },
    { id: "generate", label: "Generate", icon: PlusCircle },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-[#2a2a2a] bg-[#0a0a0a] transition-transform lg:translate-x-0 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="border-b border-[#2a2a2a] p-6">
        <h1 className="text-2xl font-medium tracking-tight text-[#FFE8DB]">{appName}</h1>
        <p className="mt-1 text-xs text-[#9a9a9a]">{appTagline}</p>
      </div>

      <nav className="flex-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`mb-1 flex w-full items-center gap-3 rounded px-4 py-3 text-left transition-colors ${
                isActive ? "bg-[#5682B1] text-[#000000]" : "text-[#FFE8DB] hover:bg-[#1a1a1a]"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="border-t border-[#2a2a2a] p-4">
        <div className="mb-4 text-xs text-[#9a9a9a]">
          <p>Organization</p>
          <p className="mt-1 truncate text-[#FFE8DB]">{profile?.name || "Organization"}</p>
          <p className="mt-1 truncate">{email}</p>
        </div>
        <button onClick={onLogout} className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-[#9a9a9a] hover:bg-[#1a1a1a] hover:text-[#FFE8DB]">
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

function Workspace({ currentPage, setCurrentPage, data, loading, session, refresh, onViewCertificate, confirmAction }) {
  const model = useMemo(
    () => ({
      recipients: data.recipients || [],
      courses: data.courses || [],
      signatories: data.signatories || [],
      certificates: data.certificates || [],
      profile: data.profile,
    }),
    [data],
  );

  if (currentPage === "dashboard") return <Dashboard data={model} loading={loading} onNavigate={setCurrentPage} />;
  if (currentPage === "recipients") return <Recipients data={model} session={session} refresh={refresh} confirmAction={confirmAction} />;
  if (currentPage === "courses") return <Courses data={model} session={session} refresh={refresh} confirmAction={confirmAction} />;
  if (currentPage === "signatories") return <Signatories data={model} session={session} refresh={refresh} confirmAction={confirmAction} />;
  if (currentPage === "certificates") return <Certificates data={model} session={session} refresh={refresh} onViewCertificate={onViewCertificate} confirmAction={confirmAction} />;
  if (currentPage === "generate") return <Generate data={model} session={session} refresh={refresh} />;
  return <SettingsPanel data={model} />;
}

function Dashboard({ data, loading, onNavigate }) {
  const recentCertificates = data.certificates.slice(0, 5);
  const issued = data.certificates.filter((cert) => cert.status === "ISSUED" || cert.status === "issued").length;
  const pending = data.certificates.length - issued;
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
        <MetricCard label="Pending Certificates" value={formatNumber(pending)} icon={<Clock className="h-4 w-4" />} />
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

function Recipients({ data, session, refresh, confirmAction }) {
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingRecipient, setEditingRecipient] = useState(null);
  const [generatingFor, setGeneratingFor] = useState(null);
  const [busyRecipientId, setBusyRecipientId] = useState("");

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
      refresh();
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
      setMessage("Recipient updated.");
    } catch (error) {
      setMessage(readError(error));
    } finally {
      setBusyRecipientId("");
    }
  }

  async function handleDelete(recipient) {
    setOpenMenuId(null);
    const confirmed = await confirmAction({
      title: "Delete recipient",
      message: `Delete ${recipient.fullName}? This cannot be undone.`,
      confirmLabel: "Delete Recipient",
      tone: "danger",
    });
    if (!confirmed) return;
    setMessage("");
    setBusyRecipientId(recipient.id);
    try {
      await api(`/api/recipients/${recipient.id}`, { method: "DELETE" }, session);
      await refresh();
      setMessage("Recipient deleted.");
    } catch (error) {
      setMessage(readError(error));
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
      await api(
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
      setMessage("Certificate generated.");
    } catch (error) {
      setMessage(readError(error));
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

  const rows = filterRows(data.recipients, searchQuery, ["fullName", "email", "courseName"]);
  const columns = [
    { key: "name", label: "Full Name", width: "20%" },
    { key: "email", label: "Email", width: "20%" },
    { key: "course", label: "Course", width: "20%" },
    { key: "score", label: "Score", width: "10%" },
    { key: "grade", label: "Grade", width: "10%" },
    { key: "completion", label: "Completion Date", width: "15%" },
    { key: "actions", label: "", width: "5%" },
  ];

  return (
    <div>
      <PageHeader title="Recipients" description="Manage certificate recipients and their course completion records" action={<Button onClick={() => {
        setShowForm(!showForm);
        setEditingRecipient(null);
        setGeneratingFor(null);
        setMessage("");
      }}><Plus className="h-4 w-4" />Add Recipient</Button>} />
      {showForm && (
        <Panel title="New Recipient">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Full Name" required><Input name="fullName" placeholder="John Doe" required /></FormField>
              <FormField label="Email" required><Input name="email" type="email" placeholder="john@example.com" required /></FormField>
              <FormField label="Course" required>
                <Select name="courseId" required options={[{ value: "", label: "Select a course" }, ...data.courses.map((course) => ({ value: course.id, label: course.name }))]} />
              </FormField>
              <FormField label="Score" required><Input name="score" type="number" placeholder="95" required /></FormField>
              <FormField label="Grade" required><Input name="grade" placeholder="A" required /></FormField>
              <FormField label="Completion Date" required><Input name="completionDate" type="date" required /></FormField>
            </div>
            {message && <p className="mt-4 text-xs text-[#dc2626]">{message}</p>}
            <FormActions onCancel={() => setShowForm(false)} submitLabel="Add Recipient" />
          </form>
        </Panel>
      )}
      {editingRecipient && (
        <Panel title={`Edit ${editingRecipient.fullName}`}>
          <form key={editingRecipient.id} onSubmit={handleEdit}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Full Name" required><Input name="fullName" defaultValue={editingRecipient.fullName} required /></FormField>
              <FormField label="Email" required><Input name="email" type="email" defaultValue={editingRecipient.email} required /></FormField>
              <FormField label="Course" required>
                <Select name="courseId" required defaultValue={editingRecipient.courseId} options={[{ value: "", label: "Select a course" }, ...data.courses.map((course) => ({ value: course.id, label: course.name }))]} />
              </FormField>
              <FormField label="Score" required><Input name="score" type="number" defaultValue={editingRecipient.score} required /></FormField>
              <FormField label="Grade" required><Input name="grade" defaultValue={editingRecipient.grade} required /></FormField>
              <FormField label="Completion Date" required><Input name="completionDate" type="date" defaultValue={formatDate(editingRecipient.completionDate)} required /></FormField>
            </div>
            <FormActions onCancel={() => setEditingRecipient(null)} submitLabel={busyRecipientId === editingRecipient.id ? "Saving..." : "Save Changes"} disabled={busyRecipientId === editingRecipient.id} />
          </form>
        </Panel>
      )}
      {generatingFor && (
        <Panel title={`Generate certificate for ${generatingFor.fullName}`}>
          <form key={generatingFor.id} onSubmit={handleGenerate}>
            <div className="mb-4 grid gap-4 md:grid-cols-2">
              <Detail label="Recipient" value={generatingFor.fullName} />
              <Detail label="Course" value={generatingFor.courseName || courseName(data.courses, generatingFor.courseId)} />
            </div>
            <FormField label="Certificate Title" required><Input name="certificateTitle" defaultValue="Certificate of Completion" required /></FormField>
            <FormField label="Signatory" required>
              <Select name="signatoryId" required options={[{ value: "", label: "Select a signatory" }, ...data.signatories.map((signatory) => ({ value: signatory.id, label: `${signatory.name} - ${signatory.title}` }))]} />
            </FormField>
            <FormActions onCancel={() => setGeneratingFor(null)} submitLabel={busyRecipientId === generatingFor.id ? "Generating..." : "Generate Certificate"} disabled={busyRecipientId === generatingFor.id} />
          </form>
        </Panel>
      )}
      {message && <p className={`mb-4 text-xs ${message.includes("updated") || message.includes("deleted") || message.includes("generated") ? "text-[#739EC9]" : "text-[#dc2626]"}`}>{message}</p>}
      <SearchBox value={searchQuery} onChange={setSearchQuery} placeholder="Search recipients by name, email, or course..." />
      <Table
        columns={columns}
        data={rows}
        renderRow={(recipient) => (
          <tr key={recipient.id} className="transition-colors hover:bg-[#1a1a1a]">
            <td className="px-4 py-3 text-sm text-[#FFE8DB]">{recipient.fullName}</td>
            <td className="px-4 py-3 text-sm text-[#9a9a9a]">{recipient.email}</td>
            <td className="px-4 py-3 text-sm text-[#9a9a9a]">{recipient.courseName || courseName(data.courses, recipient.courseId)}</td>
            <td className="px-4 py-3 text-sm text-[#FFE8DB]">{recipient.score}</td>
            <td className="px-4 py-3 text-sm text-[#FFE8DB]">{recipient.grade}</td>
            <td className="px-4 py-3 text-sm text-[#9a9a9a]">{formatDate(recipient.completionDate)}</td>
            <td className="px-4 py-3">
              <RowActionMenu
                open={openMenuId === recipient.id}
                onToggle={() => setOpenMenuId((current) => (current === recipient.id ? null : recipient.id))}
                onClose={() => setOpenMenuId(null)}
                onEdit={() => startEdit(recipient)}
                onGenerate={() => startGenerate(recipient)}
                onDelete={() => handleDelete(recipient)}
                disabled={busyRecipientId === recipient.id}
              />
            </td>
          </tr>
        )}
      />
    </div>
  );
}

function Courses({ data, session, refresh, confirmAction }) {
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
      refresh();
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
      setMessage("Course updated.");
    } catch (error) {
      setMessage(readError(error));
    } finally {
      setBusyCourseId("");
    }
  }

  async function handleDelete(course) {
    setOpenMenuId(null);
    const confirmed = await confirmAction({
      title: "Deactivate course",
      message: `Deactivate ${course.name}? It will no longer appear in active course lists.`,
      confirmLabel: "Deactivate Course",
      tone: "danger",
    });
    if (!confirmed) return;
    setMessage("");
    setBusyCourseId(course.id);
    try {
      await api(`/api/courses/${course.id}`, { method: "DELETE" }, session);
      await refresh();
      setMessage("Course deactivated.");
    } catch (error) {
      setMessage(readError(error));
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
    { key: "name", label: "Course Name", width: "25%" },
    { key: "description", label: "Description", width: "35%" },
    { key: "duration", label: "Duration", width: "12%" },
    { key: "score", label: "Min. Score", width: "12%" },
    { key: "enrolled", label: "Enrolled", width: "11%" },
    { key: "actions", label: "", width: "5%" },
  ];

  return (
    <div>
      <PageHeader title="Courses" description="Manage available courses and certificate requirements" action={<Button onClick={() => {
        setShowForm(!showForm);
        setEditingCourse(null);
        setMessage("");
      }}><Plus className="h-4 w-4" />Add Course</Button>} />
      {showForm && (
        <Panel title="New Course">
          <form onSubmit={handleSubmit}>
            <FormField label="Course Name" required><Input name="name" placeholder="Web Development Fundamentals" required /></FormField>
            <FormField label="Description" required><Textarea name="description" rows={3} placeholder="Comprehensive introduction to web development..." required /></FormField>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Duration"><Input name="duration" placeholder="12 weeks" /></FormField>
              <FormField label="Eligibility Score" required><Input name="minScore" type="number" placeholder="70" required /></FormField>
            </div>
            {message && <p className="mt-4 text-xs text-[#dc2626]">{message}</p>}
            <FormActions onCancel={() => setShowForm(false)} submitLabel="Add Course" />
          </form>
        </Panel>
      )}
      {editingCourse && (
        <Panel title={`Edit ${editingCourse.name}`}>
          <form key={editingCourse.id} onSubmit={handleEdit}>
            <FormField label="Course Name" required><Input name="name" defaultValue={editingCourse.name} required /></FormField>
            <FormField label="Description"><Textarea name="description" rows={3} defaultValue={editingCourse.description || ""} /></FormField>
            <FormField label="Eligibility Score" required><Input name="minScore" type="number" defaultValue={editingCourse.minScore ?? 0} required /></FormField>
            <FormActions onCancel={() => setEditingCourse(null)} submitLabel={busyCourseId === editingCourse.id ? "Saving..." : "Save Changes"} disabled={busyCourseId === editingCourse.id} />
          </form>
        </Panel>
      )}
      {message && <p className={`mb-4 text-xs ${message.includes("updated") || message.includes("deactivated") ? "text-[#739EC9]" : "text-[#dc2626]"}`}>{message}</p>}
      <SearchBox value={searchQuery} onChange={setSearchQuery} placeholder="Search courses by name or description..." />
      <Table
        columns={columns}
        data={rows}
        renderRow={(course) => (
          <tr key={course.id} className="transition-colors hover:bg-[#1a1a1a]">
            <td className="px-4 py-3 text-sm text-[#FFE8DB]">{course.name}</td>
            <td className="px-4 py-3 text-sm text-[#9a9a9a]">{course.description}</td>
            <td className="px-4 py-3 text-sm text-[#9a9a9a]">{course.duration || "--"}</td>
            <td className="px-4 py-3 text-sm text-[#FFE8DB]">{course.minScore ?? course.eligibilityScore ?? "--"}</td>
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

function Signatories({ data, session, refresh, confirmAction }) {
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [signatureName, setSignatureName] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingSignatory, setEditingSignatory] = useState(null);
  const [editSignatureFile, setEditSignatureFile] = useState(null);
  const [busySignatoryId, setBusySignatoryId] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage("");
    try {
      await api(
        "/api/signatories",
        {
          method: "POST",
          body: JSON.stringify({ name: form.get("name"), title: form.get("title") }),
        },
        session,
      );
      setShowForm(false);
      refresh();
    } catch (error) {
      setMessage(readError(error));
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
      setMessage("Signatory updated.");
    } catch (error) {
      setMessage(readError(error));
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
      setMessage("Default signatory updated.");
    } catch (error) {
      setMessage(readError(error));
    } finally {
      setBusySignatoryId("");
    }
  }

  async function handleDelete(signatory) {
    setOpenMenuId(null);
    const confirmed = await confirmAction({
      title: "Delete signatory",
      message: `Delete ${signatory.name}? This cannot be undone.`,
      confirmLabel: "Delete Signatory",
      tone: "danger",
    });
    if (!confirmed) return;
    setMessage("");
    setBusySignatoryId(signatory.id);
    try {
      await api(`/api/signatories/${signatory.id}`, { method: "DELETE" }, session);
      await refresh();
      setMessage("Signatory deleted.");
    } catch (error) {
      setMessage(readError(error));
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
        setShowForm(!showForm);
        setEditingSignatory(null);
        setEditSignatureFile(null);
        setMessage("");
      }}><Plus className="h-4 w-4" />Add Signatory</Button>} />
      {showForm && (
        <Panel title="New Signatory">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Full Name" required><Input name="name" placeholder="Dr. Sarah Johnson" required /></FormField>
              <FormField label="Title" required><Input name="title" placeholder="Dean of Education" required /></FormField>
            </div>
            <div className="mt-4">
              <FileUpload label="Signature Image" accept="image/png,image/jpeg" onFileSelect={(file) => setSignatureName(file?.name || "")} />
              {signatureName && <p className="mt-2 text-xs text-[#9a9a9a]">{signatureName}</p>}
            </div>
            {message && <p className="mt-4 text-xs text-[#dc2626]">{message}</p>}
            <FormActions onCancel={() => setShowForm(false)} submitLabel="Add Signatory" />
          </form>
        </Panel>
      )}
      {editingSignatory && (
        <Panel title={`Edit ${editingSignatory.name}`}>
          <form key={editingSignatory.id} onSubmit={handleEdit}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Full Name" required><Input name="name" defaultValue={editingSignatory.name} required /></FormField>
              <FormField label="Title" required><Input name="title" defaultValue={editingSignatory.title} required /></FormField>
            </div>
            <div className="mt-4">
              <FileUpload label="Signature Image" accept="image/png,image/jpeg" onFileSelect={(file) => setEditSignatureFile(file || null)} />
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
      {message && <p className={`mb-4 text-xs ${message.includes("updated") || message.includes("deleted") ? "text-[#739EC9]" : "text-[#dc2626]"}`}>{message}</p>}
      <SearchBox value={searchQuery} onChange={setSearchQuery} placeholder="Search signatories by name or title..." />
      <Table
        columns={columns}
        data={rows}
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

function Certificates({ data, session, refresh, onViewCertificate, confirmAction }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingCertificate, setEditingCertificate] = useState(null);
  const [busyCertificateId, setBusyCertificateId] = useState("");
  const [message, setMessage] = useState("");
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

  async function download(id, code) {
    if (String(id).startsWith("CERT-")) return;
    const blob = await api(`/api/certificates/download/${id}`, {}, session);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${code || "certificate"}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleEdit(event) {
    event.preventDefault();
    if (!editingCertificate) return;
    const form = new FormData(event.currentTarget);
    setMessage("");
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
      setMessage("Certificate updated.");
    } catch (error) {
      setMessage(readError(error));
    } finally {
      setBusyCertificateId("");
    }
  }

  async function handleRevoke(cert) {
    setOpenMenuId(null);
    const confirmed = await confirmAction({
      title: "Revoke certificate",
      message: `Revoke certificate ${displayCertificateId(cert)}? It will no longer verify publicly.`,
      confirmLabel: "Revoke Certificate",
      tone: "danger",
    });
    if (!confirmed) return;
    setMessage("");
    setBusyCertificateId(cert.id);
    try {
      await api(`/api/certificates/${cert.id}/revoke`, { method: "PATCH" }, session);
      await refresh();
      setMessage("Certificate revoked.");
    } catch (error) {
      setMessage(readError(error));
    } finally {
      setBusyCertificateId("");
    }
  }

  function startEdit(cert) {
    setOpenMenuId(null);
    setEditingCertificate(cert);
    setMessage("");
  }

  return (
    <div>
      <PageHeader title="Certificate Registry" description="Complete registry of all issued and pending certificates" />
      {editingCertificate && (
        <Panel title={`Edit ${displayCertificateId(editingCertificate)}`}>
          <form key={editingCertificate.id} onSubmit={handleEdit}>
            <FormField label="Recipient" required>
              <Select name="recipientId" required defaultValue={editingCertificate.recipientId} options={[{ value: "", label: "Select a recipient" }, ...data.recipients.map((recipient) => ({ value: recipient.id, label: `${recipient.fullName} - ${recipient.email}` }))]} />
            </FormField>
            <FormField label="Certificate Title" required><Input name="certificateTitle" defaultValue={editingCertificate.certificateTitle} required /></FormField>
            <FormField label="Signatory" required>
              <Select name="signatoryId" required defaultValue={editingCertificate.signatoryId} options={[{ value: "", label: "Select a signatory" }, ...data.signatories.map((signatory) => ({ value: signatory.id, label: `${signatory.name} - ${signatory.title}` }))]} />
            </FormField>
            <FormActions onCancel={() => setEditingCertificate(null)} submitLabel={busyCertificateId === editingCertificate.id ? "Saving..." : "Save Changes"} disabled={busyCertificateId === editingCertificate.id} />
          </form>
        </Panel>
      )}
      {message && <p className={`mb-4 text-xs ${message.includes("updated") || message.includes("revoked") ? "text-[#739EC9]" : "text-[#dc2626]"}`}>{message}</p>}
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
            { value: "pending", label: "Pending" },
            { value: "revoked", label: "Revoked" },
          ]}
        />
      </div>
      <Table
        columns={columns}
        data={filtered}
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

function Generate({ data, session, refresh }) {
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setGenerating(true);
    setMessage("");
    try {
      await api(
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
      event.currentTarget.reset();
      refresh();
      setMessage("Certificate generated.");
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
              <Select name="recipientId" required options={[{ value: "", label: "Select a recipient" }, ...data.recipients.map((recipient) => ({ value: recipient.id, label: `${recipient.fullName} - ${recipient.email}` }))]} />
            </FormField>
            <FormField label="Course" required>
              <Select name="courseId" required options={[{ value: "", label: "Select a course" }, ...data.courses.map((course) => ({ value: course.id, label: course.name }))]} />
            </FormField>
            <FormField label="Certificate Title" required><Input name="certificateTitle" placeholder="Certificate of Completion" required /></FormField>
            <FormField label="Signatory" required>
              <Select name="signatoryId" required options={[{ value: "", label: "Select a signatory" }, ...data.signatories.map((signatory) => ({ value: signatory.id, label: `${signatory.name} - ${signatory.title}` }))]} />
            </FormField>
            {message && <p className={`mb-4 text-xs ${message.includes("generated") ? "text-[#739EC9]" : "text-[#dc2626]"}`}>{message}</p>}
            <div className="mt-6">
              <Button type="submit" variant="primary" disabled={generating}>
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
                <li>Recipient must have completed the selected course</li>
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

function CertificateDetail({ certificateId, certificates, onBack, session }) {
  const certificate = certificates.find((cert) => cert.id === certificateId);
  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");

  useEffect(() => {
    if (!certificate) return undefined;

    let objectUrl = "";
    let cancelled = false;

    async function loadPdf() {
      setPdfLoading(true);
      setPdfError("");
      setPdfUrl("");
      try {
        const blob = await api(`/api/certificates/download/${certificate.id}`, {}, session);
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPdfUrl(`${objectUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`);
      } catch (error) {
        if (!cancelled) setPdfError(readError(error));
      } finally {
        if (!cancelled) setPdfLoading(false);
      }
    }

    loadPdf();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [certificate?.id, session.token]);

  async function download() {
    if (!certificate) return;
    const blob = await api(`/api/certificates/download/${certificate.id}`, {}, session);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${certificate.uniqueCode || "certificate"}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
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
        <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <div className="rounded border border-[#2a2a2a] bg-[#0a0a0a] p-3">
            <div className="min-h-[520px] overflow-hidden rounded border border-[#2a2a2a] bg-[#1a1a1a]">
              {pdfLoading && (
                <div className="flex min-h-[520px] items-center justify-center text-sm text-[#739EC9]">
                  Loading certificate PDF...
                </div>
              )}
              {pdfError && (
                <div className="flex min-h-[520px] items-center justify-center p-6 text-center">
                  <div>
                    <AlertCircle className="mx-auto mb-3 h-8 w-8 text-[#dc2626]" />
                    <p className="mb-2 text-sm text-[#FFE8DB]">Unable to load certificate PDF</p>
                    <p className="text-xs text-[#9a9a9a]">{pdfError}</p>
                  </div>
                </div>
              )}
              {pdfUrl && !pdfLoading && !pdfError && (
                <iframe
                  title={`${displayCertificateId(certificate)} PDF`}
                  src={pdfUrl}
                  className="h-[72vh] min-h-[520px] w-full bg-[#1a1a1a]"
                />
              )}
            </div>
          </div>
        </div>
        <div>
          <div className="mb-4 rounded border border-[#2a2a2a] bg-[#0a0a0a] p-6">
            <h3 className="mb-4 text-lg font-medium text-[#FFE8DB]">Certificate Details</h3>
            <div className="space-y-4">
              <Detail label="Certificate ID" value={displayCertificateId(certificate)} />
              <div><DetailLabel>Status</DetailLabel><StatusBadge status={normalizeStatus(certificate.status)} /></div>
              <Detail label="Verification Code" value={certificate.uniqueCode} mono />
              <Detail label="Issued Date" value={formatDate(certificate.issuedAt)} />
              <Detail label="Completion Date" value={formatDate(certificate.completionDate)} />
              <Detail label="Score / Grade" value={`${certificate.score ?? "--"} / ${certificate.grade || "--"}`} />
            </div>
          </div>
          <div className="space-y-2">
            <Button variant="primary" fullWidth onClick={download}><Download className="h-4 w-4" />Download PDF</Button>
            <Button variant="secondary" fullWidth><Share2 className="h-4 w-4" />Share Certificate</Button>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}

function SettingsPanel({ data }) {
  const [saving, setSaving] = useState(false);
  const [logoName, setLogoName] = useState("");
  const profile = data.profile || {};

  function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setTimeout(() => setSaving(false), 1000);
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <PageHeader title="Organization Settings" description="Manage your organization profile and preferences" />
      <div>
        <Panel title="Organization Profile">
          <form onSubmit={handleSubmit}>
            <FormField label="Organization Name" required><Input name="name" defaultValue={profile.name} required /></FormField>
            <FormField label="Contact Email" required><Input name="email" type="email" defaultValue={profile.email} required /></FormField>
            <FormField label="Website"><Input name="website" type="url" defaultValue={profile.website} /></FormField>
            <div className="mt-4">
              <FileUpload label="Organization Logo" accept="image/png,image/jpeg" onFileSelect={(file) => setLogoName(file?.name || "")} />
              <p className="mt-2 text-xs text-[#9a9a9a]">This logo will appear on all generated certificates</p>
              {logoName && <p className="mt-1 text-xs text-[#739EC9]">{logoName}</p>}
            </div>
            <div className="mt-6 border-t border-[#2a2a2a] pt-6">
              <Button type="submit" variant="primary" disabled={saving}>{saving ? "Saving Changes..." : "Save Changes"}</Button>
            </div>
          </form>
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

function Verify({ onBack }) {
  const [verificationCode, setVerificationCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [verifyError, setVerifyError] = useState("");

  async function handleVerify() {
    const code = verificationCode.trim();
    if (!code) {
      setResult(null);
      setVerifyError("Enter a verification code.");
      return;
    }
    setVerifying(true);
    setVerifyError("");
    setResult(null);
    try {
      const certificate = await api(`/api/verify/${encodeURIComponent(code)}`);
      setResult(certificate);
    } catch {
      setVerifyError("The verification code you entered could not be found in our system. Please check the code and try again.");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#000000] p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-medium tracking-tight text-[#FFE8DB]">Certificate Verification</h1>
          <p className="text-sm text-[#9a9a9a]">Verify the authenticity of a certificate</p>
        </div>
        <div className="mb-6 rounded border border-[#2a2a2a] bg-[#0a0a0a] p-6">
          <div className="mb-6 flex gap-3">
            <div className="flex-1">
              <Input value={verificationCode} onChange={(event) => setVerificationCode(event.target.value)} placeholder="Enter verification code (e.g., WD-A95-2026-1234)" />
            </div>
            <Button onClick={handleVerify} disabled={verifying}><Search className="h-4 w-4" />{verifying ? "Verifying..." : "Verify"}</Button>
          </div>
          {result && (
            <div className="rounded border border-[#5682B1]/30 bg-[#5682B1]/10 p-6">
              <div className="mb-4 flex items-start gap-3">
                <CheckCircle className="h-6 w-6 flex-shrink-0 text-[#5682B1]" />
                <div>
                  <h3 className="mb-1 text-lg font-medium text-[#FFE8DB]">Certificate Verified</h3>
                  <p className="text-sm text-[#9a9a9a]">This certificate is authentic and valid</p>
                </div>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Detail label="Recipient" value={result.recipientName || "--"} />
                <Detail label="Course" value={result.courseName || "--"} />
                <Detail label="Organization" value={result.organizationName || "--"} />
                <Detail label="Issued Date" value={formatDate(result.issuedAt)} />
                <Detail label="Verification Code" value={verificationCode.trim()} mono />
                <Detail label="Status" value={String(result.status || "--").toUpperCase()} accent />
              </div>
            </div>
          )}
          {verifyError && (
            <div className="rounded border border-[#dc2626]/30 bg-[#dc2626]/10 p-6">
              <div className="flex items-start gap-3">
                <XCircle className="h-6 w-6 flex-shrink-0 text-[#dc2626]" />
                <div>
                  <h3 className="mb-1 text-lg font-medium text-[#FFE8DB]">Certificate Not Found</h3>
                  <p className="text-sm text-[#9a9a9a]">{verifyError}</p>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="text-center">
          {onBack && <button onClick={onBack} className="mb-4 text-sm text-[#5682B1] hover:text-[#739EC9]">Back to dashboard</button>}
          <p className="text-xs text-[#9a9a9a]">Powered by <span className="text-[#5682B1]">{appName}</span> {appTagline}</p>
        </div>
      </div>
    </div>
  );
}

function ConfirmationDialog({ open, title, message, confirmLabel = "Confirm", tone = "danger", onCancel, onConfirm }) {
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

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="presentation" onMouseDown={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-title"
        className="w-full max-w-md rounded border border-[#2a2a2a] bg-[#0a0a0a] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.65)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start gap-4">
          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded border ${isDanger ? "border-[#dc2626]/30 bg-[#dc2626]/10 text-[#dc2626]" : "border-[#5682B1]/30 bg-[#5682B1]/10 text-[#739EC9]"}`}>
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h2 id="confirmation-title" className="mb-2 text-lg font-medium text-[#FFE8DB]">{title}</h2>
            <p className="text-sm leading-6 text-[#9a9a9a]">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-[#2a2a2a] pt-5">
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button variant={isDanger ? "danger" : "primary"} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}

function Button({ children, onClick, variant = "primary", size = "md", disabled = false, type = "button", fullWidth = false }) {
  const variants = {
    primary: "bg-[#5682B1] text-[#000000] hover:bg-[#739EC9]",
    secondary: "bg-[#1a1a1a] text-[#FFE8DB] border border-[#2a2a2a] hover:bg-[#2a2a2a]",
    ghost: "text-[#FFE8DB] hover:bg-[#1a1a1a]",
    danger: "bg-[#dc2626] text-[#FFE8DB] hover:bg-[#b91c1c]",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`inline-flex items-center justify-center gap-2 rounded transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""}`}>
      {children}
    </button>
  );
}

function PageHeader({ title, description, action }) {
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

function MetricCard({ label, value, icon, trend }) {
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

function FormField({ label, error, required, children }) {
  return (
    <div className="mb-4">
      <label className="mb-2 block text-sm font-medium text-[#FFE8DB]">
        {label}
        {required && <span className="ml-1 text-[#dc2626]">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-[#dc2626]">{error}</p>}
    </div>
  );
}

function Input(props) {
  const { className = "", ...rest } = props;
  return <input {...rest} className={inputClass(className)} />;
}

function Textarea({ className = "", ...props }) {
  return <textarea {...props} className={`w-full resize-none rounded border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-[#FFE8DB] placeholder:text-[#5a5a5a] focus:border-[#5682B1] focus:outline-none ${className}`} />;
}

function Select({ options, className = "", value, defaultValue = "", onChange, name, required, disabled }) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(value ?? defaultValue ?? "");
  const wrapperRef = useRef(null);
  const selectedValue = value ?? internalValue;
  const selectedOption = options.find((option) => String(option.value) === String(selectedValue)) || options[0];

  useEffect(() => {
    if (value !== undefined) setInternalValue(value);
  }, [value]);

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
  }

  function handleKeyDown(event) {
    if (disabled) return;
    const currentIndex = Math.max(0, options.findIndex((option) => String(option.value) === String(selectedValue)));
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen((current) => !current);
    }
    if (event.key === "Escape") setOpen(false);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      const nextIndex = (currentIndex + direction + options.length) % options.length;
      choose(options[nextIndex]);
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
          {options.map((option) => {
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
        </div>
      )}
    </div>
  );
}

function FileUpload({ label, accept, onFileSelect, preview }) {
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

function Table({ columns, data, renderRow, emptyMessage = "No data available" }) {
  if (data.length === 0) {
    return (
      <div className="rounded border border-[#2a2a2a] bg-[#0a0a0a]">
        <div className="p-12 text-center">
          <p className="text-sm text-[#9a9a9a]">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded border border-[#2a2a2a] bg-[#0a0a0a]">
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
        <tbody className="divide-y divide-[#2a2a2a]">{data.map((item, index) => renderRow(item, index))}</tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    issued: "bg-[#5682B1]/20 text-[#5682B1] border-[#5682B1]/30",
    pending: "bg-[#FFE8DB]/20 text-[#FFE8DB] border-[#FFE8DB]/30",
    active: "bg-[#739EC9]/20 text-[#739EC9] border-[#739EC9]/30",
    revoked: "bg-[#dc2626]/20 text-[#dc2626] border-[#dc2626]/30",
    inactive: "bg-[#2a2a2a] text-[#9a9a9a] border-[#2a2a2a]",
  };
  return <span className={`inline-flex rounded border px-2 py-0.5 text-xs ${styles[status] || styles.pending}`}>{capitalize(status)}</span>;
}

function Panel({ title, children }) {
  return (
    <div className="mb-6 rounded border border-[#2a2a2a] bg-[#0a0a0a] p-6">
      <h3 className="mb-4 text-lg font-medium text-[#FFE8DB]">{title}</h3>
      {children}
    </div>
  );
}

function FormActions({ onCancel, submitLabel, disabled = false }) {
  return (
    <div className="mt-6 flex gap-3">
      <Button type="submit" variant="primary" disabled={disabled}>{submitLabel}</Button>
      <Button variant="secondary" onClick={onCancel}>Cancel</Button>
    </div>
  );
}

function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="mb-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a9a9a]" />
        <input type="text" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={inputClass("pl-10")} />
      </div>
    </div>
  );
}

function IconButton({ title, icon: Icon, onClick }) {
  return (
    <button onClick={onClick} className="text-[#9a9a9a] hover:text-[#5682B1]" title={title} aria-label={title}>
      <Icon className="h-4 w-4" />
    </button>
  );
}

function RowActionMenu({
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

function SignaturePreview({ signatory, session }) {
  const [imageUrl, setImageUrl] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!signatory.signatureUrl) return undefined;

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
  }, [signatory.id, signatory.signatureUrl, session.token]);

  if (!signatory.signatureUrl || failed) {
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

function Detail({ label, value, mono, accent }) {
  return (
    <div>
      <DetailLabel>{label}</DetailLabel>
      <p className={`text-sm ${mono ? "font-mono" : ""} ${accent || mono ? "text-[#739EC9]" : "text-[#FFE8DB]"}`}>{value}</p>
    </div>
  );
}

function DetailLabel({ children }) {
  return <p className="mb-1 text-xs uppercase tracking-wider text-[#9a9a9a]">{children}</p>;
}

function StatBlock({ label, value }) {
  return (
    <div className="rounded border border-[#2a2a2a] bg-[#1a1a1a] p-4">
      <p className="mb-1 text-xs uppercase tracking-wider text-[#9a9a9a]">{label}</p>
      <p className="text-[#FFE8DB]">{value}</p>
    </div>
  );
}

function inputClass(extra = "") {
  return `themed-input w-full rounded border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-[#FFE8DB] placeholder:text-[#5a5a5a] focus:border-[#5682B1] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${extra}`;
}

function filterRows(rows, query, keys) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return rows;
  return rows.filter((row) => keys.some((key) => String(row[key] || "").toLowerCase().includes(normalized)));
}

function normalizeStatus(status = "pending") {
  const value = String(status).toLowerCase();
  if (value === "issued") return "issued";
  if (value === "revoked") return "revoked";
  if (value === "active") return "active";
  if (value === "inactive") return "inactive";
  return "pending";
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

function formatDate(value) {
  if (!value) return "--";
  const stringValue = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(stringValue)) return stringValue.slice(0, 10);
  try {
    return new Intl.DateTimeFormat("en-CA").format(new Date(value));
  } catch {
    return stringValue;
  }
}

function displayCertificateId(cert) {
  return String(cert.id || "").startsWith("CERT-") ? cert.id : cert.uniqueCode || shortId(cert.id);
}

function courseName(courses, id) {
  return courses.find((course) => String(course.id) === String(id))?.name || "Unassigned";
}

function shortId(value = "") {
  return value ? `${String(value).slice(0, 4)}...${String(value).slice(-4)}` : "CERT-0000";
}

function capitalize(value) {
  const text = String(value || "");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function readError(error) {
  if (!error?.message) return "Something went wrong.";
  try {
    const parsed = JSON.parse(error.message);
    return parsed.message || parsed.error || error.message;
  } catch {
    return error.message;
  }
}

createRoot(document.getElementById("root")).render(<App />);
