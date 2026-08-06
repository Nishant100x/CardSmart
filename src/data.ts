import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { CATALOG } from "./cardCatalog";
import { isSupabaseConfigured, supabase } from "./supabase";
import type { PaymentChannel, PurchaseCategory } from "./recommendationEngine";

export type Activity = {
  id: string;
  merchant: string;
  amount: number;
  cardId: string;
  reward: number;
  extra: number;
  date: string;
  category: Exclude<PurchaseCategory, "auto">;
  channel: Exclude<PaymentChannel, "auto">;
};

export type Profile = {
  name: string;
  email: string;
  saveChecks: boolean;
  ruleAlerts: boolean;
};

export type AuthMode = "signup" | "login";

export const DEFAULT_PROFILE: Profile = {
  name: "Your account",
  email: "",
  saveChecks: true,
  ruleAlerts: false,
};

type InteractionRow = {
  id: string;
  query: string | null;
  amount: number | string | null;
  best_card_id: string | null;
  estimated_reward: number | string | null;
  incremental_reward: number | string | null;
  created_at: string;
  full_response: unknown;
};

const GUEST_KEY = "cardsmart-v106-guest";
const AUTH_INTENT_KEY = "cardsmart-v106-auth-intent";
const WALLET_COLUMNS = "card_id";
const INTERACTION_COLUMNS = "id, query, amount, best_card_id, estimated_reward, incremental_reward, created_at, full_response";

function uniqueKnownCardIds(ids: string[]) {
  const known = new Set(CATALOG.map((card) => card.id));
  return [...new Set(ids.filter((id) => known.has(id)))];
}

function activityFromRow(row: InteractionRow): Activity {
  const response = row.full_response && typeof row.full_response === "object"
    ? row.full_response as Record<string, unknown>
    : {};
  const category = typeof response.category === "string" ? response.category : "other";
  const channel = typeof response.payment_channel === "string" ? response.payment_channel : "online";
  return {
    id: row.id,
    merchant: row.query || "Previous payment",
    amount: Number(row.amount) || 0,
    cardId: row.best_card_id || "",
    reward: Number(row.estimated_reward) || 0,
    extra: Number(row.incremental_reward) || 0,
    date: row.created_at,
    category: category as Activity["category"],
    channel: channel as Activity["channel"],
  };
}

