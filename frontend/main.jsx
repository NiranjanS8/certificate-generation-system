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
import { api, appName, appTagline, emptySession, storageKey } from "./api/client.js";
import { Button } from "./components/Button.jsx";
import { ConfirmationDialog, Toast } from "./components/Feedback.jsx";
import { FormError, FormField, Input, Detail, StatusBadge } from "./components/AppUi.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { Recipients } from "./pages/Recipients.jsx";
import { Courses } from "./pages/Courses.jsx";
import { Signatories } from "./pages/Signatories.jsx";
import { Certificates } from "./pages/Certificates.jsx";
import { Generate } from "./pages/Generate.jsx";
import { CertificateDetail } from "./pages/CertificateDetail.jsx";
import { SettingsPanel } from "./pages/SettingsPanel.jsx";
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
  const [activeSection, setActiveSection] = useState("features");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navItems = [
    { id: "features", label: "Features" },
    { id: "workflow", label: "Workflow" },
    { id: "security", label: "Security" },
    { id: "verification", label: "Verification" },
  ];

  useEffect(() => {
    const sections = navItems.map((item) => document.getElementById(item.id)).filter(Boolean);
    if (sections.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveSection(visible.target.id);
      },
      { rootMargin: "-35% 0px -50% 0px", threshold: [0.1, 0.25, 0.5] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  function linkClass(id, mobile = false) {
    const active = activeSection === id;
    if (mobile) {
      return `rounded px-3 py-2 text-sm transition-colors ${active ? "bg-[#5682B1] text-[#000000]" : "text-[#9a9a9a] hover:bg-[#1a1a1a] hover:text-[#FFE8DB]"}`;
    }
    return `relative text-sm transition-colors after:absolute after:-bottom-2 after:left-1/2 after:h-0.5 after:w-4 after:-translate-x-1/2 after:rounded after:transition-opacity ${
      active ? "text-[#FFE8DB] after:bg-[#5682B1] after:opacity-100" : "text-[#9a9a9a] after:opacity-0 hover:text-[#FFE8DB]"
    }`;
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-[#2a2a2a] bg-[#000000]/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <div className="flex items-center justify-between gap-4 md:block">
            <div>
              <div className="text-lg font-semibold text-[#FFE8DB]">{appName}</div>
              <div className="text-xs text-[#9a9a9a]">{appTagline}</div>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="flex h-10 w-10 items-center justify-center rounded border border-[#2a2a2a] text-[#FFE8DB] hover:bg-[#1a1a1a] md:hidden"
              aria-label="Toggle home navigation"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
          <div className="hidden items-center justify-center gap-x-6 md:flex">
            {navItems.map((item) => (
              <a key={item.id} href={`#${item.id}`} className={linkClass(item.id)}>
                {item.label}
              </a>
            ))}
          </div>
          <div className="hidden items-center gap-3 md:flex md:justify-end">
            <Button variant="ghost" onClick={onNavigateToLogin}>Sign In</Button>
            <Button onClick={onNavigateToRegister}>Get Started</Button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="mt-4 rounded border border-[#2a2a2a] bg-[#0a0a0a] p-3 shadow-[0_18px_50px_rgba(0,0,0,0.55)] md:hidden">
            <div className="grid gap-1">
              {navItems.map((item) => (
                <a key={item.id} href={`#${item.id}`} onClick={closeMobileMenu} className={linkClass(item.id, true)}>
                  {item.label}
                </a>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#2a2a2a] pt-3">
              <Button variant="secondary" onClick={() => {
                closeMobileMenu();
                onNavigateToLogin();
              }}>Sign In</Button>
              <Button onClick={() => {
                closeMobileMenu();
                onNavigateToRegister();
              }}>Get Started</Button>
            </div>
          </div>
        )}
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
    <section id="features" className="scroll-mt-28 px-6 py-20">
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
    <section id="workflow" className="scroll-mt-28 border-y border-[#2a2a2a] bg-[#0a0a0a] px-6 py-20">
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
    <section id="security" className="scroll-mt-28 px-6 py-20">
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
    <section id="verification" className="scroll-mt-28 border-t border-[#2a2a2a] px-6 py-20">
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


createRoot(document.getElementById("root")).render(<App />);

