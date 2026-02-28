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

| Field Name    | Type     | Required | Notes                                              |
|---------------|----------|----------|----------------------------------------------------|
| `user`        | Relation | ✅       | Relation to the `users` collection                 |
| `date`        | Text     | ✅       | Format: `YYYY-MM-DD` (must be **Text**, not Date)  |
| `wordCount`   | Number   | ✅       |                                                    |
| `writing`     | Text     |          | May contain HTML from the rich editor              |
| `vocab`       | Text     |          | JSON string of device ratings                      |
| `devices`     | Text     |          | Session feel rating (1-5)                          |
| `good`        | Text     |          |                                                    |
| `bad`         | Text     |          |                                                    |
| `thoughts`    | Text     |          | Optional reflection note                           |
| `prompt`      | Text     |          | The quote prompt used for the session              |
| `quoteAuthor` | Text     |          | Author of the quote prompt (optional)              |
| `terms`       | Text     |          | JSON string of technique terms                     |
| `image`       | Text     |          | URI or base64 of any scanned image                 |

> **⚠️ Important:** The `date` field **must** be a **Text** field, not a Date field.
> PocketBase Date fields apply server-timezone conversion, which causes dates to
> shift when the server is in a different timezone than the user (e.g. a server
> in Germany and a user in New York). Using Text preserves the exact `YYYY-MM-DD`
> calendar date the user intended.

5. Under **API Rules** for the `sessions` collection:

   - **List/Search rule:** `@request.auth.id = user`
   - **View rule:** `@request.auth.id = user`
   - **Create rule:** `@request.auth.id = user`
   - **Update rule:** `@request.auth.id = user`
   - **Delete rule:** `@request.auth.id = user`

---

## 3. Configure the `users` Collection

The built-in `users` collection needs custom fields for settings and curation
data, plus correct API rules so account management works.

### 3a. Add Custom Fields

In the PocketBase Admin UI, go to **Collections** → **users** → **Edit collection** and add:

| Field Name     | Type   | Required | Notes                                                |
|----------------|--------|----------|------------------------------------------------------|
| `settings`     | Text   |          | JSON string of user preferences (session duration, weekly goal, etc.) |
| `sessionCount` | Number |          | Total number of completed writing sessions           |
| `deviceQueue`  | Text   |          | JSON string of spaced-repetition device queue        |
| `onboardingComplete` | Bool |     | Whether the user has completed onboarding            |

### 3b. Set API Rules

- **List/Search rule:** `id = @request.auth.id` — users can only list themselves
- **View rule:** `id = @request.auth.id` — users can only view their own profile
- **Update rule:** `id = @request.auth.id` — users can only edit themselves
- **Delete rule:** `id = @request.auth.id` — users **must** be allowed to delete
  their own account (required for Apple App Store compliance)

> **Note:** Without the Delete rule, the "Delete Account" button in the app will
> fail with a permission error.

---

## 4. Configure Google OAuth

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

## 5. Configure the App

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

   When running in Expo Go or via `expo start`, the client uses Expo's proxy
   redirect URL rather than the custom scheme. Register the proxy URI with
   Google as well, typically:
   ```
   https://auth.expo.io/@<your-username>/<your-app-slug>
   ```

   For web builds, include your host origin (e.g. `http://localhost:19006`) as
   an authorized redirect URI.

---

## 6. Timezone Considerations

Pensée stores session dates as plain `YYYY-MM-DD` text strings representing the
user's **local calendar day**. This design is intentional:

- The client determines "today" using `new Date()` in the user's local timezone.
- The date string is sent to PocketBase as-is — no timezone conversion occurs.
- When reading back, the app uses the exact string stored.

**If your PocketBase server is in a different timezone** (e.g. Germany/CET while
your users are in US/EST), this works correctly **as long as the `date` field is
a Text type**, not a Date type. PocketBase Date fields apply automatic timezone
conversion which will shift dates.

If you previously set up `date` as a Date field and are seeing date mismatches:
1. Export your sessions data
2. Change the `date` field type to **Text**
3. Re-import or let new sessions use the corrected field

---

## 7. Apple App Store Requirements

To publish to the App Store, you must provide:

1. **Privacy Policy URL** — Required for any app with user accounts or data collection.
   - Create a privacy policy at `https://pensee.app/privacy`

2. **Terms of Service URL** — Strongly recommended.
   - Create terms at `https://pensee.app/terms`

3. **Data deletion** — Apple requires that users can delete their accounts and data. The Settings modal includes a "Delete Account" button that calls PocketBase's user deletion API.

4. **App Privacy details** in App Store Connect — Declare the data your app collects:
   - **Account info** (name, email) — Used for account management, linked to user identity
   - **User content** (writing sessions) — Stored on user's PocketBase instance

5. **Age Rating** — Set to **4+** (no objectionable content).

6. **Screenshots** — Provide screenshots for all required device sizes (iPhone 6.7", 6.5", 5.5").

---

## 8. Testing

Once configured:

1. Build the app: `npm run ios` or `npm run android`
2. Tap the **⚙️ Settings** gear in the top-right corner
3. Tap **Sign In** → **Continue with Google** to test OAuth
4. After signing in, writing sessions will automatically sync to PocketBase
5. Verify that session dates match your local calendar day
6. Offline sessions (written without an account) are stored locally and are **not** automatically migrated to PocketBase

---

## Summary

| Step | Where |
|------|-------|
| Deploy PocketBase | Your server |
| Create `sessions` collection (with Text `date` field) | PocketBase Admin UI |
| Add custom fields to `users` collection | PocketBase Admin UI |
| Set API rules for `sessions` and `users` | PocketBase Admin UI |
| Enable Google OAuth | PocketBase Admin UI → Settings → Auth providers |
| Set Google OAuth credentials | Google Cloud Console + PocketBase Admin UI |
| Set `EXPO_PUBLIC_POCKETBASE_URL` | `.env` file |
| Provide Privacy Policy & Terms | Your website |
