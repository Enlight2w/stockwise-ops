import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Leaf,
  LogIn,
  MapPin,
  Menu,
  Package,
  PackageSearch,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  UsersRound,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

const heroImage = "/manus-storage/stockwise-team_39c7ef70.jpg";

const initialProducts = [
  { id: 1, name: "Harvest Granola", sku: "GRN-224", category: "Pantry", stock: 128, unit: "cases", price: 18.4, status: "Healthy", trend: "+12%" },
  { id: 2, name: "Citrus Sparkling Water", sku: "SPK-091", category: "Beverages", stock: 42, unit: "cases", price: 11.9, status: "Reorder soon", trend: "+8%" },
  { id: 3, name: "Market Tote — Sand", sku: "TOT-014", category: "Merch", stock: 16, unit: "units", price: 24, status: "Low stock", trend: "−3%" },
  { id: 4, name: "Organic Oat Milk", sku: "OAT-702", category: "Chilled", stock: 86, unit: "cases", price: 21.5, status: "Healthy", trend: "+19%" },
];

const initialTeam = [
  { id: 1, name: "Maya Chen", initials: "MC", color: "#d88963", role: "Owner", sold: 247, goal: 300, accent: "#ef8354" },
  { id: 2, name: "Jordan Mensah", initials: "JM", color: "#8aa39b", role: "Floor lead", sold: 214, goal: 250, accent: "#6f9888" },
  { id: 3, name: "Sofia Reyes", initials: "SR", color: "#d9a441", role: "Sales associate", sold: 176, goal: 220, accent: "#d9a441" },
  { id: 4, name: "Theo Martin", initials: "TM", color: "#8e91c7", role: "Stock associate", sold: 159, goal: 210, accent: "#8e91c7" },
];

const initialReviews = [
  { id: 1, customer: "Amina K.", time: "12 min ago", product: 5, service: 5, note: "Loved the easy pickup and the team was so helpful finding the bulk cartons.", status: "new" },
  { id: 2, customer: "Daniel R.", time: "Yesterday", product: 4, service: 5, note: "Great quality on the granola. Quick, friendly service at checkout.", status: "new" },
  { id: 3, customer: "Lena P.", time: "2 days ago", product: 5, service: 4, note: "The store is beautifully organized and I found everything I needed.", status: "reviewed" },
];

