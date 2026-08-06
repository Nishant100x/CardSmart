"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CATALOG, type CardData } from "./cardCatalog";
import {
  confidenceLabel,
  inferCategory,
  rankCards,
  type PaymentChannel,
  type PurchaseCategory,
  type RecommendationInput,
} from "./recommendationEngine";
import {
  type Activity,
  type AuthMode,
  type Profile,
  useCardSmartData,
} from "./data";

type View = "landing" | "pay" | "cards" | "activity" | "discover" | "account" | "privacy" | "terms" | "about";
type PaymentContext = Pick<Activity, "merchant" | "amount" | "category" | "channel">;
type DiscoverInputs = {
  income: "under50" | "50to100" | "100to200" | "200to300" | "300plus";
  fee: "free" | "1000" | "5000" | "value";
  goal: "cashback" | "travel" | "lounge" | "balanced";
  spends: Record<"shopping" | "dining" | "travel" | "grocery" | "utilities", number>;
};

const ROUTES: Array<{ value: Exclude<PaymentChannel, "auto">; label: string }> = [
  { value: "online", label: "Online" },
  { value: "app", label: "Partner app" },
  { value: "offline", label: "At a store" },
  { value: "upi", label: "UPI" },
];
const CATEGORIES: Array<{ value: Exclude<PurchaseCategory, "auto">; label: string }> = [
  { value: "dining", label: "Food & dining" },
  { value: "shopping", label: "Shopping" },
  { value: "travel", label: "Travel" },
  { value: "grocery", label: "Groceries" },
  { value: "utilities", label: "Bills & utilities" },
  { value: "fuel", label: "Fuel" },
  { value: "rent", label: "Rent" },
  { value: "education", label: "Education" },
  { value: "insurance", label: "Insurance" },
  { value: "government", label: "Government & tax" },
  { value: "wallet", label: "Wallet load" },
  { value: "other", label: "Something else" },
];
const POPULAR_IDS = ["sbi-cashback", "hdfc-millennia", "amazon-icici", "axis-atlas", "hdfc-swiggy", "hsbc-liveplus"];
const DEFAULT_DISCOVER: DiscoverInputs = {
  income: "100to200",
  fee: "value",
  goal: "cashback",
  spends: { shopping: 0, dining: 0, travel: 0, grocery: 0, utilities: 0 },
};

const DISCOVERY_META: Record<string, { fee: number; minIncome: number; styles: DiscoverInputs["goal"][] }> = {
  "sbi-cashback": { fee: 999, minIncome: 30000, styles: ["cashback", "balanced"] },
  "hdfc-millennia": { fee: 1000, minIncome: 35000, styles: ["cashback", "balanced"] },
  "hdfc-swiggy": { fee: 500, minIncome: 25000, styles: ["cashback", "balanced"] },
  "hsbc-liveplus": { fee: 999, minIncome: 50000, styles: ["cashback", "balanced"] },
  "axis-atlas": { fee: 5000, minIncome: 100000, styles: ["travel", "balanced"] },
  "hdfc-regalia-gold": { fee: 2500, minIncome: 100000, styles: ["travel", "lounge", "balanced"] },
  "hdfc-dcb-metal": { fee: 10000, minIncome: 250000, styles: ["travel", "lounge"] },
  "hdfc-infinia": { fee: 12500, minIncome: 300000, styles: ["travel", "lounge"] },
  "amazon-icici": { fee: 0, minIncome: 30000, styles: ["cashback", "balanced"] },
  "axis-ace": { fee: 499, minIncome: 40000, styles: ["cashback", "balanced"] },
};

function money(value: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.max(0, Math.round(value)));
}

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    cards: <><rect x="3" y="6" width="18" height="13" rx="3"/><path d="M7 6V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"/></>,
    close: <><path d="m6 6 12 12"/><path d="m18 6-12 12"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    tick: <path d="m5 12 4 4L19 6"/>,
    spark: <><path d="m12 3 1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3Z"/><path d="m18 15 .8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8L18 15Z"/></>,
    wallet: <><path d="M4 7h14a2 2 0 0 1 2 2v9H4a2 2 0 0 1-2-2V6a3 3 0 0 1 3-3h12"/><path d="M15 12h5"/></>,
    chart: <><path d="M4 19V9"/><path d="M10 19V5"/><path d="M16 19v-7"/><path d="M22 19V3"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    trash: <><path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="m6 7 1 14h10l1-14M9 7V4h6v3"/></>,
    edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function Logo({ onClick }: { onClick?: () => void }) {
  return <button className="brand" onClick={onClick} aria-label="CardSmart home"><span className="brand-mark"><i/><i/><i/></span><span>CardSmart</span></button>;
}

function CardVisual({ card, small = false }: { card: CardData; small?: boolean }) {
  return (
    <div className={`credit-card ${small ? "small" : ""}`} style={{ background: `linear-gradient(145deg, ${card.colors[0]}, ${card.colors[1]})`, color: card.accent }}>
      <div><span className="card-bank">{card.bank}</span><span className="card-chip"/></div>
      <div><strong>{card.name}</strong><span>{card.network}</span></div>
    </div>
  );
}

