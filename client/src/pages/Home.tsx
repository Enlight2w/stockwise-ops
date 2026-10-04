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
  Globe2,
  Leaf,
  LogIn,
  Languages,
  MapPin,
  Menu,
  Package,
  PackageSearch,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

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

const languageOptions = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "pt", label: "Português" },
  { code: "sw", label: "Kiswahili" },
  { code: "ar", label: "العربية" },
  { code: "hi", label: "हिन्दी" },
  { code: "zh", label: "简体中文" },
  { code: "de", label: "Deutsch" },
  { code: "ja", label: "日本語" },
];

const copy: Record<string, Record<string, string>> = {
  en: { overview: "Overview", inventory: "Inventory", team: "Team performance", voice: "Customer voice", owner: "Owner view", employee: "Employee view", alerts: "Owner alerts", market: "Market snapshot", setup: "Finish your shop setup" },
  es: { overview: "Resumen", inventory: "Inventario", team: "Rendimiento del equipo", voice: "Opinión del cliente", owner: "Vista del propietario", employee: "Vista del empleado", alerts: "Alertas del propietario", market: "Resumen del mercado", setup: "Completa la configuración" },
  fr: { overview: "Vue d’ensemble", inventory: "Inventaire", team: "Performance de l’équipe", voice: "Avis clients", owner: "Vue propriétaire", employee: "Vue employé", alerts: "Alertes propriétaire", market: "Aperçu du marché", setup: "Terminez la configuration" },
  pt: { overview: "Visão geral", inventory: "Inventário", team: "Desempenho da equipe", voice: "Opinião dos clientes", owner: "Visão do proprietário", employee: "Visão do funcionário", alerts: "Alertas do proprietário", market: "Panorama do mercado", setup: "Conclua a configuração" },
  sw: { overview: "Muhtasari", inventory: "Hesabu ya bidhaa", team: "Utendaji wa timu", voice: "Maoni ya wateja", owner: "Mwonekano wa mmiliki", employee: "Mwonekano wa mfanyakazi", alerts: "Tahadhari za mmiliki", market: "Muhtasari wa soko", setup: "Kamilisha usanidi" },
  ar: { overview: "نظرة عامة", inventory: "المخزون", team: "أداء الفريق", voice: "آراء العملاء", owner: "واجهة المالك", employee: "واجهة الموظف", alerts: "تنبيهات المالك", market: "ملخص السوق", setup: "أكمل إعداد المتجر" },
  hi: { overview: "अवलोकन", inventory: "इन्वेंटरी", team: "टीम प्रदर्शन", voice: "ग्राहक राय", owner: "मालिक दृश्य", employee: "कर्मचारी दृश्य", alerts: "मालिक अलर्ट", market: "बाज़ार स्नैपशॉट", setup: "दुकान सेटअप पूरा करें" },
  zh: { overview: "概览", inventory: "库存", team: "团队表现", voice: "客户反馈", owner: "店主视图", employee: "员工视图", alerts: "店主提醒", market: "市场概览", setup: "完成店铺设置" },
};