const monthlyTrend = [41, 56, 52, 68, 63, 77, 74, 86, 91, 83, 95, 100];
const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type Role = "owner" | "employee";
type View = "overview" | "inventory" | "team" | "reviews";

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function StatusPill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "green" | "orange" | "red" }) {
  const styles = { neutral: "bg-[#f0eee8] text-[#69716b]", green: "bg-[#e4f2ea] text-[#3b7961]", orange: "bg-[#fff0e6] text-[#bf6235]", red: "bg-[#fce9e6] text-[#b75a51]" };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles[tone]}`}>{children}</span>;
}

function NavItem({ active, icon: Icon, label, onClick, badge }: { active: boolean; icon: typeof Package; label: string; onClick: () => void; badge?: string }) {
  return (
    <button onClick={onClick} className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition-all duration-200 active:scale-[.98] ${active ? "bg-[#1e2a28] text-[#fffdf8] shadow-lg shadow-[#1e2a28]/10" : "text-[#768079] hover:bg-[#f1eee7] hover:text-[#1e2a28]"}`}>
      <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-[#f3b08f]" : "text-[#96a19a] group-hover:text-[#ef8354]"}`} />
      <span className="flex-1">{label}</span>
      {badge && <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? "bg-white/10 text-white/75" : "bg-[#fff0e6] text-[#bf6235]"}`}>{badge}</span>}
    </button>
  );
}

function Stars({ score }: { score: number }) {
  return <span className="inline-flex gap-0.5 text-[#e09b36]">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3.5 w-3.5 ${i < score ? "fill-current" : "text-[#ddd8cd]"}`} />)}</span>;
}

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [role, setRole] = useState<Role>(user?.role === "admin" ? "owner" : "owner");
  const [view, setView] = useState<View>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [beaconOn, setBeaconOn] = useState(true);
  const [geoLabel, setGeoLabel] = useState("12 nearby customers within 1.5 km");
  const [products, setProducts] = useState(initialProducts);
  const [team, setTeam] = useState(initialTeam);
  const [reviews, setReviews] = useState(initialReviews);
  const [saleQty, setSaleQty] = useState(1);
  const [saleProduct, setSaleProduct] = useState(initialProducts[0].name);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("This year");
  const snapshot = trpc.operations.snapshot.useQuery(undefined, { retry: false, staleTime: 60_000 });
  const logSale = trpc.operations.logSale.useMutation();
  const setBeacon = trpc.operations.setBeacon.useMutation();
  const markReview = trpc.operations.markReview.useMutation();

  const visibleProducts = useMemo(() => products.filter((product) => `${product.name} ${product.sku} ${product.category}`.toLowerCase().includes(search.toLowerCase())), [products, search]);
  const totalSold = team.reduce((sum, member) => sum + member.sold, 0);
  const employeeOfMonth = [...team].sort((a, b) => b.sold - a.sold)[0];

  function toggleBeacon() {
    const next = !beaconOn;
    setBeaconOn(next);
    if (next && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setGeoLabel(`${Math.max(12, Math.round(position.coords.accuracy / 40))} nearby customers within 1.5 km`),
        () => setGeoLabel("Nearby signal ready — location permission optional"),
        { enableHighAccuracy: false, timeout: 4000 },
      );
    } else if (!next) setGeoLabel("Nearby discovery is paused");
    if (isAuthenticated) setBeacon.mutate({ shopId: 1, enabled: next });
    toast.success(next ? "Nearby customer signal is live" : "Nearby discovery paused");
  }

  function submitSale() {
    const product = products.find((item) => item.name === saleProduct);
    if (!product) return;
    const nextProducts = products.map((item) => item.name === product.name ? { ...item, stock: Math.max(0, item.stock - saleQty), trend: "+21%" } : item);
    setProducts(nextProducts);
    setTeam(team.map((member, index) => index === 0 ? { ...member, sold: member.sold + saleQty } : member));
    if (isAuthenticated) logSale.mutate({ shopId: 1, productId: product.id, employeeId: 1, quantity: saleQty, revenueCents: Math.round(product.price * saleQty * 100), profitCents: Math.round(product.price * saleQty * 36) });
    toast.success(`${saleQty} ${product.unit} of ${product.name} logged`, { description: "Inventory and team score updated." });
    setSaleQty(1);
  }

  function resolveReview(id: number) {
    setReviews(reviews.map((review) => review.id === id ? { ...review, status: "reviewed" } : review));
    if (isAuthenticated) markReview.mutate({ reviewId: id, status: "reviewed" });
    toast.success("Review marked as reviewed");
  }

  const welcomeName = user?.name?.split(" ")[0] || "Maya";

  return (
    <div className="app-grid min-h-screen bg-[#fbf8f1] text-[#1e2a28]">
      <div className="mx-auto flex min-h-screen max-w-[1500px]">
        <aside className={`fixed inset-y-0 left-0 z-50 flex w-[256px] flex-col border-r border-[#ebe6db] bg-[#fbf8f1]/95 px-5 py-6 backdrop-blur-xl transition-transform duration-300 lg:static lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2.5"><div className="flex h-9 w-9 items-center justify-center rounded-[13px] bg-[#1e2a28] text-[#ffd8c5]"><Leaf className="h-5 w-5" /></div><div><p className="font-display text-[19px] font-semibold tracking-[-.04em]">stockwise</p><p className="-mt-1 text-[9px] font-bold uppercase tracking-[.2em] text-[#a0a59d]">ops studio</p></div></div>
            <button onClick={() => setMobileOpen(false)} className="rounded-xl p-2 text-[#9aa29b] hover:bg-[#f0ece3] lg:hidden"><X className="h-4 w-4" /></button>
          </div>
          <div className="mt-11"><p className="px-3 text-[10px] font-bold uppercase tracking-[.18em] text-[#a2a69f]">Workspace</p><nav className="mt-3 space-y-1"><NavItem active={view === "overview"} icon={BarChart3} label="Overview" onClick={() => { setView("overview"); setMobileOpen(false); }} /><NavItem active={view === "inventory"} icon={PackageSearch} label="Inventory" badge="4" onClick={() => { setView("inventory"); setMobileOpen(false); }} /><NavItem active={view === "team"} icon={UsersRound} label="Team performance" onClick={() => { setView("team"); setMobileOpen(false); }} /><NavItem active={view === "reviews"} icon={Star} label="Customer voice" badge="2" onClick={() => { setView("reviews"); setMobileOpen(false); }} /></nav></div>
          <div className="mt-10"><p className="px-3 text-[10px] font-bold uppercase tracking-[.18em] text-[#a2a69f]">Shop mode</p><div className="mt-3 rounded-2xl border border-[#e8e2d6] bg-white/60 p-1"><button onClick={() => setRole("owner")} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold ${role === "owner" ? "bg-[#fffdf8] text-[#1e2a28] shadow-sm" : "text-[#929990]"}`}><ShieldCheck className="h-4 w-4 text-[#ef8354]" /> Owner view</button><button onClick={() => setRole("employee")} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold ${role === "employee" ? "bg-[#fffdf8] text-[#1e2a28] shadow-sm" : "text-[#929990]"}`}><Target className="h-4 w-4 text-[#6f9888]" /> Employee view</button></div></div>
          <div className="mt-auto rounded-2xl bg-[#e9f0eb] p-4"><div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[.16em] text-[#6f9888]">Live pulse</span><span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#69a082] opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#4d8a6c]" /></span></div><p className="mt-2 text-xs leading-5 text-[#597068]">Inventory and sales are syncing as your team works.</p></div>
          <div className="mt-5 flex items-center gap-3 border-t border-[#ebe6db] pt-5"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ef8354] text-xs font-bold text-white">{welcomeName.slice(0, 1)}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{welcomeName} {user ? "" : "(demo)"}</p><p className="text-[10px] text-[#959b94]">{role === "owner" ? "Owner account" : "Team member"}</p></div>{isAuthenticated ? <button onClick={logout} className="text-[10px] font-bold text-[#8e9790] hover:text-[#bf6235]">Sign out</button> : <button onClick={() => startLogin()} className="text-[#ef8354]" title="Sign in"><LogIn className="h-4 w-4" /></button>}</div>
        </aside>

        {mobileOpen && <button aria-label="Close menu" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-[#1e2a28]/20 backdrop-blur-sm lg:hidden" />}

        <main className="min-w-0 flex-1 px-4 py-4 sm:px-7 sm:py-7 lg:px-10">
          <header className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><button onClick={() => setMobileOpen(true)} className="rounded-xl border border-[#ebe6db] bg-white/70 p-2.5 text-[#67736b] lg:hidden"><Menu className="h-5 w-5" /></button><div><p className="text-xs font-semibold text-[#9da39b]">Tuesday, 22 September 2026</p><h1 className="mt-0.5 font-display text-[27px] font-semibold tracking-[-.045em] sm:text-[32px]">Good morning, {welcomeName} <span className="text-[#ef8354]">.</span></h1></div></div><div className="flex items-center gap-2 sm:gap-3"><button className="hidden items-center gap-2 rounded-xl border border-[#e8e2d7] bg-white/70 px-3 py-2 text-xs font-semibold text-[#6f7971] sm:flex"><MapPin className="h-3.5 w-3.5 text-[#ef8354]" /> Portland, OR <ChevronDown className="h-3.5 w-3.5" /></button><button className="relative rounded-xl border border-[#e8e2d7] bg-white/70 p-2.5 text-[#78817a] hover:bg-white"><Bell className="h-4 w-4" /><span className="absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full bg-[#ef8354]" /></button><div className="hidden h-9 w-9 items-center justify-center rounded-full bg-[#ef8354] text-xs font-bold text-white sm:flex">{welcomeName.slice(0, 1)}</div></div></header>

          <div className="mt-7 flex flex-col gap-4 rounded-[24px] bg-[#1e2a28] p-5 text-[#fffdf8] shadow-[0_20px_60px_rgba(30,42,40,.18)] sm:p-7 lg:flex-row lg:items-center lg:justify-between" style={{ backgroundImage: `linear-gradient(90deg, rgba(30,42,40,.98) 0%, rgba(30,42,40,.9) 35%, rgba(30,42,40,.36) 74%, rgba(30,42,40,.12) 100%), url(${heroImage})`, backgroundPosition: "center", backgroundSize: "cover" }}><div className="max-w-[560px]"><div className="flex items-center gap-2 text-[#ffbf9f]"><Sparkles className="h-4 w-4" /><span className="text-[11px] font-bold uppercase tracking-[.18em]">Today at Cedar & Co.</span></div><h2 className="mt-3 font-display text-[26px] font-semibold leading-[1.05] tracking-[-.04em] sm:text-[33px]">Your shop is moving<br className="hidden sm:block" /> in the right direction.</h2><p className="mt-3 max-w-[430px] text-sm leading-6 text-white/65">Keep the floor stocked, celebrate the people making it happen, and let your customers feel close to the work.</p><div className="mt-5 flex flex-wrap gap-2"><button onClick={() => setView(role === "owner" ? "inventory" : "overview")} className="inline-flex items-center gap-2 rounded-xl bg-[#ef8354] px-4 py-2.5 text-xs font-bold text-white transition-transform hover:-translate-y-0.5 active:scale-[.98]">{role === "owner" ? "Review stock" : "Log a sale"}<ArrowUpRight className="h-3.5 w-3.5" /></button><button onClick={toggleBeacon} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-bold text-white/85 backdrop-blur transition-colors hover:bg-white/15"><span className={`h-1.5 w-1.5 rounded-full ${beaconOn ? "bg-[#90d2ae]" : "bg-white/40"}`} /> {beaconOn ? "Nearby signal live" : "Turn on nearby signal"}</button></div></div><div className="hidden min-w-[210px] rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md lg:block"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/45">Store beacon</p><div className="mt-3 flex items-center justify-between"><div><p className="font-display text-3xl">{beaconOn ? "Live" : "Off"}</p><p className="mt-1 text-[11px] text-white/55">{geoLabel}</p></div><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${beaconOn ? "bg-[#e9f6ed] text-[#4f8a67]" : "bg-white/10 text-white/40"}`}><MapPin className="h-5 w-5" /></div></div></div></div>

          {role === "employee" ? <EmployeeView products={products} saleProduct={saleProduct} saleQty={saleQty} setSaleProduct={setSaleProduct} setSaleQty={setSaleQty} submitSale={submitSale} team={team} /> : <OwnerView view={view} setView={setView} products={visibleProducts} allProducts={products} setProducts={setProducts} team={team} reviews={reviews} resolveReview={resolveReview} employeeOfMonth={employeeOfMonth} totalSold={totalSold} period={period} setPeriod={setPeriod} search={search} setSearch={setSearch} snapshotReady={Boolean(snapshot.data)} />}

          <footer className="mt-10 flex flex-col gap-2 border-t border-[#ebe6db] pb-4 pt-5 text-[11px] text-[#a1a69f] sm:flex-row sm:items-center sm:justify-between"><span>Stockwise Ops · made for the people behind the counter.</span><span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[#6f9888]" /> All systems operational</span></footer>
        </main>
      </div>
    </div>
  );
}