function CardSearch({ selected, onChange, min = 0, label = "Add the cards you own" }: { selected: string[]; onChange: (ids: string[]) => void; min?: number; label?: string }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    const sorted = [...CATALOG].sort((a, b) => Number(POPULAR_IDS.includes(b.id)) - Number(POPULAR_IDS.includes(a.id)));
    if (!term) return sorted.slice(0, 8);
    return sorted.filter(card => `${card.bank} ${card.name}`.toLowerCase().includes(term)).slice(0, 12);
  }, [query]);
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter(item => item !== id) : [...selected, id]);
  return (
    <div className="card-search">
      <div className="field-label-row"><label htmlFor="card-search">{label}</label><span>{selected.length} selected</span></div>
      <div className="search-input"><Icon name="search" size={18}/><input id="card-search" value={query} onChange={event => setQuery(event.target.value)} placeholder={`Search ${CATALOG.length} cards by bank or name`} /></div>
      <div className="card-search-results" role="listbox" aria-label="Credit cards">
        {results.map(card => {
          const active = selected.includes(card.id);
          return <button key={card.id} type="button" role="option" aria-selected={active} className={`card-option ${active ? "selected" : ""}`} onClick={() => toggle(card.id)}><span className="mini-card" style={{ background: `linear-gradient(145deg, ${card.colors[0]}, ${card.colors[1]})` }}/><span><strong>{card.name}</strong><small>{card.bank}</small></span><span className="select-dot">{active && <Icon name="tick" size={15}/>}</span></button>;
        })}
      </div>
      {selected.length < min && <p className="field-hint">Select at least {min} cards for a meaningful comparison.</p>}
    </div>
  );
}

function prepareWallet(ids: string[], capUsage: Record<string, number>, prime: boolean) {
  return ids.map(id => CATALOG.find(card => card.id === id)).filter(Boolean).map(raw => {
    const card = raw as CardData;
    let next = { ...card, trackedValue: capUsage[card.id] ?? 0 };
    if (card.id === "amazon-icici" && !prime) {
      next = {
        ...next,
        rewardModel: {
          ...next.rewardModel,
          merchantRules: next.rewardModel.merchantRules?.map(rule => rule.matches.includes("amazon") ? { ...rule, rate: 3, label: "Amazon non-Prime purchase reward" } : rule),
          assumptions: ["Amazon rate uses 3% because Prime membership is set to no.", ...(next.rewardModel.assumptions ?? []).slice(1)],
        },
      };
    }
    return next;
  });
}

