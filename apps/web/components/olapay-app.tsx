"use client";

import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpFromLine,
  BookOpen,
  Check,
  ChevronDown,
  CircleDollarSign,
  Home,
  Link2,
  LogOut,
  QrCode,
  ShieldCheck,
  UsersRound,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Order = { amount: number; income: number; percent: number; kind: "Payment" | "VIP" };
type Upi = {
  id: string;
  address: string;
  status: "Available" | "Unavailable" | "Pending verification";
  sell: boolean;
};
type Activity = {
  type: string;
  amount: number;
  status: string;
  time: string;
  currency?: "INR" | "USDT";
};
type Profile = { id: string; phone: string; role: string; hasPin: boolean };

const demoOrders: Order[] = [
  { amount: 465, income: 13.95, percent: 3, kind: "Payment" },
  { amount: 485, income: 14.55, percent: 3, kind: "Payment" },
  { amount: 487, income: 14.61, percent: 3, kind: "Payment" },
  { amount: 24000, income: 960, percent: 4, kind: "VIP" },
  { amount: 42000, income: 2100, percent: 5, kind: "VIP" },
];
const demoUpi: Upi[] = [];
const ledgerKinds = [
  "All",
  "Recharge",
  "Reward",
  "Activity Reward",
  "Commission",
  "Receive",
  "Return",
  "Transfer In",
  "Transfer Out",
  "Payment Task",
  "Payment Task Reward",
  "Invite Recharge Activity",
  "Order Balance Transfer",
  "Game Balance Exchange",
  "Game Withdrawal",
  "Task Reward",
  "Withdraw Apply",
  "Withdraw Refund",
  "Withdraw Success",
];

