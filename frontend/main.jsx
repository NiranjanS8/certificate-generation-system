import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Award,
  BadgeCheck,
  BookOpen,
  Building2,
  Check,
  ChevronDown,
  CircleUserRound,
  Download,
  FileCheck2,
  Gauge,
  LogOut,
  Menu,
  PenLine,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  UsersRound,
  X,
} from "lucide-react";
import "./styles.css";

const storageKey = "certificate-authority-session";

const emptySession = {
  token: "",
  refreshToken: "",
  email: "",
  orgId: "",
};

const sampleCertificates = [
  {
    id: "demo-1",
    recipientName: "Eleanor Vance",
    courseName: "Degree Authentication",
    certificateTitle: "Advanced Credential Verification",
    uniqueCode: "0x7F...3B2A",
    status: "ISSUED",
    issuedAt: "2026-04-27T09:42:00",
  },
  {
    id: "demo-2",
    recipientName: "Marcus Holloway",
    courseName: "Professional License",
    certificateTitle: "Professional License",
    uniqueCode: "0xA1...9C4D",
    status: "PENDING",
    issuedAt: "2026-04-26T17:14:00",
  },
  {
    id: "demo-3",
    recipientName: "Sarah Chen",
    courseName: "Identity Verification",
    certificateTitle: "Identity Verification",
    uniqueCode: "0x4B...8E1F",
    status: "ISSUED",
    issuedAt: "2026-04-25T11:08:00",
  },
];

const api = async (path, options = {}, session = emptySession) => {
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
};

