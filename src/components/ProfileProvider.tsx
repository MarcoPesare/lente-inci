"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { emptyProfile, type Flag, type Profile } from "@/lib/inci/engine";

interface Ctx {
  profile: Profile;
  ready: boolean;
  toggleFav: (id: string) => boolean;
  pushHistory: (id: string) => void;
  toggleAvoidFlag: (f: Flag) => void;
  toggleAvoidIngr: (name: string) => void;
  compare: string[];
  toggleCompare: (id: string) => string | null;
  clearCompare: () => void;
}
const ProfileCtx = createContext<Ctx | null>(null);
const LS = "lente-inci-profile";

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [ready, setReady] = useState(false);
  const [compare, setCompare] = useState<string[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loaded = useRef(false);

  useEffect(() => {
    try { const v = JSON.parse(localStorage.getItem(LS) || "null"); if (v) setProfile({ ...emptyProfile(), ...v }); } catch {}
    fetch("/api/profile").then((r) => (r.ok ? r.json() : null)).then((v) => { if (v) setProfile({ ...emptyProfile(), ...v }); })
      .catch(() => {}).finally(() => { loaded.current = true; setReady(true); });
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try { localStorage.setItem(LS, JSON.stringify(profile)); } catch {}
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) }).catch(() => {});
    }, 600);
  }, [profile]);

  const toggleFav = useCallback((id: string) => {
    let added = false;
    setProfile((p) => { const has = p.favorites.includes(id); added = !has; return { ...p, favorites: has ? p.favorites.filter((x) => x !== id) : [id, ...p.favorites] }; });
    return added;
  }, []);
  const pushHistory = useCallback((id: string) => setProfile((p) => (p.history[0] === id ? p : { ...p, history: [id, ...p.history.filter((x) => x !== id)].slice(0, 30) })), []);
  const toggleAvoidFlag = useCallback((f: Flag) => setProfile((p) => ({ ...p, avoidFlags: p.avoidFlags.includes(f) ? p.avoidFlags.filter((x) => x !== f) : [...p.avoidFlags, f] })), []);
  const toggleAvoidIngr = useCallback((n: string) => setProfile((p) => ({ ...p, avoidIngr: p.avoidIngr.includes(n) ? p.avoidIngr.filter((x) => x !== n) : [...p.avoidIngr, n] })), []);
  const toggleCompare = useCallback((id: string) => {
    let msg: string | null = null;
    setCompare((c) => { if (c.includes(id)) return c.filter((x) => x !== id); if (c.length >= 3) { msg = "Puoi confrontare al massimo 3 prodotti."; return c; } return [...c, id]; });
    return msg;
  }, []);
  const clearCompare = useCallback(() => setCompare([]), []);

  return <ProfileCtx.Provider value={{ profile, ready, toggleFav, pushHistory, toggleAvoidFlag, toggleAvoidIngr, compare, toggleCompare, clearCompare }}>{children}</ProfileCtx.Provider>;
}

export function useProfile() {
  const c = useContext(ProfileCtx);
  if (!c) throw new Error("useProfile fuori da ProfileProvider");
  return c;
}
export const hasProfile = (p: Profile) => p.avoidFlags.length > 0 || p.avoidIngr.length > 0;