function PaymentWorkbench({ selected, onSelected, compact = false, onSave, onConfirm, initialPayment = null, busy = false }: {
  selected: string[];
  onSelected: (ids: string[]) => void;
  compact?: boolean;
  onSave?: () => void;
  onConfirm?: (activity: Activity) => void;
  initialPayment?: PaymentContext | null;
  busy?: boolean;
}) {
  const [merchant, setMerchant] = useState(initialPayment?.merchant ?? (compact ? "" : "Swiggy"));
  const [amount, setAmount] = useState(initialPayment ? String(initialPayment.amount) : (compact ? "" : "2000"));
  const [channel, setChannel] = useState<Exclude<PaymentChannel, "auto">>(initialPayment?.channel ?? "online");
  const [category, setCategory] = useState<Exclude<PurchaseCategory, "auto">>(initialPayment?.category ?? "dining");
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [prime, setPrime] = useState(true);
  const [capUsage, setCapUsage] = useState<Record<string, number>>({});
  const [result, setResult] = useState<ReturnType<typeof rankCards<CardData>> | null>(null);
  const [showMath, setShowMath] = useState(false);
  useEffect(() => {
    if (!initialPayment) return;
    setMerchant(initialPayment.merchant);
    setAmount(String(initialPayment.amount));
    setCategory(initialPayment.category);
    setChannel(initialPayment.channel);
    setCategoryTouched(true);
    setResult(null);
  }, [initialPayment]);
  const input: RecommendationInput = { merchant, amount: Number(amount) || 0, category, channel };
  const compare = (nextCaps = capUsage, nextPrime = prime) => {
    const wallet = prepareWallet(selected, nextCaps, nextPrime);
    setResult(rankCards(wallet, input));
  };
  const handleMerchant = (value: string) => {
    setMerchant(value);
    if (!categoryTouched && value.trim()) setCategory(inferCategory(value));
    setResult(null);
  };
  const winner = result?.[0];
  const runner = result?.[1];
  const tied = Boolean(winner && runner && winner.value === runner.value);
  const capCards = result?.filter(item => item.capAmount !== null && item.grossValue > 0).slice(0, 2) ?? [];
  const amazonRelevant = selected.includes("amazon-icici") && merchant.toLowerCase().includes("amazon");

  if (result && winner) {
    return (
      <div className="result-shell" aria-live="polite">
        <button className="back-link" onClick={() => setResult(null)}>← Change payment</button>
        <div className="result-stage">
          <div className="decision-kicker"><span/><span>{tied ? "Same estimated value" : "Best estimated value"}</span></div>
          <div className="winner-stack">
            {result.slice(0, 3).reverse().map((item, index) => <div className={`stack-card stack-${index}`} key={item.card.id}><CardVisual card={item.card}/></div>)}
          </div>
          <div className="result-copy">
            <p>{merchant} · ₹{money(Number(amount))} · {channel}</p>
            <h3>{tied && runner ? `${winner.card.name} and ${runner.card.name} are tied` : `Use ${winner.card.name}`}</h3>
            <div className="result-value"><span>Estimated reward</span><strong>₹{money(winner.value)}</strong></div>
            {!tied && runner && <div className="extra-value">₹{money(winner.value - runner.value)} more than {runner.card.name}</div>}
            {tied && <div className="extra-value neutral">Use either card for this payment.</div>}
          </div>
        </div>

        <div className="assumption-bar"><Icon name="spark" size={18}/><span>{winner.ruleLabel}. {winner.capAmount ? `Assumes ₹${money(winner.capRemaining ?? 0)} of this reward limit is still available.` : "No known reward cap changed this answer."}</span></div>

        {(capCards.length > 0 || amazonRelevant) && <div className="context-check">
          <h4>Make this answer more accurate</h4>
          {amazonRelevant && <label className="inline-question"><span>Amazon Prime active?</span><select value={prime ? "yes" : "no"} onChange={event => { const nextPrime = event.target.value === "yes"; setPrime(nextPrime); compare(capUsage, nextPrime); }}><option value="yes">Yes</option><option value="no">No</option></select></label>}
          {capCards.map(item => <label className="inline-question" key={item.card.id}><span>{item.card.name} rewards already used this cycle</span><div className="money-input"><b>₹</b><input inputMode="numeric" value={capUsage[item.card.id] ?? ""} placeholder="0" onChange={event => { const nextCaps = { ...capUsage, [item.card.id]: Number(event.target.value) || 0 }; setCapUsage(nextCaps); compare(nextCaps, prime); }}/></div></label>)}
        </div>}

        <div className="result-actions">
          {onConfirm && <button className="button primary" disabled={busy} onClick={() => onConfirm({ id: crypto.randomUUID(), merchant, amount: Number(amount), cardId: winner.card.id, reward: winner.value, extra: Math.max(0, winner.value - (runner?.value ?? 0)), date: new Date().toISOString(), category, channel })}>{busy ? "Saving…" : "I paid with this card"}</button>}
          {onSave && <button className="button primary" onClick={onSave}>Save this wallet</button>}
          <button className="button ghost" onClick={() => setShowMath(value => !value)}>{showMath ? "Hide calculation" : "Why this card?"}</button>
        </div>
        {showMath && <div className="math-panel">
          <div className="math-head"><h4>Same calculation for every card</h4><span>{confidenceLabel(winner.confidence)}</span></div>
          {result.map(item => <div className="math-row" key={item.card.id}><span><strong>{item.card.name}</strong><small>{item.ruleLabel}</small></span><span>{item.rate}% × ₹{money(Number(amount))}</span><strong>₹{money(item.value)}</strong></div>)}
          <p>Issuer recognition, merchant category codes and redemptions can change the realised value. CardSmart shows its assumptions so you can verify them.</p>
        </div>}
      </div>
    );
  }

  return (
    <div className={`payment-workbench ${compact ? "compact" : ""}`}>
      <div className="workbench-head">
        <span className="step-number">01</span>
        <div><h3>What are you paying for?</h3><p>Give CardSmart the details that can genuinely change the answer.</p></div>
      </div>
      <div className="payment-fields">
        <label className="field wide"><span>Merchant or payment</span><input value={merchant} onChange={event => handleMerchant(event.target.value)} placeholder="e.g. Swiggy, Amazon, flight booking"/></label>
        <label className="field"><span>Amount</span><div className="amount-input"><b>₹</b><input inputMode="numeric" value={amount} onChange={event => { setAmount(event.target.value.replace(/\D/g, "")); setResult(null); }} placeholder="2,000"/></div></label>
        <label className="field"><span>How will you pay?</span><select value={channel} onChange={event => { setChannel(event.target.value as Exclude<PaymentChannel, "auto">); setResult(null); }}>{ROUTES.map(route => <option value={route.value} key={route.value}>{route.label}</option>)}</select></label>
        <label className="field"><span>We think this is</span><select value={category} onChange={event => { setCategory(event.target.value as Exclude<PurchaseCategory, "auto">); setCategoryTouched(true); setResult(null); }}>{CATEGORIES.map(item => <option value={item.value} key={item.value}>{item.label}</option>)}</select><small>Correct this if we got it wrong.</small></label>
      </div>
      <div className="workbench-divider"/>
      <div className="workbench-head">
        <span className="step-number">02</span>
        <div><h3>Which cards are in your wallet?</h3><p>Search the full catalogue. No card number or bank login needed.</p></div>
      </div>
      <CardSearch selected={selected} onChange={ids => { onSelected(ids); setResult(null); }} min={2}/>
      <button className="button primary compare-button" disabled={!merchant.trim() || Number(amount) <= 0 || selected.length < 2 || busy} onClick={() => compare()}>Compare my cards <Icon name="arrow" size={18}/></button>
      <p className="submit-note"><Icon name="lock" size={15}/> No card number or bank login needed.</p>
    </div>
  );
}

function PublicHeader({ onLogin, navigate }: { onLogin: () => void; navigate: (view: View) => void }) {
  return <header className="public-header"><Logo onClick={() => navigate("landing")}/><nav><button onClick={() => document.getElementById("proof")?.scrollIntoView()}>How it decides</button><button onClick={() => navigate("about")}>About</button></nav><div className="header-actions"><button className="text-button" onClick={onLogin}>Log in</button><button className="button dark small-button" onClick={() => document.getElementById("try")?.scrollIntoView()}>Try a payment</button></div></header>;
}

