# PocketBase Setup Guide for Pensée

This guide walks you through configuring PocketBase as the backend for Pensée.

---

## 1. Deploy PocketBase

Host PocketBase on any server or cloud provider. Recommended options:

- **fly.io** — free tier available, easy deployment
- **Railway** — simple deployment from GitHub
- **VPS (DigitalOcean, Hetzner, etc.)** — full control
- **Self-hosted** — run the binary on your own machine

Download PocketBase from https://pocketbase.io/docs/ and follow the deployment instructions.

Once deployed, open the Admin UI at `https://your-pocketbase-instance.com/_/`.

---

## 2. Create the `sessions` Collection

In the PocketBase Admin UI:

1. Go to **Collections** → **New collection**
2. Name it `sessions`
3. Set **Type** to `Base`
4. Add the following fields:

| Field Name | Type     | Required | Notes                                   |
|------------|----------|----------|-----------------------------------------|
| `user`     | Relation | ✅       | Relation to the `users` collection      |
| `date`     | Text     | ✅       | Format: `YYYY-MM-DD`                    |
| `wordCount`| Number   | ✅       |                                         |
| `writing`  | Text     |          | May contain HTML from the rich editor   |
| `vocab`    | Text     |          |                                         |
| `devices`  | Text     |          |                                         |
| `good`     | Text     |          |                                         |
| `bad`      | Text     |          |                                         |
| `thoughts` | Text     |          |                                         |
| `prompt`   | Text     |          | The creative word used for the session  |
| `terms`    | Text     |          | JSON string of technique terms          |
| `image`    | Text     |          | URI or base64 of any scanned image      |

5. Under **API Rules**, set the following rules so users can only access their own sessions:

   - **List/Search rule:** `@request.auth.id = user`
   - **View rule:** `@request.auth.id = user`
   - **Create rule:** `@request.auth.id = user`
   - **Update rule:** `@request.auth.id = user`
   - **Delete rule:** `@request.auth.id = user`

---

## 3. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client IDs**
3. Set **Application type** to **Web application** (PocketBase handles the OAuth server-side)
4. Under **Authorized redirect URIs**, add:
   ```
   https://your-pocketbase-instance.com/api/oauth2-redirect
   ```
5. Copy the **Client ID** and **Client Secret**

Then in PocketBase Admin UI:

1. Go to **Settings** → **Auth providers**
2. Enable **Google**
3. Paste in the **Client ID** and **Client Secret** from Google Cloud Console
4. Save

> **Note:** The Google Client ID is handled entirely by PocketBase server-side. You do **not** need to add it to the Pensée `.env` file. PocketBase manages the OAuth flow.

---

## 4. Configure the App

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Set your PocketBase URL:
   ```
   EXPO_PUBLIC_POCKETBASE_URL=https://your-pocketbase-instance.com
   ```

3. In `app.json`, update the `scheme` if needed (currently `pensee`). This scheme is used as the OAuth redirect URL on mobile:
   ```
   pensee://auth
   ```
   Add `pensee://auth` to your **Authorized redirect URIs** in Google Cloud Console as well (for mobile OAuth).

---

## 5. Apple App Store Requirements

To publish to the App Store, you must provide:

1. **Privacy Policy URL** — Required for any app with user accounts or data collection.
   - Create a privacy policy at `https://pensee.app/privacy`
   - This URL is already referenced in the Account modal

2. **Terms of Service URL** — Strongly recommended.
   - Create terms at `https://pensee.app/terms`

3. **Data deletion** — Apple requires that users can delete their accounts and data. The Account modal includes a "Delete Account" button that calls PocketBase's user deletion API.

4. **App Privacy details** in App Store Connect — Declare the data your app collects:
   - **Account info** (name, email) — Used for account management, linked to user identity
   - **User content** (writing sessions) — Stored on user's PocketBase instance

5. **Age Rating** — Set to **4+** (no objectionable content).

6. **Screenshots** — Provide screenshots for all required device sizes (iPhone 6.7", 6.5", 5.5").

7. **App description** — Must not contain technical jargon. Use plain language describing what the app does for users.

---

## 6. Testing

Once configured:

1. Build the app: `npm run ios` or `npm run android`
2. Tap **Account** in the top-right corner
3. Tap **Continue with Google** to test OAuth
4. After signing in, writing sessions will automatically sync to PocketBase
5. Offline sessions (written without an account) are stored locally and are **not** automatically migrated to PocketBase

---

## Summary

| Step | Where |
|------|-------|
| Deploy PocketBase | Your server |
| Create `sessions` collection | PocketBase Admin UI |
| Enable Google OAuth | PocketBase Admin UI → Settings → Auth providers |
| Set Google OAuth credentials | Google Cloud Console + PocketBase Admin UI |
| Set `EXPO_PUBLIC_POCKETBASE_URL` | `.env` file |
| Provide Privacy Policy & Terms | Your website |
