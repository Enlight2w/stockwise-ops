import { trpc } from "@/lib/trpc";
import { MapView } from "@/components/Map";
import { Link } from "wouter";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, ChevronDown, Filter, LocateFixed, MapPin, Search, Send, SlidersHorizontal, Star, Store, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

function distanceKm(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const radius = 6371;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((from.lat * Math.PI) / 180) * Math.cos((to.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type SortMode = "nearest" | "inventory" | "name";

export default function CustomerMap() {
  const [position, setPosition] = useState({ lat: 40.7128, lng: -74.006 });
  const [locationReady, setLocationReady] = useState(false);
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [businessType, setBusinessType] = useState("all");
  const [maxDistance, setMaxDistance] = useState("any");
  const [sortMode, setSortMode] = useState<SortMode>("nearest");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [productRating, setProductRating] = useState(5);
  const [serviceRating, setServiceRating] = useState(5);
  const [comment, setComment] = useState("");
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRefs = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const directoryQuery = trpc.operations.publicDirectory.useQuery(undefined, { staleTime: 30_000, retry: false });
  const submitReview = trpc.operations.submitReview.useMutation({
    onSuccess: () => {
      toast.success("Review submitted", { description: "Thanks for helping this shop improve." });
      setCustomerName(""); setComment(""); setProductRating(5); setServiceRating(5);
    },
    onError: (error) => toast.error("Review could not be submitted", { description: error.message }),
  });

  const shopsWithDistance = useMemo(() => (directoryQuery.data ?? []).map((shop) => ({ ...shop, distance: distanceKm(position, { lat: shop.latitude, lng: shop.longitude }) })), [directoryQuery.data, position]);
  const categories = useMemo(() => Array.from(new Set(shopsWithDistance.flatMap((shop) => shop.inventory.map((item) => item.category)))).sort(), [shopsWithDistance]);
  const filteredShops = useMemo(() => {
    const query = search.trim().toLowerCase();
    const maxKm = maxDistance === "any" ? Infinity : Number(maxDistance);
    const result = shopsWithDistance.filter((shop) => {
      const matchingItems = shop.inventory.filter((item) => {
        const matchesQuery = !query || item.name.toLowerCase().includes(query) || item.category.toLowerCase().includes(query);
        const matchesCategory = category === "all" || item.category === category;
        return matchesQuery && matchesCategory;
      });
      const matchesShop = !query || shop.name.toLowerCase().includes(query) || (shop.address ?? "").toLowerCase().includes(query);
      return shop.distance <= maxKm && (businessType === "all" || shop.businessType === businessType) && (matchesShop || matchingItems.length > 0);
    }).map((shop) => ({ ...shop, visibleInventory: shop.inventory.filter((item) => {
      const query = search.trim().toLowerCase();
      return (!query || item.name.toLowerCase().includes(query) || item.category.toLowerCase().includes(query)) && (category === "all" || item.category === category);
    }) }));
    return result.sort((a, b) => sortMode === "name" ? a.name.localeCompare(b.name) : sortMode === "inventory" ? b.inventory.length - a.inventory.length : a.distance - b.distance);
  }, [shopsWithDistance, search, category, businessType, maxDistance, sortMode]);
  const selectedShop = filteredShops.find((shop) => shop.id === selectedShopId) ?? filteredShops[0];
  const activeFilterCount = [category !== "all", businessType !== "all", maxDistance !== "any", sortMode !== "nearest"].filter(Boolean).length;

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((location) => { setPosition({ lat: location.coords.latitude, lng: location.coords.longitude }); setLocationReady(true); }, () => setLocationReady(false), { enableHighAccuracy: false, timeout: 5000 });
  }, []);
  useEffect(() => { if (mapRef.current) mapRef.current.setCenter(position); }, [position]);
  useEffect(() => {
    if (!mapRef.current || !window.google?.maps?.marker || !mapReady) return;
    markerRefs.current.forEach((marker) => { marker.map = null; });
    markerRefs.current = filteredShops.map((shop) => {
      const marker = new google.maps.marker.AdvancedMarkerElement({ map: mapRef.current!, position: { lat: shop.latitude, lng: shop.longitude }, title: shop.name });
      marker.addListener("click", () => setSelectedShopId(shop.id));
      return marker;
    });
  }, [filteredShops, mapReady]);
  useEffect(() => { if (selectedShopId && !filteredShops.some((shop) => shop.id === selectedShopId)) setSelectedShopId(null); }, [filteredShops, selectedShopId]);

  return <div className="min-h-screen bg-[#fbf8f1] text-[#1e2a28]"><header className="sticky top-0 z-20 border-b border-[#ebe6db] bg-[#fbf8f1]/90 px-4 py-4 backdrop-blur-xl sm:px-8"><div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3"><Link href="/"><span className="inline-flex items-center gap-2 text-sm font-bold text-[#52625a] hover:text-[#ef8354]"><ArrowLeft className="h-4 w-4" /> Back to Stockwise</span></Link><div className="flex items-center gap-2 text-xs font-bold text-[#718077]"><LocateFixed className="h-4 w-4 text-[#6f9888]" />{locationReady ? "Using your location" : "Showing shops near the map center"}</div></div></header><main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-8"><div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]"><section className="overflow-hidden rounded-[26px] border border-[#e6e2d7] bg-white shadow-[0_20px_60px_rgba(30,42,40,.08)]"><div className="border-b border-[#eee9df] p-5 sm:p-6"><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f9888]">Nearby shops</p><h1 className="mt-1 font-display text-[31px] font-semibold tracking-[-.045em]">Find what’s in stock around you.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#89938b]">Search a product, filter by shop type or distance, and open any result to see the shop’s full available inventory.</p><div className="mt-5 flex flex-col gap-2 sm:flex-row"><div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca49d]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search items, categories, or shop names" className="w-full rounded-xl border border-[#e6e1d6] bg-[#fbf8f1] py-3 pl-10 pr-3 text-sm outline-none focus:border-[#ef8354]" /></div><button onClick={() => setFiltersOpen(!filtersOpen)} className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-bold ${filtersOpen || activeFilterCount > 0 ? "border-[#ef8354] bg-[#fff0e6] text-[#bf6235]" : "border-[#e6e1d6] bg-[#fbf8f1] text-[#67736b]"}`}><SlidersHorizontal className="h-4 w-4" /> Filters {activeFilterCount > 0 && <span className="rounded-full bg-[#ef8354] px-1.5 py-0.5 text-[9px] text-white">{activeFilterCount}</span>}</button></div>{filtersOpen && <div className="mt-3 grid gap-2 rounded-2xl bg-[#f6f2ea] p-3 sm:grid-cols-3"><FilterSelect label="Shop type" value={businessType} onChange={setBusinessType} options={[["all", "All shop types"], ["retail", "Retail shops"], ["wholesale", "Wholesale shops"], ["hybrid", "Retail + wholesale"]]} /><FilterSelect label="Category" value={category} onChange={setCategory} options={[["all", "All categories"], ...categories.map((value) => [value, value])]} /><FilterSelect label="Distance" value={maxDistance} onChange={setMaxDistance} options={[["any", "Any distance"], ["1", "Within 1 km"], ["5", "Within 5 km"], ["10", "Within 10 km"], ["25", "Within 25 km"]]} /><FilterSelect label="Sort results" value={sortMode} onChange={(value) => setSortMode(value as SortMode)} options={[["nearest", "Nearest first"], ["inventory", "Most inventory"], ["name", "Shop name"]]} /><button onClick={() => { setSearch(""); setCategory("all"); setBusinessType("all"); setMaxDistance("any"); setSortMode("nearest"); }} className="mt-auto rounded-xl px-3 py-2 text-left text-[11px] font-bold text-[#9a6b58] hover:bg-white">Clear all filters</button></div>}</div><div className="relative h-[500px]"><MapView className="h-full" initialCenter={position} initialZoom={13} onMapReady={(map) => { mapRef.current = map; setMapReady(true); map.setCenter(position); }} /><div className="absolute left-4 top-4 rounded-xl border border-white/60 bg-white/90 px-3 py-2 text-[10px] font-bold text-[#647169] shadow-lg backdrop-blur">{filteredShops.length} matching shop{filteredShops.length === 1 ? "" : "s"}</div></div></section><aside className="space-y-4"><section className="rounded-[26px] border border-[#e6e2d7] bg-[#fffdf8] p-5 shadow-[0_20px_60px_rgba(30,42,40,.06)] sm:p-6"><div className="flex items-start justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#a1a69f]">Live directory</p><h2 className="mt-1 font-display text-[24px] font-semibold">{search ? `Results for “${search}”` : "Available nearby"}</h2><p className="mt-1 text-xs text-[#929990]">{filteredShops.reduce((total, shop) => total + shop.inventory.length, 0)} available inventory items across {filteredShops.length} shop{filteredShops.length === 1 ? "" : "s"}</p></div><Store className="h-5 w-5 text-[#ef8354]" /></div><div className="mt-4 max-h-[410px] space-y-3 overflow-y-auto pr-1">{directoryQuery.isLoading ? <p className="rounded-2xl bg-[#f6f2ea] p-4 text-xs text-[#929990]">Loading participating shops…</p> : filteredShops.length === 0 ? <div className="rounded-2xl bg-[#f6f2ea] p-4 text-xs leading-5 text-[#929990]">No shops match those filters. Try a broader search or clear the distance/category filter.</div> : filteredShops.map((shop) => <button key={shop.id} onClick={() => { setSelectedShopId(shop.id); mapRef.current?.panTo({ lat: shop.latitude, lng: shop.longitude }); }} className={`w-full rounded-2xl border p-4 text-left transition-colors ${selectedShop?.id === shop.id ? "border-[#ef8354] bg-[#fff0e6]" : "border-[#eee9df] bg-[#faf8f3] hover:border-[#cbded0]"}`}><div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e8f1ea] text-[#5d8b6d]"><MapPin className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-bold">{shop.name}</p><span className="shrink-0 text-[10px] font-bold text-[#7f8c83]">{shop.distance.toFixed(1)} km</span></div><p className="mt-1 text-[10px] capitalize text-[#9aa29b]">{shop.businessType} · {shop.address ?? "Address not provided"}</p><div className="mt-2 space-y-1.5">{shop.visibleInventory.slice(0, 4).map((item) => <div key={item.id} className="flex items-center justify-between gap-2 rounded-lg bg-white px-2.5 py-2"><span className="min-w-0 truncate text-[10px] font-bold text-[#5e6d64]">{item.name}<span className="ml-1 font-normal text-[#9ca49d]">· {item.category}</span></span><span className="shrink-0 text-[10px] font-bold text-[#5d8b6d]">{item.stockOnHand} {item.unit}</span></div>)}{shop.inventory.length > shop.visibleInventory.length && <span className="block pt-1 text-[9px] font-bold text-[#9a6b58]">{shop.inventory.length - shop.visibleInventory.length} more inventory items · open to view all</span>}</div></div></div></button>)}</div></section>{selectedShop && <><section className="rounded-[26px] border border-[#e6e2d7] bg-[#fffdf8] p-5 shadow-[0_20px_60px_rgba(30,42,40,.06)] sm:p-6"><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f9888]">Full inventory</p><h2 className="mt-1 font-display text-[24px] font-semibold">{selectedShop.name}</h2><p className="mt-1 text-xs text-[#929990]">{selectedShop.inventory.length} item{selectedShop.inventory.length === 1 ? "" : "s"} available · {selectedShop.distance.toFixed(1)} km away</p></div><button onClick={() => setSelectedShopId(null)} className="rounded-xl p-2 text-[#9ca49d] hover:bg-[#f6f2ea]" aria-label="Close shop inventory"><X className="h-4 w-4" /></button></div><div className="mt-4 max-h-[280px] space-y-2 overflow-y-auto pr-1">{selectedShop.inventory.map((item) => <div key={item.id} className="rounded-xl border border-[#eee9df] bg-[#faf8f3] p-3"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-xs font-bold">{item.name}</p><p className="mt-0.5 text-[10px] text-[#9ca49d]">{item.category} · per {item.unit}</p></div><span className="rounded-full bg-[#e4f2ea] px-2 py-1 text-[9px] font-bold text-[#3b7961]">{item.stockOnHand} in stock</span></div><div className="mt-2 flex items-center justify-between text-[10px]"><span className="text-[#8d978f]">Current shop price</span><span className="font-bold text-[#1e2a28]">{selectedShop.currencyCode} {(item.salePriceCents / 100).toFixed(2)}</span></div></div>)}</div></section><section className="rounded-[26px] border border-[#e6e2d7] bg-[#1e2a28] p-5 text-white shadow-[0_20px_60px_rgba(30,42,40,.12)] sm:p-6"><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#ffbf9f]">Customer voice</p><h2 className="mt-1 font-display text-[24px] font-semibold">Review {selectedShop.name}</h2><p className="mt-1 text-xs leading-5 text-white/55">Tell the owner how the product and service felt.</p></div></div><div className="mt-5 space-y-3"><input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Your name" className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#ffbf9f]" /><div className="grid gap-3 sm:grid-cols-2"><RatingPicker label="Product" value={productRating} onChange={setProductRating} /><RatingPicker label="Service" value={serviceRating} onChange={setServiceRating} /></div><textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="What should the shop keep doing?" rows={3} className="w-full resize-none rounded-xl border border-white/10 bg-white/10 px-3 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#ffbf9f]" /><button disabled={!customerName.trim() || submitReview.isPending} onClick={() => submitReview.mutate({ shopId: selectedShop.id, customerName, productRating, serviceRating, comment: comment || undefined })} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#ef8354] px-4 py-3 text-xs font-bold text-white hover:bg-[#f39a71] disabled:opacity-50">{submitReview.isPending ? "Sending review…" : "Submit review"}<Send className="h-3.5 w-3.5" /></button></div></section></>}</aside></div></main></div>;
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) {
  return <label className="relative block text-[10px] font-bold uppercase tracking-[.1em] text-[#8b958c]">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full appearance-none rounded-xl border border-[#e6e1d6] bg-white px-3 py-2.5 pr-8 text-xs font-bold normal-case tracking-normal text-[#536159] outline-none"><>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</></select><ChevronDown className="pointer-events-none absolute bottom-2.5 right-2.5 h-3.5 w-3.5 text-[#9ba39c]" /></label>;
}

function RatingPicker({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <div><p className="mb-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-white/50">{label}</p><div className="flex items-center gap-1">{[1, 2, 3, 4, 5].map((score) => <button key={score} type="button" onClick={() => onChange(score)} className="rounded-lg p-1 hover:bg-white/10" aria-label={`${label} rating ${score}`}><Star className={`h-4 w-4 ${score <= value ? "fill-[#ffbf9f] text-[#ffbf9f]" : "text-white/25"}`} /></button>)}</div></div>;
}
