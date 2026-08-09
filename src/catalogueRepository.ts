import { supabase } from "./supabase";
import { parsePublishedCatalogRows, type CatalogSnapshot } from "./catalogueData";

export async function loadPublishedCatalog(): Promise<CatalogSnapshot> {
  const { data, error } = await supabase
    .from("card_catalog")
    .select(`
      id,
      issuer,
      name,
      network,
      card_versions!inner(
        version_no,
        reward_model,
        fees,
        eligibility,
        benefits,
        terms_and_conditions,
        effective_from
      )
    `)
    .eq("status", "active")
    .eq("card_versions.status", "published")
    .order("issuer", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;
  const snapshot = parsePublishedCatalogRows(data);
  if (snapshot.cards.length < 10) throw new Error("Published catalogue failed its minimum-size safety check");
  return snapshot;
}
