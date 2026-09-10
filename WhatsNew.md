# Gaia Lake Bungalow — Asset & Inventory Manager

## Version & Change Log

Full release history. The app itself only shows the current version — download or view this file any time for everything that came before.

---

### v4.51 · MINOR · 2026-09-10

**Split the growing Version & Change Log out of the app itself, and moved Cloud/Company/Admin configuration into its own file.**

Two structural changes, no change to day-to-day functionality: (1) The full version history previously lived inside index.html as a large embedded array, growing with every release and adding real weight to every page load even though almost no one ever opened it. That full history now lives in this separate WhatsNew.md file instead, hosted alongside index.html on GitHub Pages and maintained independently. The in-app Settings → Version & Change Log panel now shows only the current version's badge, type, date and one-line summary instead of a scrollable list of every past release — the "Download WhatsNew.txt" button is now a plain link to this file (renamed WhatsNew.md), with no JavaScript generating it on the fly anymore. (2) Google Drive credentials (Client ID, API Key, target Folder ID), the mobile-upload images-folder ID, default company branding (name, address, phone, email, logo), and the fallback admin seed email were all moved out of index.html into a new config.js file, loaded via a script tag before the main app script. This is an organizational split for cleaner future edits (changing a phone number or swapping a credential no longer means touching the main app file) — it is explicitly NOT a security measure: config.js is just as publicly downloadable as index.html itself on a static, backend-less site, and nothing shipped to a browser can be kept secret from someone who opens developer tools. The real access boundary remains Google Drive's own sharing permission on the underlying data files, unchanged by this update.

---

### v4.50 · PATCH · 2026-09-10

**Removed leftover category/location "code" plumbing from the Settings page — dead weight left over from the old numbering scheme, no longer used by anything.**

Asset Numbers switched to the sequential YY#### scheme a while back and haven’t encoded a category/location code since — but the 3-letter code generator, its live preview field on the Add Category/Add Location forms, the "· CODE" badge shown next to every category/location pill, and two lookup helpers (catByCode/locByCode) that were never even called anymore all kept running as inert leftovers. Also removed a one-time v3.2 migration routine (migrateShortLocationCodesV32) that was already fully unreachable for every install at this version — it only ever fired when upgrading from before v3.2, which no longer applies to a fresh install or to any account already this far along. Corrected two Settings help-text lines that had drifted out of sync with actual behavior and were describing the old scheme: Asset Categories claimed renaming regenerates Asset Numbers (it doesn’t, and hasn’t for a while), and Storage Locations claimed the same for a location rename. Both now correctly state that Asset Numbers are permanent and never change on a rename or move, matching what the rename functions themselves already did. Category and location records created before this version keep whatever code value they already have in storage (harmless, simply unused now) — nothing needed to change there.

---

### v4.49 · MINOR · 2026-09-10

**Added multi-administrator support — more than one Google account can now hold full Administrator access, managed from Settings.**

Previously exactly one hardcoded email had Administrator rights (Company Metadata, Cloud Connection, deletion approvals, History wipeout/recover, etc.) — every other signed-in account saw a locked-panel notice with no way to grant anyone else that access short of editing the source file. Added an "Administrators" panel in Settings (visible to existing admins only) listing every admin email with an Add field and a Remove button per entry; the list is stored in Settings, so it syncs across devices the same way Company Metadata already does. A safeguard blocks removing the last remaining administrator, so the account can never end up with zero admins. The original single hardcoded email still exists as a fallback seed for upgrading installs and a last-resort safety net if the list were ever corrupted or synced empty, but is no longer the sole authority. Worth noting plainly: this is an application-level convenience layer, not the actual security boundary — the real access control is Google Drive’s own sharing permission on the underlying files (anyone Drive lets edit the file can, in principle, write to it directly regardless of what the app’s admin list says); a technically capable user with genuine Drive Editor access could bypass this check entirely. For a small trusted team this is a solid, appropriate deterrent — a tamper-proof role boundary would need a real backend to enforce, which this architecture (client-only, Drive-as-database) deliberately doesn’t have.

---

### v4.48 · MINOR · 2026-09-10

**History deletions weren’t actually permanent — a background sync could silently bring a deleted record back, unchanged, within seconds. Fixed, and added Recover.**

Root cause: clicking the trash icon deleted a History record locally, but that deletion also triggers a background push (same as any local change) — which pulls Drive’s current copy and merges it into the local copy using a "keep anything present on either side" union rule. That rule exists deliberately for ordinary History entries (so two devices comparing logs never lose an entry one hasn’t synced yet), but it had no way to tell "missing because not yet synced" apart from "missing because someone deliberately deleted it" — so the very push the deletion triggered silently restored the exact same record, invisibly, until the next reload made it visible again. Fixed with a History deletion tombstone (the same pattern already used for deleted assets): every deleted History-entry id is now tracked and excluded from the merge on both push and pull, on every device, so a deletion finally sticks. Also reworked what the trash icon does, based on discussion of the actual admin workflow needed for clearing out test/mistaken records: on a row already showing "Deleted," it is now a genuine permanent wipeout (irreversible, with a matching warning). On any other row (Created/Updated), it no longer touches live inventory or rewrites that row’s own action — doing so would make the audit log lie about when an item was actually deleted. Instead it stages the row: the original entry is removed (tombstoned) and a new entry is logged with action "Deleted" and today’s date, ready to be wiped out with a second click once desired — letting an admin fully clear a test item’s trail (Created + Updated + Deleted, all logged, all eventually removable) without ever touching a real live asset or fabricating a false timeline. New: a Recover button appears only on a "Deleted" row with no matching live asset. It restores the item to active inventory using whatever fields that History entry actually captured (name, category, location, qty, condition, image, notes — Purchase Price/Vendor/Sub-Category were never logged and start blank on a recovered item, same as any new item) and logs a new "Recovered" entry; the original "Deleted" row is left exactly as it was, so the log reads as two honest, separate facts — deleted, then later recovered — rather than one edited fact. If the item’s old Asset Number has since been reused by something else, Recover assigns a fresh number instead of creating a duplicate, and says so before proceeding.

---

### v4.47 · PATCH · 2026-09-10

**Fixed a permanently-deleted item getting silently resurrected into active inventory, mislabeled as "updated," when opened from its History row.**

The eye ("Open") icon on a History row fell back to opening the raw History log entry itself in the edit form whenever the underlying asset no longer existed (e.g. it had been permanently deleted). A History entry carries its own `id` field — the log entry’s own id, not the item’s — and saveStandardItem() decides new-vs-update purely by checking whether `e.id` is set. That non-empty id made Save believe it was editing a real, still-existing item: saving (or deleting again) from that state wrote it back into the assets table as a new item under the wrong internal id and logged the action as "updated" instead of reflecting that the item was already gone for good. Fixed by no longer opening the editor at all when a History row has no matching live asset — it now shows a clear message pointing to Print/Export PDF (to view the historical snapshot) or the trash icon (to remove the log entry itself), instead of silently resurrecting a deleted item. The existing per-row "Delete Record" trash icon already does exactly what an administrator needs to permanently purge a stray or test entry from History — it deletes only that log entry via idbDelete, with no new record ever created — that button was already correct and untouched by this fix.

---

### v4.46 · PATCH · 2026-09-10

**Cleanup only, no functional change: removed the temporary diagnostic code added while tracking down the v4.36–v4.45 History sync bugs, now that they’re confirmed fixed across all devices.**

Removed the Settings "v4.37 diagnostic" line that printed both Drive file IDs side by side for cross-device comparison, and the step-by-step breadcrumb trail inside ensureHistoryCloudLoaded() (the internal `steps` array and its per-branch labeled try/catch wrapping) that recorded exactly which lookup/create step ran, used only to pin down where the old File-ID bug was actually failing. The real fixes those investigations led to — the historySyncing re-entrancy guard, saving the resolved File ID to IndexedDB before applying a remote pull, the safety check that refuses to mark a load successful with a blank File ID, and the once-per-distinct-error toast — are all untouched and still in place. Kept the "History archive last synced…" line and its "Last history sync error" detail on Settings, since that mirrors the Active file’s existing status line and remains genuinely useful for spotting a real future sync problem, not just the one this cleanup was about.

---

### v4.45 · PATCH · 2026-09-10

**Fixed History staying permanently stuck out of sync on a device even though the live dashboard kept updating fine, with the Refresh Cloud Data button unable to recover it.**

