# Salle d'attente de téléconsultation

Mini API REST et application mobile React Native (Expo) : le patient choisit un motif, rejoint une file d'attente, suit sa position, et peut quitter la file.

Les données sont fictives et restent en mémoire. Il n'y a pas de base de données, pas de compte, et aucune information de santé réelle.

## Lancer le projet

Deux terminaux. Node.js 20 ou plus récent.

### API

```bash
cd api
npm install
npm run dev
```

L'API écoute sur `http://localhost:3000`.

Variables d'environnement facultatives :

| Variable | Défaut | Rôle |
| --- | --- | --- |
| `PORT` | `3000` | Port HTTP |
| `AVERAGE_CONSULTATION_MINUTES` | `5` | Durée moyenne utilisée pour l'attente estimée |
| `ADVANCE_INTERVAL_MS` | `20000` | Intervalle auquel le premier ticket en attente passe à `called` |

### Application

```bash
cd app
npm install
npm start
```

Puis ouvrir le projet dans Expo Go, un émulateur, ou le navigateur avec `npm run web`.

L'app appelle `http://localhost:3000`. Sur l'émulateur Android, elle utilise `http://10.0.2.2:3000`. Sur un téléphone physique, Expo reprend l'adresse de la machine qui sert le bundler, toujours sur le port 3000.

Pour forcer une adresse :

```bash
# PowerShell
$env:EXPO_PUBLIC_API_URL="http://192.168.1.10:3000"
npm start
```

### Tests

```bash
cd api
npm test
```

15 tests Vitest, sur la file d'attente et sur les routes HTTP. Ils ne lancent pas le serveur : chaque test construit sa propre file en mémoire.

GitHub Actions lance ces tests à chaque push et à chaque pull request (`.github/workflows/api.yml`).

## Parcours

1. L'écran Motif charge `GET /reasons` et attend un choix.
2. « Rejoindre la file » envoie `POST /tickets` et ouvre la salle d'attente.
3. La position et l'attente estimée sont relues toutes les 12 secondes.
4. Quand le statut passe à `called`, l'écran affiche « C'est votre tour » et le rafraîchissement s'arrête.
5. « Quitter la file » demande une confirmation, puis envoie `DELETE /tickets/:id`.

Au démarrage, trois patients fictifs sont déjà en attente. Un nouveau ticket n'est donc pas appelé immédiatement. Toutes les 20 secondes, le premier ticket `waiting` passe à `called`.

L'attente estimée vaut `position × durée moyenne` (5 minutes par défaut). Un ticket appelé ou annulé a une position et une attente à 0.

## Choix techniques

- **Express 5 + TypeScript** pour l'API. La logique de file est dans `WaitingQueue`, sans timer et sans HTTP, pour pouvoir la tester directement. Les routes traduisent les erreurs métier en 400, 404 et 409.
- **Données en mémoire**, comme demandé. Pas de persistance serveur.
- **Expo + React Native + TypeScript** pour les deux écrans. Pas de bibliothèque de navigation : deux vues suffisent, l'état de l'écran courant est dans `App.tsx`.
- **Polling à 12 secondes**, dans la fenêtre de 10 à 15 secondes demandée. Le timer est annulé quand on quitte l'écran, et il n'est pas reprogrammé quand le ticket est `called` ou `cancelled`.
- **Messages d'erreur côté app**. L'API reste explicite ; l'app reformule le code HTTP en phrase affichable, avec un bouton « Réessayer ». Un chargement initial bloque l'écran ; les rafraîchissements suivants restent discrets.

Bibliothèques qui structurent le projet :

- `express` et `cors` : routes HTTP et appels depuis Expo (autre origine).
- `vitest` et `supertest` : tests de la file et des codes HTTP, sans serveur réel.
- `tsx` : lancer l'API TypeScript en développement sans étape de build.
- `expo` : le sujet le recommande pour aller vite sur React Native.

## Outils d'IA

Claude et Cursor ont servi à :

- comprendre le besoin ;
- structurer le projet et définir l'architecture ;
- générer les tests automatisés de l'API (`api/tests/queue.test.ts` et `api/tests/api.test.ts`) ;
- générer les interfaces de l'application (écrans Motif et Salle d'attente, message d'erreur, présentation) ;
- gérer les erreurs (codes HTTP de l'API, messages affichés dans l'app, bouton « Réessayer ») ;
- rédiger le README.

Le comportement métier de la file, les routes et les codes HTTP ont été relus et sont à expliquer pendant le débrief.

## Ce qui n'est pas fait

Bonus du sujet, non réalisés :

- reprise du ticket après fermeture de l'app (pas de stockage local) ;
- notification locale quand c'est son tour ;
- accessibilité complète (le message d'erreur a un rôle d'alerte ; les boutons et la liste de motifs n'ont pas de libellés dédiés au lecteur d'écran, et les tailles de texte ne suivent pas le réglage système de façon travaillée) ;
- temps réel sans polling (pas de WebSocket ni de Server-Sent Events) ;
- Dockerfile pour l'API.

Limites connues du socle :

- si un rafraîchissement échoue, le polling s'arrête. La dernière position reste affichée, avec le message d'erreur et « Réessayer ». C'est voulu : on ne rappelle pas l'API en boucle tant qu'elle ne répond pas ;
- aucun test automatisé côté application.

## Avec deux heures de plus

1. Retrouver le ticket en cours au redémarrage de l'app (stockage local).
2. Ajouter un Dockerfile pour l'API.
3. Compléter les libellés d'accessibilité sur les deux écrans.

## Temps passé

À compléter avec le temps réellement passé : `3h`.
