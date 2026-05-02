import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
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
import { api, appName, appTagline, emptySession, storageKey } from "./api/client.js";
import { Button } from "./components/Button.jsx";
import { ConfirmationDialog, Toast } from "./components/Feedback.jsx";
import { capitalize, courseName, displayCertificateId, filterRows, formatDate, formatNumber, normalizeStatus, readError } from "./utils/format.js";
import "./styles.css";

function App() {
  const initialVerificationCode = new URLSearchParams(window.location.search).get("verify") || "";
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || emptySession;
    } catch {
      return emptySession;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(session.token));
  const [currentPage, setCurrentPage] = useState(initialVerificationCode ? "verify" : "dashboard");
  const [authView, setAuthView] = useState("landing");
  const [publicVerificationCode, setPublicVerificationCode] = useState(initialVerificationCode);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [apiError, setApiError] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [toast, setToast] = useState(null);
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

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(null), 4800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  function notify(message, tone = "success") {
    const nextToast = typeof message === "object" ? message : { title: message };
    setToast({ id: Date.now(), tone, ...nextToast });
  }

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
      setCurrentPage("dashboard");
    } catch (error) {
      setAuthError(readError(error));
    } finally {
      setLoading(false);
    }
  }

  function performLogout() {
    setSession(emptySession);
    setData({ profile: null, certificates: [], recipients: [], courses: [], signatories: [] });
    setCurrentPage("dashboard");
    localStorage.removeItem(storageKey);
  }

  async function requestLogout() {
    const confirmed = await confirmAction({
      title: "Sign out?",
      message: "You will return to the public site and need to sign in again to manage certificates.",
      confirmLabel: "Sign out",
      tone: "default",
    });
    if (confirmed) performLogout();
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
    return (
      <Verify
        initialCode={publicVerificationCode}
        onBack={() => {
          setCurrentPage("dashboard");
          setAuthView("landing");
        }}
        backLabel="Back to home"
      />
    );
  }

  if (!isAuthenticated) {
    if (authView === "landing") {
      return (
        <PublicLanding
          onNavigateToLogin={() => setAuthView("login")}
          onNavigateToRegister={() => setAuthView("register")}
          onNavigateToVerify={(code = "") => {
            setPublicVerificationCode(code);
            setCurrentPage("verify");
          }}
        />
      );
    }

    return authView === "login" ? (
      <Login
        error={authError}
        loading={loading}
        onSubmit={handleAuth}
        onNavigateToRegister={() => setAuthView("register")}
        onNavigateToLanding={() => setAuthView("landing")}
        onNavigateToVerify={() => {
          setPublicVerificationCode("");
          setCurrentPage("verify");
        }}
      />
    ) : (
      <Register
        error={authError}
        loading={loading}
        onSubmit={handleAuth}
        onNavigateToLogin={() => setAuthView("login")}
        onNavigateToLanding={() => setAuthView("landing")}
      />
    );
  }

  if (currentPage === "verify") {
    return <Verify initialCode={publicVerificationCode} onBack={() => setCurrentPage("dashboard")} backLabel="Back to dashboard" />;
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
        onLogout={requestLogout}
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
            notify={notify}
          />
        )}
      </main>
      <Toast toast={toast} onClose={() => setToast(null)} />
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

function PublicLanding({ onNavigateToLogin, onNavigateToRegister, onNavigateToVerify }) {
  return (
    <div className="min-h-screen bg-[#000000] text-[#FFE8DB]">
      <LandingNavigation onNavigateToLogin={onNavigateToLogin} onNavigateToRegister={onNavigateToRegister} />
      <LandingHero onNavigateToRegister={onNavigateToRegister} onNavigateToVerify={() => onNavigateToVerify("")} />
      <LandingFeatures />
      <LandingWorkflow />
      <LandingSecurity />
      <LandingVerification onNavigateToVerify={onNavigateToVerify} />
      <LandingFooter />
    </div>
  );
}