type Role = "owner" | "employee";
type View = "overview" | "inventory" | "team" | "reviews" | "staff";

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
  const [language, setLanguage] = useState("en");
  const [setupOpen, setSetupOpen] = useState(false);
  const [shopName, setShopName] = useState("");
  const [marketProduct, setMarketProduct] = useState("Harvest Granola");
  const [countryCode, setCountryCode] = useState("US");
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [businessType, setBusinessType] = useState<"retail" | "wholesale" | "hybrid">("retail");
  const [subscriptionPlan, setSubscriptionPlan] = useState<"starter" | "growth" | "scale">("starter");
  const [beaconOn, setBeaconOn] = useState(true);
  const [geoLabel, setGeoLabel] = useState("12 nearby customers within 1.5 km");
  const [products, setProducts] = useState(initialProducts);
  const [team, setTeam] = useState(initialTeam);
  const [reviews, setReviews] = useState(initialReviews);
  const [saleQty, setSaleQty] = useState(1);
  const [saleProduct, setSaleProduct] = useState(initialProducts[0].name);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("This year");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const t = (key: string) => copy[language]?.[key] ?? copy.en[key] ?? key;
  const workspaceQuery = trpc.operations.workspace.useQuery(undefined, { enabled: isAuthenticated, retry: false, staleTime: 60_000 });
  const workspace = workspaceQuery.data;
  const ownerShopId = workspace?.shop.id ?? 1;
  const profile = workspace?.shop;
  const saveProfile = trpc.operations.saveOwnerProfile.useMutation({
    onSuccess: () => {
      workspaceQuery.refetch();
      setSetupOpen(false);
      toast.success("Shop profile saved", { description: "Your workspace is now scoped to this owner account." });
    },
  });
  const snapshot = trpc.operations.snapshot.useQuery(undefined, { retry: false, staleTime: 60_000 });
  const alertsInput = useMemo(() => ({ shopId: ownerShopId }), [ownerShopId]);
  const alertsQuery = trpc.operations.alerts.useQuery(alertsInput, {
    enabled: isAuthenticated && role === "owner",
    refetchInterval: isAuthenticated && role === "owner" ? 15_000 : false,
    retry: false,
  });
  const logSale = trpc.operations.logSale.useMutation();
  const setBeacon = trpc.operations.setBeacon.useMutation();
  const markReview = trpc.operations.markReview.useMutation();
  const markAlertRead = trpc.operations.markAlertRead.useMutation({
    onSuccess: () => alertsQuery.refetch(),
  });
  const marketInput = useMemo(() => ({ productName: marketProduct, category: "Pantry", countryCode, currencyCode }), [marketProduct, countryCode, currencyCode]);
  const marketQuery = trpc.operations.marketAnalysis.useQuery(marketInput, { enabled: isAuthenticated && role === "owner" && view === "inventory", retry: false, staleTime: 300_000 });
  const marketCompareInput = useMemo(() => ({ items: products.slice(0, 8).map((product) => ({ productName: product.name, category: product.category })), countryCode, currencyCode }), [products, countryCode, currencyCode]);
  const marketCompareQuery = trpc.operations.marketAnalysisBatch.useQuery(marketCompareInput, { enabled: isAuthenticated && role === "owner" && view === "inventory" && products.length > 0, retry: false, staleTime: 300_000 });
  const aiMarketInsightsQuery = trpc.operations.aiMarketInsights.useQuery(undefined, { enabled: isAuthenticated && role === "owner" && view === "overview", retry: false, staleTime: 300_000 });
  const utils = trpc.useUtils();
  const applyMarketPrice = trpc.operations.applyMarketPrice.useMutation({
    onSuccess: (result) => {
      if (result) {
        setProducts((current) => current.map((product) => product.id === result.productId ? { ...product, price: result.salePriceCents / 100 } : product));
      }
      utils.operations.workspace.invalidate();
      utils.operations.aiMarketInsights.invalidate();
      toast.success("Market price applied", { description: "The product price was updated to the latest recommendation." });
    },
    onError: (error) => toast.error("Price update failed", { description: error.message }),
  });
  const seenAlertIds = useRef(new Set<number>());
  const alertsBootstrapped = useRef(false);

  const visibleProducts = useMemo(() => products.filter((product) => `${product.name} ${product.sku} ${product.category}`.toLowerCase().includes(search.toLowerCase())), [products, search]);
  const totalSold = team.reduce((sum, member) => sum + member.sold, 0);
  const employeeOfMonth = [...team].sort((a, b) => b.sold - a.sold)[0];
  const alerts = alertsQuery.data ?? [];
  const unreadAlerts = alerts.filter((alert) => !alert.readAt);

  useEffect(() => {
    if (!profile) return;
    setLanguage(profile.languageCode || "en");
    setCountryCode(profile.countryCode || "US");
    setCurrencyCode(profile.currencyCode || "USD");
    setBusinessType(profile.businessType || "retail");
    setSubscriptionPlan(profile.subscriptionPlan || "starter");
    setShopName(profile.name || `${welcomeName}'s shop`);
    if (!profile.setupCompleted) setSetupOpen(true);
  }, [profile]);

  useEffect(() => {
    if (!workspace) return;
    const currentMember = workspace.team.find((member) => member.userId === user?.id);
    if (currentMember?.role === "employee") setRole("employee");
    if (workspace.inventory.length > 0) {
      const nextProducts = workspace.inventory.map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        stock: product.stockOnHand,
        unit: product.unit,
        price: product.salePriceCents / 100,
        status: product.stockOnHand <= product.reorderLevel ? "Reorder" : "Healthy",
        trend: product.stockOnHand <= product.reorderLevel ? "watch" : "+8%",
      }));
      setProducts(nextProducts);
      setSaleProduct((current) => nextProducts.some((product) => product.name === current) ? current : nextProducts[0]?.name ?? current);
    }
    if (workspace.team.length > 0) {
      setTeam(workspace.team.map((member) => ({
        id: member.id,
        name: member.name,
        role: member.role === "owner" ? "Shop owner" : "Employee",
        sold: member.monthlyUnits,
        goal: member.targetUnits,
        color: member.avatarColor,
        accent: member.avatarColor,
        initials: member.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
      })));
    }
    if (workspace.reviews.length > 0) {
      setReviews(workspace.reviews.map((review) => ({
        id: review.id,
        customer: review.customerName,
        product: review.productRating,
        service: review.serviceRating,
        note: review.comment ?? "No written comment.",
        time: new Date(review.createdAt).toLocaleDateString(),
        status: review.status,
      })));
    }
  }, [workspace, user?.id]);

  useEffect(() => {
    if (!alertsQuery.data) return;
    const freshAlerts = alertsQuery.data.filter((alert) => !seenAlertIds.current.has(alert.id));
    if (alertsBootstrapped.current) {
      freshAlerts.forEach((alert) => toast.error(alert.title, { description: alert.message }));
    }
    freshAlerts.forEach((alert) => seenAlertIds.current.add(alert.id));
    alertsBootstrapped.current = true;
  }, [alertsQuery.data]);

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
    if (isAuthenticated) setBeacon.mutate({ shopId: ownerShopId, enabled: next });
    toast.success(next ? "Nearby customer signal is live" : "Nearby discovery paused");
  }

  function submitSale() {
    const product = products.find((item) => item.name === saleProduct);
    if (!product) return;
    const nextProducts = products.map((item) => item.name === product.name ? { ...item, stock: Math.max(0, item.stock - saleQty), trend: "+21%" } : item);
    setProducts(nextProducts);
    setTeam(team.map((member, index) => index === 0 ? { ...member, sold: member.sold + saleQty } : member));
    if (isAuthenticated) {
      logSale.mutate({ shopId: ownerShopId, productId: product.id, employeeId: team[1]?.id, quantity: saleQty, revenueCents: Math.round(product.price * saleQty * 100), profitCents: Math.round(product.price * saleQty * 36) }, {
        onSuccess: (result) => {
          utils.operations.alerts.invalidate(alertsInput);
          if (result?.lowStockAlert) {
            toast.error(result.lowStockAlert.title, { description: result.lowStockAlert.message });
          }
        },
      });
    }
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
          <div className="mt-11"><p className="px-3 text-[10px] font-bold uppercase tracking-[.18em] text-[#a2a69f]">Workspace</p><nav className="mt-3 space-y-1"><NavItem active={view === "overview"} icon={BarChart3} label={t("overview")} onClick={() => { setView("overview"); setMobileOpen(false); }} /><NavItem active={view === "inventory"} icon={PackageSearch} label={t("inventory")} badge="4" onClick={() => { setView("inventory"); setMobileOpen(false); }} /><NavItem active={view === "team"} icon={UsersRound} label={t("team")} onClick={() => { setView("team"); setMobileOpen(false); }} /><NavItem active={view === "reviews"} icon={Star} label={t("voice")} badge="2" onClick={() => { setView("reviews"); setMobileOpen(false); }} />{role === "owner" && <NavItem active={view === "staff"} icon={UserPlus} label="Staff access" onClick={() => { setView("staff"); setMobileOpen(false); }} />}</nav></div>
          <div className="mt-10"><p className="px-3 text-[10px] font-bold uppercase tracking-[.18em] text-[#a2a69f]">Shop mode</p><div className="mt-3 rounded-2xl border border-[#e8e2d6] bg-white/60 p-1"><button onClick={() => setRole("owner")} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold ${role === "owner" ? "bg-[#fffdf8] text-[#1e2a28] shadow-sm" : "text-[#929990]"}`}><ShieldCheck className="h-4 w-4 text-[#ef8354]" /> {t("owner")}</button><button onClick={() => setRole("employee")} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold ${role === "employee" ? "bg-[#fffdf8] text-[#1e2a28] shadow-sm" : "text-[#929990]"}`}><Target className="h-4 w-4 text-[#6f9888]" /> {t("employee")}</button></div></div>
          <div className="mt-auto rounded-2xl bg-[#e9f0eb] p-4"><div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[.16em] text-[#6f9888]">Live pulse</span><span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#69a082] opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#4d8a6c]" /></span></div><p className="mt-2 text-xs leading-5 text-[#597068]">Inventory and sales are syncing as your team works.</p></div>
          <div className="mt-5 flex items-center gap-3 border-t border-[#ebe6db] pt-5"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ef8354] text-xs font-bold text-white">{welcomeName.slice(0, 1)}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{welcomeName} {user ? "" : "(demo)"}</p><p className="text-[10px] text-[#959b94]">{role === "owner" ? "Owner account" : "Team member"}</p></div>{isAuthenticated ? <button onClick={logout} className="text-[10px] font-bold text-[#8e9790] hover:text-[#bf6235]">Sign out</button> : <button onClick={() => startLogin()} className="text-[#ef8354]" title="Sign in"><LogIn className="h-4 w-4" /></button>}</div>
        </aside>

        {mobileOpen && <button aria-label="Close menu" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-[#1e2a28]/20 backdrop-blur-sm lg:hidden" />}

        <main className="min-w-0 flex-1 px-4 py-4 sm:px-7 sm:py-7 lg:px-10">
          <header className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><button onClick={() => setMobileOpen(true)} className="rounded-xl border border-[#ebe6db] bg-white/70 p-2.5 text-[#67736b] lg:hidden"><Menu className="h-5 w-5" /></button><div><p className="text-xs font-semibold text-[#9da39b]">Tuesday, 22 September 2026</p><h1 className="mt-0.5 font-display text-[27px] font-semibold tracking-[-.045em] sm:text-[32px]">Good morning, {welcomeName} <span className="text-[#ef8354]">.</span></h1></div></div><div className="flex items-center gap-2 sm:gap-3"><button onClick={() => setSetupOpen(true)} className="hidden items-center gap-2 rounded-xl border border-[#e8e2d7] bg-white/70 px-3 py-2 text-xs font-semibold text-[#6f7971] sm:flex"><Globe2 className="h-3.5 w-3.5 text-[#ef8354]" /> {profile?.countryCode ?? countryCode} · {profile?.currencyCode ?? currencyCode} <ChevronDown className="h-3.5 w-3.5" /></button><label className="hidden items-center gap-2 rounded-xl border border-[#e8e2d7] bg-white/70 px-3 py-2 text-xs font-semibold text-[#6f7971] sm:flex"><Languages className="h-3.5 w-3.5 text-[#6f9888]" /><select aria-label="Language" value={language} onChange={(event) => { setLanguage(event.target.value); if (isAuthenticated) saveProfile.mutate({ name: shopName || `${welcomeName}'s shop`, businessType, countryCode, currencyCode, languageCode: event.target.value, subscriptionPlan }); }} className="max-w-[90px] bg-transparent outline-none">{languageOptions.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}</select></label><button onClick={() => setNotificationsOpen((open) => !open)} aria-label="Open low-stock notifications" className="relative rounded-xl border border-[#e8e2d7] bg-white/70 p-2.5 text-[#78817a] hover:bg-white"><Bell className="h-4 w-4" />{unreadAlerts.length > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ef8354] px-1 text-[9px] font-bold text-white">{unreadAlerts.length > 9 ? "9+" : unreadAlerts.length}</span>}</button><div className="hidden h-9 w-9 items-center justify-center rounded-full bg-[#ef8354] text-xs font-bold text-white sm:flex">{welcomeName.slice(0, 1)}</div></div></header>
          {notificationsOpen && <div className="relative z-30"><div className="absolute right-0 top-3 w-full max-w-[360px] overflow-hidden rounded-2xl border border-[#ebe6db] bg-[#fffdf8] shadow-2xl shadow-[#1e2a28]/10"><div className="flex items-center justify-between border-b border-[#eee9df] px-4 py-3"><div><p className="text-xs font-bold">Owner alerts</p><p className="mt-0.5 text-[10px] text-[#9ca29b]">Low-stock warnings refresh automatically</p></div><span className="rounded-full bg-[#fff0e6] px-2 py-1 text-[10px] font-bold text-[#bf6235]">{unreadAlerts.length} unread</span></div>{alerts.length === 0 ? <div className="px-4 py-6 text-center"><CheckCircle2 className="mx-auto h-6 w-6 text-[#6f9888]" /><p className="mt-2 text-xs font-bold">No inventory alerts</p><p className="mt-1 text-[10px] text-[#9ca29b]">You’ll be notified here when an item crosses its reorder point.</p></div> : <div className="max-h-[280px] overflow-y-auto">{alerts.map((alert) => <button key={alert.id} onClick={() => { if (!alert.readAt) markAlertRead.mutate({ alertId: alert.id }); }} className={`flex w-full gap-3 border-b border-[#f0ece4] px-4 py-3 text-left transition-colors hover:bg-[#faf7f0] ${alert.readAt ? "opacity-60" : ""}`}><div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#fff0e6] text-[#bf6235]"><PackageSearch className="h-3.5 w-3.5" /></div><div className="min-w-0 flex-1"><p className="text-[11px] font-bold text-[#39463f]">{alert.title}</p><p className="mt-1 text-[10px] leading-4 text-[#7f887f]">{alert.message}</p><p className="mt-1 text-[9px] text-[#a6aba4]">{new Date(alert.createdAt).toLocaleString()}</p></div>{!alert.readAt && <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ef8354]" />}</button>)}</div>}</div></div>}

          <div className="mt-7 flex flex-col gap-4 rounded-[24px] bg-[#1e2a28] p-5 text-[#fffdf8] shadow-[0_20px_60px_rgba(30,42,40,.18)] sm:p-7 lg:flex-row lg:items-center lg:justify-between" style={{ backgroundImage: `linear-gradient(90deg, rgba(30,42,40,.98) 0%, rgba(30,42,40,.9) 35%, rgba(30,42,40,.36) 74%, rgba(30,42,40,.12) 100%), url(${heroImage})`, backgroundPosition: "center", backgroundSize: "cover" }}><div className="max-w-[560px]"><div className="flex items-center gap-2 text-[#ffbf9f]"><Sparkles className="h-4 w-4" /><span className="text-[11px] font-bold uppercase tracking-[.18em]">Today at Cedar & Co.</span></div><h2 className="mt-3 font-display text-[26px] font-semibold leading-[1.05] tracking-[-.04em] sm:text-[33px]">Your shop is moving<br className="hidden sm:block" /> in the right direction.</h2><p className="mt-3 max-w-[430px] text-sm leading-6 text-white/65">Keep the floor stocked, celebrate the people making it happen, and let your customers feel close to the work.</p><div className="mt-5 flex flex-wrap gap-2"><button onClick={() => setView(role === "owner" ? "inventory" : "overview")} className="inline-flex items-center gap-2 rounded-xl bg-[#ef8354] px-4 py-2.5 text-xs font-bold text-white transition-transform hover:-translate-y-0.5 active:scale-[.98]">{role === "owner" ? "Review stock" : "Log a sale"}<ArrowUpRight className="h-3.5 w-3.5" /></button><button onClick={toggleBeacon} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-bold text-white/85 backdrop-blur transition-colors hover:bg-white/15"><span className={`h-1.5 w-1.5 rounded-full ${beaconOn ? "bg-[#90d2ae]" : "bg-white/40"}`} /> {beaconOn ? "Nearby signal live" : "Turn on nearby signal"}</button><a href="/discover" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold text-white/70 backdrop-blur transition-colors hover:bg-white/10"><MapPin className="h-3.5 w-3.5" /> Customer map</a></div></div><div className="hidden min-w-[210px] rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md lg:block"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/45">Store beacon</p><div className="mt-3 flex items-center justify-between"><div><p className="font-display text-3xl">{beaconOn ? "Live" : "Off"}</p><p className="mt-1 text-[11px] text-white/55">{geoLabel}</p></div><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${beaconOn ? "bg-[#e9f6ed] text-[#4f8a67]" : "bg-white/10 text-white/40"}`}><MapPin className="h-5 w-5" /></div></div></div></div>

          {role === "employee" ? <EmployeeView products={products} saleProduct={saleProduct} saleQty={saleQty} setSaleProduct={setSaleProduct} setSaleQty={setSaleQty} submitSale={submitSale} team={team} /> : <OwnerView view={view} setView={setView} products={visibleProducts} allProducts={products} setProducts={setProducts} team={team} reviews={reviews} resolveReview={resolveReview} employeeOfMonth={employeeOfMonth} totalSold={totalSold} period={period} setPeriod={setPeriod} search={search} setSearch={setSearch} snapshotReady={Boolean(snapshot.data)} marketProduct={marketProduct} setMarketProduct={setMarketProduct} marketQuery={marketQuery} marketCompareQuery={marketCompareQuery} aiMarketInsightsQuery={aiMarketInsightsQuery} applyMarketPrice={applyMarketPrice} t={t} />}
          {setupOpen && <ShopSetupModal name={shopName || `${welcomeName}'s shop`} setName={setShopName} countryCode={countryCode} currencyCode={currencyCode} language={language} businessType={businessType} subscriptionPlan={subscriptionPlan} setCountryCode={setCountryCode} setCurrencyCode={setCurrencyCode} setLanguage={setLanguage} setBusinessType={setBusinessType} setSubscriptionPlan={setSubscriptionPlan} onClose={() => setSetupOpen(false)} onSave={() => saveProfile.mutate({ name: shopName || `${welcomeName}'s shop`, countryCode, currencyCode, languageCode: language, businessType, subscriptionPlan })} saving={saveProfile.isPending} t={t} />}

          <footer className="mt-10 flex flex-col gap-2 border-t border-[#ebe6db] pb-4 pt-5 text-[11px] text-[#a1a69f] sm:flex-row sm:items-center sm:justify-between"><span>Stockwise Ops · made for the people behind the counter.</span><span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[#6f9888]" /> All systems operational</span></footer>
        </main>
      </div>
    </div>
  );
}

function OwnerView({ view, setView, products, allProducts, setProducts, team, reviews, resolveReview, employeeOfMonth, totalSold, period, setPeriod, search, setSearch, snapshotReady, marketProduct, setMarketProduct, marketQuery, marketCompareQuery, aiMarketInsightsQuery, applyMarketPrice, t }: any) {
  return <>
    {view === "overview" && <div className="animate-in mt-7"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Net revenue" value="$18,420" delta="+14.8%" icon={CircleDollarSign} tone="peach" detail="vs. $16,050 last month" /><MetricCard label="Units sold" value={totalSold.toLocaleString()} delta="+9.4%" icon={Package} tone="sage" detail="across 4 categories" /><MetricCard label="Gross profit" value="$6,848" delta="+11.2%" icon={TrendingUp} tone="gold" detail="37.2% margin" /><MetricCard label="Customer love" value="4.8 / 5" delta="+0.2" icon={Star} tone="lavender" detail="from 126 reviews" /></div><AiInsightsCard query={aiMarketInsightsQuery} onApplyPrice={applyMarketPrice} /><div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_.85fr]"><section className="soft-card rounded-[24px] border border-[#ebe6db] bg-[#fffdf8] p-5 sm:p-6"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#a1a69f]">Sales momentum</p><div className="mt-1 flex items-baseline gap-2"><h3 className="font-display text-[28px] font-semibold tracking-[-.04em]">$68,240</h3><span className="text-xs font-bold text-[#5d9775]">+18.2%</span></div><p className="mt-1 text-xs text-[#9aa099]">Revenue this year, updated just now</p></div><select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-fit rounded-xl border border-[#e8e2d7] bg-[#faf8f2] px-3 py-2 text-xs font-bold text-[#6e7770] outline-none"><option>This year</option><option>Last 12 months</option><option>This quarter</option></select></div><div className="mt-7 flex h-[190px] items-end gap-1.5 sm:gap-3">{monthlyTrend.map((height, index) => <div key={monthLabels[index]} className="group flex h-full flex-1 flex-col justify-end gap-2"><div className={`relative w-full rounded-t-[8px] transition-all duration-300 ${index === monthlyTrend.length - 1 ? "bg-[#ef8354]" : "bg-[#dce8df] group-hover:bg-[#b8d1c1]"}`} style={{ height: `${height * 1.46}px` }}><span className="absolute -top-6 left-1/2 hidden -translate-x-1/2 rounded-md bg-[#1e2a28] px-1.5 py-1 text-[9px] font-bold text-white group-hover:block">{height}</span></div><span className="text-center text-[10px] font-semibold text-[#a4a9a1]">{monthLabels[index]}</span></div>)}</div></section><section className="soft-card overflow-hidden rounded-[24px] border border-[#ebe6db] bg-[#fffdf8] p-5 sm:p-6"><div className="flex items-start justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#a1a69f]">Team pulse</p><h3 className="mt-1 font-display text-[23px] font-semibold tracking-[-.04em]">Who’s moving stock?</h3></div><button onClick={() => setView("team")} className="rounded-xl p-2 text-[#a2aaa2] hover:bg-[#f2eee6] hover:text-[#1e2a28]"><ArrowUpRight className="h-4 w-4" /></button></div><div className="mt-5 space-y-4">{team.slice(0, 3).map((member: any, index: number) => <TeamRow key={member.id} member={member} rank={index + 1} />)}</div><div className="mt-5 rounded-2xl bg-[#f7f3eb] p-3"><div className="flex items-center gap-2"><div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ef8354]/15 text-[#ef8354]"><Sparkles className="h-3.5 w-3.5" /></div><p className="text-[11px] font-semibold leading-4 text-[#6d776f]">Employee of the month: <span className="font-bold text-[#1e2a28]">{employeeOfMonth.name}</span></p></div></div></section></div><div className="mt-5 grid gap-5 xl:grid-cols-[.92fr_1.08fr]"><BeaconCard beaconOn={true} /><ReviewMini reviews={reviews} onResolve={resolveReview} onOpen={() => setView("reviews")} /></div></div>}
    {view === "inventory" && <InventoryView products={products} allProducts={allProducts} setProducts={setProducts} search={search} setSearch={setSearch} marketProduct={marketProduct} setMarketProduct={setMarketProduct} marketQuery={marketQuery} marketCompareQuery={marketCompareQuery} aiMarketInsightsQuery={aiMarketInsightsQuery} applyMarketPrice={applyMarketPrice} t={t} />}
    {view === "team" && <TeamView team={team} />}
    {view === "reviews" && <ReviewsView reviews={reviews} onResolve={resolveReview} />}
    {view === "staff" && <StaffView />}
  </>;
}

function AiInsightsCard({ query, onApplyPrice }: { query: any; onApplyPrice: any }) {
  const data = query.data;
  return <section className="soft-card mt-5 overflow-hidden rounded-[24px] border border-[#dfe9df] bg-gradient-to-br from-[#eff7f0] via-[#fffdf8] to-[#fff0e6] p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1e2a28] text-[#ffbf9f]"><Sparkles className="h-5 w-5" /></div><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f9888]">AI market pulse</p><h3 className="mt-1 font-display text-[24px] font-semibold tracking-[-.04em]">{query.isLoading ? "Reading your stock signals…" : data?.headline ?? "Market-aware replenishment"}</h3><p className="mt-1 max-w-2xl text-sm leading-6 text-[#6f7971]">{query.isLoading ? "Combining low-stock items with current market benchmarks." : data?.summary ?? "Your inventory insights will appear here once products and market signals are available."}</p></div></div>{data?.sourceLabel && <span className="shrink-0 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-bold text-[#718077]">{data.sourceLabel}</span>}</div>{data?.items?.length > 0 && <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{data.items.slice(0, 3).map((item: any) => <div key={item.productName} className="rounded-2xl border border-white/80 bg-white/75 p-3"><div className="flex items-start justify-between gap-2"><p className="min-w-0 truncate text-xs font-bold text-[#1e2a28]">{item.productName}</p><span className={`rounded-full px-2 py-1 text-[9px] font-bold ${item.trend === "rising" ? "bg-[#e4f2ea] text-[#3b7961]" : item.trend === "softening" ? "bg-[#fff0e6] text-[#bf6235]" : "bg-[#f0eee8] text-[#69716b]"}`}>{item.trend === "rising" ? "Trending up" : item.trend === "softening" ? "Softening" : "Stable"}</span></div><p className="mt-2 text-[10px] text-[#7d887f]">{item.stockOnHand} {item.unit} left · reorder at {item.reorderLevel}</p><p className="mt-2 text-[10px] leading-4 text-[#6f7971]">{item.reason}</p><div className="mt-3 flex items-center justify-between gap-2"><span className="text-[10px] text-[#89938b]">Market: {item.currencyCode} {item.marketSample.toFixed(2)}</span><button type="button" disabled={onApplyPrice.isPending || item.marketSample <= 0} onClick={() => onApplyPrice.mutate({ productId: item.productId, salePriceCents: Math.round(item.marketSample * 100) })} className="rounded-lg bg-[#ef8354] px-2.5 py-1.5 text-[10px] font-bold text-white transition-transform hover:-translate-y-0.5 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50">{onApplyPrice.isPending ? "Applying…" : "Apply price"}</button></div></div>)}</div>}{data?.action && <div className="mt-4 flex items-start gap-2 rounded-2xl bg-[#1e2a28] px-3 py-3 text-xs leading-5 text-white/75"><ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-[#ffbf9f]" /><span><strong className="text-white">Recommended next step:</strong> {data.action}</span></div>}{query.isError && <p className="mt-3 text-[10px] text-[#b75a51]">AI insights are temporarily unavailable. Inventory and market data remain available in the Inventory view.</p>}</section>;
}

function MarketInsightCard({ marketProduct, setMarketProduct, marketQuery, t }: any) {
  const result = marketQuery.data;
  return <section className="soft-card mt-5 rounded-[24px] border border-[#ebe6db] bg-[#fffdf8] p-5 sm:p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><div className="flex items-center gap-2 text-[#6f9888]"><Globe2 className="h-4 w-4" /><p className="text-[11px] font-bold uppercase tracking-[.16em]">{t("market")}</p></div><h3 className="mt-1 font-display text-[23px] font-semibold tracking-[-.04em]">What does the market say?</h3><p className="mt-1 max-w-xl text-xs leading-5 text-[#9aa098]">Compare your price against an internet snapshot for the same product and country before you reorder or adjust your shelf price.</p></div><div className="flex items-center gap-2"><select value={marketProduct} onChange={(event) => setMarketProduct(event.target.value)} className="rounded-xl border border-[#e8e2d7] bg-[#faf8f2] px-3 py-2.5 text-xs font-semibold text-[#6e7770] outline-none"><option>Harvest Granola</option><option>Citrus Sparkling Water</option><option>Market Tote — Sand</option><option>Organic Oat Milk</option></select><button onClick={() => marketQuery.refetch()} className="rounded-xl border border-[#e8e2d7] p-2.5 text-[#7f8c83] hover:bg-[#f3efe7]" aria-label="Refresh market analysis"><RefreshCw className={`h-4 w-4 ${marketQuery.isFetching ? "animate-spin" : ""}`} /></button></div></div>{result ? <div className="mt-5 grid gap-3 sm:grid-cols-[.7fr_.7fr_1.2fr]"><div className="rounded-2xl bg-[#e8f1ea] p-4"><p className="text-[10px] font-bold uppercase tracking-[.13em] text-[#6b9078]">Suggested range</p><p className="mt-1 font-display text-[24px] font-semibold">{result.currencyCode} {result.low.toFixed(2)}–{result.high.toFixed(2)}</p><p className="mt-1 text-[10px] text-[#769181]">based on {result.sourceType === "live_web_snapshot" ? "live web samples" : "regional benchmark"}</p></div><div className="rounded-2xl bg-[#fff0e6] p-4"><p className="text-[10px] font-bold uppercase tracking-[.13em] text-[#b56d4b]">Market midpoint</p><p className="mt-1 font-display text-[24px] font-semibold">{result.currencyCode} {result.sample.toFixed(2)}</p><p className="mt-1 text-[10px] text-[#b37a60]">Use with your cost and margin</p></div><div className="rounded-2xl bg-[#f5f2eb] p-4"><p className="text-[10px] font-bold uppercase tracking-[.13em] text-[#a1a69f]">Research note</p><p className="mt-1 text-xs font-semibold text-[#5e6a61]">{result.sources[0]?.title}</p><p className="mt-1 text-[10px] leading-4 text-[#8f9790]">{result.sourceType === "live_web_snapshot" ? "Live web snapshot · verify local taxes, pack size, and supplier terms." : result.sources[0]?.snippet}</p></div></div> : <div className="mt-5 rounded-2xl bg-[#f5f2eb] p-4 text-xs text-[#929990]">{marketQuery.isLoading ? "Collecting a current market snapshot…" : "Sign in as an owner to compare this product against market pricing."}</div>}<p className="mt-3 text-[10px] text-[#a2a8a1]">Transparent pricing guidance, not a quote. Checked {result ? new Date(result.checkedAt).toLocaleString() : "when requested"}.</p></section>;
}

function ShopSetupModal({ name, setName, countryCode, currencyCode, language, businessType, subscriptionPlan, setCountryCode, setCurrencyCode, setLanguage, setBusinessType, setSubscriptionPlan, onClose, onSave, saving, t }: any) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e2a28]/30 p-4 backdrop-blur-sm"><div className="w-full max-w-2xl rounded-[26px] bg-[#fffdf8] p-6 shadow-2xl sm:p-7"><div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2 text-[#6f9888]"><Globe2 className="h-4 w-4" /><p className="text-[11px] font-bold uppercase tracking-[.16em]">{t("setup")}</p></div><h3 className="mt-1 font-display text-[28px] font-semibold tracking-[-.04em]">Make Stockwise yours.</h3><p className="mt-1 max-w-lg text-xs leading-5 text-[#929990]">Connect your owner profile to one shop, set your local market context, and choose how much team data you want to manage.</p></div><button onClick={onClose} className="rounded-xl p-2 text-[#9ba19a] hover:bg-[#f3efe7]"><X className="h-4 w-4" /></button></div><div className="mt-6 grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold text-[#68736b]">Shop name<input value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#e6e1d6] bg-[#fbf8f1] px-3 py-3 text-sm font-semibold text-[#6e7770] outline-none focus:border-[#ef8354]" /></label><label className="text-xs font-bold text-[#68736b]">Business type<select value={businessType} onChange={(event) => setBusinessType(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#e6e1d6] bg-[#fbf8f1] px-3 py-3 text-sm font-semibold outline-none"><option value="retail">Retail shop</option><option value="wholesale">Wholesale shop</option><option value="hybrid">Retail + wholesale</option></select></label><label className="text-xs font-bold text-[#68736b]">Country / market<input value={countryCode} onChange={(event) => setCountryCode(event.target.value.toUpperCase())} maxLength={8} className="mt-1.5 w-full rounded-xl border border-[#e6e1d6] bg-[#fbf8f1] px-3 py-3 text-sm font-semibold uppercase outline-none" /></label><label className="text-xs font-bold text-[#68736b]">Currency code<input value={currencyCode} onChange={(event) => setCurrencyCode(event.target.value.toUpperCase())} maxLength={8} className="mt-1.5 w-full rounded-xl border border-[#e6e1d6] bg-[#fbf8f1] px-3 py-3 text-sm font-semibold uppercase outline-none" /></label><label className="text-xs font-bold text-[#68736b]">Dashboard language<select value={language} onChange={(event) => setLanguage(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#e6e1d6] bg-[#fbf8f1] px-3 py-3 text-sm font-semibold outline-none">{languageOptions.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}</select></label><label className="text-xs font-bold text-[#68736b]">Subscription plan<select value={subscriptionPlan} onChange={(event) => setSubscriptionPlan(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#e6e1d6] bg-[#fbf8f1] px-3 py-3 text-sm font-semibold outline-none"><option value="starter">Starter · owner essentials</option><option value="growth">Growth · live market analysis</option><option value="scale">Scale · multi-shop operations</option></select></label></div><div className="mt-5 rounded-2xl bg-[#e8f1ea] p-4"><div className="flex items-start gap-3"><UsersRound className="mt-0.5 h-4 w-4 shrink-0 text-[#5d8b6d]" /><p className="text-xs leading-5 text-[#5d7565]">Once saved, employee sales and inventory activity will be scoped to this owner’s shop. Market comparisons use the selected country and currency, with the source and fallback status shown transparently.</p></div></div><div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button onClick={onClose} className="rounded-xl px-4 py-3 text-xs font-bold text-[#858d86] hover:bg-[#f3efe7]">Not now</button><button onClick={onSave} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1e2a28] px-5 py-3 text-xs font-bold text-white hover:bg-[#30403c] disabled:opacity-60">{saving ? "Saving…" : "Save shop profile"}<ArrowUpRight className="h-3.5 w-3.5" /></button></div></div></div>;
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

function MarketPriceBadge({ product, comparison }: any) {
  if (!comparison) return <span className="rounded-full bg-[#f1eee8] px-2 py-1 text-[9px] font-bold text-[#9aa098]">Market checking</span>;
  const ratio = comparison.sample > 0 ? product.price / comparison.sample : 1;
  const state = ratio > 1.15 ? { label: "Overpriced", className: "bg-[#fce9e6] text-[#b75a51]", icon: "↑" } : ratio < 0.85 ? { label: "Underpriced", className: "bg-[#fff0e6] text-[#bf6235]", icon: "↓" } : { label: "Market aligned", className: "bg-[#e4f2ea] text-[#3b7961]", icon: "≈" };
  return <span title={`Your ${product.price.toFixed(2)} vs market midpoint ${comparison.sample.toFixed(2)}`} className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-bold ${state.className}`}><span>{state.icon}</span>{state.label}</span>;
}

function InventoryView({ products, allProducts, setProducts, search, setSearch, marketProduct, setMarketProduct, marketQuery, marketCompareQuery, t }: any) {
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", sku: "", stock: 20, category: "Pantry" });
  function addItem() { if (!newItem.name || !newItem.sku) return; setProducts([...allProducts, { id: Date.now(), name: newItem.name, sku: newItem.sku, category: newItem.category, stock: Number(newItem.stock), unit: "units", price: 18, status: "Healthy", trend: "new" }]); setNewItem({ name: "", sku: "", stock: 20, category: "Pantry" }); setShowAdd(false); toast.success("New inventory item added"); }
  return <div className="animate-in mt-7"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#a1a69f]">Inventory control</p><h2 className="mt-1 font-display text-[30px] font-semibold tracking-[-.04em]">Know what’s moving.</h2><p className="mt-1 text-sm text-[#919990]">Keep the shelves ready and reorder before the rush.</p></div><button onClick={() => setShowAdd(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1e2a28] px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#1e2a28]/10 transition-transform hover:-translate-y-0.5 active:scale-[.98]"><Plus className="h-4 w-4" /> Add inventory</button></div><MarketInsightCard marketProduct={marketProduct} setMarketProduct={setMarketProduct} marketQuery={marketQuery} t={t} /><div className="mt-6 grid gap-4 sm:grid-cols-3"><MetricCard label="Stock value" value="$42.8k" delta="+6.2%" icon={Package} tone="sage" detail="at retail price" /><MetricCard label="Healthy lines" value="86%" delta="+4.1%" icon={CheckCircle2} tone="peach" detail="18 of 21 SKUs" /><MetricCard label="Needs attention" value="4" delta="today" icon={Clock3} tone="gold" detail="2 below reorder point" /></div><div className="soft-card mt-5 overflow-hidden rounded-[24px] border border-[#ebe6db] bg-[#fffdf8]"><div className="flex flex-col gap-3 border-b border-[#eee9df] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"><div><h3 className="font-display text-[21px] font-semibold">Product lines</h3><p className="mt-1 text-xs text-[#9aa098]">{products.length} tracked products in the Cedar & Co. catalog</p></div><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a6aca4]" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products" className="w-full rounded-xl border border-[#e8e2d7] bg-[#faf8f2] py-2.5 pl-9 pr-3 text-xs outline-none transition-colors placeholder:text-[#b0b4ad] focus:border-[#ef8354] sm:w-[220px]" /></div></div><div className="divide-y divide-[#f0ece4]">{products.map((product: any) => <div key={product.id} className="grid items-center gap-3 px-4 py-4 sm:grid-cols-[1.6fr_1fr_.7fr_.7fr_auto] sm:px-5"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5eee4] text-[#c17b55]"><Package className="h-4 w-4" /></div><div><p className="text-xs font-bold">{product.name}</p><p className="mt-0.5 text-[10px] text-[#a1a69f]">{product.sku} · {product.category}</p></div></div><div className="text-xs font-semibold text-[#667169]"><span className="text-[#a4aaa2] sm:hidden">Stock · </span>{product.stock} {product.unit}</div><div><StatusPill tone={product.stock < 25 ? "red" : product.stock < 50 ? "orange" : "green"}>{product.status}</StatusPill></div><div className={`text-xs font-bold ${product.trend.startsWith("+") ? "text-[#609273]" : "text-[#bb6b5b]"}`}>{product.trend}</div><MarketPriceBadge product={product} comparison={(marketCompareQuery.data ?? []).find((item: any) => item.productName === product.name)?.analysis} /><button onClick={() => toast.success(`${product.name} is open for edits`, { description: "Pricing and reorder settings are ready to connect." })} className="justify-self-start rounded-xl border border-[#e7e2d8] px-3 py-2 text-[11px] font-bold text-[#78827a] hover:bg-[#f5f1e9] sm:justify-self-end">Manage</button></div>)}</div></div>{showAdd && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e2a28]/30 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-[24px] bg-[#fffdf8] p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#a1a69f]">New item</p><h3 className="mt-1 font-display text-[25px] font-semibold">Add to inventory</h3></div><button onClick={() => setShowAdd(false)} className="rounded-xl p-2 text-[#9ba19a] hover:bg-[#f3efe7]"><X className="h-4 w-4" /></button></div><div className="mt-5 space-y-3"><input value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} placeholder="Product name" className="w-full rounded-xl border border-[#e6e1d6] bg-[#fbf8f1] px-3 py-3 text-sm outline-none focus:border-[#ef8354]" /><input value={newItem.sku} onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })} placeholder="SKU / barcode" className="w-full rounded-xl border border-[#e6e1d6] bg-[#fbf8f1] px-3 py-3 text-sm outline-none focus:border-[#ef8354]" /><div className="grid grid-cols-2 gap-3"><input type="number" value={newItem.stock} onChange={(e) => setNewItem({ ...newItem, stock: Number(e.target.value) })} placeholder="Starting stock" className="w-full rounded-xl border border-[#e6e1d6] bg-[#fbf8f1] px-3 py-3 text-sm outline-none focus:border-[#ef8354]" /><select value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} className="w-full rounded-xl border border-[#e6e1d6] bg-[#fbf8f1] px-3 py-3 text-sm outline-none focus:border-[#ef8354]"><option>Pantry</option><option>Beverages</option><option>Chilled</option><option>Merch</option></select></div></div><button onClick={addItem} className="mt-5 w-full rounded-xl bg-[#1e2a28] py-3 text-xs font-bold text-white hover:bg-[#30403c]">Add product</button></div></div>}</div>;
}

function StaffView() {
  const [email, setEmail] = useState("");
  const [permissionRole, setPermissionRole] = useState<"manager" | "sales" | "inventory" | "support">("sales");
  const staffQuery = trpc.operations.staff.useQuery(undefined, { retry: false });
  const inviteStaff = trpc.operations.inviteStaff.useMutation({
    onSuccess: (result) => {
      staffQuery.refetch();
      setEmail("");
      toast.success("Invite created", { description: result?.invite ? `Share the invite link with ${result.invite.email}.` : "The staff invitation is ready." });
    },
    onError: (error) => toast.error("Invite could not be created", { description: error.message }),
  });
  const updatePermission = trpc.operations.updateStaffPermission.useMutation({
    onSuccess: () => { staffQuery.refetch(); toast.success("Permissions updated"); },
  });
  const revokeInvite = trpc.operations.revokeStaffInvite.useMutation({
    onSuccess: () => { staffQuery.refetch(); toast.success("Invite revoked"); },
  });
  const members = staffQuery.data?.members ?? [];
  const invites = staffQuery.data?.invites ?? [];
  const rolePermissions: Record<string, string> = {
    manager: "Overview · inventory · team · customer voice",
    sales: "Overview · log sales · employee scorecard",
    inventory: "Inventory · market pricing · low-stock alerts",
    support: "Customer voice · review follow-up",
  };
  function copyInvite(invite: any) {
    const link = `${window.location.origin}/join?token=${invite.inviteToken}`;
    navigator.clipboard?.writeText(link);
    toast.success("Invite link copied", { description: link });
  }
  return <div className="animate-in mt-7"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#a1a69f]">Staff access</p><h2 className="mt-1 font-display text-[30px] font-semibold tracking-[-.04em]">Set the right access for every shift.</h2><p className="mt-1 max-w-2xl text-sm text-[#919990]">Invite staff by email and keep permissions clear. Sales, inventory, support, and manager access stay separate from the owner account.</p></div><div className="rounded-xl bg-[#e8f1ea] px-3 py-2 text-[11px] font-bold text-[#5d8b6d]">{members.filter((member: any) => member.role !== "owner").length} active staff</div></div><div className="mt-6 grid gap-5 xl:grid-cols-[1.15fr_.85fr]"><section className="soft-card rounded-[24px] border border-[#ebe6db] bg-[#fffdf8] p-5 sm:p-6"><div className="flex items-start justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#a1a69f]">Team members</p><h3 className="mt-1 font-display text-[23px] font-semibold">People with access</h3></div><UsersRound className="h-5 w-5 text-[#6f9888]" /></div><div className="mt-5 space-y-3">{members.length === 0 ? <div className="rounded-2xl bg-[#f6f2ea] p-4 text-xs text-[#8f9790]">No staff records yet. Send the first invite from the panel on the right.</div> : members.map((member: any) => <div key={member.id} className="flex flex-col gap-3 rounded-2xl bg-[#faf8f3] p-4 sm:flex-row sm:items-center"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: member.avatarColor }}>{member.name.split(" ").map((part: string) => part[0]).join("").slice(0, 2).toUpperCase()}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold">{member.name}</p>{member.role === "owner" && <StatusPill tone="orange">Owner</StatusPill>}</div><p className="mt-1 text-[10px] text-[#9ca29b]">{member.email ?? "Owner account"} · {member.monthlyUnits} units this month</p><p className="mt-1 text-[10px] text-[#6f9888]">{member.role === "owner" ? "Full account control" : rolePermissions[member.permissionRole]}</p></div>{member.role !== "owner" && <select value={member.permissionRole} onChange={(event) => updatePermission.mutate({ memberId: member.id, permissionRole: event.target.value as "manager" | "sales" | "inventory" | "support" })} className="rounded-xl border border-[#e6e1d6] bg-[#fffdf8] px-3 py-2 text-xs font-bold outline-none focus:border-[#ef8354]"><option value="manager">Manager</option><option value="sales">Sales</option><option value="inventory">Inventory</option><option value="support">Support</option></select>}</div>)}</div></section><section className="soft-card rounded-[24px] border border-[#ebe6db] bg-[#fffdf8] p-5 sm:p-6"><div className="flex items-start gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff0e6] text-[#ef8354]"><UserPlus className="h-5 w-5" /></div><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#a1a69f]">Invite a teammate</p><h3 className="mt-1 font-display text-[23px] font-semibold">Create staff access</h3></div></div><div className="mt-5 space-y-3"><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="staff@yourshop.com" className="w-full rounded-xl border border-[#e6e1d6] bg-[#fbf8f1] px-3 py-3 text-sm outline-none focus:border-[#ef8354]" /><select value={permissionRole} onChange={(event) => setPermissionRole(event.target.value as typeof permissionRole)} className="w-full rounded-xl border border-[#e6e1d6] bg-[#fbf8f1] px-3 py-3 text-sm font-semibold outline-none"><option value="manager">Manager · broad operations</option><option value="sales">Sales · log and track sales</option><option value="inventory">Inventory · stock and pricing</option><option value="support">Support · customer voice</option></select><div className="rounded-2xl bg-[#e8f1ea] p-3 text-[11px] leading-5 text-[#5d7565]">{rolePermissions[permissionRole]}</div><button onClick={() => inviteStaff.mutate({ email, permissionRole })} disabled={!email || inviteStaff.isPending} className="w-full rounded-xl bg-[#1e2a28] py-3 text-xs font-bold text-white hover:bg-[#30403c] disabled:opacity-50">{inviteStaff.isPending ? "Creating invite…" : "Create invite link"}</button></div><div className="mt-6 border-t border-[#eee9df] pt-5"><div className="flex items-center justify-between"><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#a1a69f]">Pending invites</p><span className="text-[10px] font-bold text-[#9da49d]">{invites.filter((invite: any) => invite.status === "pending").length}</span></div><div className="mt-3 space-y-2">{invites.filter((invite: any) => invite.status === "pending").map((invite: any) => <div key={invite.id} className="flex items-center gap-2 rounded-xl bg-[#faf8f3] px-3 py-2.5"><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-bold">{invite.email}</p><p className="mt-0.5 text-[10px] text-[#9da49d]">{invite.permissionRole} · {new Date(invite.createdAt).toLocaleDateString()}</p></div><button onClick={() => copyInvite(invite)} className="rounded-lg px-2 py-1.5 text-[10px] font-bold text-[#5d8b6d] hover:bg-[#e8f1ea]">Copy</button><button onClick={() => revokeInvite.mutate({ inviteId: invite.id })} className="rounded-lg px-2 py-1.5 text-[10px] font-bold text-[#b75a51] hover:bg-[#fce9e6]">Revoke</button></div>)}</div></div></section></div></div>;
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