function Landing({ selected, onSelected, onSave, onLogin, navigate }: { selected: string[]; onSelected: (ids: string[]) => void; onSave: () => void; onLogin: () => void; navigate: (view: View) => void }) {
  return <div className="public-page">
    <PublicHeader onLogin={onLogin} navigate={navigate}/>
    <main>
      <section className="hero-light" id="try">
        <div className="hero-copy">
          <div className="eyebrow"><span/>One answer before every payment</div>
          <h1>Your cards. <em>One clear choice.</em></h1>
          <p>Tell CardSmart where you’re paying. It compares the cards you already own and shows which one is likely to earn you more.</p>
          <div className="hero-proof"><span><Icon name="tick" size={16}/> No card number</span><span><Icon name="tick" size={16}/> No bank login</span><span><Icon name="tick" size={16}/> Free to try</span></div>
          <div className="decision-preview" aria-hidden="true"><span className="preview-line"/><div><strong>₹60</strong><small>extra on a ₹2,000 payment</small></div></div>
        </div>
        <div className="hero-product"><PaymentWorkbench selected={selected} onSelected={onSelected} onSave={onSave}/></div>
      </section>
      <section className="outcome-strip"><p>Every swipe is a tiny decision.</p><strong>CardSmart turns it into money you can see.</strong></section>
      <section className="proof-section" id="proof">
        <div className="section-intro"><span className="eyebrow"><span/>No black box</span><h2>See why one card wins.</h2><p>CardSmart does not stop at a card name. It shows the reward rule, route, category, limits and assumptions behind the answer.</p></div>
        <div className="proof-grid">
          <article><span>01</span><Icon name="wallet" size={26}/><h3>Your actual wallet</h3><p>Search {CATALOG.length} Indian cards. We compare only the cards you say you own.</p></article>
          <article><span>02</span><Icon name="spark" size={26}/><h3>The payment context</h3><p>Merchant, amount, category and payment route can all change the answer.</p></article>
          <article><span>03</span><Icon name="chart" size={26}/><h3>The value gap</h3><p>See the estimated reward and what it adds over your next-best card.</p></article>
        </div>
      </section>
      <section className="truth-section"><div><span className="eyebrow"><span/>Built for trust</span><h2>Confident when the rules are clear. Careful when they aren’t.</h2></div><div className="truth-list"><div><strong>Verified and reviewed rules</strong><p>Every calculation carries a confidence label and review date where available.</p></div><div><strong>Honest uncertainty</strong><p>If merchant coding or a monthly limit can change the answer, CardSmart tells you and asks only what matters.</p></div><div><strong>Your wallet stays yours</strong><p>Saving is optional. No card numbers, CVVs or bank credentials are collected.</p></div></div></section>
      <section className="final-cta"><span className="eyebrow light"><span/>Three seconds next time</span><h2>Stop guessing at checkout.</h2><button className="button light" onClick={() => document.getElementById("try")?.scrollIntoView()}>Check a payment <Icon name="arrow" size={18}/></button></section>
    </main>
    <footer><Logo onClick={() => navigate("landing")}/><p>Independent card guidance. CardSmart is not a bank or card issuer.</p><div><button onClick={() => navigate("privacy")}>Privacy</button><button onClick={() => navigate("terms")}>Terms</button></div></footer>
  </div>;
}

function AuthDialog({ open, onClose, onSubmit, selectedCount, saveWallet, busy, error, notice }: {
  open: boolean;
  onClose: () => void;
  onSubmit: (mode: AuthMode, values: { name: string; email: string; password: string }) => Promise<boolean>;
  selectedCount: number;
  saveWallet: boolean;
  busy: boolean;
  error: string;
  notice: string;
}) {
  const [mode, setMode] = useState<AuthMode>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  if (!open) return null;
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim() || password.length < 8 || (mode === "signup" && name.trim().length < 2)) return;
    const completed = await onSubmit(mode, { name, email, password });
    if (completed) onClose();
  };
  return <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.currentTarget === event.target && !busy) onClose(); }}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="auth-title"><button className="modal-close" disabled={busy} onClick={onClose} aria-label="Close"><Icon name="close"/></button><Logo/><div className="modal-copy"><span>{saveWallet && selectedCount ? `${selectedCount} cards ready to save` : "Welcome to CardSmart"}</span><h2 id="auth-title">{mode === "signup" ? (saveWallet ? "Save your wallet" : "Create your account") : "Welcome back"}</h2><p>{mode === "signup" ? (saveWallet ? "Create an account so you never need to add these cards again." : "Create an account to keep your wallet and payment history in sync.") : "Log in to open your saved wallet."}</p></div><form onSubmit={submit}>{mode === "signup" && <label className="field"><span>Name</span><input value={name} onChange={event => setName(event.target.value)} placeholder="Your name" required/></label>}<label className="field"><span>Email</span><input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" required/></label><label className="field"><span>Password</span><input type="password" value={password} onChange={event => setPassword(event.target.value)} minLength={8} placeholder="At least 8 characters" required/></label>{error && <p className="form-message error-message">{error}</p>}{notice && <p className="form-message success-message">{notice}</p>}<button className="button primary full" disabled={busy} type="submit">{busy ? "Please wait…" : mode === "signup" ? (saveWallet ? "Create account & save wallet" : "Create account") : "Log in"}</button></form><button className="switch-mode" disabled={busy} onClick={() => setMode(current => current === "signup" ? "login" : "signup")}>{mode === "signup" ? "Already have an account? Log in" : "New to CardSmart? Create account"}</button><p className="prototype-note">Your password is handled by Supabase. CardSmart never asks for card numbers, CVVs or bank credentials.</p></div></div>;
}