export default function OlaPayApp() {
  const path = usePathname();
  const router = useRouter();
  const route = (path || "/").replace(/\/$/, "") || "/";
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [currency, setCurrency] = useState<"USDT" | "INR">("USDT");
  const [offerRows, setOfferRows] = useState(demoOrders);
  const [network, setNetwork] = useState("TRC-20");
  const [depositAmount, setDepositAmount] = useState("");
  const [category, setCategory] = useState<"Payment" | "VIP">("Payment");
  const [sort, setSort] = useState("Low to high");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [orderFilter, setOrderFilter] = useState("All");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(ledgerKinds.slice(1));
  const [upiRows, setUpiRows] = useState(demoUpi);
  const [upisOpen, setUpisOpen] = useState<Record<string, boolean>>({
    Available: true,
    Unavailable: false,
  });
  const [modal, setModal] = useState("");
  const [modalValue, setModalValue] = useState("");
  const [modalRecipient, setModalRecipient] = useState("");
  const [modalCurrency, setModalCurrency] = useState<"USDT" | "INR">("INR");
  const [activity, setActivity] = useState<Activity[]>([]);
  const [summary, setSummary] = useState({
    quotaInr: "125.00",
    rewardRatio: "0.01",
    usdtRateInr: "110.50",
    todayReceived: "0.00",
    inTransaction: "0.00",
  });
  const [teamData, setTeamData] = useState<{
    memberCount: number;
    rechargeTotal: number;
    commissionTotal: number;
    members: { id: string; rechargeTotal: string; commissionTotal: string }[];
  } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const notice = (message: string) => setToast(message);

  useEffect(() => {
    let active = true;
    const checkSession = async () => {
      try {
        let response = await fetch("/api/v1/auth/me", { credentials: "include" });
        if (!response.ok)
          response = await fetch("/api/v1/auth/refresh", {
            method: "POST",
            credentials: "include",
          });
        if (active) setAuthed(response.ok);
      } catch {
        if (active) setAuthed(false);
      } finally {
        if (active) setReady(true);
      }
    };
    void checkSession();
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (toast) {
      const timer = window.setTimeout(() => setToast(""), 2600);
      return () => window.clearTimeout(timer);
    }
  }, [toast]);
  useEffect(() => {
    if (ready && route !== "/login" && route !== "/recovery" && !authed) router.replace("/login");
    if (ready && (route === "/login" || route === "/recovery") && authed) router.replace("/");
  }, [authed, ready, route, router]);
  useEffect(() => {
    if (!authed) return;
    let active = true;
    const load = async () => {
      try {
        if (route === "/") {
          const response = await fetch("/api/v1/dashboard", { credentials: "include" });
          if (response.ok && active) setSummary(await response.json());
        } else if (route === "/deposit") {
          const response = await fetch("/api/v1/deposits/offers", { credentials: "include" });
          if (response.ok && active) {
            const offers = (await response.json()) as {
              usdtRateInr: number;
              bonusRatio: number;
              payment: { amount: number; income: number; percent: number }[];
              vip: { amount: number; income: number; percent: number }[];
            };
            setOfferRows([
              ...offers.payment.map((row) => ({ ...row, kind: "Payment" as const })),
              ...offers.vip.map((row) => ({ ...row, kind: "VIP" as const })),
            ]);
            setSummary((current) => ({
              ...current,
              usdtRateInr: String(offers.usdtRateInr),
              rewardRatio: String(offers.bonusRatio),
            }));
          }
        } else if (route === "/payment") {
          const response = await fetch("/api/v1/upis", { credentials: "include" });
          if (response.ok) {
            const data = (await response.json()) as {
              accounts: { id: string; address: string; status: string; sellEnabled: boolean }[];
            };
            if (active)
              setUpiRows(
                data.accounts.map((row) => ({
                  id: row.id,
                  address: row.address,
                  status:
                    row.status === "AVAILABLE"
                      ? "Available"
                      : row.status === "PENDING_VERIFICATION"
                        ? "Pending verification"
                        : "Unavailable",
                  sell: row.sellEnabled,
                })),
              );
          }
        } else if (route === "/team") {
          const response = await fetch("/api/v1/team", { credentials: "include" });
          if (response.ok && active) setTeamData(await response.json());
        } else if (route === "/account") {
          const response = await fetch("/api/v1/profile", { credentials: "include" });
          if (response.ok && active) setProfile(await response.json());
          else if (active) notice("Unable to load account information. Refresh to try again.");
        } else if (route === "/rechargeHistory") {
          const response = await fetch("/api/v1/history/recharges", { credentials: "include" });
          if (response.ok && active) {
            const rows = (await response.json()) as {
              currency: string;
              amount: string;
              status: string;
              createdAt: string;
            }[];
            setActivity(
              rows.map((row) => ({
                type: `${row.currency} deposit`,
                amount: Number(row.amount),
                currency: row.currency === "USDT" ? "USDT" : "INR",
                status: statusLabel(row.status),
                time: new Date(row.createdAt).toLocaleString(),
              })),
            );
          }
        } else if (route === "/tokenHistory") {
          const response = await fetch("/api/v1/history/tokens", { credentials: "include" });
          if (response.ok && active) {
            const rows = (await response.json()) as {
              type: string;
              amount: string;
              description: string;
              createdAt: string;
            }[];
            setActivity(
              rows.map((row) => ({
                type: ledgerLabel(row.type),
                amount: Number(row.amount),
                status: row.description,
                time: new Date(row.createdAt).toLocaleString(),
              })),
            );
          }
        }
      } catch {
        if (active) notice("Some account data could not be loaded. Refresh to try again.");
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [authed, route]);

  const navigate = (href: string) => router.push(href);
  const fmt = (n: number) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n);

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");
    if (!/^\+?[0-9\s-]{8,16}$/.test(phone.trim())) {
      setLoginError("Enter a valid phone number.");
      return;
    }
    if (password.length < 8) {
      setLoginError("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), password }),
      });
      if (!response.ok)
        throw new Error(
          response.status === 401
            ? "Phone number or password is incorrect."
            : "Sign-in is unavailable. Start the API and try again.",
        );
      setAuthed(true);
      setPassword("");
      router.replace("/");
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Unable to sign in. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await fetch("/api/v1/auth/logout", { method: "POST", credentials: "include" }).catch(
      () => undefined,
    );
    setAuthed(false);
    setPassword("");
    setPhone("");
    router.replace("/login");
  }

  async function createMockOrder(kind: "Buy" | "Receive Payment" | "Send Payment", amount: number) {
    if (!amount || amount <= 0) {
      notice("Enter a valid amount first.");
      return;
    }
    if (kind === "Send Payment" && !modalRecipient.trim()) {
      notice("Enter a mock recipient.");
      return;
    }
    setBusy(true);
    try {
      const response =
        kind === "Buy"
          ? await fetch("/api/v1/deposits", {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
                "Idempotency-Key": crypto.randomUUID(),
              },
              body: JSON.stringify({
                currency,
                amount,
                network: currency === "USDT" ? network : undefined,
                offerKind: category,
              }),
            })
          : await fetch("/api/v1/payments/mock", {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
                "Idempotency-Key": crypto.randomUUID(),
              },
              body: JSON.stringify({
                kind: kind === "Receive Payment" ? "RECEIVE" : "SEND",
                amount,
                recipient: kind === "Send Payment" ? modalRecipient.trim() : undefined,
              }),
            });
      if (!response.ok)
        throw new Error(
          "The mock API could not create this request. Check the API and database, then retry.",
        );
      const result = (await response.json()) as { message?: string };
      setModal("");
      setActivity((items) => [
        {
          type: kind,
          amount,
          currency: currency,
          status: "In Payment · mock",
          time: new Date().toLocaleString(),
        },
        ...items,
      ]);
      setDepositAmount("");
      notice(result.message ?? `${kind} created in mock mode. No money was moved.`);
    } catch (error) {
      notice(error instanceof Error ? error.message : "The mock request failed.");
    } finally {
      setBusy(false);
    }
  }

  const visibleOrders = useMemo(() => {
    let rows = offerRows.filter((order) => order.kind === category);
    if (min) rows = rows.filter((order) => order.amount >= Number(min));
    if (max) rows = rows.filter((order) => order.amount <= Number(max));
    rows.sort((a, b) => (sort === "High to low" ? b.amount - a.amount : a.amount - b.amount));
    return rows;
  }, [category, max, min, offerRows, sort]);

  if (!ready)
    return (
      <div className="frame">
        <div className="topbar">Olapay</div>
        <main className="main">
          <div className="empty">Loading your local session…</div>
        </main>
      </div>
    );
  if (route === "/login")
    return (
      <Login
        onSubmit={submitLogin}
        go={navigate}
        phone={phone}
        setPhone={setPhone}
        password={password}
        setPassword={setPassword}
        error={loginError}
        busy={busy}
      />
    );
  if (route === "/recovery") return <RecoveryPage go={navigate} />;
  if (!authed) return null;

  const title =
    route === "/payment"
      ? "UPI"
      : route === "/team"
        ? "Team"
        : route === "/me"
          ? "Me"
          : route === "/help"
            ? "Help Manual"
            : route === "/account"
              ? "Account Info"
              : route === "/rechargeHistory"
                ? "Recharge History"
                : route === "/tokenHistory"
                  ? "Token History"
                  : "Olapay";
  const activeNav =
    route === "/deposit"
      ? "/deposit"
      : route === "/payment"
        ? "/payment"
        : route === "/team"
          ? "/team"
          : route === "/me" ||
              route === "/account" ||
              route.includes("History") ||
              route === "/help"
            ? "/me"
            : "/";
  const isRoot = route === "/";

  return (
    <div className="frame">
      <header className="topbar">{title}</header>
      <main className="main" key={route}>
        {route === "/" && <HomeView go={navigate} summary={summary} />}
        {route === "/deposit" && (
          <DepositView
            currency={currency}
            setCurrency={setCurrency}
            network={network}
            setNetwork={setNetwork}
            amount={depositAmount}
            setAmount={setDepositAmount}
            category={category}
            setCategory={setCategory}
            sort={sort}
            setSort={setSort}
            min={min}
            setMin={setMin}
            max={max}
            setMax={setMax}
            offers={visibleOrders}
            rate={Number(summary.usdtRateInr)}
            bonusRatio={Number(summary.rewardRatio)}
            onBuy={(amount) => {
              setModal("Buy");
              setModalValue(String(amount ?? depositAmount ?? ""));
              setModalCurrency(currency);
            }}
            go={navigate}
          />
        )}
        {route === "/payment" && (
          <UpiView
            rows={upiRows}
            open={upisOpen}
            setOpen={setUpisOpen}
            onToggle={async (id, sellEnabled) => {
              try {
                const response = await fetch(`/api/v1/upis/${id}/sell`, {
                  method: "PATCH",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ sellEnabled }),
                });
                if (!response.ok)
                  throw new Error(
                    "Unable to update account. Only verified accounts can be enabled.",
                  );
                setUpiRows((items) =>
                  items.map((row) => (row.id === id ? { ...row, sell: sellEnabled } : row)),
                );
              } catch (error) {
                notice(error instanceof Error ? error.message : "Update failed.");
              }
            }}
            onAction={(action) => {
              if (action === "How to bind UPI?") navigate("/help");
              else if (action.startsWith("Link UPI account:")) {
                const id = action.split(":")[1];
                void fetch(`/api/v1/upis/${id}/link`, { method: "PATCH", credentials: "include" })
                  .then((response) => {
                    if (!response.ok) throw new Error();
                    setUpiRows((items) =>
                      items.map((row) =>
                        row.id === id
                          ? { ...row, status: "Pending verification", sell: false }
                          : row,
                      ),
                    );
                    notice("Mock verification request recorded.");
                    return response;
                  })
                  .catch(() => notice("Unable to start mock verification."));
              } else {
                setModal(action);
                setModalValue("");
                setModalRecipient("");
              }
            }}
          />
        )}
        {route === "/team" && <TeamView go={navigate} notice={notice} data={teamData} />}
        {route === "/me" && (
          <MeView go={navigate} signOut={signOut} summary={summary} notice={notice} />
        )}
        {route === "/account" && (
          <AccountView
            go={navigate}
            notice={notice}
            profile={profile}
            onPinSaved={() =>
              setProfile((current) => (current ? { ...current, hasPin: true } : current))
            }
          />
        )}
        {route === "/help" && <HelpView />}
        {route === "/rechargeHistory" && (
          <RechargeHistory
            currency={currency}
            setCurrency={setCurrency}
            filter={orderFilter}
            setFilter={setOrderFilter}
            activity={activity}
          />
        )}
        {route === "/tokenHistory" && (
          <TokenHistory
            open={filterOpen}
            setOpen={setFilterOpen}
            types={selectedTypes}
            setTypes={setSelectedTypes}
            activity={activity}
          />
        )}
        {!isRoot &&
          ![
            "/deposit",
            "/payment",
            "/team",
            "/me",
            "/account",
            "/help",
            "/rechargeHistory",
            "/tokenHistory",
          ].includes(route) && (
            <div className="panel">
              <p>Page not found.</p>
              <button className="btn secondary" onClick={() => navigate("/")}>
                Back to Home
              </button>
            </div>
          )}
      </main>
      <div
        className="notice"
        style={{
          position: "absolute",
          right: 12,
          top: 12,
          zIndex: 6,
          fontSize: 11,
          padding: "6px 9px",
        }}
      >
        LOCAL MOCK
      </div>
      <BottomNav active={activeNav} go={navigate} />
      {toast && (
        <div role="status" className="toast">
          {toast}
        </div>
      )}
      {modal && (
        <ActionModal
          action={modal}
          currency={modalCurrency}
          value={modalValue}
          setValue={setModalValue}
          recipient={modalRecipient}
          setRecipient={setModalRecipient}
          close={() => setModal("")}
          confirm={() => {
            if (modal === "Buy" || modal === "Receive Payment" || modal === "Send Payment")
              createMockOrder(
                modal as "Buy" | "Receive Payment" | "Send Payment",
                Number(modalValue),
              );
            else if (modal === "Add UPI account") {
              if (!/^[\w.-]{2,80}@[\w.-]{2,40}$/.test(modalValue)) {
                notice("Enter a valid UPI ID.");
                return;
              }
              void fetch("/api/v1/upis", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address: modalValue }),
              })
                .then(async (response) => {
                  if (!response.ok)
                    throw new Error(
                      "Could not add this mock account. Check the address or try again.",
                    );
                  const data = (await response.json()) as {
                    account: { id: string; status: string; sellEnabled: boolean };
                  };
                  setUpiRows((items) => [
                    {
                      id: data.account.id,
                      address: modalValue,
                      status: "Pending verification",
                      sell: data.account.sellEnabled,
                    },
                    ...items,
                  ]);
                  setModal("");
                  notice("Mock UPI account added as pending verification.");
                })
                .catch((error) =>
                  notice(error instanceof Error ? error.message : "Unable to add mock account."),
                );
            } else if (modal === "Link UPI account") {
              setModal("");
              notice(
                "Mock linking request recorded. Account remains unavailable until verification.",
              );
            } else {
              setModal("");
              notice("This action is simulated in local mock mode.");
            }
          }}
        />
      )}
    </div>
  );
}

