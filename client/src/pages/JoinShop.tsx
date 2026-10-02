import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CheckCircle2, Leaf, LogIn, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function JoinShop() {
  const { user, isAuthenticated } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const token = useMemo(() => new URLSearchParams(window.location.search).get("token") ?? "", []);
  const acceptInvite = trpc.operations.acceptStaffInvite.useMutation({
    onSuccess: (result) => {
      setAccepted(true);
      toast.success("You joined the shop team", { description: `Your access level is ${result?.permissionRole ?? "assigned by the owner"}.` });
    },
    onError: (error) => toast.error("Invitation could not be accepted", { description: error.message }),
  });

  useEffect(() => {
    if (isAuthenticated && token && !accepted && !acceptInvite.isPending) acceptInvite.mutate({ inviteToken: token });
  }, [isAuthenticated, token, accepted]);

  return <div className="flex min-h-screen items-center justify-center bg-[#fbf8f1] px-4 py-8 text-[#1e2a28]"><div className="w-full max-w-lg rounded-[28px] border border-[#e6e2d7] bg-[#fffdf8] p-7 shadow-[0_20px_60px_rgba(30,42,40,.08)] sm:p-9"><div className="flex items-center gap-2.5"><div className="flex h-9 w-9 items-center justify-center rounded-[13px] bg-[#1e2a28] text-[#ffd8c5]"><Leaf className="h-5 w-5" /></div><div><p className="font-display text-[19px] font-semibold tracking-[-.04em]">stockwise</p><p className="-mt-1 text-[9px] font-bold uppercase tracking-[.2em] text-[#a0a59d]">ops studio</p></div></div>{accepted ? <div className="mt-10 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f1ea] text-[#5d8b6d]"><CheckCircle2 className="h-7 w-7" /></div><h1 className="mt-5 font-display text-[30px] font-semibold tracking-[-.04em]">You’re on the team.</h1><p className="mt-2 text-sm leading-6 text-[#89938b]">Your employee account is ready. Open the dashboard to see the permissions assigned by the shop owner.</p><Link href="/"><span className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1e2a28] px-4 py-3 text-xs font-bold text-white">Open dashboard <ArrowLeft className="h-3.5 w-3.5 rotate-180" /></span></Link></div> : <><div className="mt-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff0e6] text-[#ef8354]"><ShieldCheck className="h-6 w-6" /></div><h1 className="mt-5 font-display text-[30px] font-semibold tracking-[-.04em]">Join your shop team.</h1><p className="mt-2 text-sm leading-6 text-[#89938b]">Accept this invitation with the same email address the owner used. Stockwise will apply the assigned role permissions to your account.</p>{!token ? <div className="mt-6 rounded-2xl bg-[#fce9e6] p-4 text-xs text-[#b75a51]">This invitation link is missing its token. Ask the owner to send a fresh invite.</div> : !isAuthenticated ? <button onClick={() => startLogin()} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1e2a28] px-4 py-3 text-xs font-bold text-white"><LogIn className="h-4 w-4" /> Sign in to accept invitation</button> : <div className="mt-6 rounded-2xl bg-[#e8f1ea] p-4 text-xs leading-5 text-[#5d7565]">Signed in as <strong>{user?.email ?? user?.name}</strong>. Checking your invitation…</div>}<Link href="/"><span className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-[#758079] hover:text-[#ef8354]"><ArrowLeft className="h-3.5 w-3.5" /> Back to Stockwise</span></Link></>}</div></div>;
}
