# La Centrale — RP nocturne

3 étapes : Supabase (la base de données), coller 2 valeurs dans le code, GitHub.

## Étape 1 — Supabase

1. Va sur https://supabase.com → crée un compte gratuit → **New project**.
2. Une fois créé : dans le menu de gauche, clique **SQL Editor** → **New query**.
   Ouvre le fichier `supabase-setup.sql` (dans ce dossier), copie tout son
   contenu, colle-le dans l'éditeur → clique **Run**.
3. Toujours dans le menu de gauche : **Project Settings → API**. Tu vois deux
   valeurs :
   - **Project URL**
   - **anon public** (une longue clé)

Garde cette page ouverte, tu en as besoin juste après.

## Étape 2 — Coller les 2 valeurs dans le code

Ouvre le fichier `src/supabaseClient.js` dans ce projet. Tout en haut il y a :

```js
const SUPABASE_URL = "https://xxxxxxxxxxxx.supabase.co";
const SUPABASE_ANON_KEY = "colle-ta-clé-anon-ici";
```

Remplace ces deux lignes par tes vraies valeurs copiées à l'étape 1. Sauvegarde.
C'est tout — pas de fichier `.env`, pas de variable d'environnement à configurer.

## Étape 3 — GitHub

Sur ton ordinateur, dans le dossier du projet :

```bash
git init
git add .
git commit -m "La Centrale"
```

Crée un nouveau repo (vide) sur https://github.com/new, puis :

```bash
git remote add origin https://github.com/TON-PSEUDO/NOM-DU-REPO.git
git branch -M main
git push -u origin main
```

## Étape 4 — Mettre le site en ligne

Le plus simple : **GitHub Pages** (déjà tout configuré dans ce projet).

1. Sur GitHub, dans ton repo → **Settings → Pages** → dans "Build and
   deployment", choisis la source **GitHub Actions**.
2. Ouvre `vite.config.js`, remplace `base: "/"` par `base: "/NOM-DU-REPO/"`
   (le nom exact de ton repo GitHub) et fais un nouveau `git commit` + `git push`.
3. Attends 1-2 minutes, va dans l'onglet **Actions** de ton repo pour voir si
   ça a marché (coche verte). Ton site sera visible à :
   `https://TON-PSEUDO.github.io/NOM-DU-REPO/`

C'est cette adresse que tu envoies à tes joueurs.

## Tester avant de push (optionnel)

Si tu as Node.js installé sur ton ordinateur :

```bash
npm install
npm run dev
```

Ouvre l'adresse affichée. Teste dans deux onglets/navigateurs différents —
ils doivent voir les mêmes messages, personnages, etc.

## Codes d'accès par défaut (à changer dans `src/App.jsx` si tu veux)

- Admin : `salon2026`
- Rédaction JT : `redaction2026`
- Dark Chat / Marché noir : `nocturne2026`

## À savoir

- La clé Supabase "anon" n'est pas un secret — elle est faite pour être
  visible dans le code envoyé au navigateur. C'est pour ça qu'on peut juste
  la coller directement dans `supabaseClient.js`, pas besoin de la cacher.
- La table Supabase est ouverte en lecture/écriture à tout le monde (voir
  `supabase-setup.sql`) — il n'y a pas de vrais comptes utilisateurs, comme
  dans la version d'origine. Ne mets rien de sensible dedans.
- Argent virtuel, marché, carte bancaire : tout est fictif, aucun vrai
  paiement n'est effectué nulle part.