function OwnerView({ view, setView, products, allProducts, setProducts, team, reviews, resolveReview, employeeOfMonth, totalSold, period, setPeriod, search, setSearch, snapshotReady }: any) {
  return <>
    {view === "overview" && <div className="animate-in mt-7"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Net revenue" value="$18,420" delta="+14.8%" icon={CircleDollarSign} tone="peach" detail="vs. $16,050 last month" /><MetricCard label="Units sold" value={totalSold.toLocaleString()} delta="+9.4%" icon={Package} tone="sage" detail="across 4 categories" /><MetricCard label="Gross profit" value="$6,848" delta="+11.2%" icon={TrendingUp} tone="gold" detail="37.2% margin" /><MetricCard label="Customer love" value="4.8 / 5" delta="+0.2" icon={Star} tone="lavender" detail="from 126 reviews" /></div><div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_.85fr]"><section className="soft-card rounded-[24px] border border-[#ebe6db] bg-[#fffdf8] p-5 sm:p-6"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#a1a69f]">Sales momentum</p><div className="mt-1 flex items-baseline gap-2"><h3 className="font-display text-[28px] font-semibold tracking-[-.04em]">$68,240</h3><span className="text-xs font-bold text-[#5d9775]">+18.2%</span></div><p className="mt-1 text-xs text-[#9aa099]">Revenue this year, updated just now</p></div><select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-fit rounded-xl border border-[#e8e2d7] bg-[#faf8f2] px-3 py-2 text-xs font-bold text-[#6e7770] outline-none"><option>This year</option><option>Last 12 months</option><option>This quarter</option></select></div><div className="mt-7 flex h-[190px] items-end gap-1.5 sm:gap-3">{monthlyTrend.map((height, index) => <div key={monthLabels[index]} className="group flex h-full flex-1 flex-col justify-end gap-2"><div className={`relative w-full rounded-t-[8px] transition-all duration-300 ${index === monthlyTrend.length - 1 ? "bg-[#ef8354]" : "bg-[#dce8df] group-hover:bg-[#b8d1c1]"}`} style={{ height: `${height * 1.46}px` }}><span className="absolute -top-6 left-1/2 hidden -translate-x-1/2 rounded-md bg-[#1e2a28] px-1.5 py-1 text-[9px] font-bold text-white group-hover:block">{height}</span></div><span className="text-center text-[10px] font-semibold text-[#a4a9a1]">{monthLabels[index]}</span></div>)}</div></section><section className="soft-card overflow-hidden rounded-[24px] border border-[#ebe6db] bg-[#fffdf8] p-5 sm:p-6"><div className="flex items-start justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#a1a69f]">Team pulse</p><h3 className="mt-1 font-display text-[23px] font-semibold tracking-[-.04em]">Who’s moving stock?</h3></div><button onClick={() => setView("team")} className="rounded-xl p-2 text-[#a2aaa2] hover:bg-[#f2eee6] hover:text-[#1e2a28]"><ArrowUpRight className="h-4 w-4" /></button></div><div className="mt-5 space-y-4">{team.slice(0, 3).map((member: any, index: number) => <TeamRow key={member.id} member={member} rank={index + 1} />)}</div><div className="mt-5 rounded-2xl bg-[#f7f3eb] p-3"><div className="flex items-center gap-2"><div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ef8354]/15 text-[#ef8354]"><Sparkles className="h-3.5 w-3.5" /></div><p className="text-[11px] font-semibold leading-4 text-[#6d776f]">Employee of the month: <span className="font-bold text-[#1e2a28]">{employeeOfMonth.name}</span></p></div></div></section></div><div className="mt-5 grid gap-5 xl:grid-cols-[.92fr_1.08fr]"><BeaconCard beaconOn={true} /><ReviewMini reviews={reviews} onResolve={resolveReview} onOpen={() => setView("reviews")} /></div></div>}
    {view === "inventory" && <InventoryView products={products} allProducts={allProducts} setProducts={setProducts} search={search} setSearch={setSearch} />}
    {view === "team" && <TeamView team={team} />}
    {view === "reviews" && <ReviewsView reviews={reviews} onResolve={resolveReview} />}
  </>;
}

function MetricCard({ label, value, delta, detail, icon: Icon, tone }: any) {
  const colors: any = { peach: "bg-[#fff0e6] text-[#ef8354]", sage: "bg-[#e8f1ea] text-[#6f9888]", gold: "bg-[#fff3d7] text-[#c79335]", lavender: "bg-[#eeedfa] text-[#817fc1]" };
  return <div className="soft-card rounded-[22px] border border-[#ebe6db] bg-[#fffdf8] p-4 sm:p-5"><div className="flex items-start justify-between"><div className={`flex h-9 w-9 items-center justify-center rounded-xl ${colors[tone]}`}><Icon className="h-[18px] w-[18px]" /></div><span className="rounded-full bg-[#e8f1ea] px-2 py-1 text-[10px] font-bold text-[#5d9775]">{delta}</span></div><p className="mt-4 text-[11px] font-bold uppercase tracking-[.13em] text-[#a1a69f]">{label}</p><p className="mt-1 font-display text-[27px] font-semibold tracking-[-.04em]">{value}</p><p className="mt-1 text-[11px] text-[#9ca29b]">{detail}</p></div>;
}

function TeamRow({ member, rank }: any) {
  return <div className="flex items-center gap-3"><span className="w-3 text-[10px] font-bold text-[#b2b6af]">0{rank}</span><div className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: member.color }}>{member.initials}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="truncate text-xs font-bold">{member.name}</p><span className="text-[11px] font-bold text-[#606b63]">{member.sold} <span className="font-normal text-[#a1a69f]">units</span></span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#f0eee8]"><div className="h-full rounded-full" style={{ width: `${Math.min(100, (member.sold / member.goal) * 100)}%`, background: member.accent }} /></div></div></div>;
}