function App() {
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || emptySession;
    } catch {
      return emptySession;
    }
  });
  const [activeView, setActiveView] = useState("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    profile: null,
    certificates: [],
    recipients: [],
    courses: [],
    signatories: [],
  });
  const [apiError, setApiError] = useState("");

  const authenticated = Boolean(session.token);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(session));
  }, [session]);

  useEffect(() => {
    if (!authenticated) return;
    loadWorkspace();
  }, [authenticated]);

  const loadWorkspace = async () => {
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
  };

  const handleAuth = async (event) => {
    event.preventDefault();
    setLoading(true);
    setAuthError("");
    const form = new FormData(event.currentTarget);
    const payload =
      authMode === "login"
        ? {
            email: form.get("email"),
            password: form.get("password"),
          }
        : {
            name: form.get("name"),
            email: form.get("email"),
            password: form.get("password"),
            website: form.get("website"),
          };

    try {
      if (authMode === "register") {
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
  };

  const logout = () => {
    setSession(emptySession);
    setData({ profile: null, certificates: [], recipients: [], courses: [], signatories: [] });
    localStorage.removeItem(storageKey);
  };

  if (!authenticated) {
    return (
      <AuthScreen
        mode={authMode}
        setMode={setAuthMode}
        error={authError}
        loading={loading}
        onSubmit={handleAuth}
      />
    );
  }

  return (
    <div className="min-h-screen bg-ink text-paper">
      <Noise />
      <SideNav
        activeView={activeView}
        setActiveView={(view) => {
          setActiveView(view);
          setMobileNavOpen(false);
        }}
        profile={data.profile}
        email={session.email}
        onLogout={logout}
        mobileOpen={mobileNavOpen}
      />
      <button
        className="fixed right-4 top-4 z-50 flex h-11 w-11 items-center justify-center border border-line bg-ink text-paper lg:hidden"
        onClick={() => setMobileNavOpen((open) => !open)}
        aria-label="Toggle navigation"
      >
        {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      <main className="min-h-screen lg:ml-80">
        <TopBar activeView={activeView} email={session.email} />
        {apiError && (
          <div className="mx-4 mt-6 border border-primary/70 bg-primary/10 px-4 py-3 text-sm text-primary-soft lg:mx-12">
            {apiError}
          </div>
        )}
        <Workspace
          activeView={activeView}
          data={data}
          loading={loading}
          session={session}
          refresh={loadWorkspace}
        />
      </main>
    </div>
  );
}

function AuthScreen({ mode, setMode, error, loading, onSubmit }) {
  const isRegister = mode === "register";

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink text-paper">
      <Noise />
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="flex min-h-[44vh] flex-col justify-between border-b border-line p-8 sm:p-12 lg:min-h-screen lg:border-b-0 lg:border-r lg:p-16">
          <div>
            <div className="inline-flex items-center gap-3 border border-line px-4 py-3 text-xs font-black uppercase tracking-[0.22em]">
              <ShieldCheck size={18} className="text-primary" />
              Credential Authority
            </div>
          </div>
          <div className="max-w-4xl">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-muted">
              Certificate System
            </p>
            <h1 className="font-display text-[4.5rem] font-black uppercase leading-[0.86] tracking-tighter text-paper sm:text-[7rem] lg:text-[8.6rem]">
              Secure.
              <br />
              Issue.
              <br />
              Verify.
            </h1>
          </div>
          <div className="grid gap-4 text-sm text-muted sm:grid-cols-3">
            <MetricLabel label="Mode" value="Dark Fidelity" />
            <MetricLabel label="Grid" value="8 px" />
            <MetricLabel label="Status" value="Ready" />
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-[520px] border border-line bg-surface p-6 sm:p-8">
            <div className="mb-8 flex items-start justify-between gap-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Access node</p>
                <h2 className="mt-3 font-display text-4xl font-black uppercase tracking-tighter">
                  {isRegister ? "Create Authority" : "Sign In"}
                </h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center bg-primary text-ink">
                <Building2 size={24} />
              </div>
            </div>

            <form className="space-y-5" onSubmit={onSubmit}>
              {isRegister && (
                <>
                  <Field label="Organization Name" name="name" placeholder="Nexus Institute" required />
                  <Field label="Website" name="website" placeholder="https://example.edu" />
                </>
              )}
              <Field label="Email" name="email" type="email" placeholder="admin@example.edu" required />
              <Field label="Password" name="password" type="password" placeholder="Minimum 8 characters" required />

              {error && <div className="border border-primary/70 bg-primary/10 p-3 text-sm text-primary-soft">{error}</div>}

              <button
                className="flex h-12 w-full items-center justify-center gap-3 bg-primary px-5 text-sm font-black uppercase tracking-[0.14em] text-paper transition-colors hover:bg-[#d72323] disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Processing" : isRegister ? "Create And Enter" : "Authenticate"}
                <BadgeCheck size={18} />
              </button>
            </form>

            <button
              className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-muted underline decoration-primary decoration-4 underline-offset-8 transition-colors hover:text-paper"
              onClick={() => setMode(isRegister ? "login" : "register")}
            >
              {isRegister ? "Use existing authority" : "Register a new authority"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function SideNav({ activeView, setActiveView, profile, email, onLogout, mobileOpen }) {
  const nav = [
    ["dashboard", "Dashboard", Gauge],
    ["recipients", "Recipients", UsersRound],
    ["certificates", "Certificates", BadgeCheck],
    ["generate", "Generate", Award],
    ["signatories", "Signatories", PenLine],
    ["settings", "Settings", Settings],
  ];

  return (
    <nav
      className={`fixed left-0 top-0 z-40 flex h-screen w-80 flex-col border-r border-line bg-ink p-8 transition-transform duration-300 lg:translate-x-0 lg:p-12 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="mb-12">
        <h1 className="mb-2 text-2xl font-black uppercase tracking-[0.22em] text-paper">Credential</h1>
        <p className="font-display text-4xl font-black uppercase tracking-tighter text-paper/50">Authority</p>
      </div>

      <div className="flex flex-grow flex-col gap-7">
        {nav.map(([id, label, Icon]) => (
          <button
            key={id}
            className={`group relative flex items-center gap-4 pb-2 text-left text-paper transition-colors after:absolute after:bottom-0 after:left-0 after:h-1 after:bg-primary after:transition-all ${
              activeView === id ? "after:w-full" : "text-paper/50 after:w-0 hover:text-paper hover:after:w-full"
            }`}
            onClick={() => setActiveView(id)}
          >
            <Icon size={23} strokeWidth={2} />
            <span className="text-xs font-black uppercase tracking-[0.18em]">{label}</span>
          </button>
        ))}
      </div>

      <div className="mt-auto border-t border-line pt-8">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center border border-line bg-surface">
            <CircleUserRound size={24} className="text-primary-soft" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-black uppercase tracking-[0.14em] text-paper">
              {profile?.name || "Admin User"}
            </p>
            <p className="truncate text-xs text-paper/50">{email}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex w-full items-center justify-between border border-line px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-paper/70 transition-colors hover:border-primary hover:text-paper"
        >
          Logout
          <LogOut size={17} />
        </button>
      </div>
    </nav>
  );
}

function TopBar({ activeView, email }) {
  const labels = {
    dashboard: "System.Overview",
    recipients: "Recipient.Index",
    certificates: "Certificate.Registry",
    generate: "Issue.Certificate",
    signatories: "Signatory.Vault",
    settings: "Authority.Settings",
  };

  return (
    <header className="flex w-full flex-col justify-between gap-4 border-b border-line px-4 py-6 sm:px-8 lg:flex-row lg:items-end lg:px-12">
      <h2 className="font-display text-4xl font-black uppercase tracking-tighter text-primary sm:text-6xl lg:text-7xl">
        {labels[activeView]}
      </h2>
      <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.14em] text-paper">
        User.Profile
        <span className="max-w-[220px] truncate text-paper/50">{email}</span>
      </div>
    </header>
  );
}

function Workspace({ activeView, data, loading, session, refresh }) {
  if (activeView === "dashboard") return <Dashboard data={data} loading={loading} />;
  if (activeView === "recipients") return <Recipients data={data} session={session} refresh={refresh} />;
  if (activeView === "certificates") return <Certificates data={data} session={session} />;
  if (activeView === "generate") return <GenerateCertificate data={data} session={session} refresh={refresh} />;
  if (activeView === "signatories") return <Signatories data={data} session={session} refresh={refresh} />;
  return <SettingsPanel data={data} session={session} refresh={refresh} />;
}

function Dashboard({ data, loading }) {
  const certificates = data.certificates.length ? data.certificates : sampleCertificates;
  const issued = data.certificates.filter((cert) => cert.status === "ISSUED").length || 24892;
  const activeRecipients = data.recipients.length || 18405;

  return (
    <div className="flex flex-col gap-20 px-4 py-8 pb-24 sm:px-8 lg:gap-32 lg:p-12">
      <section className="grid grid-cols-12 gap-8">
        <div className="col-span-12 flex flex-col justify-end lg:col-span-7">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-paper/50">
            Total Certificates Issued
          </p>
          <h3 className="font-display text-[5rem] font-black leading-[0.9] tracking-tighter text-paper sm:text-[7.5rem] lg:text-[8rem]">
            {formatNumber(issued)}
          </h3>
        </div>
        <div className="col-span-12 flex flex-col justify-end border-t border-line pt-8 lg:col-span-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-paper/50">Active Recipients</p>
          <h3 className="font-display text-[5rem] font-black leading-[0.9] tracking-tighter text-primary sm:text-[7.5rem] lg:text-[8rem]">
            {formatNumber(activeRecipients)}
          </h3>
        </div>
      </section>

      <Divider />

      <section className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-3">
          <h4 className="font-display text-5xl font-black leading-none tracking-tighter text-paper">
            Recent
            <br />
            Activity
          </h4>
          <p className="mt-8 max-w-sm text-base leading-7 text-paper/50">
            Live feed of certificate issuance events and verification state across this authority.
          </p>
          {loading && <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-primary">Syncing</p>}
        </div>
        <ActivityTable certificates={certificates.slice(0, 5)} />
      </section>
    </div>
  );
}

function ActivityTable({ certificates }) {
  return (
    <div className="col-span-12 flex flex-col overflow-x-auto lg:col-span-9">
      <div className="grid min-w-[720px] grid-cols-12 gap-4 border-b border-paper/50 px-4 pb-4">
        <TableHead className="col-span-3">Hash ID</TableHead>
        <TableHead className="col-span-4">Recipient</TableHead>
        <TableHead className="col-span-3">Type</TableHead>
        <TableHead className="col-span-2 text-right">Status</TableHead>
      </div>
      {certificates.map((cert) => (
        <div
          className="grid min-w-[720px] grid-cols-12 gap-4 border-b border-line px-4 py-7 transition-colors hover:bg-surface-low"
          key={cert.id}
        >
          <div className="col-span-3 truncate pr-4 font-mono text-sm text-paper">{cert.uniqueCode || shortId(cert.id)}</div>
          <div className="col-span-4 text-base text-paper">{cert.recipientName || "Unassigned Recipient"}</div>
          <div className="col-span-3 text-base text-paper/70">{cert.courseName || cert.certificateTitle}</div>
          <div className="col-span-2 flex items-center justify-end gap-2">
            <span className={`h-2 w-2 ${cert.status === "ISSUED" ? "bg-primary" : "bg-paper/50"}`} />
            <span className={`text-xs font-black uppercase tracking-[0.14em] ${cert.status === "ISSUED" ? "text-primary" : "text-paper/50"}`}>
              {cert.status || "Pending"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Recipients({ data, session, refresh }) {
  const [message, setMessage] = useState("");

  const createRecipient = async (event) => {
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
      event.currentTarget.reset();
      setMessage("Recipient created.");
      refresh();
    } catch (error) {
      setMessage(readError(error));
    }
  };

  return (
    <SplitView
      title="Recipients"
      intro="Create and inspect recipients before certificates are issued."
      aside={<RecipientForm courses={data.courses} onSubmit={createRecipient} message={message} />}
    >
      <DataList
        empty="No recipients yet."
        items={data.recipients}
        render={(recipient) => (
          <DataRow
            key={recipient.id}
            title={recipient.fullName}
            meta={recipient.email || "No email"}
            right={recipient.grade || `${recipient.score ?? 0}%`}
            subtitle={recipient.courseName || shortId(recipient.courseId)}
          />
        )}
      />
    </SplitView>
  );
}

function Certificates({ data, session }) {
  const certificates = data.certificates;

  const download = async (id, code) => {
    const blob = await api(`/api/certificates/download/${id}`, {}, session);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${code || "certificate"}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <SplitView
      title="Certificates"
      intro="Issued credentials, verification codes, and downloadable PDF artifacts."
      aside={<RegistrySummary certificates={certificates} />}
    >
      <DataList
        empty="No certificates generated yet."
        items={certificates}
        render={(cert) => (
          <div key={cert.id} className="grid gap-4 border-b border-line px-4 py-6 transition-colors hover:bg-surface-low md:grid-cols-[1fr_auto]">
            <div>
              <p className="text-lg font-bold text-paper">{cert.certificateTitle}</p>
              <p className="mt-1 text-sm text-paper/50">
                {cert.recipientName} / {cert.courseName || "Credential"}
              </p>
              <p className="mt-3 font-mono text-xs uppercase tracking-[0.12em] text-primary-soft">{cert.uniqueCode}</p>
            </div>
            <button
              className="flex h-11 items-center justify-center gap-2 border border-line px-4 text-xs font-black uppercase tracking-[0.14em] transition-colors hover:border-primary"
              onClick={() => download(cert.id, cert.uniqueCode)}
            >
              <Download size={16} />
              PDF
            </button>
          </div>
        )}
      />
    </SplitView>
  );
}

function GenerateCertificate({ data, session, refresh }) {
  const [message, setMessage] = useState("");

  const generate = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
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
      setMessage("Certificate issued.");
      refresh();
    } catch (error) {
      setMessage(readError(error));
    }
  };

  return (
    <div className="grid gap-8 px-4 py-8 pb-24 sm:px-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:p-12">
      <section className="border border-line bg-surface p-6 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Generation node</p>
        <h3 className="mt-4 font-display text-5xl font-black uppercase leading-none tracking-tighter text-paper sm:text-6xl">
          Issue Certificate
        </h3>
        <form className="mt-10 grid gap-5" onSubmit={generate}>
          <SelectField label="Recipient" name="recipientId" required>
            <option value="">Select recipient</option>
            {data.recipients.map((recipient) => (
              <option key={recipient.id} value={recipient.id}>
                {recipient.fullName}
              </option>
            ))}
          </SelectField>
          <SelectField label="Signatory" name="signatoryId" required>
            <option value="">Select signatory</option>
            {data.signatories.map((signatory) => (
              <option key={signatory.id} value={signatory.id}>
                {signatory.name} / {signatory.title || "Signer"}
              </option>
            ))}
          </SelectField>
          <Field label="Certificate Title" name="certificateTitle" placeholder="Certificate of Completion" required />
          {message && <FormMessage>{message}</FormMessage>}
          <button className="mt-3 flex h-12 items-center justify-center gap-3 bg-primary px-5 text-sm font-black uppercase tracking-[0.14em] transition-colors hover:bg-[#d72323]">
            Generate
            <FileCheck2 size={18} />
          </button>
        </form>
      </section>
      <section className="grid content-start gap-4">
        <ActionCard icon={UsersRound} label="Recipients" value={data.recipients.length} />
        <ActionCard icon={PenLine} label="Signatories" value={data.signatories.length} />
        <ActionCard icon={BadgeCheck} label="Certificates" value={data.certificates.length} />
      </section>
    </div>
  );
}

function Signatories({ data, session, refresh }) {
  const [message, setMessage] = useState("");

  const createSignatory = async (event) => {
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
      event.currentTarget.reset();
      setMessage("Signatory added.");
      refresh();
    } catch (error) {
      setMessage(readError(error));
    }
  };

  return (
    <SplitView
      title="Signatories"
      intro="Manage authorized signatures used during certificate generation."
      aside={<SignatoryForm onSubmit={createSignatory} message={message} />}
    >
      <DataList
        empty="No signatories configured yet."
        items={data.signatories}
        render={(signatory) => (
          <DataRow
            key={signatory.id}
            title={signatory.name}
            meta={signatory.title || "Authorized signer"}
            subtitle={signatory.defaultSignatory ? "Default signatory" : shortId(signatory.id)}
            right={signatory.defaultSignatory ? "Default" : "Active"}
          />
        )}
      />
    </SplitView>
  );
}

function SettingsPanel({ data, session, refresh }) {
  const [message, setMessage] = useState("");

  const createCourse = async (event) => {
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
      event.currentTarget.reset();
      setMessage("Course created.");
      refresh();
    } catch (error) {
      setMessage(readError(error));
    }
  };

  return (
    <SplitView
      title={data.profile?.name || "Authority Settings"}
      intro="Course catalog and organization context used for recipient eligibility."
      aside={<CourseForm onSubmit={createCourse} message={message} />}
    >
      <DataList
        empty="No courses configured yet."
        items={data.courses}
        render={(course) => (
          <DataRow
            key={course.id}
            title={course.name}
            meta={course.description || "No description"}
            subtitle={`Minimum score ${course.minScore ?? 0}`}
            right={course.active === false ? "Inactive" : "Active"}
          />
        )}
      />
    </SplitView>
  );
}

function SplitView({ title, intro, aside, children }) {
  return (
    <div className="grid gap-8 px-4 py-8 pb-24 sm:px-8 lg:grid-cols-[340px_minmax(0,1fr)] lg:p-12">
      <aside>
        <h3 className="font-display text-5xl font-black uppercase leading-none tracking-tighter text-paper">{title}</h3>
        <p className="mt-6 text-base leading-7 text-paper/50">{intro}</p>
        <div className="mt-8">{aside}</div>
      </aside>
      <section className="min-w-0 border border-line bg-surface">{children}</section>
    </div>
  );
}

function RecipientForm({ courses, onSubmit, message }) {
  return (
    <FormPanel onSubmit={onSubmit} message={message} submitLabel="Create Recipient">
      <Field label="Full Name" name="fullName" placeholder="Avery Stone" required />
      <Field label="Email" name="email" type="email" placeholder="avery@example.edu" />
      <SelectField label="Course" name="courseId" required>
        <option value="">Select course</option>
        {courses.map((course) => (
          <option key={course.id} value={course.id}>
            {course.name}
          </option>
        ))}
      </SelectField>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Score" name="score" type="number" min="0" max="100" placeholder="92" />
        <Field label="Grade" name="grade" placeholder="A" />
      </div>
      <Field label="Completion Date" name="completionDate" type="date" required />
    </FormPanel>
  );
}

function SignatoryForm({ onSubmit, message }) {
  return (
    <FormPanel onSubmit={onSubmit} message={message} submitLabel="Add Signatory">
      <Field label="Name" name="name" placeholder="Dr. Alina Rhodes" required />
      <Field label="Title" name="title" placeholder="Director of Credentials" />
    </FormPanel>
  );
}

function CourseForm({ onSubmit, message }) {
  return (
    <FormPanel onSubmit={onSubmit} message={message} submitLabel="Create Course">
      <Field label="Course Name" name="name" placeholder="Applied Cryptography" required />
      <Field label="Description" name="description" placeholder="Credential program summary" />
      <Field label="Minimum Score" name="minScore" type="number" min="0" max="100" placeholder="60" />
    </FormPanel>
  );
}

function FormPanel({ onSubmit, message, submitLabel, children }) {
  return (
    <form className="grid gap-4 border border-line bg-surface-low p-5" onSubmit={onSubmit}>
      {children}
      {message && <FormMessage>{message}</FormMessage>}
      <button className="mt-2 flex h-11 items-center justify-center gap-2 bg-primary px-4 text-xs font-black uppercase tracking-[0.14em] transition-colors hover:bg-[#d72323]">
        <Plus size={16} />
        {submitLabel}
      </button>
    </form>
  );
}

function RegistrySummary({ certificates }) {
  const issued = certificates.filter((cert) => cert.status === "ISSUED").length;
  return (
    <div className="grid gap-4">
      <ActionCard icon={Check} label="Issued" value={issued} />
      <ActionCard icon={Search} label="Total Records" value={certificates.length} />
      <ActionCard icon={ChevronDown} label="Pending" value={Math.max(certificates.length - issued, 0)} />
    </div>
  );
}

function DataList({ items, render, empty }) {
  if (!items.length) {
    return (
      <div className="flex min-h-[320px] items-center justify-center p-10 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-paper/50">{empty}</p>
      </div>
    );
  }
  return <div className="min-w-0">{items.map(render)}</div>;
}

function DataRow({ title, meta, subtitle, right }) {
  return (
    <div className="grid gap-3 border-b border-line px-4 py-6 transition-colors hover:bg-surface-low md:grid-cols-[1fr_auto]">
      <div className="min-w-0">
        <p className="truncate text-lg font-bold text-paper">{title}</p>
        <p className="mt-1 truncate text-sm text-paper/50">{meta}</p>
        <p className="mt-3 font-mono text-xs uppercase tracking-[0.12em] text-primary-soft">{subtitle}</p>
      </div>
      <div className="self-start border border-line px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-paper/70">
        {right}
      </div>
    </div>
  );
}

function ActionCard({ icon: Icon, label, value }) {
  return (
    <div className="border border-line bg-surface p-6">
      <div className="mb-8 flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-paper/50">{label}</p>
        <Icon size={20} className="text-primary" />
      </div>
      <p className="font-display text-5xl font-black uppercase tracking-tighter text-paper">{formatNumber(value)}</p>
    </div>
  );
}

function Field({ label, className = "", ...props }) {
  return (
    <label className={`grid gap-2 ${className}`}>
      <span className="text-xs font-bold uppercase tracking-[0.16em] text-paper/60">{label}</span>
      <input
        className="h-11 border border-line bg-ink px-3 text-sm text-paper outline-none transition-colors placeholder:text-paper/28 focus:border-primary"
        {...props}
      />
    </label>
  );
}

function SelectField({ label, children, ...props }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-bold uppercase tracking-[0.16em] text-paper/60">{label}</span>
      <select
        className="h-11 border border-line bg-ink px-3 text-sm text-paper outline-none transition-colors focus:border-primary"
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

function MetricLabel({ label, value }) {
  return (
    <div className="border-t border-line pt-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-paper/40">{label}</p>
      <p className="mt-2 text-sm font-bold uppercase tracking-[0.1em] text-paper">{value}</p>
    </div>
  );
}

function TableHead({ children, className }) {
  return <div className={`text-xs font-black uppercase tracking-[0.16em] text-paper/50 ${className}`}>{children}</div>;
}

function FormMessage({ children }) {
  return <div className="border border-line bg-ink px-3 py-2 text-sm text-primary-soft">{children}</div>;
}

function Divider() {
  return <div className="h-px w-full bg-paper opacity-20" />;
}

function Noise() {
  return <div className="pointer-events-none fixed inset-0 z-[60] opacity-[0.035] noise" />;
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

function shortId(value = "") {
  return value ? `${value.slice(0, 4)}...${value.slice(-4)}` : "0x00...0000";
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