function Login({
  onSubmit,
  go,
  phone,
  setPhone,
  password,
  setPassword,
  error,
  busy,
}: {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  go: (href: string) => void;
  phone: string;
  setPhone: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  error: string;
  busy: boolean;
}) {
  return (
    <div className="frame">
      <header className="topbar">Olapay</header>
      <main className="main auth">
        <form className="card stack auth-card" onSubmit={onSubmit}>
          <div>
            <div className="eyebrow">Welcome back</div>
            <h1 style={{ margin: "8px 0 0" }}>Log in</h1>
          </div>
          <label className="field-label">
            Phone number
            <input
              autoComplete="username"
              className="field"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
            />
          </label>
          <label className="field-label">
            Password
            <input
              autoComplete="current-password"
              className="field"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
          </label>
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <a
              href="/recovery"
              onClick={(e) => {
                e.preventDefault();
                go("/recovery");
              }}
              className="muted"
            >
              Forget Password
            </a>
          </div>
          <div className="alert" role="alert">
            {error}
          </div>
          <button className="btn" disabled={busy || !phone || !password}>
            {busy ? "Signing in…" : "LOG IN"}
          </button>
          <small className="muted">
            Development mock environment. Use the fictional demo account documented in README.md.
          </small>
        </form>
      </main>
    </div>
  );
}