function BeaconCard({ beaconOn }: { beaconOn: boolean }) {
  return <section className="soft-card relative overflow-hidden rounded-[24px] border border-[#e6e4db] bg-[#dfeee4] p-5 sm:p-6"><div className="absolute -right-7 -top-10 h-44 w-44 rounded-full border-[18px] border-[#c8e1d1]/70" /><div className="absolute -right-1 top-7 h-28 w-28 rounded-full border border-[#b9d7c4]" /><div className="relative"><div className="flex items-center gap-2 text-[#5f8c71]"><MapPin className="h-4 w-4" /><p className="text-[11px] font-bold uppercase tracking-[.16em]">Nearby discovery</p></div><h3 className="mt-2 max-w-[260px] font-display text-[25px] font-semibold leading-tight tracking-[-.04em]">Bring the shop<br />closer to people.</h3><p className="mt-2 max-w-[275px] text-xs leading-5 text-[#6f8877]">Your store signal is {beaconOn ? "live" : "paused"}. Customers nearby can discover today’s availability and offers.</p><div className="mt-5 flex items-center gap-2"><div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-bold ${beaconOn ? "bg-[#f7fff9] text-[#568263]" : "bg-white/50 text-[#82978a]"}`}><span className={`h-1.5 w-1.5 rounded-full ${beaconOn ? "bg-[#55a273]" : "bg-[#9cae9f]"}`} /> {beaconOn ? "Signal broadcasting" : "Signal paused"}</div><span className="text-[11px] text-[#779180]">12 people nearby</span></div></div></section>;
}

function ReviewMini({ reviews, onResolve, onOpen }: any) {
  return <section className="soft-card rounded-[24px] border border-[#ebe6db] bg-[#fffdf8] p-5 sm:p-6"><div className="flex items-start justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#a1a69f]">Customer voice</p><h3 className="mt-1 font-display text-[23px] font-semibold tracking-[-.04em]">Fresh from the floor</h3></div><button onClick={onOpen} className="text-xs font-bold text-[#ef8354]">View all</button></div><div className="mt-4 space-y-3">{reviews.slice(0, 2).map((review: any) => <div key={review.id} className="flex gap-3 rounded-2xl bg-[#faf8f3] p-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f4ddcf] text-[11px] font-bold text-[#bf704f]">{review.customer.slice(0, 1)}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-1"><p className="text-xs font-bold">{review.customer}</p><span className="text-[10px] text-[#a5aaa2]">{review.time}</span></div><div className="mt-1 flex items-center gap-2"><Stars score={review.product} /><span className="text-[10px] text-[#a2a8a0]">product · {review.service}/5 service</span></div><p className="mt-1.5 text-[11px] leading-4 text-[#7e877f]">{review.note}</p></div>{review.status === "new" && <button onClick={() => onResolve(review.id)} className="self-start rounded-lg p-1.5 text-[#a5ada5] hover:bg-[#e7f1e9] hover:text-[#4f8a67]"><Check className="h-3.5 w-3.5" /></button>}</div>)}</div></section>;
}

function InventoryView({ products, allProducts, setProducts, search, setSearch }: any) {
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", sku: "", stock: 20, category: "Pantry" });
  function addItem() { if (!newItem.name || !newItem.sku) return; setProducts([...allProducts, { id: Date.now(), name: newItem.name, sku: newItem.sku, category: newItem.category, stock: Number(newItem.stock), unit: "units", price: 18, status: "Healthy", trend: "new" }]); setNewItem({ name: "", sku: "", stock: 20, category: "Pantry" }); setShowAdd(false); toast.success("New inventory item added"); }
  return <div className="animate-in mt-7"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#a1a69f]">Inventory control</p><h2 className="mt-1 font-display text-[30px] font-semibold tracking-[-.04em]">Know what’s moving.</h2><p className="mt-1 text-sm text-[#919990]">Keep the shelves ready and reorder before the rush.</p></div><button onClick={() => setShowAdd(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1e2a28] px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#1e2a28]/10 transition-transform hover:-translate-y-0.5 active:scale-[.98]"><Plus className="h-4 w-4" /> Add inventory</button></div><div className="mt-6 grid gap-4 sm:grid-cols-3"><MetricCard label="Stock value" value="$42.8k" delta="+6.2%" icon={Package} tone="sage" detail="at retail price" /><MetricCard label="Healthy lines" value="86%" delta="+4.1%" icon={CheckCircle2} tone="peach" detail="18 of 21 SKUs" /><MetricCard label="Needs attention" value="4" delta="today" icon={Clock3} tone="gold" detail="2 below reorder point" /></div><div className="soft-card mt-5 overflow-hidden rounded-[24px] border border-[#ebe6db] bg-[#fffdf8]"><div className="flex flex-col gap-3 border-b border-[#eee9df] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"><div><h3 className="font-display text-[21px] font-semibold">Product lines</h3><p className="mt-1 text-xs text-[#9aa098]">{products.length} tracked products in the Cedar & Co. catalog</p></div><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a6aca4]" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products" className="w-full rounded-xl border border-[#e8e2d7] bg-[#faf8f2] py-2.5 pl-9 pr-3 text-xs outline-none transition-colors placeholder:text-[#b0b4ad] focus:border-[#ef8354] sm:w-[220px]" /></div></div><div className="divide-y divide-[#f0ece4]">{products.map((product: any) => <div key={product.id} className="grid items-center gap-3 px-4 py-4 sm:grid-cols-[1.6fr_1fr_.7fr_.7fr_auto] sm:px-5"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5eee4] text-[#c17b55]"><Package className="h-4 w-4" /></div><div><p className="text-xs font-bold">{product.name}</p><p className="mt-0.5 text-[10px] text-[#a1a69f]">{product.sku} · {product.category}</p></div></div><div className="text-xs font-semibold text-[#667169]"><span className="text-[#a4aaa2] sm:hidden">Stock · </span>{product.stock} {product.unit}</div><div><StatusPill tone={product.stock < 25 ? "red" : product.stock < 50 ? "orange" : "green"}>{product.status}</StatusPill></div><div className={`text-xs font-bold ${product.trend.startsWith("+") ? "text-[#609273]" : "text-[#bb6b5b]"}`}>{product.trend}</div><button onClick={() => toast.success(`${product.name} is open for edits`, { description: "Pricing and reorder settings are ready to connect." })} className="justify-self-start rounded-xl border border-[#e7e2d8] px-3 py-2 text-[11px] font-bold text-[#78827a] hover:bg-[#f5f1e9] sm:justify-self-end">Manage</button></div>)}</div></div>{showAdd && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e2a28]/30 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-[24px] bg-[#fffdf8] p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#a1a69f]">New item</p><h3 className="mt-1 font-display text-[25px] font-semibold">Add to inventory</h3></div><button onClick={() => setShowAdd(false)} className="rounded-xl p-2 text-[#9ba19a] hover:bg-[#f3efe7]"><X className="h-4 w-4" /></button></div><div className="mt-5 space-y-3"><input value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} placeholder="Product name" className="w-full rounded-xl border border-[#e6e1d6] bg-[#fbf8f1] px-3 py-3 text-sm outline-none focus:border-[#ef8354]" /><input value={newItem.sku} onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })} placeholder="SKU / barcode" className="w-full rounded-xl border border-[#e6e1d6] bg-[#fbf8f1] px-3 py-3 text-sm outline-none focus:border-[#ef8354]" /><div className="grid grid-cols-2 gap-3"><input type="number" value={newItem.stock} onChange={(e) => setNewItem({ ...newItem, stock: Number(e.target.value) })} placeholder="Starting stock" className="w-full rounded-xl border border-[#e6e1d6] bg-[#fbf8f1] px-3 py-3 text-sm outline-none focus:border-[#ef8354]" /><select value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} className="w-full rounded-xl border border-[#e6e1d6] bg-[#fbf8f1] px-3 py-3 text-sm outline-none focus:border-[#ef8354]"><option>Pantry</option><option>Beverages</option><option>Chilled</option><option>Merch</option></select></div></div><button onClick={addItem} className="mt-5 w-full rounded-xl bg-[#1e2a28] py-3 text-xs font-bold text-white hover:bg-[#30403c]">Add product</button></div></div>}</div>;
}

function TeamView({ team }: any) {
  return <div className="animate-in mt-7"><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#a1a69f]">Team performance</p><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h2 className="mt-1 font-display text-[30px] font-semibold tracking-[-.04em]">Progress people can feel.</h2><p className="mt-1 text-sm text-[#919990]">Transparent scorecards for every shift, sale, and win.</p></div><div className="rounded-xl bg-[#e8f1ea] px-3 py-2 text-[11px] font-bold text-[#5d8b6d]">Employee of the year: Maya Chen</div></div><div className="mt-6 grid gap-4 sm:grid-cols-2">{team.map((member: any, index: number) => <div key={member.id} className="soft-card rounded-[24px] border border-[#ebe6db] bg-[#fffdf8] p-5"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: member.color }}>{member.initials}</div><div className="flex-1"><div className="flex items-center justify-between"><div><p className="font-bold">{member.name}</p><p className="mt-0.5 text-[11px] text-[#a0a69e]">{member.role}</p></div><span className="rounded-full bg-[#f6f2ea] px-2 py-1 text-[10px] font-bold text-[#929990]">#{index + 1}</span></div></div></div><div className="mt-5 flex items-end justify-between"><div><p className="font-display text-[30px] font-semibold tracking-[-.04em]">{member.sold}</p><p className="text-[11px] text-[#9da39c]">units sold this month</p></div><div className="text-right"><p className="text-xs font-bold text-[#5d9775]">{Math.round((member.sold / member.goal) * 100)}%</p><p className="text-[10px] text-[#a0a69e]">of target</p></div></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f0eee8]"><div className="h-full rounded-full" style={{ width: `${Math.min(100, (member.sold / member.goal) * 100)}%`, background: member.accent }} /></div><p className="mt-2 text-[10px] text-[#a0a69e]">{member.goal - member.sold > 0 ? `${member.goal - member.sold} units to target` : "Target exceeded"}</p></div>)}</div></div>;
}

function ReviewsView({ reviews, onResolve }: any) {
  return <div className="animate-in mt-7"><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#a1a69f]">Customer voice</p><h2 className="mt-1 font-display text-[30px] font-semibold tracking-[-.04em]">The feedback loop.</h2><p className="mt-1 text-sm text-[#919990]">Review the product and service experience together — then turn it into action.</p><div className="mt-6 grid gap-4 sm:grid-cols-3"><MetricCard label="Average product" value="4.7 / 5" delta="+0.1" icon={Package} tone="sage" detail="from 126 responses" /><MetricCard label="Average service" value="4.9 / 5" delta="+0.2" icon={Star} tone="gold" detail="team warmth is up" /><MetricCard label="To review" value="2" delta="today" icon={Clock3} tone="peach" detail="nothing slips through" /></div><div className="mt-5 space-y-3">{reviews.map((review: any) => <div key={review.id} className="soft-card flex flex-col gap-4 rounded-[22px] border border-[#ebe6db] bg-[#fffdf8] p-5 sm:flex-row sm:items-start"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f4ddcf] text-sm font-bold text-[#bf704f]">{review.customer.slice(0, 1)}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold">{review.customer}</p><span className="text-[10px] text-[#a3a8a1]">{review.time}</span>{review.status === "new" ? <StatusPill tone="orange">New</StatusPill> : <StatusPill tone="green">Reviewed</StatusPill>}</div><div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-[#8d968e]"><span className="inline-flex items-center gap-1.5">Product <Stars score={review.product} /></span><span className="inline-flex items-center gap-1.5">Service <Stars score={review.service} /></span></div><p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f7971]">{review.note}</p></div>{review.status === "new" && <button onClick={() => onResolve(review.id)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#e8f1ea] px-3 py-2 text-[11px] font-bold text-[#5d8b6d] hover:bg-[#dcecdf]"><Check className="h-3.5 w-3.5" /> Mark reviewed</button>}</div>)}</div></div>;
}

function EmployeeView({ products, saleProduct, saleQty, setSaleProduct, setSaleQty, submitSale, team }: any) {
  const me = team[1];
  return <div className="animate-in mt-7"><div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]"><section className="soft-card rounded-[24px] border border-[#ebe6db] bg-[#fffdf8] p-5 sm:p-7"><div className="flex items-center gap-2 text-[#6f9888]"><Target className="h-4 w-4" /><p className="text-[11px] font-bold uppercase tracking-[.16em]">Your shift dashboard</p></div><h2 className="mt-2 font-display text-[30px] font-semibold tracking-[-.04em]">Make every scan count.</h2><p className="mt-1 max-w-lg text-sm leading-6 text-[#929990]">Log sales as they happen so the team can trust the numbers and the next shift knows exactly what’s left.</p><div className="mt-7 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-[#e8f1ea] p-4"><p className="text-[10px] font-bold uppercase tracking-[.13em] text-[#6b9078]">This month</p><p className="mt-1 font-display text-3xl font-semibold">{me.sold}</p><p className="mt-1 text-[11px] text-[#769181]">units sold</p></div><div className="rounded-2xl bg-[#fff0e6] p-4"><p className="text-[10px] font-bold uppercase tracking-[.13em] text-[#b56d4b]">To your goal</p><p className="mt-1 font-display text-3xl font-semibold">{me.goal - me.sold}</p><p className="mt-1 text-[11px] text-[#b37a60]">units remaining</p></div><div className="rounded-2xl bg-[#f1effb] p-4"><p className="text-[10px] font-bold uppercase tracking-[.13em] text-[#807fb5]">Rank</p><p className="mt-1 font-display text-3xl font-semibold">#2</p><p className="mt-1 text-[11px] text-[#8b8ab2]">on the floor</p></div></div><div className="mt-7 border-t border-[#eee9df] pt-6"><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#a1a69f]">Log a sale</p><div className="mt-3 grid gap-3 sm:grid-cols-[1.3fr_.55fr_auto]"><select value={saleProduct} onChange={(e) => setSaleProduct(e.target.value)} className="rounded-xl border border-[#e6e1d6] bg-[#fbf8f1] px-3 py-3 text-sm font-semibold outline-none focus:border-[#ef8354]">{products.map((product: any) => <option key={product.id}>{product.name}</option>)}</select><input min="1" type="number" value={saleQty} onChange={(e) => setSaleQty(Math.max(1, Number(e.target.value)))} className="rounded-xl border border-[#e6e1d6] bg-[#fbf8f1] px-3 py-3 text-sm font-semibold outline-none focus:border-[#ef8354]" /><button onClick={submitSale} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ef8354] px-4 py-3 text-xs font-bold text-white transition-transform hover:-translate-y-0.5 active:scale-[.98]"><Plus className="h-4 w-4" /> Log sale</button></div><p className="mt-3 flex items-center gap-1.5 text-[11px] text-[#9ba29b]"><ShieldCheck className="h-3.5 w-3.5 text-[#6f9888]" /> Logged under your employee profile for a clear, fair scorecard.</p></div></section><section className="soft-card rounded-[24px] border border-[#ebe6db] bg-[#fffdf8] p-5 sm:p-7"><div className="flex items-start justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#a1a69f]">Shift checklist</p><h3 className="mt-1 font-display text-[24px] font-semibold tracking-[-.04em]">Ready for the rush?</h3></div><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff0e6] text-[#ef8354]"><CheckCircle2 className="h-5 w-5" /></div></div><div className="mt-5 space-y-3"><CheckRow label="Opening count synced" detail="9:05 AM · logged by you" done /><CheckRow label="Shelf scan complete" detail="3 low-stock items flagged" done /><CheckRow label="Customer feedback" detail="1 fresh review to read" /><CheckRow label="Close-out count" detail="Due at 6:00 PM" /></div><div className="mt-6 rounded-2xl bg-[#1e2a28] p-4 text-white"><div className="flex items-center gap-2 text-[#ffbf9f]"><Sparkles className="h-4 w-4" /><p className="text-[10px] font-bold uppercase tracking-[.16em]">Keep going</p></div><p className="mt-2 text-sm leading-5 text-white/70">You’re 86% of the way to your monthly goal. That’s a strong shift.</p></div></section></div></div>;
}

function CheckRow({ label, detail, done = false }: { label: string; detail: string; done?: boolean }) {
  return <div className="flex items-center gap-3"><div className={`flex h-8 w-8 items-center justify-center rounded-xl ${done ? "bg-[#e8f1ea] text-[#5d9775]" : "bg-[#f4f0e8] text-[#a5aca4]"}`}>{done ? <Check className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}</div><div><p className={`text-xs font-bold ${done ? "text-[#46544b]" : "text-[#79827b]"}`}>{label}</p><p className="mt-0.5 text-[10px] text-[#a4aaa2]">{detail}</p></div></div>;
}