export function useCardSmartData() {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [wallet, setWalletState] = useState<string[]>([]);
  const walletRef = useRef<string[]>([]);
  const [profile, setProfileState] = useState<Profile>(DEFAULT_PROFILE);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const applyWallet = useCallback((ids: string[]) => {
    const next = uniqueKnownCardIds(ids);
    walletRef.current = next;
    setWalletState(next);
    return next;
  }, []);

  const loadWallet = useCallback(async (userId: string) => {
    const { data, error: loadError } = await supabase
      .from("cards")
      .select(WALLET_COLUMNS)
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (loadError) throw loadError;
    return applyWallet((data ?? []).map((row) => row.card_id));
  }, [applyWallet]);

  const persistWallet = useCallback(async (userId: string, requestedIds: string[]) => {
    const nextIds = uniqueKnownCardIds(requestedIds);
    const { data, error: loadError } = await supabase
      .from("cards")
      .select("card_id")
      .eq("user_id", userId);
    if (loadError) throw loadError;
    const existingIds = uniqueKnownCardIds((data ?? []).map((row) => row.card_id));
    const addIds = nextIds.filter((id) => !existingIds.includes(id));
    const removeIds = existingIds.filter((id) => !nextIds.includes(id));
    if (addIds.length) {
      const rows = addIds.map((id) => {
        const card = CATALOG.find((item) => item.id === id)!;
        return {
          user_id: userId,
          card_id: id,
          bank: card.bank,
          name: card.name,
          rate: `${card.baseRate}% base reward`,
          benefits: card.bestFor,
          details: card,
          is_preset: true,
          icon: "💳",
        };
      });
      const { error: insertError } = await supabase.from("cards").insert(rows);
      if (insertError) throw insertError;
    }
    if (removeIds.length) {
      const { error: deleteError } = await supabase
        .from("cards")
        .delete()
        .eq("user_id", userId)
        .in("card_id", removeIds);
      if (deleteError) throw deleteError;
    }
    applyWallet(nextIds);
    window.localStorage.removeItem(GUEST_KEY);
    return nextIds;
  }, [applyWallet]);

  const loadProfile = useCallback(async (user: User) => {
    const fallback: Profile = {
      ...DEFAULT_PROFILE,
      name: typeof user.user_metadata?.name === "string" ? user.user_metadata.name : "Your account",
      email: user.email || "",
    };
    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("name, user_preferences")
      .eq("id", user.id)
      .maybeSingle();
    if (profileError) {
      const { data: legacy } = await supabase.from("profiles").select("name").eq("id", user.id).maybeSingle();
      setProfileState({ ...fallback, name: legacy?.name || fallback.name });
      return;
    }
    const preferences = data?.user_preferences && typeof data.user_preferences === "object"
      ? data.user_preferences as Record<string, unknown>
      : {};
    setProfileState({
      ...fallback,
      name: data?.name || fallback.name,
      saveChecks: preferences.saveChecks !== false,
      ruleAlerts: preferences.ruleAlerts === true,
    });
  }, []);

  const loadActivity = useCallback(async (userId: string) => {
    const { data, error: activityError } = await supabase
      .from("interactions")
      .select(INTERACTION_COLUMNS)
      .eq("user_id", userId)
      .eq("status", "tracked")
      .order("created_at", { ascending: false })
      .limit(100);
    if (activityError) throw activityError;
    setActivity(((data ?? []) as InteractionRow[]).map(activityFromRow));
  }, []);

  const loadSignedInData = useCallback(async (user: User, mergeGuest: boolean) => {
    setBusy(true);
    setError("");
    try {
      if (mergeGuest && walletRef.current.length) {
        const { data, error: walletError } = await supabase.from("cards").select("card_id").eq("user_id", user.id);
        if (walletError) throw walletError;
        const merged = uniqueKnownCardIds([...(data ?? []).map((row) => row.card_id), ...walletRef.current]);
        await persistWallet(user.id, merged);
      } else {
        await loadWallet(user.id);
      }
      await Promise.all([loadProfile(user), loadActivity(user.id)]);
    } catch {
      setError("We couldn’t load your saved CardSmart data. Please refresh and try again.");
    } finally {
      setBusy(false);
    }
  }, [loadActivity, loadProfile, loadWallet, persistWallet]);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(GUEST_KEY) || "null") as { wallet?: string[] } | null;
      if (saved?.wallet) applyWallet(saved.wallet);
    } catch {
      window.localStorage.removeItem(GUEST_KEY);
    }
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const user = data.session?.user ?? null;
      setAuthUser(user);
      if (user) {
        const mergeGuest = window.localStorage.getItem(AUTH_INTENT_KEY) === "save-wallet";
        window.localStorage.removeItem(AUTH_INTENT_KEY);
        void loadSignedInData(user, mergeGuest).finally(() => setReady(true));
      } else {
        setReady(true);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted || event === "INITIAL_SESSION") return;
      const user = session?.user ?? null;
      setAuthUser(user);
      if (user && event === "SIGNED_IN") {
        const mergeGuest = window.localStorage.getItem(AUTH_INTENT_KEY) === "save-wallet";
        window.localStorage.removeItem(AUTH_INTENT_KEY);
        window.setTimeout(() => void loadSignedInData(user, mergeGuest), 0);
      }
      if (event === "SIGNED_OUT") {
        applyWallet([]);
        setProfileState(DEFAULT_PROFILE);
        setActivity([]);
      }
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [applyWallet, loadSignedInData]);

  const updateWallet = useCallback((ids: string[]) => {
    const next = applyWallet(ids);
    setError("");
    if (!authUser) {
      window.localStorage.setItem(GUEST_KEY, JSON.stringify({ wallet: next }));
      return;
    }
    setBusy(true);
    void persistWallet(authUser.id, next)
      .then(() => setNotice("Wallet saved."))
      .catch(() => setError("Your wallet couldn’t be saved. Please try again."))
      .finally(() => setBusy(false));
  }, [applyWallet, authUser, persistWallet]);

  const authenticate = useCallback(async (
    mode: AuthMode,
    values: { name: string; email: string; password: string },
    saveWalletAfterAuth: boolean,
  ) => {
    setError("");
    setNotice("");
    if (!isSupabaseConfigured) {
      setError("Account service is not configured. Add the Supabase environment variables in Netlify.");
      return false;
    }
    if (saveWalletAfterAuth) window.localStorage.setItem(AUTH_INTENT_KEY, "save-wallet");
    else window.localStorage.removeItem(AUTH_INTENT_KEY);
    setBusy(true);
    if (mode === "signup") {
      const { data, error: authError } = await supabase.auth.signUp({
        email: values.email.trim().toLowerCase(),
        password: values.password,
        options: {
          data: { name: values.name.trim() || "Your account" },
          emailRedirectTo: `${window.location.origin}${window.location.pathname}`,
        },
      });
      setBusy(false);
      if (authError) {
        setError(authError.message);
        return false;
      }
      if (!data.session) {
        setNotice("Check your email to activate the account. Your selected cards are saved on this device until you return.");
        return false;
      }
      return true;
    }
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: values.email.trim().toLowerCase(),
      password: values.password,
    });
    setBusy(false);
    if (authError) {
      setError(authError.message);
      return false;
    }
    return true;
  }, []);

  const updateProfile = useCallback((next: Profile) => {
    setProfileState(next);
    if (!authUser) return;
    void supabase.from("profiles").upsert({
      id: authUser.id,
      name: next.name,
      user_preferences: { saveChecks: next.saveChecks, ruleAlerts: next.ruleAlerts },
    }, { onConflict: "id" });
  }, [authUser]);

  const confirmPayment = useCallback(async (item: Activity) => {
    if (!authUser) {
      setError("Log in before saving a confirmed payment.");
      return false;
    }
    if (!profile.saveChecks) {
      setNotice("This payment was not saved because saving confirmed checks is switched off.");
      return true;
    }
    setBusy(true);
    setError("");
    const card = CATALOG.find((candidate) => candidate.id === item.cardId);
    const { data, error: saveError } = await supabase.from("interactions").insert({
      id: item.id,
      user_id: authUser.id,
      query: item.merchant,
      category: item.category,
      amount: item.amount,
      best_card: card ? `${card.bank} ${card.name}` : item.cardId,
      best_card_id: item.cardId,
      benefit: `₹${item.reward} estimated reward`,
      estimated_saving: `₹${item.extra} estimated extra reward`,
      estimated_reward: item.reward,
      incremental_reward: item.extra,
      reason: "Highest estimated eligible reward among the cards in the saved wallet.",
      full_response: {
        merchant: item.merchant,
        amount: item.amount,
        category: item.category,
        payment_channel: item.channel,
        recommended_card: item.cardId,
        estimated_reward: item.reward,
        incremental_reward: item.extra,
      },
      status: "tracked",
      tracked_at: item.date,
    }).select(INTERACTION_COLUMNS).single();
    setBusy(false);
    if (saveError || !data) {
      setError("This payment could not be saved. Please try again.");
      return false;
    }
    const saved = activityFromRow(data as InteractionRow);
    setActivity((current) => [saved, ...current.filter((existing) => existing.id !== saved.id)]);
    setNotice("Confirmed payment saved.");
    return true;
  }, [authUser, profile.saveChecks]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    window.localStorage.removeItem(AUTH_INTENT_KEY);
    setNotice("You’re logged out.");
  }, []);

  const deleteAccount = useCallback(async () => {
    if (!authUser) return false;
    setBusy(true);
    setError("");
    const { error: deleteError } = await supabase.rpc("delete_cardsmart_account");
    if (deleteError) {
      setBusy(false);
      setError("Account deletion could not be completed. Please try again.");
      return false;
    }
    await supabase.auth.signOut();
    window.localStorage.removeItem(GUEST_KEY);
    window.localStorage.removeItem(AUTH_INTENT_KEY);
    applyWallet([]);
    setProfileState(DEFAULT_PROFILE);
    setActivity([]);
    setBusy(false);
    return true;
  }, [applyWallet, authUser]);

  return {
    authUser,
    ready,
    wallet,
    profile,
    activity,
    busy,
    error,
    notice,
    updateWallet,
    updateProfile,
    authenticate,
    confirmPayment,
    logout,
    deleteAccount,
    clearMessages: () => { setError(""); setNotice(""); },
  };
}