function AppHeader({ view, navigate }: { view: View; navigate: (view: View) => void }) {
  const nav: Array<{ id: View; label: string; icon: string }> = [{ id: "pay", label: "Pay", icon: "spark" }, { id: "cards", label: "My cards", icon: "cards" }, { id: "activity", label: "Extra rewards", icon: "chart" }, { id: "discover", label: "Find a card", icon: "search" }];
  return <><header className="app-header"><Logo onClick={() => navigate("pay")}/><nav>{nav.map(item => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => navigate(item.id)}><Icon name={item.icon} size={18}/>{item.label}</button>)}</nav><button className="account-button" onClick={() => navigate("account")}><Icon name="user" size={19}/><span>Account</span></button></header><nav className="mobile-nav">{nav.map(item => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => navigate(item.id)}><Icon name={item.icon} size={20}/><span>{item.label === "Extra rewards" ? "Rewards" : item.label}</span></button>)}</nav></>;
}

function AppShell({ view, navigate, children }: { view: View; navigate: (view: View) => void; children: React.ReactNode }) {
  return <div className="app-page"><AppHeader view={view} navigate={navigate}/><main className="app-main">{children}</main></div>;
}

function PayView({ wallet, setWallet, onActivity, initialPayment, busy, error }: { wallet: string[]; setWallet: (ids: string[]) => void; onActivity: (item: Activity) => void; initialPayment: PaymentContext | null; busy: boolean; error: string }) {
  return <div className="app-view pay-view"><div className="app-title"><span className="eyebrow"><span/>Use what you already own</span><h1>Which card should you use?</h1><p>One payment in. One clear answer out.</p></div>{error && <p className="form-message error-message page-message">{error}</p>}{wallet.length < 2 ? <div className="empty-panel"><Icon name="wallet" size={30}/><h2>Add at least two cards</h2><p>CardSmart needs a real wallet to compare. Search the catalogue below.</p><CardSearch selected={wallet} onChange={setWallet} min={2}/></div> : <PaymentWorkbench selected={wallet} onSelected={setWallet} compact onConfirm={onActivity} initialPayment={initialPayment} busy={busy}/>}</div>;
}

function CardsView({ wallet, setWallet, busy, error }: { wallet: string[]; setWallet: (ids: string[]) => void; busy: boolean; error: string }) {
  const [detail, setDetail] = useState<CardData | null>(null);
  const cards = wallet.map(id => CATALOG.find(card => card.id === id)).filter(Boolean) as CardData[];
  return <div className="app-view"><div className="app-title split"><div><span className="eyebrow"><span/>Your wallet</span><h1>{cards.length} cards. One system.</h1><p>Add or remove cards. CardSmart uses this wallet for every payment comparison.</p></div></div>{error && <p className="form-message error-message page-message">{error}</p>}{busy && <p className="form-message page-message">Saving your wallet…</p>}<div className="wallet-layout"><div className="wallet-grid">{cards.map(card => <article className="wallet-card" key={card.id}><CardVisual card={card}/><div className="wallet-card-copy"><div><strong>{card.name}</strong><span>{card.bank}</span></div><p>Best for {card.bestFor.slice(0, 2).join(" and ").toLowerCase()}.</p><button onClick={() => setDetail(card)}>View reward rules <Icon name="chevron" size={16}/></button></div></article>)}</div><aside className="add-card-panel"><h3>Add another card</h3><p>Search the complete catalogue. No card number needed.</p><CardSearch selected={wallet} onChange={setWallet}/></aside></div>{detail && <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setDetail(null); }}><div className="modal card-detail" role="dialog" aria-modal="true"><button className="modal-close" onClick={() => setDetail(null)} aria-label="Close"><Icon name="close"/></button><CardVisual card={detail}/><span className={`confidence ${detail.rewardModel.confidence}`}>{confidenceLabel(detail.rewardModel.confidence)}</span><h2>{detail.name}</h2><p>{detail.note}</p><dl><div><dt>Best for</dt><dd>{detail.bestFor.join(", ")}</dd></div><div><dt>Reward limit</dt><dd>{detail.cap}</dd></div><div><dt>Important exclusions</dt><dd>{detail.rewardModel.exclusions?.join(", ") || "No structured exclusions available yet"}</dd></div><div><dt>Rule review</dt><dd>{detail.rewardModel.reviewedOn || "Needs issuer verification"}</dd></div></dl><button className="button danger" disabled={busy} onClick={() => { setWallet(wallet.filter(id => id !== detail.id)); setDetail(null); }}>Remove from wallet</button></div></div>}</div>;
}

