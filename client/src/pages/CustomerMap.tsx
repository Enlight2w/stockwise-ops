import { trpc } from "@/lib/trpc";
import { MapView } from "@/components/Map";
import { Link } from "wouter";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, LocateFixed, MapPin, Package, Send, Star, Store, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

function distanceKm(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const radius = 6371;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((from.lat * Math.PI) / 180) * Math.cos((to.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function CustomerMap() {
  const [position, setPosition] = useState({ lat: 40.7128, lng: -74.006 });
  const [locationReady, setLocationReady] = useState(false);
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null);
  const [mapReady, setMapReady] = useState(false);
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
      setCustomerName("");
      setComment("");
      setProductRating(5);
      setServiceRating(5);
    },
    onError: (error) => toast.error("Review could not be submitted", { description: error.message }),
  });
  const shops = useMemo(() => (directoryQuery.data ?? []).map((shop) => ({ ...shop, distance: distanceKm(position, { lat: shop.latitude, lng: shop.longitude }) })).sort((a, b) => a.distance - b.distance), [directoryQuery.data, position]);
  const selectedShop = shops.find((shop) => shop.id === selectedShopId) ?? shops[0];

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (location) => {
        setPosition({ lat: location.coords.latitude, lng: location.coords.longitude });
        setLocationReady(true);
      },
      () => setLocationReady(false),
      { enableHighAccuracy: false, timeout: 5000 },
    );
  }, []);

  useEffect(() => {
    if (mapRef.current) mapRef.current.setCenter(position);
  }, [position]);

  useEffect(() => {
    if (!mapRef.current || !directoryQuery.data || !window.google?.maps?.marker) return;
    markerRefs.current.forEach((marker) => { marker.map = null; });
    markerRefs.current = directoryQuery.data.map((shop) => {
      const marker = new google.maps.marker.AdvancedMarkerElement({ map: mapRef.current!, position: { lat: shop.latitude, lng: shop.longitude }, title: shop.name });
      marker.addListener("click", () => setSelectedShopId(shop.id));
      return marker;
    });
  }, [directoryQuery.data, mapReady]);

  return <div className="min-h-screen bg-[#fbf8f1] text-[#1e2a28]"><header className="sticky top-0 z-20 border-b border-[#ebe6db] bg-[#fbf8f1]/90 px-4 py-4 backdrop-blur-xl sm:px-8"><div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3"><Link href="/"><span className="inline-flex items-center gap-2 text-sm font-bold text-[#52625a] hover:text-[#ef8354]"><ArrowLeft className="h-4 w-4" /> Back to Stockwise</span></Link><div className="flex items-center gap-2 text-xs font-bold text-[#718077]"><LocateFixed className="h-4 w-4 text-[#6f9888]" />{locationReady ? "Using your location" : "Showing shops near the map center"}</div></div></header><main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-8"><div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]"><section className="overflow-hidden rounded-[26px] border border-[#e6e2d7] bg-white shadow-[0_20px_60px_rgba(30,42,40,.08)]"><div className="border-b border-[#eee9df] p-5 sm:p-6"><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f9888]">Nearby shops</p><h1 className="mt-1 font-display text-[31px] font-semibold tracking-[-.045em]">Find what’s in stock around you.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#89938b]">Explore participating retailers and wholesalers, see available items, then share a review after your visit.</p></div><div className="relative h-[520px]"><MapView className="h-full" initialCenter={position} initialZoom={13} onMapReady={(map) => { mapRef.current = map; setMapReady(true); map.setCenter(position); }} /><div className="absolute left-4 top-4 rounded-xl border border-white/60 bg-white/90 px-3 py-2 text-[10px] font-bold text-[#647169] shadow-lg backdrop-blur">{shops.length} participating shops</div></div></section><aside className="space-y-4"><section className="rounded-[26px] border border-[#e6e2d7] bg-[#fffdf8] p-5 shadow-[0_20px_60px_rgba(30,42,40,.06)] sm:p-6"><div className="flex items-start justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#a1a69f]">Live directory</p><h2 className="mt-1 font-display text-[24px] font-semibold">Available nearby</h2></div><Store className="h-5 w-5 text-[#ef8354]" /></div><div className="mt-4 max-h-[380px] space-y-3 overflow-y-auto pr-1">{directoryQuery.isLoading ? <p className="rounded-2xl bg-[#f6f2ea] p-4 text-xs text-[#929990]">Loading participating shops…</p> : shops.length === 0 ? <div className="rounded-2xl bg-[#f6f2ea] p-4 text-xs leading-5 text-[#929990]">No shops are broadcasting their location yet. Owners can turn on Store beacon from their dashboard.</div> : shops.map((shop) => <button key={shop.id} onClick={() => { setSelectedShopId(shop.id); mapRef.current?.panTo({ lat: shop.latitude, lng: shop.longitude }); }} className={`w-full rounded-2xl border p-4 text-left transition-colors ${selectedShop?.id === shop.id ? "border-[#ef8354] bg-[#fff0e6]" : "border-[#eee9df] bg-[#faf8f3] hover:border-[#cbded0]"}`}><div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e8f1ea] text-[#5d8b6d]"><MapPin className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-bold">{shop.name}</p><span className="shrink-0 text-[10px] font-bold text-[#7f8c83]">{shop.distance.toFixed(1)} km</span></div><p className="mt-1 text-[10px] capitalize text-[#9aa29b]">{shop.businessType} · {shop.inventory.length} items available</p><div className="mt-2 flex flex-wrap gap-1.5">{shop.inventory.slice(0, 3).map((item) => <span key={item.id} className="rounded-full bg-white px-2 py-1 text-[9px] font-bold text-[#6f7d73]">{item.name} · {item.stockOnHand} {item.unit}</span>)}{shop.inventory.length > 3 && <span className="rounded-full bg-white px-2 py-1 text-[9px] font-bold text-[#9aa29b]">+{shop.inventory.length - 3} more</span>}</div></div></div></button>)}</div></section>{selectedShop && <section className="rounded-[26px] border border-[#e6e2d7] bg-[#1e2a28] p-5 text-white shadow-[0_20px_60px_rgba(30,42,40,.12)] sm:p-6"><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#ffbf9f]">Customer voice</p><h2 className="mt-1 font-display text-[24px] font-semibold">Review {selectedShop.name}</h2><p className="mt-1 text-xs leading-5 text-white/55">Tell the owner how the product and service felt.</p></div><button onClick={() => setSelectedShopId(null)} className="rounded-xl p-2 text-white/50 hover:bg-white/10" aria-label="Close review form"><X className="h-4 w-4" /></button></div><div className="mt-5 space-y-3"><input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Your name" className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#ffbf9f]" /><div className="grid gap-3 sm:grid-cols-2"><RatingPicker label="Product" value={productRating} onChange={setProductRating} /><RatingPicker label="Service" value={serviceRating} onChange={setServiceRating} /></div><textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="What should the shop keep doing?" rows={3} className="w-full resize-none rounded-xl border border-white/10 bg-white/10 px-3 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#ffbf9f]" /><button disabled={!customerName.trim() || submitReview.isPending} onClick={() => submitReview.mutate({ shopId: selectedShop.id, customerName, productRating, serviceRating, comment: comment || undefined })} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#ef8354] px-4 py-3 text-xs font-bold text-white hover:bg-[#f39a71] disabled:opacity-50">{submitReview.isPending ? "Sending review…" : "Submit review"}<Send className="h-3.5 w-3.5" /></button></div></section>}</aside></div></main></div>;
}

function RatingPicker({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <div><p className="mb-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-white/50">{label}</p><div className="flex items-center gap-1">{[1, 2, 3, 4, 5].map((score) => <button key={score} type="button" onClick={() => onChange(score)} className="rounded-lg p-1 hover:bg-white/10" aria-label={`${label} rating ${score}`}><Star className={`h-4 w-4 ${score <= value ? "fill-[#ffbf9f] text-[#ffbf9f]" : "text-white/25"}`} /></button>)}</div></div>;
}
