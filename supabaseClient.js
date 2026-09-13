import { createClient } from "@supabase/supabase-js";

/*
 * Colle ici les deux valeurs de ton projet Supabase
 * (Project Settings > API dans ton tableau de bord Supabase) :
 *
 *   SUPABASE_URL      -> "Project URL"
 *   SUPABASE_ANON_KEY -> "anon public" key
 *
 * Ces deux valeurs sont faites pour être visibles côté navigateur
 * (ce n'est pas un mot de passe secret) — la sécurité est gérée par
 * les règles "policies" qu'on met dans la base de données, pas ici.
 * Pas besoin de fichier .env, tu peux juste écrire les valeurs directement.
 */
const SUPABASE_URL = "https://xxxxxxxxxxxx.supabase.co";
const SUPABASE_ANON_KEY = "colle-ta-clé-anon-ici";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
