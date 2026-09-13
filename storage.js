import { supabase } from "./supabaseClient";

/*
 * Ce module reproduit l'API `window.storage` utilisée par l'app
 * (get / set / delete / list, avec un flag "shared").
 *
 * - shared = true  -> stocké dans Supabase (table "app_storage"),
 *                      visible par TOUS les visiteurs du site (multijoueur).
 * - shared = false -> stocké dans le localStorage du navigateur,
 *                      propre à chaque appareil (pseudo, âge vérifié, etc.)
 *
 * Voir README.md pour le SQL à exécuter dans Supabase avant de lancer l'app.
 */

const LOCAL_PREFIX = "lacentrale:";
const TABLE = "app_storage";

function localKey(key) {
  return LOCAL_PREFIX + key;
}

async function get(key, shared = false) {
  if (shared) {
    const { data, error } = await supabase
      .from(TABLE)
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { key, value: data.value, shared: true };
  }
  const value = window.localStorage.getItem(localKey(key));
  if (value === null) return null;
  return { key, value, shared: false };
}

async function set(key, value, shared = false) {
  if (shared) {
    const { error } = await supabase
      .from(TABLE)
      .upsert({ key, value, updated_at: new Date().toISOString() });
    if (error) throw error;
    return { key, value, shared: true };
  }
  window.localStorage.setItem(localKey(key), value);
  return { key, value, shared: false };
}

async function del(key, shared = false) {
  if (shared) {
    const { error } = await supabase.from(TABLE).delete().eq("key", key);
    if (error) throw error;
    return { key, deleted: true, shared: true };
  }
  window.localStorage.removeItem(localKey(key));
  return { key, deleted: true, shared: false };
}

async function list(prefix = "", shared = false) {
  if (shared) {
    const { data, error } = await supabase
      .from(TABLE)
      .select("key")
      .ilike("key", `${prefix}%`);
    if (error) throw error;
    return { keys: (data || []).map((r) => r.key), prefix, shared: true };
  }
  const keys = Object.keys(window.localStorage)
    .filter((k) => k.startsWith(LOCAL_PREFIX + prefix))
    .map((k) => k.slice(LOCAL_PREFIX.length));
  return { keys, prefix, shared: false };
}

export const storage = { get, set, delete: del, list };
