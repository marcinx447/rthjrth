
# USFinds v2 — pełny plan wdrożenia

## 1. Branding & UI bazowe
- Dodać logo `usfinds.jpg` jako asset i wstawić w `site-header` zamiast tekstu.
- Usunąć pasek kategorii (Szorty/Bluzy/Buty…) z górnej części strony.
- Dodać link do Discorda `https://discord.gg/pFTD4svkTa` w nagłówku/stopce.
- Zmienić hasło super admina na `francuz12` (migracja UPDATE w tabeli admins).
- Usunąć branding „edit with Lovable" → wyłączyć `lovable-tagger` w vite (`componentTagger` dev-only i tak nie pokazuje się w produkcji, ale upewniam się że nic nie wstawia napisów).
- Usunąć pole `contact_url` / przycisk „Kontakt" z karty i strony produktu.
- Dodać `framer-motion` i płynne animacje (fade-in sekcji, hover-scale kart, slide-in nawigacji).

## 2. Filtry katalogu
- Na `/gallery` dodać sidebar/górny pasek z filtrami: kategoria, batch, agent (dostępny), zakres ceny, sortowanie (najnowsze / cena rosnąco / cena malejąco), wyszukiwarka tekstowa po nazwie.
- Filtry działają client-side po pobraniu listy produktów.

## 3. Ważne ogłoszenie (popup)
- Nowe pola w `site_settings`: `popup_active boolean`, `popup_title text`, `popup_message text`.
- Na stronie głównej `/` pokazujemy modal po wejściu jeśli `popup_active`. „Nie pokazuj ponownie tej sesji" w `sessionStorage`.
- Super admin zarządza tym z panelu.

## 4. Link Converter
Publiczna strona `/converter` + komponent reużywalny w panelu admina.

**Wejście (rozpoznawane wzorce):**
- `usfans.com/product/<type>/<id>` (+ opcjonalny `?ref=`)
- `kakobuy.com/item/details?url=<encoded>&affcode=...`
- `litbuy.com/item/details?url=<encoded>` (analogicznie)
- `weidian.com/item.html?itemID=...`
- `taobao.com` / `item.taobao.com/item.htm?id=...`
- `1688.com/offer/...html`

**Logika:**
1. Z wklejonego linka wyciągamy „underlying url" (oryginalny weidian/taobao/1688) lub usfans-id.
2. Generujemy zestaw 3 linków:
   - **USFans**: jeśli mamy usfans-id → `https://www.usfans.com/product/<type>/<id>?ref=JCWKHX`. Jeśli mamy tylko underlying url → próbujemy wyszukiwarkę `https://www.usfans.com/search?keyword=<url>` z dopisanym ref.
   - **Kakobuy**: `https://www.kakobuy.com/item/details?url=<encoded underlying>&affcode=ogprzecin3k`.
   - **Litbuy**: `https://www.litbuy.com/item/details?url=<encoded underlying>` (bez ref/affcode).
3. Użytkownik może wybrać który link skopiować.

W panelu admina przy dodawaniu produktu: paste 1–3 linki agentów, klik „Auto-uzupełnij" → wszystkie 3 pola `agent_links` wypełnione przekonwertowanymi linkami z naszymi refami.

## 5. Auto-uzupełnianie itemka (scraper)
- Nowy server fn `scrapeProductInfo(url)` w `src/lib/scraper.functions.ts`.
- Server-side `fetch` z User-Agent przeglądarki, parsowanie:
  - `<meta property="og:title">` → nazwa
  - `<meta property="og:image">` (+ wszystkie `og:image:*`) → zdjęcia
  - `<meta property="og:description">` → opis
  - regex na cenę (`¥\d+`, `\$\d+`, `price`, itp.) — best-effort
- W panelu „Dodaj produkt" pole „Wklej link" → klik „Pobierz dane" → wypełnia formularz.

## 6. Permisje adminów + Super Admin Panel
**Schema (migracja):**
- Tabela `admins`: dodać kolumny
  - `permissions text[]` default `'{}'` (lista: `products.create`, `products.delete`, `products.edit`, `products.import`, `products.export`, `announcements.manage`, `maintenance.manage`)
  - `is_banned boolean` default false
  - `ban_reason text`
  - `banned_at timestamptz`
- Super admin ma wszystkie permisje implicite (rola `super` w kodzie).
- Domyślne permisje editor: `products.create`, `products.edit` (super admin może rozszerzyć).

**Panel zarządzania (zakładka „Administratorzy", widoczna tylko dla super):**
- Lista wszystkich adminów z rolą, statusem, permisjami.
- Akcje: utwórz konto (discord_id, username, password, permisje, rola), edytuj permisje, zmień hasło, zbanuj (z polem powodu, domyślnie „Złamanie regulaminu"), odbanuj, usuń.
- Server fns: `listAdmins`, `createAdmin`, `updateAdmin`, `banAdmin`, `unbanAdmin`, `deleteAdmin` — wszystkie pod `requireSuperAdmin`.
- Przy logowaniu: jeśli `is_banned=true` → ekran „Zostałeś zbanowany" z powodem (ładny ekran z dużym tekstem i powodem).

**Egzekwowanie permisji w serwer fn:**
- Helper `requirePermission(perm)` w `gate.server.ts` — sprawdza rolę super lub obecność permisji.
- Stosujemy w `createProduct`, `updateProduct`, `deleteProduct`, `importProducts`, `exportProducts`, `updateSiteSettings`.

## 7. Redesign panelu admina (`/ff`)
- Layout z sidebarem: zakładki Produkty / Backupy / Ogłoszenia & Maintenance / Administratorzy (super only) / Link Converter / Wyloguj.
- Karty zamiast tabel, ikony lucide, kolorowe statusy.
- Animowane przejścia między zakładkami.
- Nagłówek z avatarem (discord id) i rolą.
- Ekran logowania w stylu „glassmorphism" z logo USFinds.
- Toast notifications dla każdej akcji.

## Pliki do dodania / zmiany
- `supabase/migrations/*` — kolumny permisje/ban, hasło francuz12, pola popup w settings.
- `src/assets/usfinds-logo.png.asset.json` + lovable-assets upload.
- `src/lib/converter.ts` — czysta logika konwersji linków (klient i serwer).
- `src/lib/scraper.functions.ts` — scraper.
- `src/lib/admins.functions.ts` — CRUD adminów + ban.
- `src/lib/gate.server.ts` — `requirePermission`, sprawdzanie banów.
- `src/lib/products.functions.ts`, `settings.functions.ts`, `backups.functions.ts` — dodać `requirePermission`.
- `src/components/site-header.tsx` — logo + Discord, usunięcie nav kategorii.
- `src/components/important-popup.tsx` — nowy.
- `src/components/admin/*` — rozbicie panelu na sekcje.
- `src/routes/ff.tsx` — przebudowa z sidebarem.
- `src/routes/converter.tsx` — publiczna strona.
- `src/routes/gallery.tsx` — filtry.
- `product-card.tsx`, `product.$slug.tsx` — usunięcie kontaktu.
- `__root.tsx` — `framer-motion` `AnimatePresence`.

## Po wdrożeniu
- Test logowania super admin (`1508998046414016603` / `francuz12`).
- Test logowania editor.
- Test link converter na przykładowych URL-ach z prompta.
- Test scrappera na linku kakobuy.
