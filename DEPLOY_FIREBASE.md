Deployment steps — Firestore rules and env setup

1) Install firebase-tools (global or dev dependency)

- To install globally:

```bash
npm install -g firebase-tools
```

- Or install as dev dependency (project-local):

```bash
npm install --save-dev firebase-tools
```

2) Create a Firebase project and enable Firestore.

3) Copy `.env.local.example` to `.env.local` and fill the values from your Firebase project settings.

```bash
cp .env.local.example .env.local
# then edit .env.local to add your keys
```

4) Login and select project (one-time):

```bash
npx firebase login
npx firebase use --add
```

Choose the project id when prompted.

5) Deploy Firestore rules only (safe for rules testing):

```bash
npx firebase deploy --only firestore:rules
```

Or using the npm script:

```bash
npm run firebase:deploy:rules
```

6) Test from your running app (make sure `.env.local` is present), then run the app locally:

```bash
npm install
npm start
```

Notes:
- The included `firebase.rules` file is a starter template. Review and tighten rules before exposing the app to the public.
- For CI or automated deploys, prefer using a CI service with `firebase-tools` and a service account / CI token, not an interactive `firebase login`.