Two separate issues combined to cause this. (1) applyRemoteHistoryData() (the code path that pulls and merges a History update from another device) was still using the plain idbClear()/idbPut() calls instead of the Raw variants — unlike its two closest siblings, pushHistoryToCloud() and applyRemoteActiveData(), which already correctly use idbClearRaw()/idbPutRaw() for exactly this reason. Every idbPut() unconditionally schedules a cloud push as a side effect, so this pull’s own merge-and-rewrite step could re-flag dirty/historyDirty=true immediately after a clean pull, with a real chance that stale flag survives all the way to disk since nothing downstream re-saves it back to false. (2) More importantly, the actual Drive fetch calls (driveFetchJson) had no timeout — a request that stalled mid-flight (laptop sleep/wake, a wifi handoff, a dropped VPN) could hang forever instead of failing. Every sync function sets a busy flag (historySyncing/syncing/applyingRemote) before awaiting a Drive call and only clears it in a finally block once that call settles; a fetch that never resolves nor rejects means that finally never runs, wedging the flag true permanently — and since both the automatic 20s poll AND the manual "Refresh Cloud Data" button gate every sync attempt on that same flag being false, once wedged, nothing could recover it short of a full page reload. This exactly matches the reported symptom: the active-file poll (guarded by its own separate "syncing" flag) kept working and updated the dashboard, while History (guarded by "historySyncing") stayed frozen no matter how long the user waited or how many times they clicked refresh. Fixed by (a) switching applyRemoteHistoryData() to the Raw variants, and (b) giving every Drive fetch a 20s timeout (mirroring the 4s timeout ensureFreshAccessToken() already used for the same class of risk), so a stalled request now fails cleanly instead of hanging forever. Also hardened the manual sync button itself: an explicit click now force-clears all three busy flags before attempting anything, so it can always force a real recovery attempt even in the rare case something is still found stuck in the future — a no-op if nothing was actually wedged.

---

### v4.44 · PATCH · 2026-09-10

**Fixed a regression from v4.42: the app could get stuck continuously syncing on its own, with no edits and no user action — draining battery and eventually freezing the mobile browser tab.**

v4.42 added a call to save the cloud sync bookkeeping (file ids, dirty flags) to IndexedDB right after each successful push, to fix the "reload loses pending push" bug. That bookkeeping save used idbPut() — which this codebase’s own idbPutRaw() already carries a comment explaining should never be used for local-only bookkeeping, precisely because idbPut() always treats a write as new content and schedules another push. That turned the fix into a self-sustaining loop: a push succeeds -> saves its own bookkeeping via idbPut -> that save itself is treated as new data needing a push -> schedules another push -> succeeds -> saves bookkeeping again -> forever, entirely on its own, no error, no edits required. Switched saveCloudConfigToDB() to idbPutRaw(), matching the exact pattern already used elsewhere in this file for this exact class of problem (e.g. the auto-backup last-run tracker) — the bookkeeping is still saved every time, it just no longer re-triggers itself.

---

### v4.43 · PATCH · 2026-09-10

**Fixed a real timezone bug the user caught directly: a backup made shortly after local midnight was silently overwriting the PREVIOUS day’s backup file instead of creating a new one — permanently losing that prior day’s snapshot.**

Every "today’s date" used for naming/keying the daily and monthly auto-backups was computed with toISOString().slice(0,10|7), which always returns the date in UTC — but Sri Lanka is UTC+5:30, so for the first ~5.5 hours of every local day, that calculation still reported YESTERDAY’s date. An edit made at, say, 00:05 local time therefore reused yesterday’s backup filename and PATCHED (overwrote) it with today’s data, destroying the actual end-of-day snapshot that file was supposed to preserve. Weekly backups were unaffected — isoWeekLabel() already correctly started from the browser’s local getFullYear()/getMonth()/getDate(). Added local-time equivalents (localDateKey/localMonthKey) and switched the daily and monthly backup logic to them, along with every export filename that stamped "today’s date" the same broken way (JSON/Excel/CSV backups, all PDF exports, the dashboard summary image) for consistency, since they shared the identical defect even though only the backup one caused actual data loss. Deliberately left the Excel-import date-cell parser alone — it’s a related-looking but functionally different problem (parsing an arbitrary date a spreadsheet cell already contains, not stamping "right now"), and deserves its own look at real import data rather than a blind copy of this fix.

---

### v4.42 · PATCH · 2026-09-10

**Fixed a separate, deeper issue found while confirming v4.41: locally-added History entries could sit unpushed to Google Drive indefinitely, because the "this needs pushing" flag lived only in memory and any page reload before a push completed silently erased it — with no error, and even the manual Sync Now button unable to recover it.**

This explains why the shared History file on Drive could stop updating (stuck on an old date) even while a device’s own local History list kept growing correctly: the local data was always safe in this device’s IndexedDB, but the signal that Drive still needed those entries could be lost the moment the page reloaded — a hard refresh, a browser restart, a phone killing the tab — before the 500ms-debounced push had a chance to run. The next successful push would still have caught up automatically eventually, but nothing forced that to happen, so a device with no further edits that session could go a long time with Drive silently behind. The dirty/historyDirty flags are now saved to IndexedDB the moment they’re set and restored on the next load, so a reload can no longer erase them, and the load-success paths already checked these flags to catch up automatically. The manual Sync Now button also no longer relies solely on that flag — an explicit click now always attempts a real push if the file is ready, so it works as a reliable manual recovery option regardless.

---

### v4.41 · PATCH · 2026-09-10

**Found and fixed the actual root cause of History file ID staying blank: it only ever failed on a device finding an already-existing History file (created earlier by a different device) — which is exactly mobile’s situation once PC had already created it.**

applyRemoteHistoryData() (called after successfully downloading an existing History file) calls loadAllData(), which calls loadCloudConfig(), which re-reads historyFileId FROM IndexedDB. The newly-resolved id was only ever saved to IndexedDB at the very end of the whole function — so on a device that had never saved a historyFileId before (its first time finding one that another device already created), that disk value was still null, and loadCloudConfig()’s re-read clobbered the just-resolved in-memory id back to null moments before the final check. This is exactly why it looked like "all steps reported success, but no id ended up set": every step genuinely did succeed, right up until an unrelated later step silently reset the result. The device that instead *creates* the file (PC, in this case) never calls applyRemoteHistoryData, so it never hit this — explaining the split. The Active-file sync path elsewhere in this app already saves its id to IndexedDB before its own download+apply step for this exact reason; the History path added later simply hadn’t matched that ordering. Reordered it to match. Also added a step-by-step breadcrumb trail to the error message as a permanent safety net, so any future failure at this point names exactly which internal step ran and what it returned instead of a bare generic message.

---

### v4.40 · PATCH · 2026-09-10

**Diagnostic only, no behavior change: the "not resolved" error introduced in v4.39 was too generic to say which Drive step actually failed on mobile — this version labels each step so the next attempt shows exactly where and why.**

v4.39 correctly caught that historyFileId was ending up empty on mobile, but none of the four Drive calls involved (checking a cached id, searching by name, downloading, or creating) were throwing their own error — meaning something was failing at the response level rather than the network level, and the generic message could not say which step or why. Each step now wraps its own try/catch and reports its name if it throws, and the name-search/create steps additionally check that Drive’s response actually included a file id and print the raw (truncated) response if not, rather than silently accepting an incomplete result. This should turn the next occurrence into an actionable error message instead of another guess.

---

### v4.39 · PATCH · 2026-09-10

**Fixed a race condition that could leave History file ID permanently blank on a slow connection even while a fresh "last synced" time showed — the actual explanation for PC finding its ID under v4.38 while mobile still did not.**

ensureHistoryCloudLoaded() had no protection against being called a second time while an earlier call was still in flight — only a historyLoaded flag blocked re-entry, and that only flips true at the very end of a successful run. v4.38’s own fix made this far more likely to actually happen: retrying every ~20 seconds regardless of pending edits means that on a slow or weak connection, one call can easily outlast a single poll tick, letting the next tick start a second overlapping call before the first finishes. Two calls racing through the same lookup/create steps could each briefly reset the other’s just-set file ID back to null while re-checking it, so whichever call finished last could leave historyFileId stuck null even though historyLoaded and the sync timestamp had already been set true/fresh by the other. Added historySyncing to the function’s own entry guard so a second call can never start while one is already running, from any call site. Also added a safety check that refuses to mark a load "successful" if historyFileId ever ends up empty at that point, rather than silently accepting the contradiction.

---

### v4.38 · PATCH · 2026-09-10

**Fixed the real reason History file ID stayed blank even after v4.37's display fix: a device that made no local edits this session, and whose one attempt to load the History archive from Drive failed silently, had nothing ever retrying that load.**

v4.37 fixed the diagnostic line itself, but on redeploy it stayed blank on every device — pointing to state.cloud.historyFileId genuinely never getting set, not just a display freeze. Tracing it: History is only loaded from Drive once per device per session, triggered by opening History or Settings. If that one attempt failed (e.g. a transient Drive API error), historyLoaded stayed false — and the only retry logic added back in v4.32 only ran inside a check for a pending local History edit (historyDirty), so a device that was just viewing pages without adding/editing/deleting anything this session had no local edit to trigger that retry, and the failed load was never attempted again for the rest of the session. Moved the retry so it now runs on every ~20-second poll tick whenever a device is connected and has not yet loaded History, independent of whether anything is waiting to be pushed. Also stopped the retry from re-showing its error toast on every tick if the same failure keeps recurring — only toasts the first time a given error appears, since the persistent error line already added in v4.34 keeps it visible without repeat interruptions.

---

### v4.37 · PATCH · 2026-09-10

**Fixed the v4.36 diagnostic itself: the file-ID comparison line on Settings was frozen blank for History file ID on every device, because it was never wired up to refresh once the History file's ID actually became known.**

