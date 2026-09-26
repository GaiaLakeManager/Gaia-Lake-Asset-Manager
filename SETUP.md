# Gaia Lake Menu System — Setup Guide

Three files: `config.js` (shared settings), `admin.html` (your private dashboard),
`index.html` (the public page guests reach via QR code — named index.html so it serves directly at your GitHub Pages root). A separate,
isolated Google Cloud project — nothing shared with the Asset Inventory app.

---

## 1. Create the Google Cloud project

1. Go to https://console.cloud.google.com/projectcreate
2. Name it something like **Gaia Lake Menu** → Create.
3. Make sure this new project is selected (top-left dropdown) before continuing.

## 2. Enable the Google Drive API

1. https://console.cloud.google.com/apis/library/drive.googleapis.com
2. Confirm the new project is selected → click **Enable**.

## 3. Create the OAuth Client ID (for admin.html sign-in)

1. https://console.cloud.google.com/apis/credentials/consent
   - User type: **External** (unless you have Google Workspace, then Internal is fine).
   - Fill in app name (e.g. "Gaia Lake Menu Admin"), your email as support/contact.
   - Scopes: you can skip adding any here — the app requests them directly.
   - Add yourself as a **test user** if the consent screen stays in "Testing" mode.
2. https://console.cloud.google.com/apis/credentials → **Create Credentials → OAuth client ID**.
   - Application type: **Web application**.
   - Name: "Gaia Lake Menu Admin".
   - **Authorized JavaScript origins** — add every origin you'll open admin.html from:
     - `http://127.0.0.1:5500` (or whatever port your local Live Server uses)
     - `https://gaialakemanager.github.io` (once hosted — see step 6)
   - Create → copy the **Client ID** (ends in `.apps.googleusercontent.com`).
   - Paste it into `config.js` as `GOOGLE_CLIENT_ID`.

## 4. Create the API Key (for the guest menu's read-only access)

1. Same Credentials page → **Create Credentials → API key**.
2. Click into the new key → **Restrict key**:
   - **API restrictions** → restrict to **Google Drive API** only.
   - **Application restrictions** → **Websites**, and add your GitHub Pages domain
     (`gaialakemanager.github.io/*`) once hosted. Leave unrestricted only while testing locally.
3. Copy the key into `config.js` as `GOOGLE_API_KEY`.

## 5. Confirm your Drive folder sharing

You've already set this up:
- **GuestView** folder — Anyone with the link: **Viewer**. `config.js`'s
  `GUEST_FOLDER_ID` is already filled in from your link.
- **DishImages** (inside GuestView) — inherits the Viewer sharing, so guests can
  see dish photos. Admin uploads here.
- **Backup** and **Deleted Images** — kept private (admin-only), exactly as you set up.

The admin app finds these three subfolders **by name** automatically — no need
to hunt for their IDs. If a folder is renamed, update the matching `_FOLDER_NAME`
value in `config.js`.

## 6. Test locally, then go live

**Local test (VS Code Live Server or similar):**
1. Put `config.js`, `admin.html`, `index.html` in one folder, open it in
   VS Code, right-click `admin.html` → "Open with Live Server."
2. Add that local origin (e.g. `http://127.0.0.1:5500`) to the OAuth Client's
   Authorized JavaScript origins (step 3) if it isn't already there.
3. Sign in, and on first run the admin app will create `gaia_lake_menu.json`
   inside GuestView and show you its **file ID** on the Dashboard.
4. Copy that ID into `MENU_FILE_ID` in `config.js` — **the same config.js both
   files load**, so one edit covers both apps.

**Go live (GitHub Pages, same as your other Gaia Lake apps):**
1. Push `config.js`, `admin.html`, `index.html` to a GitHub repo → Settings
   → Pages → enable for the `main` branch.
2. Add the resulting `https://gaialakemanager.github.io/GaiaLakeMenu` origin to the
   OAuth Client's Authorized JavaScript origins, and to the API key's website
   restriction.
3. Update `GUEST_MENU_URL` in `config.js` to the real
   the resulting root address, then open **Admin → QR Code** to generate
   and download the print-ready QR code.

## Opening the admin dashboard

Once hosted, `admin.html` isn't linked from anywhere on the guest menu (by
design — guests should never stumble onto it). Bookmark its direct URL:

```
https://gaialakemanager.github.io/GaiaLakeMenu/admin.html
```

(Your public guest menu is the same path without `admin.html` at the end.)

## 7. Add admin accounts

Edit `ADMIN_EMAILS` in `config.js`:
```js
ADMIN_EMAILS: ["you@gmail.com", "someone-else@gmail.com"],
```
Anyone not on this list who signs in will see an access-denied message —
they still need Google's own Editor permission on the file to actually write,
this list is just an extra in-app gate. Leaving it empty lets anyone with
Editor access sign in (fine for solo testing, add your email before going live).

## About the GitHub "secrets detected" email

If GitHub emails you saying it found a Google API Key in `config.js`, this is
expected and not a leak in the usual sense — that key is meant to be public in
a browser-only app like this one (see "No secrets are exposed" below). What
actually matters is that the key is **restricted** the way step 4 describes
(Drive API only, your GitHub Pages domain only) — an unrestricted key is what
would let a stranger rack up usage on your Google Cloud project.
To resolve GitHub's alert: open the repo's **Security → Secret scanning
alerts**, open the flagged alert, and mark it **"Used in tests"** or **"Revoke"**
depending on the option GitHub offers — either dismisses the warning once
you've confirmed the key is properly restricted. You do not need to remove
the key from `config.js` or hide the file.

## Notes

- **No secrets are exposed.** The API key and Client ID are meant to be public
  for a browser-only app like this — real access control is Google's sign-in
  plus your Drive folder permissions.
- **Backups**: every save writes a timestamped copy into the Backup folder
  first. Nothing is deleted automatically — you can prune old backups by hand
  whenever you like.
- **Deleted dish photos** move to "Deleted Images" instead of being permanently
  removed, so an accidental delete is recoverable from Drive directly.
