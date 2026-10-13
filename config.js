/* ============================================================================
   GAIA LAKE BUNGALOW — CLOUD & COMPANY CONFIGURATION
   Split out of index.html in v4.51 so day-to-day edits to Google Drive
   credentials, company branding, or the admin seed email never require
   touching the main app file.

   Must be uploaded to GitHub Pages in the same folder as index.html —
   index.html loads this file via <script src="config.js"></script> before
   its own script runs.

   Note on security: this file is just as publicly readable as index.html
   itself once deployed. Nothing in a static, backend-less site can be kept
   secret from someone who opens browser dev tools — separating this file
   out is purely for organization (cleaner edits, smaller diffs), not
   access control. The real access boundary is Google Drive's own sharing
   permission on the underlying data files.

   The Admin (ADMIN_EMAIL below, or anyone in the in-app Administrators
   list) can still override Cloud/Branding/Company values from the Cloud
   Connection Workspace and Company Metadata panels in Settings — anything
   explicitly saved there takes priority over these defaults on future
   loads. Non-empty values already stored in a browser's IndexedDB from
   before are left untouched.
--------------------------------------------------------------------------- */
const DEFAULT_CLOUD_CONFIG = {
  clientId: '860897303640-a7oqu2mqjmqclani6vj96fnk50qd2kre.apps.googleusercontent.com',
  apiKey:   'AIzaSyAUSaqro9KJzDugSrEK0PW3mxPSIzFXPXU',
  folderId: '1x-1NAu5-kmOcGD-4Teq5Ppo7EMTralmw'
};

// Dedicated subfolder for Method C mobile-camera uploads (gaialakewebapps@gmail.com
// My Drive/WebApps/AssetsApp/ItemsImages) — separate from the main sync folder above,
// which only holds the two JSON payload files.
const DRIVE_IMAGES_FOLDER_ID = '1y0iJnUSyYWDDkox72rfzZ-Dm5LWWS6V-';

// Google Drive "view" links don't work as an <img src>; converted to the direct-content form.
const DEFAULT_LOGO_URL = 'https://drive.google.com/uc?export=view&id=1bsN5z_QUDfAyaVKfjWVDAWPWdeOeUJxR';

const DEFAULT_COMPANY = {
  companyName: 'Gaia Lake Bungalow',
  address: '3rd Mile Post, Kandalama, Dambulla, Sri Lanka',
  phone: '+94 77 291 1501',
  email: 'gaialakekandalama@gmail.com',
  website: ''
};

// Only these signed-in Google accounts see master configuration panels in
// Settings. ADMIN_EMAIL below is only a seed value (first install) and a
// last-resort fallback — the editable, synced list lives in
// state.settings.adminEmails (see loadSettings/the Settings admin panel in
// index.html).
const ADMIN_EMAIL = 'gaialakewebapps@gmail.com';