Screenshots from three devices confirmed the Active file ID matched everywhere, but History file ID showed as "—" on all three with no exception — not a real result, since the app could not have been syncing History at all if that were genuinely empty. The diagnostic line printed once, at the moment Settings first rendered, and was never touched again — unlike the "History archive last synced" line right above it, which already had an id and was being refreshed by the same background routine that keeps timestamps current. The actual History file ID is only discovered a moment later, asynchronously, after the initial render — so the diagnostic line was always showing its very first (empty) value no matter how long the device had been running. Given the same id and hooked into that existing refresh routine, so it now updates the moment the File ID is known, the same way the line above it does.

---

### v4.36 · PATCH · 2026-09-10

**Diagnostic only, no behavior change: Settings now shows the actual Google Drive file IDs this device is syncing to, so it can be checked whether all devices are really pointed at the same History file.**

v4.35 added a periodic check for History changes on Drive, mirroring the one the asset file already has, and it should have made a passively-viewing device pick up another device's update within about 20 seconds. It did not, which points to something more fundamental than a missing check: most likely, Google Drive silently allows more than one file with the same name in the same folder, and if that has already happened here (e.g. from an early moment when two devices both looked for the History file at nearly the same time and neither found one yet, so both created their own), different devices could each be correctly, successfully syncing — just to two different Drive objects that happen to share a name, which would explain every symptom seen so far: no errors, real "last synced" timestamps, and yet permanent divergence. Rather than guess again, this version just prints the exact file ID each device is using for the shared inventory file and for the History file, in Settings, so that can be compared directly across devices to confirm or rule this out before deciding on a fix.

---

### v4.35 · PATCH · 2026-09-10

**History now stays in sync on devices that are not the one making the edit. It previously only ever pulled from Drive once per session, so a device that was just viewing History (not editing) could sit indefinitely on whatever it loaded early in the session while other devices kept adding entries.**

The Settings message confirmed each device was correctly loading and pushing History with no error, but that only happens once per device per session (the first time it is needed), unlike the live asset file, which is checked against Drive roughly every 20 seconds regardless of whether that device is editing anything. So three devices open around the same time would each do their one History pull early on, and whichever one edited something afterward correctly merged and pushed it to Drive (v4.33) — but the other two, having already done their one pull for the session, never checked again and kept showing their older list. Added the same kind of check the asset file already has: every ~20-second background tick now also asks Drive whether the History file has changed since this device last saw it, and pulls and merges (same merge logic already in place) if so. A device that is just sitting on the History page, not editing at all, should now pick up another device's update within about 20 seconds, the same way the Dashboard already does.

---

### v4.34 · PATCH · 2026-09-10

**Added visibility into why the History archive might not be reaching Google Drive: a persistent error line on Settings (next to "History archive last synced…") now shows the actual reason if a History sync fails, instead of only a toast message that is easy to miss on a background sync nobody is watching happen.**

After v4.33's fix, a report came in that the History file's "Date modified" on Drive still was not updating at all — not just showing a stale date, but genuinely receiving zero successful writes since a much earlier date, even though the live asset file and Dashboard were updating correctly. That is a different symptom than v4.32/v4.33 addressed, and nothing in the app surfaced why a History sync attempt might be failing outright — only a transient toast that disappears, easy to miss on an automatic background push nobody is actively watching. This version does not change the sync logic itself; it adds a persistent "Last history sync error" line to Settings (matching the one the asset file has always had) so the real underlying error, if any, is visible and can be diagnosed from there instead of guessed at blindly.

---

### v4.33 · PATCH · 2026-09-10

**Fixed two follow-on issues from v4.32: (1) existing installs kept showing the old version number in the sidebar/footer after an update because a step needed to carry the new version forward to devices that already had data was missed, and (2) multiple devices editing around the same time could each silently overwrite each other's History log entries on Drive, so different devices showed different History lists and a recent update could vanish from everyone's view but the device that made it.**

Version display: every version bump adds its changelog entry to a code-defined list, but an existing install's local database keeps its own stored version number and only picks up newly-added entries through a separate migration list that has to be updated by hand alongside it — v4.32 shipped without that step, so any device that already had the app installed kept showing v4.31 even after loading the new file. Added the missing entry so already-installed devices now pick up the version correctly, and will going forward. History overwrite: pushing a History update to Drive used to just send this device's own local copy straight over, with no check for what else might already be sitting on Drive — unlike pushing an asset update, which has always pulled Drive's current copy and merged first specifically to prevent this. Two or three devices adding History entries around the same time could each push their own copy back to back, and since History is an append-only log rather than a single record, whichever device pushed last would wipe out anything added by the others since it was last pulled — even though the underlying asset data itself was never at risk, since that always used the safer merge approach. History push now pulls and merges with Drive first as well, the same way asset syncing already does, so no device's entries can overwrite another's.

---

### v4.32 · PATCH · 2026-09-10

**Fixed a bug where a History log entry for an edit could get stuck on the device that made it and never actually reach Google Drive, even though the edited item itself synced fine — other devices then kept showing an old History archive date and were missing the newer entry entirely.**