function RecoveryPage({ go }: { go: (href: string) => void }) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [mockCode, setMockCode] = useState("");
  const [stage, setStage] = useState<"request" | "verify" | "complete">("request");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/v1/auth/recovery/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (!response.ok) throw new Error("Unable to request a recovery code. Try again shortly.");
      const result = (await response.json()) as { mockCode?: string };
      setMockCode(result.mockCode ?? "");
      setStage("verify");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to request a recovery code.");
    } finally {
      setBusy(false);
    }
  }

  async function complete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/v1/auth/recovery/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code, password }),
      });
      if (!response.ok)
        throw new Error(
          response.status === 401
            ? "Recovery code is invalid or expired."
            : "Unable to update the password.",
        );
      setStage("complete");
      setPassword("");
      setCode("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update the password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="frame">
      <header className="topbar">Olapay</header>
      <main className="main auth">
        <section className="card stack auth-card">
          <button
            className="btn ghost"
            style={{ justifySelf: "start" }}
            onClick={() => go("/login")}
          >
            <ArrowLeft size={16} /> Back to login
          </button>
          <div>
            <div className="eyebrow">Local mock SMS</div>
            <h1 style={{ margin: "8px 0 0" }}>Password recovery</h1>
          </div>
          {stage === "request" && (
            <form className="stack" onSubmit={requestCode}>
              <label className="field-label">
                Phone number
                <input
                  className="field"
                  autoComplete="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  required
                />
              </label>
              <button className="btn" disabled={busy}>
                {busy ? "Sending…" : "Send recovery code"}
              </button>
            </form>
          )}
          {stage === "verify" && (
            <form className="stack" onSubmit={complete}>
              {mockCode && (
                <div className="notice" role="status">
                  Development SMS code: <strong>{mockCode}</strong> · Expires in 5 minutes.
                </div>
              )}
              <label className="field-label">
                6-digit code
                <input
                  className="field"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  required
                />
              </label>
              <label className="field-label">
                New password
                <input
                  className="field"
                  type="password"
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>
              <button className="btn" disabled={busy}>
                {busy ? "Updating…" : "Update password"}
              </button>
            </form>
          )}
          {stage === "complete" && (
            <div className="stack">
              <div className="notice" role="status">
                Password updated. Existing sessions have been signed out.
              </div>
              <button className="btn" onClick={() => go("/login")}>
                Return to login
              </button>
            </div>
          )}
          {error && (
            <div className="alert" role="alert">
              {error}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function BottomNav({ active, go }: { active: string; go: (href: string) => void }) {
  const items = [
    { href: "/", label: "Home", icon: Home },
    { href: "/deposit", label: "Deposit", icon: CircleDollarSign },
    { href: "/payment", label: "UPI", icon: QrCode },
    { href: "/team", label: "Team", icon: UsersRound },
    { href: "/me", label: "Me", icon: UserRound },
  ];
  return (
    <nav className="nav" aria-label="Main navigation">
      {items.map(({ href, label, icon: Icon }) => (
        <a
          key={href}
          href={href}
          onClick={(e) => {
            e.preventDefault();
            go(href);
          }}
          className={active === href ? "active" : ""}
          aria-current={active === href ? "page" : undefined}
        >
          <Icon aria-hidden="true" />
          <span>{label}</span>
        </a>
      ))}
    </nav>
  );
}

function HomeView({
  go,
  summary,
}: {
  go: (href: string) => void;
  summary: {
    quotaInr: string;
    rewardRatio: string;
    usdtRateInr: string;
    todayReceived: string;
    inTransaction: string;
  };
}) {
  return (
    <div className="stack">
      <section className="panel summary">
        <div className="eyebrow">Quota</div>
        <div className="big-number">
          {fmt(Number(summary.quotaInr))}{" "}
          <span className="muted" style={{ fontSize: 24 }}>
            INR
          </span>
        </div>
      </section>
      <section className="panel promo">
        <div>
          <h2>A must read for newbies</h2>
          <p>How to make more profits</p>
          <button className="btn ghost" onClick={() => go("/help")}>
            Click to read{" "}
            <ArrowLeft size={16} style={{ transform: "rotate(180deg)", verticalAlign: "middle" }} />
          </button>
        </div>
        <div className="coin-art" aria-hidden="true">
          📗
        </div>
      </section>
      <div className="grid2">
        <Metric label="USDT rate" value={`1 USDT ≈ ${fmt(Number(summary.usdtRateInr))} INR`} />
        <Metric label="Bonus ratio" value={`${Number(summary.rewardRatio) * 100}%`} />
        <Metric label="Today received" value={summary.todayReceived} />
        <Metric label="In transaction" value={summary.inTransaction} />
      </div>
      <button className="panel row" style={{ textAlign: "left" }} onClick={() => go("/help")}>
        <span>
          <BookOpen /> <strong>About UPI linking & INR orders</strong>
        </span>
        <span>›</span>
      </button>
    </div>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="card stat-card">
      <span className="muted">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DepositView(props: {
  currency: "USDT" | "INR";
  setCurrency: (value: "USDT" | "INR") => void;
  network: string;
  setNetwork: (value: string) => void;
  amount: string;
  setAmount: (value: string) => void;
  category: "Payment" | "VIP";
  setCategory: (value: "Payment" | "VIP") => void;
  sort: string;
  setSort: (value: string) => void;
  min: string;
  setMin: (value: string) => void;
  max: string;
  setMax: (value: string) => void;
  offers: Order[];
  rate: number;
  bonusRatio: number;
  onBuy: (amount?: number) => void;
  go: (href: string) => void;
}) {
  const value = Number(props.amount) || 0;
  const rate = props.rate || 110.5;
  const bonus = Math.round(value * rate * props.bonusRatio * 100) / 100;
  return (
    <div className="stack">
      <div className="segmented green">
        <button
          className={props.currency === "USDT" ? "selected" : ""}
          onClick={() => props.setCurrency("USDT")}
        >
          USDT
        </button>
        <button
          className={props.currency === "INR" ? "selected" : ""}
          onClick={() => props.setCurrency("INR")}
        >
          INR
        </button>
      </div>
      {props.currency === "USDT" ? (
        <>
          <div className="grid2">
            <button
              className={`card network ${props.network === "TRC-20" ? "selected" : ""}`}
              onClick={() => props.setNetwork("TRC-20")}
            >
              🔴　<strong>TRON</strong>
              <br />
              <span className="muted">TRC20</span>
            </button>
            <button
              className={`card network ${props.network === "BEP-20" ? "selected" : ""}`}
              onClick={() => props.setNetwork("BEP-20")}
            >
              🟡　<strong>BNB Smart Chain</strong>
              <br />
              <span className="muted">BEP20</span>
            </button>
          </div>
          <div className="qr" aria-label="Mock QR code">
            <Wallet size={40} />
          </div>
          <section className="card stack">
            <div className="row">
              <strong>Wallet address ({props.network})</strong>
            </div>
            <div className="notice">No live deposit address in local mock mode.</div>
            <small className="muted">
              Mock deposits never send funds or accept cryptocurrency.
            </small>
          </section>
          <section className="card stack">
            <h2>Calculator</h2>
            <label className="field-label">
              USDT amount
              <input
                className="field"
                type="number"
                min="0"
                step="0.01"
                value={props.amount}
                onChange={(e) => props.setAmount(e.target.value)}
                placeholder="0"
              />
            </label>
            <div className="row">
              <span className="muted">Ratio 1 USDT</span>
              <strong>{rate} INR</strong>
            </div>
            <div className="row">
              <span className="muted">Estimated bonus</span>
              <strong>{fmt(bonus)} INR</strong>
            </div>
            <div className="row">
              <span className="muted">Total quota</span>
              <strong>{fmt(value * rate + bonus)} INR</strong>
            </div>
            <button
              className="btn"
              onClick={() => props.onBuy(Number(props.amount))}
              disabled={!value}
            >
              Simulate deposit
            </button>
          </section>
          <div className="notice">
            After a real provider confirms a deposit, processing may take several minutes. This
            local demo does not accept cryptocurrency.
          </div>
        </>
      ) : (
        <>
          <section className="card">
            <div className="milestones">
              {[1, 5, 10, 20, 30].map((n, i) => (
                <div key={n}>
                  <small className="muted">+₹{[10, 15, 50, 100, 200][i]}</small>
                  <div className="milestone">{n}</div>
                </div>
              ))}
            </div>
            <p className="muted" style={{ textAlign: "center" }}>
              Mock bonus milestones
            </p>
          </section>
          <button
            className="row notice"
            style={{ width: "100%", textAlign: "left" }}
            onClick={() => props.go("/help")}
          >
            <span>
              <BookOpen /> How Buy Quota?
            </span>
            <span>›</span>
          </button>
          <div className="segmented green">
            <button
              className={props.category === "Payment" ? "selected" : ""}
              onClick={() => props.setCategory("Payment")}
            >
              Payment
            </button>
            <button
              className={props.category === "VIP" ? "selected" : ""}
              onClick={() => props.setCategory("VIP")}
            >
              VIP
            </button>
          </div>
          <section className="card stack">
            <div className="row">
              <select
                className="field"
                value={props.sort}
                onChange={(e) => props.setSort(e.target.value)}
              >
                <option>Low to high</option>
                <option>High to low</option>
              </select>
            </div>
            <div className="grid2">
              <label className="field-label">
                Min
                <input
                  className="field"
                  type="number"
                  value={props.min}
                  onChange={(e) => props.setMin(e.target.value)}
                />
              </label>
              <label className="field-label">
                Max
                <input
                  className="field"
                  type="number"
                  value={props.max}
                  onChange={(e) => props.setMax(e.target.value)}
                />
              </label>
            </div>
            <button
              className="btn secondary"
              onClick={() => {
                props.setMin("");
                props.setMax("");
              }}
            >
              Refresh / clear filters
            </button>
          </section>
          <div className="list">
            {props.offers.map((order, index) => (
              <div className="card offer" key={`${order.kind}-${order.amount}-${index}`}>
                <div>
                  <strong>{fmt(order.amount)} INR</strong>
                  <div className="muted">
                    Income {fmt(order.income)} · {order.percent}%<br />
                    Quota +{fmt(order.amount + order.income)}
                  </div>
                </div>
                <button className="btn" onClick={() => props.onBuy(order.amount)}>
                  Buy
                </button>
              </div>
            ))}
            {props.offers.length === 0 && (
              <div className="empty">No orders match these filters.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function UpiView({
  rows,
  open,
  setOpen,
  onToggle,
  onAction,
}: {
  rows: Upi[];
  open: Record<string, boolean>;
  setOpen: (open: Record<string, boolean>) => void;
  onToggle: (id: string, sellEnabled: boolean) => void;
  onAction: (action: string) => void;
}) {
  return (
    <div className="stack">
      <div className="segmented">
        <button className="selected">UPI</button>
      </div>
      <div className="row">
        <button className="btn green" onClick={() => onAction("Receive Payment")}>
          Receive Payment
        </button>
        <button className="btn" onClick={() => onAction("Send Payment")}>
          Send Payment
        </button>
      </div>
      <button className="notice row" onClick={() => onAction("How to bind UPI?")}>
        <span>
          <ShieldCheck /> Please keep your account available. How to bind UPI?
        </span>
        <span>→</span>
      </button>
      {(["Available", "Unavailable"] as const).map((status) => {
        const items = rows.filter((row) =>
          status === "Available" ? row.status === "Available" : row.status !== "Available",
        );
        return (
          <section className="card" key={status}>
            <button
              className="row"
              style={{ width: "100%", border: 0, background: "none", padding: 0 }}
              onClick={() => setOpen({ ...open, [status]: !open[status] })}
            >
              <strong>{status}</strong>
              <span>
                {items.length} <ChevronDown size={16} />
              </span>
            </button>
            {open[status] && (
              <div className="list" style={{ marginTop: 14 }}>
                {items.length ? (
                  items.map((row) => (
                    <div className="list-row" key={row.id}>
                      <div className="row">
                        <span className="muted">{row.address}</span>
                        <button
                          aria-label={`Toggle sell for ${row.id}`}
                          disabled={row.status !== "Available"}
                          className={`switch ${row.sell ? "on" : ""}`}
                          onClick={() => onToggle(row.id, !row.sell)}
                        >
                          <span />
                        </button>
                      </div>
                      <div className="row" style={{ marginTop: 10 }}>
                        <small>
                          Status:{" "}
                          {row.status === "Available"
                            ? "Enabled"
                            : row.status === "Unavailable"
                              ? "Verification needed"
                              : "Pending verification"}
                        </small>
                        {row.status === "Unavailable" && (
                          <button
                            className="btn ghost"
                            onClick={() => onAction(`Link UPI account:${row.id}`)}
                          >
                            Link
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty">No UPI accounts.</div>
                )}
              </div>
            )}
          </section>
        );
      })}
      <button className="card row" onClick={() => onAction("Add UPI account")}>
        <strong>＋ Add new account</strong>
      </button>
    </div>
  );
}

function TeamView({
  go,
  notice,
  data,
}: {
  go: (href: string) => void;
  notice: (message: string) => void;
  data: {
    memberCount: number;
    rechargeTotal: number;
    commissionTotal: number;
    members: { id: string; rechargeTotal: string; commissionTotal: string }[];
  } | null;
}) {
  const members = data?.members ?? [];
  async function copyInvite() {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText("DEMO-INVITE-CODE");
      notice("Demo invite code copied.");
    } catch {
      notice("Clipboard access is unavailable.");
    }
  }
  return (
    <div className="stack">
      <section className="card grid2">
        <Metric label="Commission" value={fmt(data?.commissionTotal ?? 0)} />
        <Metric label="Team recharge" value={fmt(data?.rechargeTotal ?? 0)} />
        <div className="row">
          <UsersRound />
          <strong>{data?.memberCount ?? 0} members</strong>
        </div>
        <div>
          <span className="muted">Invite code</span>
          <button className="btn ghost" onClick={() => void copyInvite()}>
            Copy
          </button>
        </div>
      </section>
      <section className="card stack">
        <div className="row">
          <h2>Team Detail</h2>
          <button className="btn ghost" onClick={() => go("/tokenHistory")}>
            Commission history
          </button>
        </div>
        {members.length ? (
          members.map((member, i) => (
            <div className="list-row row" key={member.id}>
              <div>
                <strong>Member {String(i + 1).padStart(2, "0")}</strong>
                <div className="muted">
                  Recharge aggregate · {fmt(Number(member.rechargeTotal))}
                </div>
              </div>
              <span>Commission · {fmt(Number(member.commissionTotal))}</span>
            </div>
          ))
        ) : (
          <div className="empty">No team members yet.</div>
        )}
      </section>
      <section className="card">
        <h2>Invite user rewards</h2>
        <p className="muted">Earn team commissions. Mock rewards are illustrative only.</p>
      </section>
    </div>
  );
}

function MeView({
  go,
  signOut,
  summary,
  notice,
}: {
  go: (href: string) => void;
  signOut: () => void;
  summary: { quotaInr: string; rewardRatio: string };
  notice: (message: string) => void;
}) {
  const rows = [
    ["Recharge History", "/rechargeHistory"],
    ["Token History", "/tokenHistory"],
    ["Languages · English", "language"],
    ["Google Authentication", "authenticator"],
    ["Contact Us", "contact"],
  ];
  return (
    <div className="stack">
      <section className="card">
        <button
          className="row"
          style={{ width: "100%", border: 0, background: "none", padding: 0 }}
          onClick={() => go("/account")}
        >
          <span>
            <strong>Edit profile</strong>
            <div className="muted">Account information and security</div>
          </span>
          <span>›</span>
        </button>
        <div className="grid2" style={{ marginTop: 24 }}>
          <Metric label="Quota" value={`${fmt(Number(summary.quotaInr))} INR`} />
          <Metric label="Reward ratio" value={`${Number(summary.rewardRatio) * 100}%`} />
        </div>
      </section>
      <section className="card">
        <h2>Invite user rewards</h2>
        <p className="muted">Earn team commissions</p>
        <button className="btn ghost" onClick={() => go("/team")}>
          Team details
        </button>
      </section>
      <section className="card list">
        {rows.map(([label, href]) => (
          <button
            key={label}
            className="list-row row"
            style={{ textAlign: "left" }}
            onClick={() =>
              href.startsWith("/")
                ? go(href)
                : href === "authenticator"
                  ? go("/account")
                  : notice(
                      href === "language"
                        ? "English is the only language configured in this local build."
                        : "Support contact is not configured in local mode.",
                    )
            }
          >
            <span>{label}</span>
            <span>›</span>
          </button>
        ))}
        <button className="list-row row danger" onClick={signOut}>
          <span>
            <LogOut /> Sign Out
          </span>
          <span>›</span>
        </button>
      </section>
    </div>
  );
}

function AccountView({
  go,
  notice,
  profile,
  onPinSaved,
}: {
  go: (href: string) => void;
  notice: (message: string) => void;
  profile: Profile | null;
  onPinSaved: () => void;
}) {
  const [pinAction, setPinAction] = useState<"set" | "reset" | "">("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPin, setNewPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [saving, setSaving] = useState(false);

  async function savePin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPinError("");
    setSaving(true);
    try {
      const response = await fetch("/api/v1/profile/pin", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, pin: newPin }),
      });
      if (!response.ok)
        throw new Error(
          response.status === 401
            ? "Current password is incorrect."
            : "Unable to save the PIN. Try again.",
        );
      onPinSaved();
      setPinAction("");
      setCurrentPassword("");
      setNewPin("");
      notice("Your local account PIN has been updated.");
    } catch (reason) {
      setPinError(reason instanceof Error ? reason.message : "Unable to save the PIN.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="stack">
      <button className="btn ghost" style={{ justifySelf: "start" }} onClick={() => go("/me")}>
        <ArrowLeft size={16} /> Back
      </button>
      <section className="card stack">
        <h2>Account Info</h2>
        <div className="list-row row">
          <span className="muted">Account ID</span>
          <span>{profile ? profile.id.slice(-8).toUpperCase() : "Loading…"}</span>
        </div>
        <div className="list-row row">
          <span className="muted">Phone</span>
          <span>{profile?.phone ?? "Loading…"}</span>
        </div>
        <button className="list-row row" onClick={() => go("/recovery")}>
          <span>Password</span>
          <span>••••••••　›</span>
        </button>
        <button
          className="list-row row"
          onClick={() => {
            setPinAction("set");
            setCurrentPassword("");
            setNewPin("");
            setPinError("");
          }}
        >
          <span>PIN</span>
          <span>{profile?.hasPin ? "Change　›" : "Set up　›"}</span>
        </button>
        <button
          className="list-row row"
          onClick={() => {
            setPinAction("reset");
            setCurrentPassword("");
            setNewPin("");
            setPinError("");
          }}
        >
          <span>Reset PIN</span>
          <span>›</span>
        </button>
        <button
          className="list-row row"
          onClick={() => notice("Authenticator enrollment is not configured in local mode.")}
        >
          <span>Google Authentication</span>
          <span>›</span>
        </button>
      </section>
      {pinAction && (
        <div className="modal-backdrop" role="presentation">
          <form
            className="modal stack"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pin-title"
            onSubmit={savePin}
          >
            <div className="row">
              <span />
              <button
                type="button"
                className="btn ghost"
                onClick={() => setPinAction("")}
                aria-label="Close"
              >
                <X />
              </button>
            </div>
            <h2 id="pin-title">
              {pinAction === "reset" ? "Reset PIN" : profile?.hasPin ? "Change PIN" : "Set up PIN"}
            </h2>
            <p className="muted">Verify your local account password to save a six-digit PIN.</p>
            <label className="field-label">
              Current password
              <input
                className="field"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
              />
            </label>
            <label className="field-label">
              New six-digit PIN
              <input
                className="field"
                type="password"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                autoComplete="new-password"
                value={newPin}
                onChange={(event) => setNewPin(event.target.value)}
                required
              />
            </label>
            {pinError && (
              <div className="alert" role="alert">
                {pinError}
              </div>
            )}
            <div className="grid2">
              <button type="button" className="btn secondary" onClick={() => setPinAction("")}>
                Cancel
              </button>
              <button className="btn" disabled={saving}>
                {saving ? "Saving…" : "Save PIN"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function HelpView() {
  const [open, setOpen] = useState("How to bind UPI?");
  const topics = ["How to bind UPI?", "How to Top up use USDT?", "How to Top up use INR?"];
  return (
    <div className="stack">
      {topics.map((topic) => (
        <section className="card" key={topic}>
          <button
            className="row"
            style={{ width: "100%", border: 0, background: "none", padding: 0 }}
            onClick={() => setOpen(open === topic ? "" : topic)}
          >
            <strong>{topic}</strong>
            <ChevronDown size={17} />
          </button>
          {open === topic && (
            <div className="notice" style={{ marginTop: 16 }}>
              <p>
                Follow the in-app steps and check the selected network/account before confirming.
                Never share passwords, PINs, or verification codes.
              </p>
              <p className="muted">
                Tutorial video assets are not included in this local recreation.
              </p>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

function RechargeHistory({
  currency,
  setCurrency,
  filter,
  setFilter,
  activity,
}: {
  currency: "USDT" | "INR";
  setCurrency: (value: "USDT" | "INR") => void;
  filter: string;
  setFilter: (value: string) => void;
  activity: Activity[];
}) {
  const filters = ["All", "In Payment", "Success", "Timeout", "Cancel"];
  const rows = activity.filter(
    (item) =>
      (item.currency ?? "INR") === currency &&
      (currency === "USDT" || filter === "All" || item.status === filter),
  );
  return (
    <div className="stack">
      <div className="segmented green">
        <button
          className={currency === "USDT" ? "selected" : ""}
          onClick={() => setCurrency("USDT")}
        >
          USDT
        </button>
        <button className={currency === "INR" ? "selected" : ""} onClick={() => setCurrency("INR")}>
          INR
        </button>
      </div>
      {currency === "INR" && (
        <div className="history-tabs">
          {filters.map((item) => (
            <button
              className={filter === item ? "selected" : ""}
              key={item}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
      )}
      <div className="list">
        {rows.length ? (
          rows.map((item, i) => (
            <div className="card" key={`${item.time}-${i}`}>
              <div className="row">
                <strong>
                  {fmt(item.amount)} {currency}
                </strong>
                <span className="muted">{item.status}</span>
              </div>
              <p className="muted">
                {item.type} · {item.time}
              </p>
            </div>
          ))
        ) : (
          <div className="empty">
            <CircleDollarSign size={28} />
            <p>No data</p>
            <small>Complete a task to earn Commission and Bonus.</small>
          </div>
        )}
      </div>
    </div>
  );
}

function TokenHistory({
  open,
  setOpen,
  types,
  setTypes,
  activity,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
  types: string[];
  setTypes: (value: string[]) => void;
  activity: Activity[];
}) {
  const rows = activity.filter((item) => types.includes(item.type));
  return (
    <div className="stack">
      <div className="row">
        <strong>Token history</strong>
        <button className="btn ghost" onClick={() => setOpen(!open)}>
          Type <ChevronDown size={16} />
        </button>
      </div>
      {open && (
        <section className="card checklist" style={{ maxHeight: 300, overflow: "auto" }}>
          {ledgerKinds.map((kind) => (
            <label key={kind}>
              <input
                type="checkbox"
                checked={
                  kind === "All" ? types.length === ledgerKinds.length - 1 : types.includes(kind)
                }
                onChange={() => {
                  if (kind === "All")
                    setTypes(types.length === ledgerKinds.length - 1 ? [] : ledgerKinds.slice(1));
                  else
                    setTypes(
                      types.includes(kind) ? types.filter((x) => x !== kind) : [...types, kind],
                    );
                }}
              />
              {kind}
            </label>
          ))}
        </section>
      )}
      <div className="list">
        {rows.length ? (
          rows.map((item, i) => (
            <div className="card" key={`${item.time}-${i}`}>
              <div className="row">
                <strong>{item.type}</strong>
                <span>{fmt(item.amount)}</span>
              </div>
              <p className="muted">
                {item.status} · {item.time}
              </p>
            </div>
          ))
        ) : (
          <div className="empty">No data</div>
        )}
      </div>
    </div>
  );
}

function ActionModal({
  action,
  currency,
  value,
  setValue,
  recipient,
  setRecipient,
  close,
  confirm,
}: {
  action: string;
  currency: "USDT" | "INR";
  value: string;
  setValue: (value: string) => void;
  recipient: string;
  setRecipient: (value: string) => void;
  close: () => void;
  confirm: () => void | Promise<void>;
}) {
  const financial = ["Buy", "Receive Payment", "Send Payment"].includes(action);
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <section
        className="modal stack"
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-title"
      >
        <div className="row">
          <span />
          <button className="btn ghost" onClick={close} aria-label="Close">
            <X />
          </button>
        </div>
        <h2 id="action-title">{action}</h2>
        <p className="muted" style={{ textAlign: "center" }}>
          {financial
            ? "This is a local mock. No funds will be transferred."
            : "This workflow is simulated in local mock mode."}
        </p>
        {financial && (
          <label className="field-label">
            Amount ({action === "Buy" ? currency : "INR"})
            <input
              className="field"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              type="number"
              min="1"
              placeholder="0"
            />
          </label>
        )}
        {action === "Send Payment" && (
          <label className="field-label">
            Mock recipient
            <input
              className="field"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="demo-recipient"
            />
          </label>
        )}
        {action === "Add UPI account" && (
          <label className="field-label">
            UPI ID
            <input
              className="field"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="name@bank"
            />
          </label>
        )}
        <div className="grid2">
          <button className="btn secondary" onClick={close}>
            Cancel
          </button>
          <button className="btn" onClick={confirm}>
            {financial ? "Review mock action" : "Continue"}
          </button>
        </div>
      </section>
    </div>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n);
}
function ledgerLabel(type: string) {
  return type
    .toLowerCase()
    .split("_")
    .map((word) => (word ? `${word[0].toUpperCase()}${word.slice(1)}` : word))
    .join(" ");
}
function statusLabel(status: string) {
  if (["INITIATED", "PENDING", "PROCESSING"].includes(status)) return "In Payment";
  if (["SUCCESSFUL", "REFUNDED"].includes(status)) return "Success";
  if (["FAILED"].includes(status)) return "Timeout";
  if (["CANCELLED"].includes(status)) return "Cancel";
  return "In Payment";
}
