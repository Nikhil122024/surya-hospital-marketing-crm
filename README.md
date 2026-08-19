# Surya Hospital Marketing CRM

A healthcare marketing CRM prototype built with Next.js 15, React 19, TypeScript, Tailwind CSS, React Hook Form, Zod, Recharts, and Firebase.

## Current working features

- Firebase email/password login and password reset
- Auth session restoration with `onAuthStateChanged`
- Firestore role lookup from `users/{uid}`
- Separate `/admin/login` + `/admin/dashboard` administration portal
- Root portal selection with separate Employee and Admin entry points
- Employee access requests at `/register` with Admin approval at `/admin/employee-requests`
- Department-aware employee portals with `MARKETING`, `HR`, `FINANCE`, `ACCOUNTS`, `OPERATIONS`, and `OTHER` profiles
- Role, department, `gpsPolicy`, `campAccess`, and inactive-status profile enforcement
- Conditional GPS: mandatory for Marketing, disabled for normal office departments, temporary and mandatory during Camp Mode
- Protected dashboard routes and Firebase sign out
- Responsive healthcare-oriented shell, mobile drawer, and bottom navigation
- Firebase Firestore and Storage rules, indexes, and environment template
- Existing dashboard/module screens remain available as prototype presentation surfaces

## Prerequisites

- Node.js 20 or newer
- A Firebase project with Authentication, Firestore, and Storage enabled
- Firebase Email/Password sign-in enabled
- Optional Google Maps JavaScript API key

## Local development

```bash
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

Populate `.env.local` with the web app configuration from Firebase Console. Without Firebase configuration, local development exposes clearly labeled demo accounts; production never enables the demo fallback.

Local demo accounts: `admin@surya.com`, `manager@surya.com`, `executive@surya.com`, `hr@surya.com`, and `finance@surya.com`, all with password `demo123`. These accounts are not Firebase users and must never be used for production.

Place the supplied official logo at `public/images/surya-hospital-logo.jpg`. The login, sidebar, mobile drawer, metadata, and PWA manifest all use that local path.

## Firebase setup

1. Create a Firebase project and register a web app.
2. Enable Authentication > Sign-in method > Email/Password.
3. Create a Firestore database and Storage bucket.
4. Copy the web app values into `.env.local` using `.env.example`.
5. Create Firebase Authentication users for the team.
6. Create a matching Firestore document at `users/{authUid}`. At minimum it needs `name`, `email`, `role`, `department`, `status`, `gpsPolicy`, and `campAccess`.
7. Set `role` to `SUPER_ADMIN`, `ADMIN`, `MARKETING_MANAGER`, or `MARKETING_EXECUTIVE`.
8. For approval account creation, configure the server-only `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` values. Never expose these as `NEXT_PUBLIC_*` variables.
9. Deploy rules and indexes:

```bash
firebase login
firebase use YOUR_FIREBASE_PROJECT_ID
firebase deploy --only firestore:rules,firestore:indexes,storage
```

The web client never receives Firebase Admin credentials. Firestore rules enforce access using the authenticated user document.

## Google Maps

Create a browser API key in Google Cloud Console, enable Maps JavaScript API, restrict the key by deployed domains, and set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`. The app should treat a missing key as a configuration state rather than a secret to hard-code.

## Validation and deployment

```bash
npm run lint
npm run build
npm run start
```

Deploy the Next.js frontend to Vercel:

```bash
npx vercel
npx vercel --prod
```

Add the same `NEXT_PUBLIC_*` values in the Vercel project settings. Firebase Hosting can also serve a compatible Next.js deployment, but Vercel is the recommended target for this App Router project.

## Important prototype scope

The core operational lists now use Firestore CRUD with shared loading, search, edit, delete confirmation, validation-by-browser-controls, and toast feedback. Dashboard metrics query Firestore, Quick Add creates records, Attendance uses browser GPS and writes `attendance` plus `locationHistory`, Notifications support read/delete, Reports export queried records to CSV, and FileUploader uses Firebase Storage with progress.

Before production use, add Admin SDK/Cloud Functions for creating Firebase Authentication users from the employee screen, complete PDF/Excel export and offline queue UX, add emulator/automated integration tests, and seed real demo documents. The demo accounts are intentionally session-only when Firebase is not configured and are disabled in production.

Employee approval uses the secure Next.js route `/api/admin/employee-requests/approve`. It verifies the administrator Firebase ID token, creates the Firebase Authentication account server-side, writes `users/{uid}`, updates the request, and records an audit log. The route requires the server-only Admin SDK environment variables above.