Root cause: the shared History/changelog file only ever gets pulled from Drive the first time a device opens the History or Settings page in a session (to avoid loading it on every single screen). But pushing a new History entry back up to Drive was also gated behind that same "has this device opened History/Settings yet" flag — and even the 20-second background watchdog that retries other stuck syncs explicitly skipped a stuck History push for the same reason. So an edit made from the Dashboard, a location roster, or the Edit form — without ever visiting History or Settings afterward on that device — correctly updated and synced the live asset record (which is why the Dashboard's Last Updated Asset card looked right), but its matching History line sat queued locally, invisible to Drive and every other device, indefinitely. Fixed by having a History-writing edit pull (or create) the shared archive itself the moment it is needed, instead of waiting for a human to happen to open History or Settings first; the background watchdog now also retries that pull if it failed once (e.g. a brief offline moment), instead of only ever retrying the push half of it. No visible UI change — this only affects how reliably History reaches Drive in the background.

---

### v4.31 · MINOR · 2026-09-10

**History page now has Date/Action/Condition filters. Deleting an asset is now Administrator-only everywhere in the app — a Standard Manager account pressing Delete now files a request (with a required reason) for the Administrator to approve or decline from Settings, instead of deleting anything directly.**

History: added Action, Condition and From/To Date filters alongside the existing search and sort, with a live result count and a one-click Clear. Viewing/editing an asset from a History row (the eye icon, which actually opens the full Edit form) and deleting a History record are now Administrator-only actions — Print and PDF export stay available to everyone since those are read-only reporting, not edit access. Deletion requests: every place an asset could be deleted (the Edit form Delete button, Location roster Delete Selected, and deleting a single condition-split entry) now checks the signed-in account. The Administrator account keeps deleting directly, exactly as before. Any other signed-in account gets asked for a reason instead, and that becomes a pending request — Asset Number, Name, Location, Category, Qty, Condition and Reason — that syncs to Drive like everything else, so it reaches the Administrator from whichever device they next check. A new Deletion Requests section in Settings (Administrator only) lists pending requests with Approve (performs the deletion) and Decline (dismisses it) buttons, plus a short history of recently resolved ones, and the Dashboard shows a clear banner the moment a request is waiting. Each request also has a one-click email link pre-filled with its details — true automatic email sending would need a third-party email service wired in, which is not currently part of this app, so this is a manual send rather than a background one for now.

---

### v4.30 · PATCH · 2026-09-10

**Removed the built-in demo/sample-data seeder entirely.**

The app used to auto-populate 6 sample assets (Office Chairs, Commercial Refrigerator, Backup Generator System 20kVA, Smart LED Television 43 inch, Cotton Bath Towels, Rattan Lounge Sofa Set) on any completely empty database, meant only to avoid a blank screen on a brand-new install. That check ran on every boot regardless of cloud connection state, and its writes were not exempt from the normal sync path — so on a device with empty local storage that had not yet finished pulling the real database down from Drive, it could seed those demo items locally and then genuinely push them into the live shared database, where the multi-device merge introduced in v4.27 would keep them rather than overwrite them away. Removed the function and its boot-time call outright rather than trying to gate it more carefully, since a production app in daily real use never needs a first-run demo seed. Also trims the file size slightly.

---

### v4.29 · MINOR · 2026-09-10

**Last New Item Received now goes strictly by Purchase Date and never invents one; a new Bulk Correct Existing Records tool updates fields like Purchase Date from a corrected spreadsheet without ever touching Asset Numbers or creating new items; and weekly/monthly automatic backups no longer get modified after the fact when more than one device is in use.**

Purchase Date: new items now start with a blank Purchase Date instead of defaulting to today, so nothing gets recorded that was never actually entered. Last New Item Received reads live asset records directly and picks whichever one has the newest Purchase Date, skipping any item with no Purchase Date at all, and the card now labels the date shown as Purchased for clarity. New in Settings: Bulk Correct Existing Records — export the current inventory as Excel or CSV (already has an Asset Number column), correct fields by hand in a spreadsheet, and re-import that file here. Matching is by exact Asset Number; a row whose number is not found is skipped and reported rather than turned into a new item, Asset Numbers are never reassigned by this tool, and a blank cell always leaves that field exactly as it was rather than clearing it, so a partly-filled-in sheet is safe to re-import as many times as needed. Backup scheduling reworked: weekly and monthly backups are now checked against what actually exists on Drive rather than a per-device memory of what has run — once a file exists for the current week or month, nothing touches it again for the rest of that period, from any device, closing the gap that let a second device quietly overwrite an already-finished weekly or monthly snapshot. Daily backups still update freely whenever a real edit is saved, exactly as before.

---

### v4.28 · PATCH · 2026-09-10

**CRITICAL FIX: found and fixed a bug from v4.27 that had the app continuously syncing to Drive even with zero edits — a background merge step was mistakenly re-triggering itself in a loop. Also: Last New Item Received now goes by Purchase Date instead of data-entry date, Asset Numbers get an extra collision check at the moment they are generated, and a duplicate-number warning now shows right on the Dashboard instead of only appearing when the Settings check is run manually.**

The continuous-syncing bug: v4.27 added a merge-before-push step so a concurrent edit from another device could not get silently overwritten. That merge step cleared and rewrote the local assets store as part of its own bookkeeping, and did so using the normal write function instead of the internal, non-syncing variant used everywhere else in that same step — so every push (even one triggered by nothing more than the routine 20 second background check) re-armed its own push timer for another 500ms later, forever, with no real edit anywhere in the loop. This is now fixed at the exact line that caused it, verified end to end. Last New Item Received: now shows whichever asset has the most recent Purchase Date, reading live asset records directly rather than a History log entry — this also sidesteps any risk of showing stale info if an item was later renamed or renumbered. Asset Number generation now cross-checks the candidate number against every asset number currently in memory before handing it out, on top of the existing per-year counter, closing the gap that let two devices generate the same number close together. Because a QR code already printed and stuck onto an item can never have its number changed after the fact, the app does not auto-renumber anything silently in the background even when it finds a conflict — it surfaces a clear warning banner on the Dashboard the moment one exists, linking straight to Settings, Data Integrity, where a person can review which item actually has a sticker on it before confirming which one gets the new number.

---

### v4.27 · MINOR · 2026-09-10

**Found and fixed the real cause of an Asset Number being reused between two different items — sync now merges instead of overwriting when more than one device is signed in. Also: Dashboard Last Updated/Last New Item cards are now clickable with images, and Save on the Edit form no longer logs a History entry when nothing was actually changed.**

Root cause of the asset-number bug: two devices open around the same time could each add a new item within the same ~20 second poll window. Every push was a plain overwrite of the whole assets list, and every pull did a full clear-and-replace from whatever Drive returned, so whichever push landed second could silently erase the other device's new item from the live file (History kept a record either way, since History merges instead of overwriting, which is exactly why the Dashboard card still showed the old item). The asset-number counter itself was also purely local per device, so two devices could independently generate the same next number for two completely different items. Fixed by merging assets and the counter by id (newest edit wins) on every push and every pull instead of overwriting, with a proper deletion record so a merge cannot resurrect something a device deliberately deleted. Also added a Data Integrity checker in Settings (Check for Duplicate Asset Numbers) as a safety net, since two saves within the exact same fraction of a second could still theoretically collide — it finds any number shared between two differently named items and reassigns a fresh number to the older one with a History entry noting why. Dashboard: Last Updated Asset and Last New Item Received now look up the live current record instead of a frozen History snapshot, show the asset photo, location, category and condition, and are clickable straight into the Edit form with a hover highlight. Edit form: Save now compares the form against the untouched original before writing anything — if nothing on an existing item actually changed, it behaves as a plain close (same navigation, a "No changes made" toast) instead of writing an identical record and logging a no-op "updated" History entry.

---

### v4.26 · PATCH · 2026-09-10

**Fixed automatic backups creating duplicate files when more than one device (phone, PC, etc.) is signed in and runs its backup check around the same time.**

Each device tracked its own last-backup-run date locally, so when two devices were open and signed in around the same day, each one independently created a brand new Drive file for that day/week/month, even though a good one already existed. Google Drive itself allows several files to share the exact same name, so this did not fail loudly, it just quietly produced 2-3 duplicate objects per period. Google Drive for Desktop then has to disambiguate those identically-named files when it downloads them onto an actual Windows folder, which is where the "(1)" and "(2)" suffixes seen in the Backup folder came from. Fixed by making the backup write idempotent: before saving, it now looks for a file already named exactly right for that period, updates that one in place instead of creating a new one, and removes any leftover duplicates it finds along the way. This self-heals the existing clutter automatically the next time any signed-in device runs its backup check, and prevents new duplicates going forward no matter how many devices are open at once.

---

### v4.25 · MINOR · 2026-09-10

**Added automatic daily/weekly/monthly full-database backups to a Backup folder on Drive, plus continued digging on the "JSON not updating" report — this update on its own does not explain a report of the live file staying untouched for many days, see the note below.**

New Automatic Backups panel in Settings: a complete point-in-time snapshot (assets, History, Settings, changelog) now saves itself to My Drive/WebApps/AssetsApp/Backup — one file per day, one per ISO week, and one per calendar month — every time the app is open and signed in, with old copies rotated out automatically (14 daily, 8 weekly, 12 monthly kept). A Run Backup Now button and a status line showing the last daily/weekly/monthly run date were added alongside it. This is separate from, and does not replace, the live-sync JSON files. Important note on the ongoing "JSON file is not updating" report: a screenshot showed the live gaia_lake_inventory.json and gaia_Asset_history_archive.json on Drive genuinely unchanged for around two weeks even though items were being added during that window in the app. The two most likely explanations are (1) the browser tab in use has been open a long time and is still running an old, pre-fix build of the code from before v4.23, or (2) the updated files from v4.22 through v4.24 have not yet been uploaded to the live GitHub Pages site. A hard refresh (or fully closing and reopening the browser tab) after confirming the live site is on v4.25 is the next thing to try, and the version number shown in the sidebar after that refresh confirms which build is actually running.

---

### v4.24 · PATCH · 2026-09-10

**Fixed the "Last synced" and history-archive timestamps on the Settings page not updating even though the underlying JSON was syncing correctly the whole time.**

Root cause: the "Last synced HH:MM:SS" line (and a matching new "History archive last synced" line) on the Settings page was only ever written once, at whatever moment that page's template last rendered. A background push or pull correctly updated the sync dot/status word (via setCloudStatus) and correctly wrote the new content to gaia_lake_inventory.json / gaia_Asset_history_archive.json on Drive — but that one specific timestamp paragraph never got touched again until the user navigated off Settings and back, so it looked frozen even while every sync underneath it was succeeding. Both timestamp lines now have their own element and patch themselves directly on every push, pull, and reconnect (active file, history archive, and the case where another device's change gets pulled in) instead of waiting for a full page re-render.

---

### v4.23 · PATCH · 2026-09-10

**Fixed Notes repeating 2-3x on a merged multi-condition 3APP block, added a true 1"×1" QR Code Label sheet (Category/Location filters, name+location+number under each code) for pasting on physical assets, made the in-app QR code click-to-enlarge for scanning, and hardened Google Drive sync so a silently-expired session can no longer leave the live JSON (or the history archive) stuck stale without any visible warning.**

Notes: the 3APP merge step used to join every condition-split's note even when they were identical copies of the same text (common when a Split just carries the note forward) — printing the same sentence 2-3 times. Now dedupes by trimmed text before joining, so a shared note prints once. QR Labels: new "QR Code Labels" section on Print & Export generates a grid of true 1"×1" (25.4mm) QR codes on A4, each with the asset name/location/number printed underneath for identification, filterable by Category and/or Location with a live match count, previewable or downloadable — works fully offline (no photo/Drive dependency) and dedupes by Asset Number so a Split doesn't print 3 near-identical labels for one physical item. QR Enlarge: the QR code on the Edit Item form is now clickable, opening a 260x260px enlarged view (reusing the same lightbox pattern as photo zoom) that a phone camera can actually focus on and scan, with the asset name/number shown underneath. Cloud sync (critical): traced a real failure chain — the ~1hr access token's background silent refresh had no retry if it ever failed once (a blocked silent prompt, a backgrounded browser tab, an expired session), so refreshing simply stopped forever; meanwhile the periodic 20-second sync poll silently swallowed ALL errors including auth failures, and "connected" was never reset to false on failure, so the sidebar kept showing green "Live-synced" indefinitely while every push to both gaia_lake_inventory.json and gaia_Asset_history_archive.json quietly failed in the background — exactly matching "JSON not updating with no warning". Fixed with a proactive ensureFreshAccessToken() check before every sync call, automatic retry-with-backoff on a failed refresh instead of giving up permanently, and a new visible "Reconnect needed" state (banner + red sidebar dot) the moment a refresh genuinely fails, replacing the silent, permanently-stale "Live-synced" label.

---

### v4.22 · PATCH · 2026-09-10

**Six corrections to the 3APP reference sheet — true 1:1 logo sizing, condition color-coding, full Notes text, one merged block per Asset Number with a condition/qty breakdown instead of duplicate rows, and a Print & Export selection list that no longer jumps to the top on every tick.**

