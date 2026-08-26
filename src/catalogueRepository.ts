import { supabase } from "./supabase";
import { parsePublishedCatalogRows, type CatalogSnapshot } from "./catalogueData";

export async function loadPublishedCatalog(): Promise<CatalogSnapshot> {
  const [catalogResponse, offersResponse, merchantsResponse] = await Promise.all([
    supabase
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
      .order("name", { ascending: true }),
    supabase
      .from("card_offers")
      .select("id, offer_key, card_id, issuer, merchant, title, offer_value, eligibility, starts_at, ends_at, source_url, terms_url, source_checked_at, reviewed_at")
      .eq("status", "published")
      .order("ends_at", { ascending: true }),
    supabase
      .from("merchant_directory")
      .select("id, merchant_key, display_name, aliases, category_candidates, channel_candidates, confidence, source_url")
      .eq("status", "published")
      .order("display_name", { ascending: true }),
  ]);

  if (catalogResponse.error) throw catalogResponse.error;
  const snapshot = parsePublishedCatalogRows(
    catalogResponse.data,
    offersResponse.error ? [] : offersResponse.data,
    merchantsResponse.error ? [] : merchantsResponse.data,
  );
  if (snapshot.cards.length < 10) throw new Error("Published catalogue failed its minimum-size safety check");
  return snapshot;
}
