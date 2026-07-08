# Deployment

## Vercel Environment Variables

Set these in Vercel Project Settings before using Firebase-backed portfolio editing:

```txt
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

When all Firebase variables are present, the portfolio editor uses:

- Google sign-in through Firebase Auth
- Firestore collections `portfolioProjects` and `homepagePortfolioItems`
- Firebase Storage path `portfolio/homepage/*`

When any Firebase variable is missing, the app keeps running with the local/mock portfolio adapter and shows a warning inside editor screens only.

## Firebase Console Setup

1. Enable Google as a Firebase Auth provider.
2. Add the Vercel production domain and local dev domains to Firebase Auth authorized domains.
3. Create Firestore in production mode.
4. Enable Firebase Storage.
5. Apply rules from `FIREBASE_RULES.md`, replacing `OWNER_UID`.
