# Second Thought — landing page

Statyczna strona (HTML + CSS + vanilla JS) zbudowana na podstawie projektu Figma
„Second Thought” › sekcja „version 2”.

## Struktura

```
index.html              # welcome screen + one pager + 3 pop-upy (filozofia)
assets/css/styles.css   # style (tokeny kolorów/typografii na górze pliku)
assets/js/main.js       # przejście welcome → one pager, pop-upy, akordeon, menu mobilne
assets/icons/*.svg      # ikony (Tabler Icons, MIT)
netlify/ , netlify.toml # backend walidacji kodów — do użycia po przeniesieniu na Netlify
```

## Zachowanie (wersja podglądowa)

- **Kod dostępu nie jest walidowany** — dowolny kod (lub puste pole) + „Wejdź” otwiera one pager.
  Miejsce na wywołanie `/.netlify/functions/validate-code` jest oznaczone w `assets/js/main.js`.
- Kafelki w sekcji „Filozofia” otwierają pop-upy (Esc / klik w tło / ✕ zamyka).
- Formularz zapisu na premierę Basics of Coexistence jest nieaktywny.
- Przyciski „Umów bezpłatną rozmowę wstępną” otwierają e-mail do secondthought.msa@gmail.com.
- Przełącznik PL | EN jest na razie tylko wizualny.

## Publikacja na GitHub Pages

Settings → Pages → Build and deployment → Source: **Deploy from a branch** → `main` / `/ (root)`.
Strona będzie pod adresem `https://skozicki.github.io/secondthought/`.

## Uruchomienie lokalnie

```bash
python3 -m http.server 8000
```