Logo now prints at its true aspect ratio everywhere it appears in a generated PDF (3APP header and the Full Manifest / PDF with Images letterhead) instead of being stretched into a fixed box. The 3APP header title is now "ASSET REFERENCE SHEET" in all caps, with the "3 Per Page" subtitle removed. Condition is now shown as a small colored pill on the 3APP sheet, using each condition's own badge color (matching the on-screen Usable/Unusable/Damaged/etc. colors) instead of plain black text. The Notes field is no longer hard-capped at 2 lines — it now prints as much of the note as fits the generous row height, only truncating with an ellipsis in the rare case a note is genuinely too long for the space. Biggest change: when the assets selected for a 3APP sheet include the same Asset Number split across multiple conditions (e.g. one number with separate Usable/Unusable/Damaged quantity records), those are now merged into a single asset block with one condition/qty pill per split, instead of printing as several near-identical, confusingly-numbered rows. Finally, ticking a checkbox, using Select All, or clearing selection in Print & Export no longer re-renders the whole page — it updates the selection count and checkboxes in place, so the scrollable asset list stays exactly where you left it.

---

### v4.21 · MINOR · 2026-09-10

**New "3 Assets Per Page" (3APP) print/PDF format, QR codes on every asset (auto-generated + scannable from the Dashboard), and a fix for assets showing as "Untitled Asset" when printed from History.**

Fixed the root cause of "Untitled Asset": printing or exporting a PDF from a History row was passing the raw history log entry into the sheet template instead of the live asset record — a history entry doesn't carry the full set of fields (name, category, price, etc.), only what changed at that point in time, so most of the sheet came out blank. It now looks up the live asset by number first (same pattern already used correctly for the History row's Edit action) and only falls back to the bare history entry if the asset no longer exists. Added a new "3APP" print/PDF format: a full A4 page (0.75in margins, header and footer each under 1in) split into exactly 3 asset rows, each with a square (1:1) photo at the left margin and full detail alongside it — Category, Location, Quantity, Condition, Price, Purchase Date, Vendor, Last Updated, Notes — separated by a thin rule, with the page disclaimer and page/date info moved into a single shared footer instead of repeating per asset. Print & Export now has tick-box selection (with a location-scoped Select All) so a specific set of assets can be chosen, then previewed as a PDF before downloading. Added a QR code to the Edit Item form, auto-generated from the asset number (appears once the item has been saved and has a number), plus a Print button there that opens a 1-item 3APP sheet directly. Added a Scan QR button next to New Item on the Dashboard (and the mobile header) — opens the camera, decodes a QR code from an asset's label, and opens that asset's Edit form directly if a match is found.

---

### v4.20 · MINOR · 2026-09-10

**The individual asset print/PDF sheet is now A5 (half of A4) instead of a full A4 page — same photo and full details, roughly half the paper.**

Redesigned the single-asset sheet (used by the Print and Export PDF actions on History rows) for a 148x210mm (A5) page instead of full A4: a full-width photo band up top rather than the old side-by-side split (which would leave the photo too small to be useful at A5 width), followed by a compact two-column grid of every field — Category, Location, Quantity, Condition, Purchase Price, Purchase Date, Vendor, Last Updated — and Notes. Remarks is intentionally left off the printed/exported sheet (it still shows anywhere the item itself is otherwise displayed) since it was called out as internal-only detail not needed on a paper reference sheet. A5 was chosen over quarter-A4 (A6) specifically because A6 is too small to fit a photo plus this many fields at a legible size without cutting content. The Download PDF button always produces a true 148x210mm file regardless of device; the browser Print button targets the same size but depends on the device/browser choosing to honor it, which varies (solid on Chrome/Edge, inconsistent on some mobile browsers) — Download PDF is the reliable one if the printed size matters.

---

### v4.19 · PATCH · 2026-09-10

**Fixed a mobile-only "database connection is closing" error shown right after signing in to Google Drive.**

Signing in pulls the full inventory from Drive and writes every record into the local database in one continuous burst — for a ~200-item inventory, that's roughly 200 database writes back to back. The app held a single database connection opened once at startup with no way to recover if it was ever closed. Mobile browsers are far more aggressive than desktop about force-closing an idle or backgrounded IndexedDB connection under memory pressure, and a long, uninterrupted burst of writes right after opening the app is exactly the kind of moment that can trigger it — hence why this only ever showed up on phones, never on PC. It was harmless in the sense that the write which failed simply hadn't landed locally yet, but showed a scary red error and depended on the user retrying to fully catch up. Fixed by having the app notice when its database connection has been closed out from under it and transparently reopen and retry, once, before giving up — silently, since this is a normal recoverable condition on mobile rather than something that needs to alarm anyone.

---

### v4.18 · PATCH · 2026-09-10

**Fixed Export as Excel/CSV silently doing nothing when an asset's photo was stored inline rather than as a Drive link, and added the version number to the mobile hamburger menu (desktop sidebar already showed it).**

exportAssetsToExcel()/exportAssetsToCsv() had no error handling at all. Excel enforces a hard ~32,767-character limit per spreadsheet cell, and the SheetJS library throws on anything longer; any asset whose photo happened to be stored as a raw embedded image (from before it had a Drive connection) rather than a short Drive link would blow past that limit and throw — with nothing catching it, the whole export died with zero feedback, which is why clicking the button appeared to do nothing at all. Fixed two ways: embedded photos now export as a short readable note ("Photo saved in-app — not included in spreadsheet export") instead of the raw data, since dumping a giant base64 blob into a cell was never useful even when it didn't crash; and both export functions are now wrapped in proper error handling, so any future failure shows a clear error toast instead of failing silently. Also added the app version number to the bottom of the mobile hamburger menu, matching the desktop sidebar (which has always shown it there) — it was previously only visible on mobile by scrolling all the way to the page footer.

---

### v4.17 · PATCH · 2026-09-10

**Replaced the Tailwind Play CDN script with a small pre-built, minified stylesheet — faster load, no more production-mode console warning.**

The Tailwind Play CDN (<script src="https://cdn.tailwindcss.com">) is meant for prototyping — it ships the entire Tailwind engine to the browser and re-compiles CSS live on every page load, which is why it printed a "cdn.tailwindcss.com should not be used in production" warning in the console and added load weight for something that never actually changes at runtime (the app doesn't modify its own class names on the fly, so there was nothing to justify recompiling in the browser). Replaced it with a single style.css built once, ahead of time, using the real Tailwind CLI scanning this exact file for every utility class actually in use — including ones only ever set from inside the app's JavaScript (conditional classes, dark mode, arbitrary values like the photo lightbox's z-[999] and bg-black/85) — so nothing that was working before should look any different. Deploy style.css to GitHub Pages in the same folder as index.html, alongside it, not instead of it.

---

### v4.16 · PATCH · 2026-09-10

**Fixed the new photo lightbox not opening on click (cursor changed, but nothing happened).**

v4.15 wired each photo's click-to-enlarge using an inline onclick="..." HTML attribute. The whole app runs inside its own self-contained function wrapper (so its internal names don't leak into or collide with anything else on the page), but inline onclick attributes always run against the page's global scope, not that wrapper — so the browser could never actually find the function to call. This failed completely silently (no visible error), which is why the cursor still correctly showed the zoom icon on hover (pure CSS, unaffected) while the click itself did nothing, and right-click → Open image in new tab still worked (a native browser feature with no dependency on the page's own code). Fixed by switching to a single delegated click listener registered up front, which stays inside the app's own scope and needs no global exposure — every photo now just carries a marker attribute to opt in, and the fix applies uniformly to all four locations from v4.15 (card thumbnail, edit form preview, A4 preview, Print & Export preview).

---

### v4.15 · MINOR · 2026-09-10

**Click any asset photo to view it full-size, and a new "Unusable" condition (blue) added alongside Usable/Damaged/In Repair/Discarded/Missing.**