function ActivityView({ activity, onReplay }: { activity: Activity[]; onReplay: (item: Activity) => void }) {
  const [period, setPeriod] = useState<"month" | "all">("month");
  const filtered = period === "all" ? activity : activity.filter(item => new Date(item.date).getMonth() === new Date().getMonth() && new Date(item.date).getFullYear() === new Date().getFullYear());
  const total = filtered.reduce((sum, item) => sum + item.extra, 0);
  return <div className="app-view"><div className="app-title"><span className="eyebrow"><span/>Confirmed choices only</span><h1>Your estimated extra rewards.</h1><p>Built from payments where you confirmed the card you used. These are estimates, not bank-verified rewards.</p></div><div className="period-switch"><button className={period === "month" ? "active" : ""} onClick={() => setPeriod("month")}>This month</button><button className={period === "all" ? "active" : ""} onClick={() => setPeriod("all")}>All time</button></div>{filtered.length === 0 ? <div className="empty-panel simple"><Icon name="chart" size={32}/><h2>No saved payments yet</h2><p>Confirm a card choice after paying and your estimated extra rewards will appear here.</p></div> : <><div className="reward-total"><span>Estimated extra rewards</span><strong>₹{money(total)}</strong><small>across {filtered.length} confirmed {filtered.length === 1 ? "payment" : "payments"}</small></div><div className="activity-list">{filtered.map(item => { const card = CATALOG.find(cardItem => cardItem.id === item.cardId); return <article key={item.id}><div className="activity-icon" style={{ background: card?.colors[0] }}/><div><strong>{item.merchant}</strong><span>{new Date(item.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {card?.name}</span><button className="replay-button" onClick={() => onReplay(item)}>Try this payment again</button></div><div><strong>+₹{money(item.extra)}</strong><span>₹{money(item.reward)} estimated reward</span></div></article>;})}</div></>}</div>;
}

function incomeValue(value: DiscoverInputs["income"]) {
  return { under50: 40000, "50to100": 75000, "100to200": 150000, "200to300": 250000, "300plus": 350000 }[value];
}
function feeLimit(value: DiscoverInputs["fee"]) {
  return { free: 0, "1000": 1000, "5000": 5000, value: Number.POSITIVE_INFINITY }[value];
}

function DiscoverView({ wallet }: { wallet: string[] }) {
  const [inputs, setInputs] = useState(DEFAULT_DISCOVER);
  const [hasCalculated, setHasCalculated] = useState(false);
  const evaluations = useMemo(() => {
    const owned = prepareWallet(wallet, {}, true);
    return Object.entries(DISCOVERY_META).filter(([id]) => !wallet.includes(id)).map(([id, meta]) => {
      const card = CATALOG.find(item => item.id === id)!;
      let annualIncremental = 0;
      let annualCardValue = 0;
      let annualWalletValue = 0;
      for (const [category, monthlySpend] of Object.entries(inputs.spends)) {
        const payment: RecommendationInput = { merchant: category, amount: monthlySpend, category: category as Exclude<PurchaseCategory, "auto">, channel: "online" };
        const currentBest = rankCards(owned, payment)[0]?.value ?? 0;
        const cardValue = rankCards([card], payment)[0]?.value ?? 0;
        annualWalletValue += currentBest * 12;
        annualCardValue += cardValue * 12;
        annualIncremental += Math.max(0, cardValue - currentBest) * 12;
      }
      const net = annualIncremental - meta.fee;
      return { card, ...meta, annualIncremental, annualCardValue, annualWalletValue, net, incomeFit: incomeValue(inputs.income) >= meta.minIncome, feeFit: meta.fee <= feeLimit(inputs.fee), styleFit: meta.styles.includes(inputs.goal) };
    }).sort((a, b) => Number(b.incomeFit && b.feeFit) - Number(a.incomeFit && a.feeFit) || b.net - a.net);
  }, [inputs, wallet]);
  const eligible = evaluations.filter(item => item.incomeFit && item.feeFit && item.net > 0);
  const uncertain = evaluations.filter(item => (!item.incomeFit || !item.feeFit) && item.net > 0).slice(0, 2);
  const winner = eligible[0];
  const totalSpend = Object.values(inputs.spends).reduce((sum, value) => sum + value, 0);
  const updateSpend = (key: keyof DiscoverInputs["spends"], value: string) => setInputs(current => ({ ...current, spends: { ...current.spends, [key]: Number(value) || 0 } }));
  return <div className="app-view discover-view"><div className="app-title"><span className="eyebrow"><span/>A separate decision</span><h1>Is another card actually worth it?</h1><p>We compare what a new card adds over the best card already in your wallet, then subtract its annual fee.</p></div><div className="discover-layout"><div className="discover-form"><section><span className="form-step">01 · Your real monthly spend</span><div className="spend-grid">{Object.keys(inputs.spends).map(key => <label className="field" key={key}><span>{key === "shopping" ? "Online shopping" : key[0].toUpperCase() + key.slice(1)}</span><div className="amount-input"><b>₹</b><input inputMode="numeric" value={inputs.spends[key as keyof DiscoverInputs["spends"]] || ""} placeholder="0" onChange={event => updateSpend(key as keyof DiscoverInputs["spends"], event.target.value)}/></div></label>)}</div></section><section><span className="form-step">02 · Basic fit</span><div className="two-fields"><label className="field"><span>Monthly take-home income</span><select value={inputs.income} onChange={event => setInputs(current => ({ ...current, income: event.target.value as DiscoverInputs["income"] }))}><option value="under50">Below ₹50,000</option><option value="50to100">₹50,000–₹1 lakh</option><option value="100to200">₹1–2 lakh</option><option value="200to300">₹2–3 lakh</option><option value="300plus">Above ₹3 lakh</option></select></label><label className="field"><span>Annual-fee comfort</span><select value={inputs.fee} onChange={event => setInputs(current => ({ ...current, fee: event.target.value as DiscoverInputs["fee"] }))}><option value="free">Lifetime-free only</option><option value="1000">Up to ₹1,000</option><option value="5000">Up to ₹5,000</option><option value="value">Any fee if value works</option></select></label></div><label className="field"><span>What do you value most?</span><select value={inputs.goal} onChange={event => setInputs(current => ({ ...current, goal: event.target.value as DiscoverInputs["goal"] }))}><option value="cashback">Simple cashback</option><option value="travel">Travel rewards</option><option value="lounge">Lounge access</option><option value="balanced">Balanced value</option></select><small>This changes how we explain fit. Soft benefits are not silently added to the rupee ranking.</small></label></section><button className="button primary full" disabled={wallet.length === 0 || totalSpend === 0} onClick={() => setHasCalculated(true)}>Calculate incremental value</button>{wallet.length === 0 && <p className="field-hint">Add your current cards first. Without them, “extra value” would be misleading.</p>}</div><div className="discover-result">{!hasCalculated ? <div className="empty-result"><span className="result-orbit"><i/><i/><i/></span><h3>Your wallet is the baseline</h3><p>We calculate the best reward you already have in every category before giving a new card any credit.</p><div className="formula">New reward advantage − annual fee = net incremental value</div></div> : !winner ? <div className="empty-result"><Icon name="tick" size={34}/><h3>Don’t add a paid card yet</h3><p>None of the modelled cards adds enough reward value over your current wallet after its fee.</p></div> : <><div className="recommendation-card"><span className="recommendation-label">Best incremental value</span><CardVisual card={winner.card}/><div><h2>{winner.card.name}</h2><p>{winner.card.bank}</p></div><div className="net-value"><span>Net extra value after fee</span><strong>₹{money(winner.net)}<small>/year</small></strong></div><div className="value-breakdown"><div><span>Extra rewards over your wallet</span><strong>₹{money(winner.annualIncremental)}</strong></div><div><span>Annual fee</span><strong>−₹{money(winner.fee)}</strong></div></div><p className="preference-fit">{winner.styleFit ? `Matches your ${inputs.goal} preference.` : `Best rupee value, although ${inputs.goal} is not its primary strength.`}</p><p className="eligibility-note"><Icon name="tick" size={16}/> Meets the stated income and fee filters. Final issuer approval can differ.</p></div>{uncertain.length > 0 && <div className="uncertain-list"><h3>Higher value, basic fit uncertain</h3>{uncertain.map(item => <div key={item.card.id}><span><strong>{item.card.name}</strong><small>{!item.incomeFit ? "Income requirement may not fit" : "Outside your fee preference"}</small></span><strong>₹{money(item.net)}/yr</strong></div>)}</div>}</>}</div></div><p className="model-note">This prototype ranks {Object.keys(DISCOVERY_META).length} cards whose annual-fee and income filters are modelled. The full catalogue remains searchable for your wallet; indicative cards are not allowed to create false precision here.</p></div>;
}

function AccountView({ profile, setProfile, onLogout, onDelete, busy, error, notice }: { profile: Profile; setProfile: (profile: Profile) => void; onLogout: () => void; onDelete: () => void; busy: boolean; error: string; notice: string }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  return <div className="app-view account-view"><div className="app-title"><span className="eyebrow"><span/>Your account</span><h1>Simple controls. No hidden behaviour.</h1><p>These preferences affect only the actions they describe.</p></div>{error && <p className="form-message error-message page-message">{error}</p>}{notice && <p className="form-message success-message page-message">{notice}</p>}<div className="settings-panel"><div className="profile-row"><div className="avatar">{profile.name[0]?.toUpperCase() || "Y"}</div><div><strong>{profile.name}</strong><span>{profile.email}</span></div></div><label className="toggle-row"><span><strong>Save confirmed payment checks</strong><small>When off, “I paid with this card” will not add to Extra rewards.</small></span><input type="checkbox" checked={profile.saveChecks} onChange={event => setProfile({ ...profile, saveChecks: event.target.checked })}/></label><label className="toggle-row"><span><strong>Reward-rule update alerts</strong><small>Your preference is saved. Alerts will begin only after notifications are connected.</small></span><input type="checkbox" checked={profile.ruleAlerts} onChange={event => setProfile({ ...profile, ruleAlerts: event.target.checked })}/></label><button className="settings-action" disabled={busy} onClick={onLogout}>Log out <Icon name="chevron" size={18}/></button><button className="settings-action danger-text" disabled={busy} onClick={() => setConfirmDelete(true)}>Delete account and data <Icon name="trash" size={18}/></button></div>{confirmDelete && <div className="modal-backdrop"><div className="modal confirm-modal" role="dialog" aria-modal="true"><Icon name="trash" size={30}/><h2>Delete your CardSmart account?</h2><p>This permanently removes your account, profile, wallet and confirmed payment history. It cannot be undone.</p><div className="modal-actions"><button className="button danger" disabled={busy} onClick={onDelete}>{busy ? "Deleting…" : "Delete everything"}</button><button className="button ghost" disabled={busy} onClick={() => setConfirmDelete(false)}>Cancel</button></div></div></div>}</div>;
}

function LegalPage({ type, navigate }: { type: "privacy" | "terms" | "about"; navigate: (view: View) => void }) {
  const copy = {
    privacy: { eyebrow: "Privacy", title: "Your financial decisions are personal.", intro: "CardSmart is designed to work without card numbers, CVVs or bank credentials.", sections: [["What CardSmart stores", "Your selected card names, account preferences and confirmed payment estimates are stored in your authenticated CardSmart account."], ["Your control", "You can delete your CardSmart account, wallet, profile and payment history from Account settings."], ["What we never need", "Full card numbers, CVVs, PINs, OTPs or banking passwords are not required for recommendation logic."]] },
    terms: { eyebrow: "Terms", title: "Guidance, not a bank promise.", intro: "CardSmart compares published and modelled reward rules. Issuer treatment can still differ.", sections: [["Estimates", "Reward values are estimates based on the merchant, category, payment route and limits available to CardSmart."], ["Eligibility", "Income filters show only basic stated fit. Card issuance remains entirely with the issuer."], ["Independent guidance", "CardSmart is not a bank, card network or lender. Any future affiliate relationship will be disclosed clearly."]] },
    about: { eyebrow: "About CardSmart", title: "Credit cards are complicated. Paying shouldn’t be.", intro: "CardSmart exists to turn reward rules, exclusions and limits into one usable answer before a payment.", sections: [["Use the cards you own", "The first job is simple: show the strongest card in your wallet for this payment."], ["Add only when it helps", "The second job is separate: recommend a new card only when it adds net value over your current wallet."], ["Show the work", "Every recommendation should be traceable to its assumptions, not hidden behind a generic score."]] },
  }[type];
  return <div className="legal-page"><header><Logo onClick={() => navigate("landing")}/><button className="button dark small-button" onClick={() => navigate("landing")}>Back to CardSmart</button></header><main><span className="eyebrow"><span/>{copy.eyebrow}</span><h1>{copy.title}</h1><p className="legal-intro">{copy.intro}</p>{copy.sections.map(([heading, body]) => <section key={heading}><h2>{heading}</h2><p>{body}</p></section>)}</main></div>;
}

export default function CardSmartExperience() {
  const [view, setView] = useState<View>("landing");
  const [authOpen, setAuthOpen] = useState(false);
  const [saveWalletAfterAuth, setSaveWalletAfterAuth] = useState(false);
  const [replayPayment, setReplayPayment] = useState<PaymentContext | null>(null);
  const data = useCardSmartData();
  const navigate = (next: View) => { setView(next); window.scrollTo({ top: 0, behavior: "smooth" }); };
  useEffect(() => {
    if (data.ready && data.authUser && view === "landing" && !authOpen) setView("pay");
  }, [authOpen, data.authUser, data.ready, view]);
  const openAuth = (saveWallet: boolean) => {
    data.clearMessages();
    setSaveWalletAfterAuth(saveWallet);
    setAuthOpen(true);
  };
  const submitAuth = async (mode: AuthMode, values: { name: string; email: string; password: string }) => {
    const completed = await data.authenticate(mode, values, saveWalletAfterAuth);
    if (completed) navigate("pay");
    return completed;
  };
  const confirmActivity = async (item: Activity) => {
    const saved = await data.confirmPayment(item);
    if (saved) navigate("activity");
  };
  const replay = (item: Activity) => {
    setReplayPayment({ merchant: item.merchant, amount: item.amount, category: item.category, channel: item.channel });
    navigate("pay");
  };
  const logout = async () => {
    await data.logout();
    navigate("landing");
  };
  const deleteAll = async () => {
    const deleted = await data.deleteAccount();
    if (deleted) navigate("landing");
  };
  if (!data.ready) return <div className="loading-screen"><Logo/><span>Preparing your wallet…</span></div>;
  if (view === "privacy" || view === "terms" || view === "about") return <LegalPage type={view} navigate={navigate}/>;
  if (!data.authUser || view === "landing") return <><Landing selected={data.wallet} onSelected={data.updateWallet} onSave={() => openAuth(true)} onLogin={() => openAuth(false)} navigate={navigate}/><AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} onSubmit={submitAuth} selectedCount={data.wallet.length} saveWallet={saveWalletAfterAuth} busy={data.busy} error={data.error} notice={data.notice}/></>;
  return <AppShell view={view} navigate={navigate}>{view === "pay" && <PayView wallet={data.wallet} setWallet={data.updateWallet} onActivity={(item) => void confirmActivity(item)} initialPayment={replayPayment} busy={data.busy} error={data.error}/>} {view === "cards" && <CardsView wallet={data.wallet} setWallet={data.updateWallet} busy={data.busy} error={data.error}/>} {view === "activity" && <ActivityView activity={data.activity} onReplay={replay}/>} {view === "discover" && <DiscoverView wallet={data.wallet}/>} {view === "account" && <AccountView profile={data.profile} setProfile={data.updateProfile} onLogout={() => void logout()} onDelete={() => void deleteAll()} busy={data.busy} error={data.error} notice={data.notice}/>}</AppShell>;
}
