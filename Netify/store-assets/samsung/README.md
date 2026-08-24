# Samsung Galaxy Store Distribution Kit for Netify

This directory contains all metadata, store copy, and specifications required to publish **Netify** to the **Samsung Galaxy Store (Seller Portal)**.

---

## 1. Samsung Galaxy Store Asset Requirements

| Asset | Dimensions | Format | Notes |
|---|---|---|---|
| **App Icon** | 512 x 512 px | PNG 32-bit with Alpha | Square format (Samsung applies the squircle mask automatically). |
| **Promotional Banner** | 1024 x 500 px | PNG or JPG (No Alpha) | Max 1 MB. Displays at top of Galaxy Store app page. |
| **Phone Screenshots** | 1080 x 2400 px or 1080 x 1920 px | PNG / JPG | Minimum 4, Maximum 8 screenshots (9:16 aspect ratio). |
| **Foldable / Tablet Screenshots** | 1536 x 2048 px or 1768 x 2208 px | PNG / JPG | Optional 4 screenshots for Galaxy Z Fold and Galaxy Tab users. |

---

## 2. Generating Release Builds for Samsung Galaxy Store

### 2.1 Generating Signed Android App Bundle (`.aab`) — Recommended for Store Submission
```bash
cd Netify
eas build --platform android --profile production-samsung
```

### 2.2 Generating Universal Signed APK (`.apk`) — Recommended for Direct Device QA
```bash
cd Netify
eas build --platform android --profile production-apk
```

---

## 3. Localized Store Listings Available

The following metadata packages are ready for upload:
- [`metadata.en.json`](./metadata.en.json) — English (Global / Pan-Africa Default)
- [`metadata.ha.json`](./metadata.ha.json) — Hausa (`ha`)
- [`metadata.yo.json`](./metadata.yo.json) — Yoruba (`yo`)
- [`metadata.ig.json`](./metadata.ig.json) — Igbo (`ig`)
- [`metadata.pcm.json`](./metadata.pcm.json) — Nigerian Pidgin (`pcm`)

---

## 4. Samsung Seller Portal Submission Checklist

1. [ ] Log in to [Samsung Galaxy Store Seller Portal](https://seller.samsungapps.com/).
2. [ ] Click **Add New Application** > select **Android**.
3. [ ] Set Default Language to **English (United States)** or **English (United Kingdom)**.
4. [ ] Paste App Title, Short Description, and Full Description from `metadata.en.json`.
5. [ ] Add secondary localized languages (Hausa, Yoruba, Igbo) using their respective JSON files.
6. [ ] Upload 512x512 App Icon and 1024x500 Promotional Banner.
7. [ ] Upload 4–8 phone screenshots.
8. [ ] Under **Binary**, upload the `.aab` produced by `production-samsung`.
9. [ ] Select **Target Countries/Regions** (Nigeria, Ghana, Kenya, South Africa, UK, US, Global).
10. [ ] Set **Age Rating** to All Ages (3+).
11. [ ] Enter Privacy Policy (`https://netify.africa/privacy`) and Support Email (`support@netify.africa`).
12. [ ] Click **Submit for Certification**.