function LandingNavigation({ onNavigateToLogin, onNavigateToRegister }) {
  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-[#2a2a2a] bg-[#000000]/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-8">
            <div>
              <div className="text-lg font-semibold text-[#FFE8DB]">{appName}</div>
              <div className="text-xs text-[#9a9a9a]">{appTagline}</div>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <a href="#features" className="text-sm text-[#9a9a9a] transition-colors hover:text-[#FFE8DB]">Features</a>
              <a href="#workflow" className="text-sm text-[#9a9a9a] transition-colors hover:text-[#FFE8DB]">Workflow</a>
              <a href="#verification" className="text-sm text-[#9a9a9a] transition-colors hover:text-[#FFE8DB]">Verification</a>
              <a href="#security" className="text-sm text-[#9a9a9a] transition-colors hover:text-[#FFE8DB]">Security</a>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ghost" onClick={onNavigateToLogin}>Sign In</Button>
            <Button onClick={onNavigateToRegister}>Get Started</Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function LandingHero({ onNavigateToRegister, onNavigateToVerify }) {
  return (
    <section className="px-6 pb-16 pt-36 md:pt-40">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <h1 className="mb-6 text-4xl font-semibold leading-tight text-[#FFE8DB] md:text-6xl">
            Issue trusted certificates without manual paperwork
          </h1>
          <p className="mb-8 text-lg leading-relaxed text-[#9a9a9a]">
            CertifyX helps organizations manage recipients, courses, signatories, certificate generation, PDF delivery, and public verification from one secure workspace.
          </p>
          <div className="flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center">
            <Button size="lg" onClick={onNavigateToRegister}>Get Started</Button>
            <Button size="lg" variant="secondary" onClick={onNavigateToVerify}>Verify a Certificate</Button>
          </div>
        </div>
        <LandingDashboardPreview />
      </div>
    </section>
  );
}

function LandingDashboardPreview() {
  const metrics = [
    { label: "Total Certificates", value: "1,247", icon: <Award className="h-4 w-4" /> },
    { label: "Active Recipients", value: "856", icon: <Users className="h-4 w-4" /> },
    { label: "Revoked", value: "12", icon: <XCircle className="h-4 w-4" /> },
    { label: "Issued This Week", value: "43", icon: <TrendingUp className="h-4 w-4" /> },
  ];
  const certificates = [
    { id: "CERT-2026-4832", recipient: "Sarah Chen", course: "Advanced React Development", status: "Issued", date: "2026-04-28" },
    { id: "CERT-2026-4831", recipient: "Michael Torres", course: "UI/UX Design Fundamentals", status: "Issued", date: "2026-04-27" },
    { id: "CERT-2026-4830", recipient: "Emma Wilson", course: "Cloud Architecture", status: "Issued", date: "2026-04-26" },
    { id: "CERT-2026-4829", recipient: "James Rodriguez", course: "Data Science Bootcamp", status: "Revoked", date: "2026-04-25" },
  ];

  return (
    <div className="mx-auto max-w-5xl rounded border border-[#2a2a2a] bg-[#0a0a0a] p-4 md:p-6">
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded border border-[#2a2a2a] bg-[#1a1a1a] p-4">
            <div className="mb-2 flex items-center gap-2 text-[#5682B1]">
              {metric.icon}
              <span className="text-xs text-[#9a9a9a]">{metric.label}</span>
            </div>
            <div className="text-2xl font-semibold text-[#FFE8DB]">{metric.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded border border-[#2a2a2a] bg-[#1a1a1a] p-4 lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-[#FFE8DB]">Recent Certificate Activity</h3>
          <div className="space-y-3">
            {certificates.map((cert) => (
              <div key={cert.id} className="grid gap-2 border-b border-[#2a2a2a] pb-3 text-xs last:border-b-0 md:grid-cols-[1.1fr_1.4fr_auto] md:items-center">
                <div>
                  <div className="font-medium text-[#FFE8DB]">{cert.id}</div>
                  <div className="text-[#9a9a9a]">{cert.recipient}</div>
                </div>
                <div className="text-[#9a9a9a]">{cert.course}</div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={normalizeStatus(cert.status)} />
                  <span className="w-20 text-[#9a9a9a]">{cert.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded border border-[#2a2a2a] bg-[#1a1a1a] p-4">
          <h3 className="mb-4 text-sm font-semibold text-[#FFE8DB]">Certificate Preview</h3>
          <div className="aspect-[3/4] rounded border border-[#2a2a2a] bg-[#0a0a0a] p-4">
            <div className="flex h-full flex-col justify-between">
              <div className="text-center">
                <div className="mb-2 text-xs text-[#9a9a9a]">CERTIFICATE OF COMPLETION</div>
                <div className="mb-1 text-sm font-semibold text-[#FFE8DB]">Sarah Chen</div>
                <div className="text-xs text-[#9a9a9a]">Advanced React Development</div>
              </div>
              <div className="mt-auto border-t border-[#2a2a2a] pt-3">
                <div className="flex justify-between gap-2 text-xs text-[#9a9a9a]">
                  <div>ID: CERT-2026-4832</div>
                  <div>Apr 28, 2026</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LandingFeatures() {
  const features = [
    { icon: Building2, title: "Organization workspace", description: "Centralized dashboard for managing all certificate operations and organizational data." },
    { icon: Users, title: "Recipient and course management", description: "Track recipients, courses, and enrollment data in one unified system." },
    { icon: FileSignature, title: "Signature and logo setup", description: "Configure authorized signatories and upload organizational branding assets." },
    { icon: Award, title: "One-click certificate generation", description: "Generate and deliver certificates instantly with automated PDF creation." },
    { icon: ShieldCheck, title: "Public certificate verification", description: "Allow anyone to verify certificate authenticity via unique verification codes." },
    { icon: RotateCcw, title: "Revocation tracking", description: "Revoke certificates when needed and maintain complete audit trails." },
  ];

  return (
    <section id="features" className="px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-semibold text-[#FFE8DB] md:text-4xl">Everything you need to manage certificates</h2>
          <p className="text-lg text-[#9a9a9a]">A complete certificate authority platform built for organizations</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="rounded border border-[#2a2a2a] bg-[#0a0a0a] p-6 transition-colors hover:bg-[#1a1a1a]">
                <Icon className="mb-4 h-5 w-5 text-[#5682B1]" />
                <h3 className="mb-2 text-base font-semibold text-[#FFE8DB]">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-[#9a9a9a]">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function LandingWorkflow() {
  const steps = [
    { number: "01", icon: Building2, title: "Register Organization", description: "Create your organization account and configure your certificate authority settings." },
    { number: "02", icon: BookOpen, title: "Add Courses and Recipients", description: "Set up your courses, upload recipient data, and manage enrollments." },
    { number: "03", icon: FileCheck, title: "Generate Certificates", description: "Create and deliver certificates with one click to all enrolled recipients." },
    { number: "04", icon: ShieldCheck, title: "Verify Publicly", description: "Recipients and employers can verify certificate authenticity instantly." },
  ];

  return (
    <section id="workflow" className="border-y border-[#2a2a2a] bg-[#0a0a0a] px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-semibold text-[#FFE8DB] md:text-4xl">Simple workflow, powerful results</h2>
          <p className="text-lg text-[#9a9a9a]">From setup to verification in four straightforward steps</p>
        </div>
        <div className="grid gap-6 md:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="relative">
                <div className="h-full rounded border border-[#2a2a2a] bg-[#1a1a1a] p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="text-2xl font-semibold text-[#5682B1]">{step.number}</span>
                    <Icon className="h-5 w-5 text-[#5682B1]" />
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-[#FFE8DB]">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-[#9a9a9a]">{step.description}</p>
                </div>
                {index < steps.length - 1 && <div className="absolute -right-3 top-1/2 hidden h-px w-6 bg-[#2a2a2a] md:block" />}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function LandingSecurity() {
  const securityItems = [
    { icon: ShieldCheck, title: "Unique verification codes", description: "Every issued certificate carries a public code that confirms recipient, course, date, and current status." },
    { icon: RotateCcw, title: "Revocation visibility", description: "Revoked certificates remain traceable while clearly showing that the credential is no longer valid." },
    { icon: Building2, title: "Organization-scoped records", description: "Certificate, recipient, course, and signatory data stay bound to the issuing organization workspace." },
    { icon: FileSignature, title: "Authorized signatories", description: "Only configured signatories and approved organization branding are used for certificate generation." },
  ];

  return (
    <section id="security" className="px-6 py-20">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#5682B1]">Security & trust</p>
          <h2 className="mb-4 text-3xl font-semibold text-[#FFE8DB] md:text-4xl">Certificates should be simple to verify and hard to misuse.</h2>
          <p className="text-base leading-7 text-[#9a9a9a]">
            CertifyX keeps the verification story clear: issue credentials from one organization workspace, track their lifecycle, and let anyone confirm a certificate without private dashboard access.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {securityItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded border border-[#2a2a2a] bg-[#0a0a0a] p-5">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded bg-[#5682B1] text-[#000000]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-[#FFE8DB]">{item.title}</h3>
                <p className="text-sm leading-6 text-[#9a9a9a]">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function LandingVerification({ onNavigateToVerify }) {
  const [code, setCode] = useState("");

  function submit(event) {
    event.preventDefault();
    onNavigateToVerify(code.trim());
  }

  return (
    <section id="verification" className="border-t border-[#2a2a2a] px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-semibold text-[#FFE8DB] md:text-4xl">Public certificate verification</h2>
          <p className="text-lg text-[#9a9a9a]">Anyone can verify the authenticity of certificates issued through CertifyX</p>
        </div>
        <form onSubmit={submit} className="rounded border border-[#2a2a2a] bg-[#0a0a0a] p-6 md:p-8">
          <label className="mb-3 block text-sm text-[#FFE8DB]" htmlFor="landing-verification-code">Enter Certificate Code</label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              id="landing-verification-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="CERT-2026-XXXX"
              className="flex-1"
            />
            <Button type="submit" size="lg"><Search className="h-4 w-4" />Verify</Button>
          </div>
        </form>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="border-t border-[#2a2a2a] bg-[#000000] px-6 py-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[#FFE8DB]">{appName}</div>
            <div className="text-xs text-[#9a9a9a]">&copy; 2026 CertifyX. All rights reserved.</div>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <a href="#features" className="text-xs text-[#9a9a9a] transition-colors hover:text-[#FFE8DB]">Privacy</a>
            <a href="#security" className="text-xs text-[#9a9a9a] transition-colors hover:text-[#FFE8DB]">Security</a>
            <a href="mailto:support@certifyx.local" className="text-xs text-[#9a9a9a] transition-colors hover:text-[#FFE8DB]">Contact</a>
            <a href="https://www.linkedin.com/in/niranjans8" aria-label="LinkedIn" className="text-[#9a9a9a] transition-colors hover:text-[#FFE8DB]"><Linkedin className="h-4 w-4" /></a>
            <a href="https://github.com/NiranjanS8" aria-label="GitHub" className="text-[#9a9a9a] transition-colors hover:text-[#FFE8DB]"><Github className="h-4 w-4" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function Login({ error, loading, onSubmit, onNavigateToRegister, onNavigateToLanding, onNavigateToVerify }) {
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
            <FormField label="Email" helper="Use the admin email connected to your organization workspace." required>
              <Input name="email" type="email" placeholder="admin@example.com" required />
            </FormField>
            <FormField label="Password" helper="Keep it private. We will never ask for it outside this sign-in screen." required>
              <Input name="password" type="password" placeholder="Password" required />
            </FormField>
            <FormError message={error} className="mb-4" />
            <Button type="submit" variant="primary" fullWidth loading={loading}>
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
            <button onClick={onNavigateToLanding} className="mt-4 block w-full text-xs text-[#9a9a9a] hover:text-[#FFE8DB]">
              Back to home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Register({ error, loading, onSubmit, onNavigateToLogin, onNavigateToLanding }) {
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
              <FormField label="Organization Name" helper="This name appears on generated certificates and verification pages." required>
                <Input name="name" placeholder="Acme Corporation" required />
              </FormField>
              <FormField label="Email" helper="Use a shared admin inbox if multiple people will manage certificates." required>
                <Input name="email" type="email" placeholder="admin@acme.com" required />
              </FormField>
              <FormField label="Website" helper="Shown as part of your public organization profile when available.">
                <Input name="website" type="url" placeholder="https://acme.com" />
              </FormField>
              <FormField label="Password" helper="Choose a password your organization can store securely." required>
                <Input name="password" type="password" placeholder="Password" required />
              </FormField>
            </div>
            <FormError message={error} className="mt-4" />
            <div className="mt-6 flex gap-3">
              <Button type="submit" variant="primary" fullWidth loading={loading}>
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
            <button onClick={onNavigateToLanding} className="mt-4 text-xs text-[#9a9a9a] hover:text-[#FFE8DB]">
              Back to home
            </button>
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

function Workspace({ currentPage, setCurrentPage, data, loading, session, refresh, onViewCertificate, confirmAction, notify }) {
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
  if (currentPage === "recipients") return <Recipients data={model} session={session} refresh={refresh} onViewCertificate={onViewCertificate} confirmAction={confirmAction} notify={notify} />;
  if (currentPage === "courses") return <Courses data={model} session={session} refresh={refresh} confirmAction={confirmAction} notify={notify} />;
  if (currentPage === "signatories") return <Signatories data={model} session={session} refresh={refresh} confirmAction={confirmAction} notify={notify} />;
  if (currentPage === "certificates") return <Certificates data={model} session={session} refresh={refresh} onViewCertificate={onViewCertificate} onNavigate={setCurrentPage} confirmAction={confirmAction} notify={notify} />;
  if (currentPage === "generate") return <Generate data={model} session={session} refresh={refresh} onViewCertificate={onViewCertificate} notify={notify} />;
  return <SettingsPanel data={model} session={session} refresh={refresh} notify={notify} onNavigate={setCurrentPage} />;
}

function Dashboard({ data, loading, onNavigate }) {
  const recentCertificates = data.certificates.slice(0, 5);
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

function Recipients({ data, session, refresh, onViewCertificate, confirmAction, notify }) {
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
      notify("Certificate generated.");
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

function Courses({ data, session, refresh, confirmAction, notify }) {
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

function Signatories({ data, session, refresh, confirmAction, notify }) {
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

function Certificates({ data, session, refresh, onViewCertificate, onNavigate, confirmAction, notify }) {
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

function Generate({ data, session, refresh, onViewCertificate, notify }) {
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
      notify("Certificate generated.");
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

function CertificateDetail({ certificateId, certificates, onBack, session }) {
  const certificate = certificates.find((cert) => cert.id === certificateId);
  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [shareMessage, setShareMessage] = useState("");

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
            <div className="mt-4 rounded border border-[#2a2a2a] bg-[#0a0a0a] p-4">
              <div className="mb-4">
                <DetailLabel>Actions</DetailLabel>
                <p className="mt-1 text-sm text-[#9a9a9a]">Download the PDF or copy a public verification link.</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button variant="primary" fullWidth onClick={download}><Download className="h-4 w-4" />Download PDF</Button>
                <Button variant="secondary" fullWidth onClick={shareCertificate}><Share2 className="h-4 w-4" />Share Verification Link</Button>
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

function SettingsPanel({ data, session, refresh, notify, onNavigate }) {
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

function Verify({ initialCode = "", onBack, backLabel = "Back" }) {
  const [verificationCode, setVerificationCode] = useState(initialCode);
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

  useEffect(() => {
    if (initialCode) handleVerify();
  }, []);

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
          {onBack && <button onClick={onBack} className="mb-4 text-sm text-[#5682B1] hover:text-[#739EC9]">{backLabel}</button>}
          <p className="text-xs text-[#9a9a9a]">Powered by <span className="text-[#5682B1]">{appName}</span> {appTagline}</p>
        </div>
      </div>
    </div>
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

function FormField({ label, error, helper, required, children }) {
  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="block text-sm font-medium text-[#FFE8DB]">
          {label}
          {required && <span className="ml-1 text-[#dc2626]">*</span>}
        </label>
        {!required && <span className="text-[0.65rem] uppercase tracking-wider text-[#6f6f6f]">Optional</span>}
      </div>
      {children}
      {helper && !error && <p className="mt-2 text-xs leading-5 text-[#8f8f8f]">{helper}</p>}
      {error && <p className="mt-2 text-xs leading-5 text-[#dc2626]">{error}</p>}
    </div>
  );
}

function FormError({ message, className = "" }) {
  if (!message) return null;
  return (
    <div className={`flex items-start gap-2 rounded border border-[#dc2626]/35 bg-[#dc2626]/10 p-3 text-sm leading-5 text-[#fecaca] ${className}`}>
      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#dc2626]" />
      <span>{message}</span>
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

function Select({ options, className = "", value, defaultValue = "", onChange, name, required, disabled, searchable = false, searchPlaceholder = "Search..." }) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(value ?? defaultValue ?? "");
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef(null);
  const searchInputRef = useRef(null);
  const selectedValue = value ?? internalValue;
  const selectedOption = options.find((option) => String(option.value) === String(selectedValue)) || options[0];
  const filteredOptions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!searchable || !query) return options;
    return options.filter((option) => String(option.value) === "" || String(option.label || "").toLowerCase().includes(query));
  }, [options, searchTerm, searchable]);

  useEffect(() => {
    if (value !== undefined) setInternalValue(value);
  }, [value]);

  useEffect(() => {
    if (!open) {
      setSearchTerm("");
      return;
    }
    if (searchable) setTimeout(() => searchInputRef.current?.focus(), 0);
  }, [open, searchable]);

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
    setSearchTerm("");
  }

  function handleKeyDown(event) {
    if (disabled) return;
    const activeOptions = filteredOptions.length ? filteredOptions : options;
    const currentIndex = Math.max(0, activeOptions.findIndex((option) => String(option.value) === String(selectedValue)));
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen((current) => !current);
    }
    if (event.key === "Escape") setOpen(false);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      const nextIndex = (currentIndex + direction + activeOptions.length) % activeOptions.length;
      choose(activeOptions[nextIndex]);
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
          {searchable && (
            <div className="sticky top-0 z-10 border-b border-[#2a2a2a] bg-[#0a0a0a] p-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#739EC9]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") setOpen(false);
                    event.stopPropagation();
                  }}
                  placeholder={searchPlaceholder}
                  className={inputClass("h-9 pl-9")}
                />
              </div>
            </div>
          )}
          {filteredOptions.map((option) => {
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
          {filteredOptions.length === 0 && (
            <div className="px-3 py-4 text-center text-sm text-[#9a9a9a]">No matches found</div>
          )}
        </div>
      )}
    </div>
  );
}

function DateInput({ name, defaultValue = "", value, onChange, required, disabled, readOnly }) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue || "");
  const wrapperRef = useRef(null);
  const selectedValue = value ?? internalValue;
  const selectedDate = parseDateValue(selectedValue);
  const [viewDate, setViewDate] = useState(selectedDate || new Date());
  const isLocked = disabled || readOnly;
  const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const monthLabel = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(monthStart);
  const firstDay = monthStart.getDay();
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const cells = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => new Date(viewDate.getFullYear(), viewDate.getMonth(), index + 1)),
  ];

  useEffect(() => {
    if (value !== undefined) setInternalValue(value || "");
  }, [value]);

  useEffect(() => {
    if (selectedDate) setViewDate(selectedDate);
  }, [selectedValue]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (wrapperRef.current?.contains(event.target)) return;
      setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function commit(nextDate) {
    const nextValue = formatDateValue(nextDate);
    setInternalValue(nextValue);
    onChange?.(nextValue);
    setOpen(false);
  }

  function moveMonth(direction) {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
  }

  const displayValue = selectedDate
    ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(selectedDate)
    : "Select date";

  return (
    <div className="relative" ref={wrapperRef}>
      {name && <input type="hidden" name={name} value={selectedValue} />}
      <button
        type="button"
        disabled={isLocked}
        onClick={() => setOpen((current) => !current)}
        className={`flex w-full items-center justify-between gap-3 rounded border px-3 py-2 text-left text-sm transition-colors ${
          open ? "border-[#5682B1] bg-[#1a1a1a]" : "border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#5682B1]/60"
        } ${isLocked ? "cursor-not-allowed opacity-50" : ""}`}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className={selectedDate ? "text-[#FFE8DB]" : "text-[#5a5a5a]"}>{displayValue}</span>
        <Calendar className="h-4 w-4 text-[#739EC9]" />
      </button>
      {open && !isLocked && (
        <div className="absolute z-50 mt-2 w-full min-w-[18rem] rounded border border-[#2a2a2a] bg-[#0a0a0a] p-3 shadow-[0_16px_40px_rgba(0,0,0,0.55)]">
          <div className="mb-3 flex items-center justify-between">
            <button type="button" onClick={() => moveMonth(-1)} className="rounded p-2 text-[#9a9a9a] hover:bg-[#1a1a1a] hover:text-[#FFE8DB]" aria-label="Previous month">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-medium text-[#FFE8DB]">{monthLabel}</p>
            <button type="button" onClick={() => moveMonth(1)} className="rounded p-2 text-[#9a9a9a] hover:bg-[#1a1a1a] hover:text-[#FFE8DB]" aria-label="Next month">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="mb-2 grid grid-cols-7 gap-1">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
              <div key={`${day}-${index}`} className="py-1 text-center text-[0.65rem] uppercase tracking-wider text-[#9a9a9a]">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((date, index) => {
              if (!date) return <div key={`blank-${index}`} />;
              const dateValue = formatDateValue(date);
              const selected = dateValue === selectedValue;
              const today = dateValue === formatDateValue(new Date());
              return (
                <button
                  type="button"
                  key={dateValue}
                  onClick={() => commit(date)}
                  className={`flex h-9 items-center justify-center rounded text-sm transition-colors ${
                    selected
                      ? "bg-[#5682B1] text-[#000000]"
                      : today
                        ? "border border-[#5682B1]/50 text-[#FFE8DB] hover:bg-[#1a1a1a]"
                        : "text-[#FFE8DB] hover:bg-[#1a1a1a]"
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-[#2a2a2a] pt-3">
            <button type="button" onClick={() => commit(new Date())} className="text-xs text-[#739EC9] hover:text-[#FFE8DB]">Today</button>
            {!required && (
              <button type="button" onClick={() => {
                setInternalValue("");
                onChange?.("");
                setOpen(false);
              }} className="text-xs text-[#9a9a9a] hover:text-[#FFE8DB]">Clear</button>
            )}
          </div>
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

function Table({
  columns,
  data,
  renderRow,
  emptyIcon: EmptyIcon = FileText,
  emptyTitle = "No data available",
  emptyMessage = "There are no records to show yet.",
  emptyAction,
  pageSize = 10,
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const pageStart = (page - 1) * pageSize;
  const visibleRows = data.slice(pageStart, pageStart + pageSize);
  const showingStart = data.length === 0 ? 0 : pageStart + 1;
  const showingEnd = Math.min(pageStart + pageSize, data.length);
  const canPaginate = data.length > pageSize;

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  if (data.length === 0) {
    return (
      <div className="rounded border border-[#2a2a2a] bg-[#0a0a0a]">
        <div className="flex flex-col items-center p-12 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded border border-[#5682B1]/30 bg-[#5682B1]/10 text-[#739EC9]">
            <EmptyIcon className="h-5 w-5" />
          </div>
          <h3 className="mb-2 text-sm font-medium text-[#FFE8DB]">{emptyTitle}</h3>
          <p className="max-w-md text-sm leading-6 text-[#9a9a9a]">{emptyMessage}</p>
          {emptyAction && <div className="mt-5">{emptyAction}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded border border-[#2a2a2a] bg-[#0a0a0a]">
      <div className="overflow-x-auto">
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
          <tbody className="divide-y divide-[#2a2a2a]">{visibleRows.map((item, index) => renderRow(item, pageStart + index))}</tbody>
        </table>
      </div>
      {canPaginate && (
        <div className="flex flex-col gap-3 border-t border-[#2a2a2a] px-4 py-3 text-xs text-[#9a9a9a] sm:flex-row sm:items-center sm:justify-between">
          <p>
            Showing <span className="text-[#FFE8DB]">{showingStart}-{showingEnd}</span> of <span className="text-[#FFE8DB]">{data.length}</span>
          </p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="min-w-16 text-center text-[#FFE8DB]">Page {page} / {totalPages}</span>
            <Button variant="secondary" size="sm" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    issued: "bg-[#5682B1] text-[#000000]",
    active: "bg-[#5682B1] text-[#000000]",
    revoked: "bg-[#dc2626] text-[#FFE8DB]",
    inactive: "bg-[#2a2a2a] text-[#9a9a9a]",
    "not issued": "bg-[#2a2a2a] text-[#9a9a9a]",
  };
  return <span className={`inline-flex rounded px-2 py-1 text-xs ${styles[status] || styles.inactive}`}>{capitalize(status)}</span>;
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
  }, [signatory.id, session.token]);

  if (failed) {
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

function parseDateValue(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return null;
  const [year, month, day] = String(value).split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

createRoot(document.getElementById("root")).render(<App />);
