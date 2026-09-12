# Portail RP V2 — déploiement public

## Ce que fait cette version
- Interface publique interactive
- Profil RP local
- Carte d'identité RP et permis RP fictifs
- Demandes de vérification avec code temporaire
- JT/News stocké dans SQLite
- Espace administrateur protégé par connexion
- Deux comptes administrateurs configurables par variables d'environnement (toi + collaborateur)
- Gestion des news et validation/refus des demandes
- Dark Chat : interface frontend de démonstration

## Important
Cette V2 est un **socle de site**. Pour un vrai Dark Chat multi-utilisateur, il faut ajouter une base de messages temps réel (WebSocket) et le contrôle d'accès côté serveur. Pour envoyer réellement un code en MP Discord, il faut connecter un bot Discord officiel avec son propre token stocké côté serveur. Ne demande jamais aux membres leur mot de passe Discord, token ou code de connexion.

Les cartes et permis sont volontairement marqués comme documents fictifs et ne doivent pas imiter des documents officiels réels.

## Lancer en local
1. Installer Node.js 20+.
2. Copier `.env.example` vers `.env` et renseigner les valeurs.
3. `npm install`
4. `npm start`
5. Ouvrir `http://localhost:3000`

## Rendre le site public
Déployer ce dossier sur un hébergeur Node.js qui permet une application Express et un stockage persistant pour SQLite. Ajouter les variables d'environnement du fichier `.env.example` dans le panneau de l'hébergeur.

### Sécurité admin
- Utiliser un mot de passe long et unique.
- Changer `JWT_SECRET` en une chaîne aléatoire longue.
- Activer `COOKIE_SECURE=true` uniquement après mise en place de HTTPS si tu passes à une authentification par cookie.
- Ne mets jamais les secrets Discord dans le frontend.

## Comptes admin
`ADMIN_OWNER_USER` + `ADMIN_OWNER_PASSWORD` = compte principal.
`ADMIN_COLLAB_USER` + `ADMIN_COLLAB_PASSWORD` = compte collaborateur.

Aucun nom réel n'est intégré dans le projet : tu peux choisir les noms/pseudos plus tard.