Every asset photo shown anywhere in the app — the roster/location group card thumbnail, the Edit Item form's image preview, the live A4 print preview panel, and the Print & Export Manifest Preview's Photo column — now opens a full-size view in a dark overlay on click (Esc, clicking outside the image, or the × button closes it). Added a new Condition option, "Unusable" (dark blue #0000FF background, white text), alongside the existing five — it appears automatically everywhere Condition is used (Edit Item form, Dashboard condition filters/counts, Print & Export, Excel export, Settings condition reference) since those all already read from the single shared condition list rather than a hardcoded set.

---

### v4.14 · MINOR · 2026-09-10

**Added a "Has Image" sort option, a Photo column on the on-screen Manifest Preview, and a View PDF with Images preview — all so photo coverage can be checked before printing anything.**

Print & Export → Sort By now has a "Has Image (Images First)" option, which groups every asset with a photo at the top and everything missing one at the bottom (each group keeps its own alphabetical order by name) — makes it easy to see at a glance, or work through, which assets still need a photo taken. The on-screen Manifest Preview table (the live list above the PDF buttons) now shows a small Photo column with either the actual thumbnail or a "No Image" label per row, so photo coverage can be checked instantly without generating any file at all. Added a "View PDF with Images" button next to the existing "PDF with Images" download — opens the same photo-inclusive manifest in a new browser tab for review, without saving anything to disk, mirroring how the plain "View PDF" button already works for the text-only manifest.

---

### v4.13 · PATCH · 2026-09-10

**Fixed almost every photo showing "No Image" in the new PDF with Images export.**

v4.12's photo loader used a plain cross-origin <img> tag (with crossOrigin="anonymous") to pull each asset's photo off Google Drive before drawing it into the PDF. Google's Drive thumbnail/content endpoints generally don't send the CORS headers a browser needs to read pixel data out of a cross-origin image into a canvas — the image either refuses to load at all once crossOrigin is set (silent failure, printed as "No Image"), or loads but leaves the canvas "tainted" so reading it throws. This is why only a small handful of photos came through (the ones stored as an inline data: URI rather than a Drive link) while every genuinely Drive-hosted photo failed silently. Fixed by fetching each photo's bytes directly from the authenticated Drive API — the same Bearer-token connection already used for the JSON master files — instead of an anonymous browser image request; the fetched bytes are loaded as a same-origin blob so the canvas is never tainted. This needs an active Drive sign-in to work (since it authenticates the same way the rest of the app does), so the PDF with Images button now shows a clear message asking you to sign in first if you click it while offline, rather than silently printing every row as "No Image".

---

### v4.12 · MINOR · 2026-09-10

**New "PDF with Images" export on Print & Export, and the manifest PDF header now leads with a centered company logo.**

Added a "PDF with Images" button next to Download Full PDF on the Print & Export page. It builds the same Asset #, Name, Category, Location, Qty, Condition, Updated table as the standard manifest, with a photo column added on the left of every row at a genuinely readable size (not a postage-stamp thumbnail) — each row is drawn tall enough to fit it, and a missing/broken photo prints "No Image" in that cell rather than failing the whole export. Photos are fetched in small batches (6 at a time) rather than all at once, with the button label showing live progress ("Loading photos… 40/210") since a large inventory can take a moment; each photo is downscaled and re-encoded as JPEG before embedding so a few-hundred-asset PDF stays a reasonable file size instead of ballooning. Also restructured the manifest header on both the standard and photo PDFs into a centered letterhead — logo centered at the top (previously small and top-right), with company name, address, and contact line centered beneath it — for a more professional, print-shop look; the report title, location filter, and item count still sit left/right beneath that on their own line.

---

### v4.11 · PATCH · 2026-09-10

**Fixed a cloud-sync gap where an edit could get silently queued and never actually pushed to Drive with no error shown; added a Go-Live Reset in the Danger Zone.**

scheduleActiveCloudPush()/scheduleHistoryCloudPush() correctly defer a push (marking it "dirty") whenever a pull is mid-flight or sync isn't ready yet — but nothing was guaranteed to retry a deferred push afterward except the next sign-in or a manual Sync Now click; the 20-second poll only ever checked for incoming remote changes. If a save happened to land in that window, it could sit queued indefinitely with the Drive file's timestamp never updating and no error toast, since nothing had actually failed — it was just waiting on a retry that never came. pollCloud() now also flushes any pending dirty push/history-push on every 20-second tick, so a deferred write can no longer get silently stuck. Added console logging around every push gate/attempt/result for easier diagnosis going forward. Also added a Go-Live Reset button to Settings → Danger Zone (Administrator only): unlike Delete All Records (which intentionally keeps History for audit), this wipes assets AND History AND resets the Asset Number counter back to the start, then immediately force-pushes the clean state to both Drive files — for starting a fresh production launch with zero test data on all devices at once.

---

### v4.10 · PATCH · 2026-09-10

**Method C's Take/Choose Photo split into two explicit buttons — Camera and Gallery/Files — so camera access no longer depends on the phone's OS picker deciding whether to offer it.**

On Android 13+, Chrome routes a plain image file input (no capture attribute) through Android's newer Photo Picker API instead of the classic chooser sheet — and depending on the phone/OEM, that picker sometimes omits the Camera shortcut entirely and opens straight into Google Photos, which is exactly what was being reported on a newer phone while an older phone (still on the classic chooser) kept showing both options. This can't be reliably controlled from the app's JS once it hands off to the OS picker, so instead of one combined button, Method C now has two dedicated buttons: Camera (its own file input with capture=environment, guaranteed to open the camera on every device) and Gallery / Files (a separate plain file input for picking an existing photo). Both feed into the exact same compress-and-upload pipeline as before, so upload/overwrite/cache-busting behavior is unchanged.

---

### v4.9 · PATCH · 2026-09-10

**Fixed a regression of the v4.6 fix: after a Method C upload, saving the item was silently stripping the cache-busting parameter from the photo link, so the asset showed the old cached photo again right after "Item saved successfully."**

This is the same class of bug as v4.6, resurfacing through a different path. convertImageUrl() — which normalizes any Drive link typed or set into the image URL field into a canonical thumbnail URL — runs on every Save (via readFormIntoEditing), not just on manual Method B pastes. It rebuilt the URL from scratch using only the extracted file ID, discarding any other query parameters in the process. Since Method C's own upload flow stamps a cache-busting &t= timestamp onto the link it writes into that same field, saving the item immediately after taking a photo ran that freshly-stamped URL back through convertImageUrl() and silently dropped the &t=, reverting the field to the bare (already browser/Drive-cached) URL — even though the actual file on Drive was correctly updated. Fixed by having convertImageUrl() detect and preserve an existing &t= parameter when one is present, instead of only ever emitting a bare id+sz URL. Audited every other call site and construction point for this same URL to confirm this was the only place still capable of dropping it.

---

### v4.8 · PATCH · 2026-09-10

**Fixed a 403 permission error on Method C's Clear button: it now moves the photo to the "Items Deleted" Drive folder (same as asset delete) instead of trying to permanently delete it outright, which was failing for anyone who wasn't the file's original owner.**

Clear (Method C, Mobile Camera) previously called Drive's files.delete, which requires owning the file — plain Editor access to the shared folder is not enough. If a photo was originally uploaded from a different signed-in Google account than the one currently clearing it, Drive correctly refused with a 403 ("The user does not have sufficient permissions for this file"), and the app surfaced that raw error instead of recovering. Clear now performs the same reparent (move-between-folders) operation already used when an asset is deleted — moving the file into "Items Deleted" instead of the original ItemsImages folder — which only requires Editor access to the folder, not ownership, so it now works for any signed-in user regardless of who originally uploaded the photo. The confirmation wording was updated to match: it now describes moving the photo to Items Deleted for Administrator review, rather than claiming an irreversible permanent delete that the app was never actually guaranteed to be able to perform.

---

### v4.7 · MAJOR · 2026-09-10

**New Asset Number format (YY####, permanent and independent of Location/Category), Duplicate Asset confirmation, ascending dropdown order everywhere, a proper picker on Method C (camera or gallery/files), and deleted-asset photos now move to an "Items Deleted" Drive folder instead of vanishing.**

Asset Number format changed to YY#### — YY is the current year, #### is a 4-digit sequential counter starting at 0000, assigned once at New Item or Duplicate Asset and never regenerated again. Removed the old coupling to Location/Category entirely: renaming a Location or Category, or moving/recategorizing an asset (including bulk Move/Recategorize), no longer changes its Asset Number — the number is now a permanent identity that survives the asset moving anywhere. Clicking Duplicate Asset (from any list in the app) now shows a confirmation — "You want to create NEW asset? A NEW asset number will be created." with YES/Cancel — before creating the copy with its own fresh number. All dropdowns and pill lists that list Categories or Locations (Settings, the Edit Form, Dashboard filters, Print & Export) are now sorted ascending by name automatically, sourced from a single sort point so new lists stay sorted with no extra work. Method C's "Take / Choose Photo" button no longer forces the camera open directly — it now shows the normal picker so a photo can be taken live or chosen from the gallery/files. Deleting an asset (single delete, bulk-selected delete, or Delete All) no longer permanently deletes its Method C-managed Drive photo — the file is moved into a new "Items Deleted" folder instead, for the Administrator to review and clear manually; a still-in-use sibling split/batch row sharing the same photo is detected and skipped. If a Method B pasted Drive link points to a file sitting in Items Deleted, it's automatically moved back into ItemsImages to avoid a duplicate copy — note this one only works for Method B's manual link paste, since a native file/camera picker has no way to know a photo came from a specific Drive folder; true drag-and-browse selection from within Drive would need a separate Google Picker API integration.

---

### v4.6 · PATCH · 2026-09-10

**Fixed a bug where retaking a photo via Method C would successfully replace the image on Google Drive, but the form kept showing the old picture.**

Root cause: when Method C overwrites an existing photo, the File ID and filename intentionally stay identical (that's the whole point of v4.5's upsert), which meant the thumbnail URL saved on the asset was also byte-for-byte identical after every retake — so the browser (and Google's own thumbnail cache) just kept serving the old cached image for that same URL instead of fetching the new one. The saved thumbnail link now includes a changing cache-busting parameter on every upload/overwrite, forcing both the browser and Drive's thumbnail cache to treat it as fresh content — the form (and anywhere else that image is shown) now reflects the new photo immediately after a retake. The File ID and filename in Drive are unaffected and still stay identical, as designed.

---

### v4.5 · MINOR · 2026-09-10

**Method C (Mobile Camera) is now a true one-image-per-asset slot: retaking a photo overwrites the same Drive file in place instead of creating a new one, and Clear now permanently deletes the Drive file (with a confirmation warning) instead of just unlinking it — no more orphaned "dead" images piling up in Drive.**

Reworked Method C's upload flow into a proper upsert: if this asset already has a Method C-managed photo, taking a new one now sends a PATCH to overwrite that exact Drive file's binary content — same File ID, same filename, same thumbnail link, only the image content and captured-at timestamp change. A brand-new capture (no existing photo) still creates a new file as before. Renamed the "Retake / Clear" button to "Clear" and changed what it does: clicking it now shows a hard warning ("CRITICAL: This will permanently delete the image from Google Drive and remove the link from this asset. This action cannot be undone. Proceed?"), and on confirmation actually deletes the file from Drive (not just the link) before resetting the form back to empty. The "Take / Choose Photo" button stays available at all times, including when a photo already exists — tapping it always opens the camera/picker, and on a successful new capture it automatically overwrites rather than duplicating. Safety scoping: overwrite and delete only ever apply to files this feature itself uploaded (tracked via the asset's own capture ID) — an image pasted in via Method B's manual URL field is never touched by Clear or overwritten by a new Method C capture, since Method C has no way to know if that's a shared/external file. Net effect: Drive's ItemsImages folder stays at exactly one file per asset that has a Method C photo, with no leftover files from retakes.

---

### v4.4 · MINOR · 2026-09-10

**Hardened the mobile/tablet experience: forced cache revalidation so phones stop showing stale builds after an update, added touch-tap feedback to buttons that previously only had a hover state, and prevented the Mobile Camera box's buttons from overflowing on narrow screens.**

The v4.3 Admin Email Guard on Asset Image Method A/B is a single responsive template driven by isAdminSession() — it cannot literally behave differently by device — so the most likely cause of it appearing to "only work on PC" is a phone or tablet browser (especially one added to the Home Screen) serving a cached older build. Added no-cache/must-revalidate meta tags so every visit re-fetches the latest file instead of a stale cached copy. Separately hardened touch usability across recently-added controls: buttons that relied only on a :hover highlight (Take/Retake photo, Edit/Save Configuration toggles) now also have a matching :active state so tapping on a touchscreen gives the same visual feedback a mouse hover gives on desktop; the Mobile Camera box's button row now wraps instead of risking overflow on narrow phone widths. Standing rule going forward: every future update/change must be verified for PC, Mobile, and Tablet layouts, not just desktop.

---

### v4.3 · MINOR · 2026-09-10

**Locked Asset Image Method A (Local Upload) and Method B (Cloud URL) on the Edit Form to the Administrator account only, matching the same lock message and pattern already used for Company Metadata and Branding Logo.**

Method A (Local Upload) and Method B (Cloud URL) in the Edit Form's Asset Image section are now gated behind isAdminSession() — only gaialakewebapps@gmail.com sees the actual controls; every other signed-in account sees the same compact lock notice ("Standard Manager Account: Core system configurations are locked by the Administrator.") already used to lock the Company Metadata and Branding Logo panels in Settings, reusing the identical icon and wording for consistency. Method C (Mobile Camera) stays open to all users, since it uploads straight to a fixed Drive folder rather than accepting an arbitrary local file or URL. Non-admin sessions no longer render the underlying input fields for A/B at all, and the Save flow was hardened to skip reading them when absent instead of erroring.

---

### v4.2 · MINOR · 2026-09-10

**New Method C on the Edit Form: take a live photo on mobile that auto-compresses and uploads straight to your Drive folder, with a permanent capture ID and timestamp — no more bulky inline images.**

Added a third image-capture option to the Asset Image section of the Edit Form, alongside the existing Local Upload and Cloud URL methods: "Method C — Mobile Camera" opens the phone's camera directly (via capture="environment"), instantly previews the shot, downscales it on-device to a max 1000px WebP at 0.7 quality, and uploads that compressed file straight to the shared Google Drive folder — the saved asset record only stores the resulting Drive thumbnail link, not a bulky embedded image, keeping the active-file cloud payload lightweight the same way v4.0's history-archive split did. Each capture gets a permanent identifier in the form IMG-YYYYMMDD-HHMMSS-xxxxxxxx (timestamp plus a short random tag) shown under the preview along with the exact date/time taken — deliberately independent of the Asset Number and Location, since either can change later when an item is renumbered or moved, and the capture record shouldn't. A "Retake / Clear" button appears once a photo is captured, letting the user wipe the shot and try again before saving. Requires being signed in to Google Drive (Settings → Cloud Connection Workspace) since this method uploads directly; the existing Local Upload and Cloud URL methods still work without sign-in as before.

---

### v4.1 · MAJOR · 2026-09-10

**Fixed a version-number regression on cloud sync, rebuilt the manifest PDF as sharp native text with a header/footer on every page, fixed unreadable Category/Location pills in Dark Mode, added Asset Name type-ahead search on the Dashboard, and added Edit/Save locks to Cloud Connection and Company Metadata settings.**

Fixed an important bug where signing in on a device could silently roll the displayed app version number backward (e.g. showing v3.3 again after already running v4.0) — a stale version number cached in an old Drive file could overwrite the correct locally-known version on login; the version number is now only ever allowed to move forward on sync, never backward. Rebuilt the Full Inventory Manifest PDF (View PDF / Download Full PDF) from a rasterized screenshot into real, sharp PDF text with proper pagination via jsPDF-autotable — rows can no longer be sliced in half across a page break, and Company Metadata (name, address, contact info, logo) now repeats as a header with "Page X of Y" plus the printed date/time repeating as a footer on every single page, all inside a true 0.75in margin. The on-screen Manifest Preview (Print & Export page) now shows the complete filtered list in a scrollable table instead of capping at 8 rows with a "+N more" notice. The browser Print path also got a fix to stop table rows from being cut in half across a printed page. Fixed a Dark Mode bug where Asset Categories and Storage Locations pills in Settings were unreadable — a broad text-color rule was silently overriding their intended accent color, leaving near-invisible text on a pale background; both now use dark-safe, readable colors. The Dashboard filter bar on the All-Time Condition Breakdown roster now has an Asset Name type-to-search box with live matching suggestions (backed by a datalist of existing names) instead of a plain dropdown, and matches partial text rather than requiring an exact pick. Added an Edit/Save lock to the Cloud Connection Workspace (the existing Save Configuration button now doubles as the toggle: Edit Configuration unlocks the three fields, Save Configuration saves and re-locks them) and a new matching Edit/Save toggle on the Company Metadata panel, so neither section can be changed by an accidental click or tap — both default to locked/read-only.

---

### v4.0 · MAJOR · 2026-09-10

**Cloud sync overhaul: fixed a login race that could let stale offline data overwrite the shared Drive file, and split the history/changelog log into its own lightweight file.**

Fixed a Cloud Sync priority bug: on sign-in, the app now guarantees a full pull FROM Google Drive lands on the device FIRST, and blocks every auto-sync push until that pull has completed — closing a race where stale local/offline data could momentarily overwrite the shared Drive file right after login, before the fresh remote copy had finished loading. Restructured cloud storage into two Drive files: gaia_lake_inventory.json now holds only active assets, Settings, and current state, and stays small and fast on every login, edit, and 20-second background sync; the full History action log and version changelog moved to a new gaia_Asset_history_archive.json, which is only fetched from or pushed to Drive the first time the History page or Settings (where the changelog lives) is opened in a session. History and changelog entries merge across devices instead of overwriting, so nothing recorded on another device is lost when this device's archive loads. Everyday sync payloads are meaningfully smaller as a result, with no change to how assets, History, or the changelog look or behave on screen.

---

### v3.5 · MINOR · 2026-09-10

**Quality pass: consistent Asset Number wording, more dark mode fixes, real 0.75in PDF margins, and name/location/category autocomplete.**

Full app review for consistency, dark mode coverage, print/PDF output, and cross-device compatibility. Standardized a few toast messages that said "item number(s)" to "Asset Number(s)" to match the term used everywhere else (Asset #, Asset Number, Asset Name are the only names used across the whole app — nothing is called an "Item Number"). Dark Mode: fixed the Dark Mode toggle's own switch knob turning invisible against its track, and fixed a couple of hover effects (on category/location edit icons and the cloud Sync Now button) that were being forced to a solid dark block instead of their intended subtle highlight. PDF export (Print & Export → PDF, and single-item manifest PDFs) now has a real 0.75in margin on every side of every page, matching the existing browser Print output — previously the PDF path placed content edge-to-edge with no margin at all, which is what was cutting text at the page edge. Typing a new Asset Name, Category Name, or Location Name now suggests matching existing entries to pick from — same type-ahead already used for Sub-category — so it's easy to reuse "Main Kitchen" instead of accidentally creating a near-duplicate "Kitchen".

---

### v3.4 · MINOR · 2026-09-10

**New Information page for condition definitions, dark mode readability fixes, and a downloaded-summary layout fix.**

Added an Information page to the sidebar, right before Settings — a quick-reference "Assets Condition Definition" table explaining what each status means (Usable, Unusable, Damaged, In Repair, Missing, Discarded), with each row color-matched to that condition's badge color used everywhere else in the app. Fixed two Dark Mode readability bugs: the Asset Groups stat card's number became invisible while its roster was open, because the active-state highlight used a background color the dark-mode styles didn't know to re-color — it now uses a proper dark-aware highlight class. Separately, every condition badge (the All-Time Condition Breakdown pills, the roster table's Condition column, History, and the new Information page) was rendering with pale light-mode background colors but the badge's own text color was being silently overridden to near-white by an overly broad dark-mode rule — badges now keep readable, dark-appropriate colors of their own. Fixed the downloaded Month/Year Summary PNG (Download PNG button) where the title could visually overlap the company name row — reduced the title font size, added more spacing, and the export now waits for web fonts to finish loading before capturing the image so layout is measured correctly.

---

### v3.3 · MINOR · 2026-09-10

**Roster table shows condition-matching quantity, and the dashboard roster is easier to spot when it opens.**

Replaced the combined "Qty (Total/Usable)" roster column with two separate columns — Total (the asset group's overall quantity across all conditions) and QTY (the quantity for just that row's own condition, e.g. how many of that item are specifically In Repair or Missing). The Asset Groups stat card now visually highlights on hover and again while its full unfiltered roster is open, so it's clear at a glance what triggered the table below. Clicking Asset Groups or a Condition Breakdown badge now automatically scrolls the roster into view instead of leaving a manager to notice it opened further down the page.

---

### v3.2 · MINOR · 2026-09-10

**Interactive dashboard roster with filters, strict 3-character Location/Category codes, and layout fixes.**

The Dashboard is now a real filterable roster, not just a summary: click the Asset Groups stat card to clear all filters and browse every record, or click any All-Time Condition Breakdown badge to jump straight to that condition. A filter bar sits above the results with independent dropdowns for Asset #, Asset Name, Location, Category, and Condition — combine any of them, and results always stay sorted by Asset #. Each row shows Asset #, Asset Name, Location, Category, Qty (Total/Usable), Condition, Price, and Update Date, with Edit, Split, Duplicate, and Delete actions (Split and Duplicate generate a proper new Asset Number; deletions keep full History for audit). Fixed a bug where a handful of built-in locations (the four Rooms and Pool) had 2- or 4-character codes instead of the strict 3-character format used everywhere else, which produced inconsistent Asset Numbers like "R2-APP-000001" — Location and Category codes are now always exactly 3 letters/numbers for clean, uniform barcoding, and any current records at the corrected locations were automatically renumbered on upgrade (old numbers kept in History for audit). Fixed the Dashboard search bar's magnifying-glass icon overlapping the input text, and fixed the Month/Year Summary card title getting clipped for longer month names.

---

### v3.1 · MINOR · 2026-09-10

**6-digit Asset Numbers, clickable condition roster, Danger Zone lock, and a swappable favicon.**

Asset Numbers now use a 6-digit sequence — [Location]-[Category]-000001 (e.g. MGR-FUR-000001) — instead of 3 digits. The counter is unchanged in behavior: it is tracked separately per Location-Category combination, always advances forward, and a deleted number is never reused. The Company Address default is corrected to "3rd Mile Post, Kandalama, Dambulla, Sri Lanka" (existing installs with the old short default are upgraded automatically; any address you've manually customized is left untouched). The All-Time Condition Breakdown badges on the Dashboard are now clickable: selecting one (e.g. Damaged) filters a new roster table beneath it to just that condition, listing Asset #, Name, Location, Category, Qty (Total/Usable), Condition, Price, and Last Updated, with Edit/Duplicate/Delete actions on every row. The Danger Zone (Delete All Records) is now behind the same Admin Email Guard as the rest of master configuration — other managers see it locked, and the underlying delete function itself refuses to run for anyone but the Administrator account. The hardcoded 📦 emoji favicon was removed in favor of a plain <link rel="icon" href="favicon.png"> reference — drop your own favicon.png next to index.html to brand the browser tab.

---

### v3.0 · MAJOR · 2026-09-10

**Hardcoded production credentials, permanent branding, and an Admin-only configuration lock.**

Google API Key, Client ID, and the target shared Drive Folder ID are now hardcoded into the app itself — no one needs to type them in for cloud sync to work, though an Admin can still override them from Settings if the credentials ever need to change. The company logo, name, address, phone, and email are baked in as the permanent defaults shown across the sidebar header, Settings, and printed A4 manifests, while any values you've already customized are kept exactly as they are. Added an Admin Email Guard: only gaialakewebapps@gmail.com sees the Cloud Connection Workspace, Company Metadata & Logo panels, and the Bulk Import/Export & Data Portability tools in Settings — every other signed-in manager sees a clean "locked by the Administrator" notice in their place instead. Export as CSV was added alongside the existing Excel export for spreadsheet-tool compatibility. Added a one-tap "Refresh Cloud Data" button beside Sign Out in the sidebar so a manager who has been editing for a while can instantly pull in the latest updates from other devices.

---

### v2.0 · MAJOR · 2026-09-10

**Excel export, safe bulk actions, and full Location/Category lifecycle management.**

Added Export as Excel (.xlsx) alongside the existing Excel/CSV import, so data can be shared with anyone who doesn't have web access via a simple import/export round-trip. Added a Danger Zone in Settings to Delete All Records in one confirmed action (History is preserved for audit) — handy right before a fresh bulk import. Locations and Categories can now be renamed directly in Settings: renaming instantly regenerates the Asset Number on every affected record to reflect the new name, while the OLD Asset Number is kept in History for audit and quantities are never touched; a one-step Undo is available immediately after. Locations/Categories can only be deleted once no current records use them, keeping the list to a practical minimum without losing audit history. Added a Select Items mode on each Location page for bulk actions — Move to Location and Change Category now update many records at once instead of one at a time, and Delete Selected removes a chosen batch with a warning. The Sub-category field is now a type-ahead that suggests existing values as you type. Fixed the Settings sidebar icon, which was rendering as a broken/partial gear — it's now the full gear-wheel icon used elsewhere in the app.

---

### v1.5 · MAJOR · 2026-09-10

**Google Drive Live-Sync and one-click Excel/CSV bulk import.**

Added Strategy 2 cloud storage: sign in with Google from the sidebar, connect a shared Drive folder in Settings, and every device reads/writes the same live gaia_lake_inventory.json master file — changes push automatically on every edit and pull in for other authorized devices roughly every 20 seconds, with a manual Sync Now and a clear "Running Offline" banner when signed out. Added Bulk Import from Spreadsheet: upload an existing Excel/CSV file and the app maps flexible column headers (renamed or reordered columns still work), auto-generates a fresh Asset Number for every row from its location and category, and auto-creates any category or location the sheet references that doesn't exist yet — with a preview-and-confirm step before anything is written, so existing records are never overwritten.

---

### v1.4 · MAJOR · 2026-09-10

**Dashboard rebuild, dark mode, and customizable sidebar color.**

Set Damaged to #FFFF00 and In Repair to #FF8000 across badges and charts. Added a search bar to the Dashboard with a live results dropdown. Added an Information section with Last Updated Asset, Last New Item Received, and a Month/Year condition summary card titled "[Month/Year] Summary of Assets and Inventory" — screenshot-ready with its own Download PNG button for sharing reports. Compacted the All-Time condition breakdown into a single chip row and removed the redundant Locations grid (already covered by the sidebar) so the Overview fits one screen without scrolling on desktop. Added a dark, customizable sidebar (color picker in Settings) and a separate app-wide Dark Mode / Light Mode toggle. Fixed a new batch entry incorrectly inheriting its original group's creation date.

---

### v1.3 · MAJOR · 2026-09-10

**Image rendering fix, smarter split workflow, dedicated Print & Export page.**

Fixed a bug where a failed item image would corrupt the card markup and render as garbled text instead of a fallback icon. Fixed the Split Item Condition Cancel button, which was silently unbound when a second "back" control existed on the page. Added an explicit close (X) button to the editor header. Reworked the split workflow so every item starts as Usable by default — entering a quantity for any other condition now auto-deducts from Usable, which always equals the group total, with over-allocation blocked. Unified the History table to a single consistent text size and tighter row spacing. Moved Print & PDF Export out of Settings into its own sidebar page, with a live manifest preview table and a View PDF button that opens a full preview in a new tab before downloading.

---

### v1.2 · MAJOR · 2026-09-10

**One-screen layout, simplified navigation, and reliability fixes.**

Reworked the app shell to fit a single desktop viewport with no page-level scrolling. Removed the live A4 preview from the item editor so New Item / Edit Item forms are fully visible on one screen. Collapsed the sidebar into Dashboard, History, three expandable zone groups (Guest Areas, Operations, Staff & Management), and Settings. Switched the Google Drive image converter to the more reliable thumbnail endpoint with clearer sharing guidance and broken-link detection. Set default currency to LKR (Rs.) and default theme color to #4C9D38. Added a Category column to the History table.

---

### v1.1 · MINOR · 2026-09-10

**Dynamic categories & smart asset codes.**

Categories are no longer fixed: any category added on the Settings page now appears instantly in the New Item form dropdown. The asset numbering engine derives a 3-letter code from the first three letters of a custom category (e.g. Glassware becomes GLA, producing codes like LBY-GLA-001), with automatic de-duplication if a derived code collides with an existing one.

---

### v1.0 · MAJOR · 2026-09-10

**Initial production release.**

Launched the full Boutique Hotel Asset & Inventory Management App: 16-location inventory tracking, dual-image engine (local upload + Google Drive URL converter), split-condition workflow with live Total/Usable quantity calculators, live A4 print preview, history portal, configurable branding & theme color, JSON import/export, and PDF/print export engine.

---
