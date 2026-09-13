-- À exécuter dans Supabase : Dashboard > SQL Editor > New query > Run

create table if not exists app_storage (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

-- Active la sécurité au niveau des lignes (obligatoire sur Supabase)
alter table app_storage enable row level security;

-- ⚠️ Politique ouverte : tout visiteur du site (via la clé "anon") peut
-- lire et écrire dans cette table. C'est nécessaire ici car l'app n'a pas
-- de vrai système de comptes/authentification (comme le pseudo RP actuel).
-- Convient pour un salon RP entre joueurs de confiance ; à ne pas utiliser
-- pour des données sensibles.
create policy "Public read" on app_storage for select using (true);
create policy "Public write" on app_storage for insert with check (true);
create policy "Public update" on app_storage for update using (true);
create policy "Public delete" on app_storage for delete using (true);
