# Person 3 Implementation Test (Tab Monitoring)

This README tells you exactly:
- What to do
- Where to click
- What to run
- What results you should see

You will run **4 tests**:
- **Test A**: Injection + Extraction
- **Test B**: TAB_DATA → Storage
- **Test C**: Screenshot Capture
- **Test D**: Alarms + Break Notification

---

## Step 0 — Load the Extension (Required)

1. Open Chrome
2. Go to `chrome://extensions`
3. Turn ON **Developer mode** (top-right)
4. Click **Load unpacked**
5. Select folder: `.../what-the-hack---HTE/extension`
6. On your extension card:
   - ✅ No red errors
   - Click **service worker** → opens DevTools (keep this window open)

---

## Test A — Injection + Extraction (MOST IMPORTANT)

### What you do

1. Open a normal webpage: `https://example.com`  
   (**Do NOT** test on `chrome://...` pages or Chrome Web Store)

2. In the **Service Worker DevTools Console**, run:

```js
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tabId = tabs[0].id;
  chrome.tabs.sendMessage(tabId, { type: "FOCUS_CHECK" }, (resp) => {
    console.log("A resp:", resp);
    console.log("A lastError:", chrome.runtime.lastError);
  });
});
```

### What you should see (PASS)

- ✅ `A resp:` prints an object with fields:
  - `url`, `title`, `domain`, `text`, `category`, `timestamp`
  - (`description` may be empty depending on site)
- ✅ `A lastError:` is `null` or `undefined`

### If you see this (FAIL)

- ❌ `Receiving end does not exist`
  - Content scripts didn't inject (check manifest `matches`/path/order)
  - OR page is restricted (chrome://, Web Store, etc.)

---

## Test B — TAB_DATA → Storage Written

### What you do

1. Visit 2–3 sites to generate logs:
   - `https://example.com`
   - `https://wikipedia.org`
   - `https://news.ycombinator.com`

2. In the **Service Worker Console**, run:

```js
chrome.storage.local.get(["tabHistory"], console.log);
```

### What you should see (PASS)

- ✅ `tabHistory` exists
- ✅ It's an array with entries containing:
  - `url`, `title`, `domain`, `text`, `category`, `timestamp`

### SPA navigation check (optional)

1. Open a SPA site (YouTube, Notion, etc.)
2. Click around (URL changes without full reload)
3. Re-run storage query above

**PASS if:** ✅ New entries appear / timestamps update

---

## Test C — Screenshot Capture (Optional but recommended)

### What you do

On a normal webpage (e.g. `https://example.com`), in **Service Worker Console**, run:

```js
chrome.tabs.captureVisibleTab(null, { format: "jpeg", quality: 60 }, (dataUrl) => {
  console.log("C prefix:", dataUrl?.slice(0, 50));
  console.log("C lastError:", chrome.runtime.lastError);
});
```

### What you should see (PASS)

- ✅ `C prefix:` starts with `data:image/jpeg;base64,`
- ✅ `C lastError:` is empty/undefined

### If it fails

- Missing permissions (`tabs` / `activeTab` / `<all_urls>`)
- Testing on restricted pages (Chrome Web Store / `chrome://`)

---

## Test D — Alarms + Break Notification

### What you do

1. In **Service Worker Console**, start a short session:

```js
chrome.runtime.sendMessage(
  { type: "START_SESSION", payload: { taskName: "Test Task", durationMins: 1 } },
  console.log
);
```

2. Immediately verify alarms exist:

```js
chrome.alarms.getAll(console.log);
```

### What you should see (PASS)

- ✅ `chrome.alarms.getAll` prints a list of alarms:
  - `FOCUS_CHECK_ALARM`
  - `BREAK_REMINDER_ALARM`
- ✅ Within ~1 minute, you receive a **Break Time** notification

### If you do NOT get a notification

- Check `notifications` permission in manifest ✅ (already included)
- Check your OS notification settings for Chrome
- Confirm alarms exist (output from `getAll`)

---

## Optional — Backend Call (Only if backend is running)

`alarms.js` calls: `POST {apiBaseUrl}/api/analyze/focus`

### What you do

1. Start backend:
   ```bash
   node backend/app.js
   ```

2. Watch Service Worker Console for fetch logs/errors

### What you should see

- ✅ Requests attempted and responses handled
- If backend route missing: you may see `Focus check API call failed`  
  (Person 3 side still OK — waiting on Person 2)

---

## Pages to AVOID Testing On

| Page Type | Why |
|-----------|-----|
| `chrome://...` | Content scripts blocked |
| Chrome Web Store | Content scripts blocked |
| `file://...` | Needs explicit permission |

Use normal `http://` or `https://` websites.

---

## Quick Reference — Message Types Used

| Message Type | Direction | Handler |
|--------------|-----------|---------|
| `FOCUS_CHECK` | background → content | `contentScript.js` |
| `TAB_DATA` | content → background | `messaging.js` → `storage.js` |
| `SCREENSHOT_REQUEST` | content → background | `messaging.js` |
| `START_SESSION` | popup → background | `messaging.js` → `alarms.js` |
| `END_SESSION` | popup → background | `messaging.js` → `alarms.js` |

---

## Summary Checklist

| Test | Status |
|------|--------|
| A — Injection + Extraction | ⬜ |
| B — TAB_DATA → Storage | ⬜ |
| C — Screenshot Capture | ⬜ |
| D — Alarms + Notification | ⬜ |
