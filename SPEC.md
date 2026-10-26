# ТЗ: сайт-витрина v2 (case-study site)

**Статус:** draft 1 · 26.10.2026
**Заменяет:** `site/` — прототип, дизайн отклонён владельцем.
**Каркас:** `site-v2/` — рабочий скелет, который уже собирается и проходит проверки.
**Владелец контента:** Максим Кухто. **Исполнитель дизайна:** агент, который берёт эту задачу.

---

## 0. Резюме для агента

Нужен **статический сайт-витрина на 3–5 кейсов**, который:

1. Живёт на бесплатном хостинге (Cloudflare Pages), без сервера, базы и CMS.
2. Собирается одной командой `python build.py` из YAML-контента.
3. Позволяет **добавить проект за 5 минут** — создать папку, заполнить `project.yaml`, положить скриншоты, прогнать проверки.
4. Позволяет **убрать проект** — `published: false` (скрыть) или удалить папку (удалить).
5. Не требует правки HTML при изменении контента.
6. Даёт агенту свободу в дизайне: **вёрстка и стиль — зона исполнителя**, ТЗ задаёт только контент, структуру, ограничения и приёмку.

Текущий `site-v2/static/css/site.css` — **базовый макет**, а не финальный дизайн. Исполнитель может заменить CSS и шаблоны, сохранив контракт сборки и схему контента.

---

## 1. Цель и аудитория

**Цель:** за 20 секунд показать нанимающему менеджеру или тимлиду, кто ты, что умеешь, чем это подтверждено и когда можешь начать.

**Аудитория по приоритету:**

1. **Техлид / hiring manager** — смотрит код, метрики, архитектуру; не верит словам без артефактов.
2. **HR / рекрутер** — сканирует заголовок, опыт, стек, availability; дальше не читает.
3. **Заказчик на фрилансе** — ищет «кто решит мою задачу», а не «портфолио».

**Что должно быть понятно сразу:**

- Python / AI-инженер, фокус — **CAD/GIS-автоматизация, offline-RAG, LLM-агенты, medtech**.
- Реальная работа: инженер по медоборудованию в УЗ МООД, 2022 — ноябрь 2026; ухожу, доступен full-time с конца ноября 2026.
- 3 кейса с цифрами; публичный код там, где можно; NDA там, где нельзя.
- Английский B2, UTC+3, remote.
- Контакт: email, GitHub, LinkedIn, CV.

---

## 2. Что считается успехом

| Критерий | Как проверяем |
|---|---|
| Понятность за 20 секунд | 5 случайных людей / сам владелец: «кто это и что предлагает» без скролла |
| Конверсия в клик | клик по кейсу или CV с главной; цель — 30%+ |
| Добавление проекта | агент добавляет кейс за ≤5 минут, без правки HTML |
| Удаление проекта | `published: false` → страница исчезает из `dist/` и `sitemap.xml` |
| Сборка | `validate.py` + `build.py` + `check_dist.py` — exit 0 |
| Дизайн | Lighthouse mobile ≥95/95/95/95, нет горизонтального скролла на 360px |
| Честность | нет выдуманных работодателей, «7 лет опыта», битых ссылок |
| Хостинг | бесплатный Cloudflare Pages, HTTPS, кастомный домен/поддомен |

---

## 3. Границы: что НЕ делаем

- **Нет CMS, базы данных, админки, логина.** Контент — YAML в git.
- **Нет серверного кода** (Python/Node на проде). Только статика.
- **Нет React/Vue/Next/Astro** и сборки на Node. Стек — Python + Jinja2, чтобы агент мог работать из этого окружения.
- **Нет блога, комментариев, форм обратной связи, аналитики с cookies.**
- **Нет «портфолио из 15 проектов».** 3–5 кейсов, остальное — ссылкой на Open_space.
- **Нет открытия исходников под NDA.** Только скриншоты, архитектура, метрики.
- **Нет выдуманных фактов, работодателей, метрик, лет опыта.**

---

## 4. Принципы

1. **Контент отдельно от дизайна.** YAML → шаблоны → `dist/`. Агент правит YAML, не HTML.
2. **Один источник правды.** Факты на сайте = факты в резюме = факты в LinkedIn. Меняешь дату выхода — меняешь в `site.yaml`, а не в трёх местах.
3. **Сборка воспроизводима.** `python build.py` из чистого clone даёт тот же `dist/`.
4. **Проверки встроены.** Нельзя собрать сайт с битой ссылкой, пустым `alt`, запрещённым токеном.
5. **Дизайн — итеративный.** Первый вариант не обязан быть финальным; важны критерии и возможность быстро переверстать.
6. **Никакой магии.** Никаких плагинов, генераторов, скрытых зависимостей. Агент должен понимать каждую строку.

---

## 5. Информационная архитектура

```
/                       EN home
/ru/                    RU home
/work/<slug>/           EN case
/ru/work/<slug>/        RU case
/404.html               not found (Cloudflare Pages)
/assets/css/site.css    стили
/assets/cv-en.pdf       CV EN
/assets/cv-ru.pdf       CV RU
/assets/projects/<slug>/<image>
/sitemap.xml
/robots.txt
/_headers               Cloudflare Pages headers
/_redirects             Cloudflare Pages redirects
```

**Правила URL:**

- slug — латиница, нижний регистр, дефисы: `engineer-companion`, `vetka-dwg`, `geoconverter`.
- Меняешь slug — добавляй 301 в `_redirects` и обновляй внешние ссылки.
- EN — корень, RU — `/ru/`. Причина: международные рекрутёры и LinkedIn; hh.by получает `/ru/` ссылку.
- `hreflang`: `en`, `ru`, `x-default` = EN.

**Главная страница:**

1. Hero: имя, роль, лид, availability, локация/таймзона, английский, CTA (CV, GitHub, email).
2. 3 карточки кейсов: статус (public/NDA), год, заголовок, 1–2 строки, 3 метрики, ссылка.
3. «Что делаю»: 3 направления.
4. «Обо мне»: 2–3 абзаца + факты.
5. Контакты.
6. Footer.

**Страница кейса:**

1. Назад к работам.
2. Статус, год, заголовок, лид.
3. Обложка + подпись.
4. Problem → Approach → Results → Stack → What is public.
5. Сайдбар: ссылки, галерея.

---

## 6. Контент-модель

### 6.1 `content/site.yaml`

Глобальные данные. Схема:

```yaml
name: {en: "...", ru: "..."}
role: {en: "...", ru: "..."}
location: {en: "...", ru: "..."}
timezone: "UTC+3"
availability: {en: "...", ru: "..."}
email: "..."
github: "https://..."
linkedin: "https://..."
telegram: ""            # optional
cv: {en: "assets/cv-en.pdf", ru: "assets/cv-ru.pdf"}
domain: "https://..."   # без слэша на конце
seo:
  title: {en: "...", ru: "..."}
  description: {en: "...", ru: "..."}
hero:
  lead: {en: "...", ru: "..."}
  note: {en: "...", ru: "..."}
about:
  en: ["...", "..."]
  ru: ["...", "..."]
facts:
  - label: {en: "Based", ru: "База"}
    value: {en: "...", ru: "..."}
services:
  - number: "01"
    title: {en: "...", ru: "..."}
    text: {en: "...", ru: "..."}
more:
  - title: {en: "...", ru: "..."}
    text: {en: "...", ru: "..."}
    url: "https://..."
status_labels:
  public: {en: "Public code", ru: "Публичный код"}
  nda: {en: "Source private · NDA", ru: "Исходники закрыты · NDA"}
  commercial: {en: "Commercial · NDA", ru: "Коммерческий · NDA"}
  rnd: {en: "R&D · proprietary", ru: "R&D · закрытый код"}
```

### 6.2 `content/ui.yaml`

Подписи интерфейса. Все ключи — словари `{en, ru}`. Список обязательных ключей — в `scripts/validate.py` (`REQUIRED_UI`). Добавляешь новую подпись — добавь в оба языка и в список.

### 6.3 `content/projects/<slug>/project.yaml`

Один проект = одна папка. Схема:

```yaml
slug: engineer-companion        # = имя папки
order: 1                        # сортировка на главной
published: true                 # false = скрыть, не удаляя
featured: true                  # true = показывать на главной
status: public                  # public | nda | commercial | rnd
year: "2026"
title: {en: "...", ru: "..."}
summary: {en: "...", ru: "..."}
problem: {en: "...", ru: "..."}
approach:
  en: ["...", "..."]
  ru: ["...", "..."]
results:
  - value: "21,214"
    label: {en: "facts indexed", ru: "фактов в индексе"}
stack: ["Python", "LanceDB", "..."]
confidentiality: {en: "...", ru: "..."}
links:
  - label: {en: "Public code", ru: "Публичный код"}
    url: "https://..."
images:
  - src: "images/cover.png"
    alt: {en: "...", ru: "..."}
    caption: {en: "...", ru: "..."}
```

**Правила:**

- `slug` совпадает с именем папки; менять — только вместе с папкой и редиректом.
- `order` уникален; меньше — выше.
- `status` определяет бейдж; `public` — только если код реально открыт.
- `results` — 3–4 штуки, одна цифра на строку.
- `images` — минимум одна; первая = обложка; остальные = галерея.
- `links` — минимум одна; внешние URL только `http(s)://` или `mailto:`.
- `confidentiality` — честно: «public code» / «source private, NDA» / «commercial, NDA».

### 6.4 Изображения

- Папка `content/projects/<slug>/images/`.
- Формат: PNG/WebP; для продакшена — WebP/AVIF, ширина 1600–2000px, вес ≤300KB.
- Имена: `cover.png`, `screenshot-1.png` и т.п.
- `alt` и `caption` — на обоих языках.
- Скриншоты с клиентскими данными — размывать/обезличивать.
- Не использовать чужие логотипы без разрешения.

### 6.5 CV

- `content/cv/cv-en.pdf`, `content/cv/cv-ru.pdf`.
- Собираются из `rewrite/resume_master_*` (или актуальных исходников), не правятся руками.
- Факты в CV и на сайте совпадают: УЗ МООД, 2022 — ноябрь 2026, B2, NDA, 3 кейса.
- PDF — 1 страница, проверено `pymupdf`/пробниками.

---

## 7. Сборка

### 7.1 Стек

- Python **3.12** (на этой машине: `C:/Users/Nitro/AppData/Local/Programs/Python/Python312/python.exe`).
- `Jinja2==3.1.6`, `PyYAML==6.0.3`. Опционально `Pillow` для конвертации изображений.
- Никакого Node/React/Next. Node нужен только для `wrangler` при прямом деплое (опционально).

`requirements.txt`:

```
Jinja2==3.1.6
PyYAML==6.0.3
```

### 7.2 Команды

```bash
cd C:/Users/Nitro/AppData/Local/hermes/profiles/freelance/workspace/site-v2
PY="C:/Users/Nitro/AppData/Local/Programs/Python/Python312/python.exe"

"$PY" scripts/validate.py     # проверка контента
"$PY" build.py                # сборка dist/
"$PY" scripts/check_dist.py   # проверка ссылок/alt/заголовков/sitemap
```

Локальный просмотр:

```bash
"$PY" -m http.server 8000 --directory dist
# http://localhost:8000/  и  http://localhost:8000/ru/
```

Важно: открывать `dist/index.html` через `file://` нельзя — root-relative `/assets/...` не загрузятся. Только HTTP-сервер.

### 7.3 Что делает `build.py`

1. Читает `content/site.yaml`, `content/ui.yaml`, `content/projects/*/project.yaml`.
2. Сортирует проекты по `order`, фильтрует `published: false`.
3. Считает URL, canonical, hreflang, OG, статусы.
4. Рендерит `home.html`, `project.html`, `404.html` в `dist/`.
5. Копирует `static/` → `dist/assets/`, CV → `dist/assets/`, изображения → `dist/assets/projects/<slug>/`.
6. Генерирует `sitemap.xml`, `robots.txt`, `_headers`, `_redirects`.
7. Полностью пересоздаёт `dist/` (никаких stale-страниц).

### 7.4 Что проверяет `validate.py`

- Обязательные поля `site.yaml`, `ui.yaml`, `project.yaml`.
- Оба языка (`en`, `ru`) у всех локализованных полей.
- `slug` = имя папки; уникальность `slug` и `order`.
- `status` ∈ `{public, nda, commercial, rnd}`.
- `published`/`featured` — bool; хотя бы один published + featured.
- `results` — непустой список с `value` и локализованным `label`.
- `links` — непустой список с URL.
- `images` — минимум одна, файл существует, `alt`/`caption` на двух языках.
- CV-файлы существуют.
- `domain` начинается с `https://`.
- **Запрещённые токены** во всех YAML: `hermes-reform`, `294682165`, `NeuralForge`, `DataRoot`, `ITech`, `parallel practice`, `B1–B2`, `B1-B2`, `Продвинутый`, `2018`, `7 лет`, `7 years`, `+375`.
- При ошибке — exit 1 и список.

### 7.5 Что проверяет `check_dist.py`

- Все HTML-страницы: `lang`, `<title>`, `meta description`, `canonical`, ровно один `<h1>`.
- Все `<img>` имеют непустой `alt`.
- Все внутренние ссылки (`href`/`src`) ведут на существующие файлы в `dist/`.
- `sitemap.xml` — все URL имеют файл.
- Обязательные файлы: `index.html`, `ru/index.html`, `404.html`, `robots.txt`, `_headers`, `_redirects`, CSS, оба CV.
- Запрещённые токены в HTML.
- При ошибке — exit 1.

---

## 8. Дизайн (зона ответственности исполнителя)

**Дизайн не фиксируется в ТЗ.** Текущий `site-v2/static/css/site.css` — базовый макет, чтобы проверить сборку. Исполнитель должен сделать **свой** дизайн, а не «улучшить» текущий.

### 8.1 Бриф

- **Ощущение:** профессионально, технически, спокойно. Не SaaS-лендинг, не «тёмный хакер», не шаблон с градиентными шарами.
- **Акцент:** кейсы и цифры, а не «обо мне». Первый экран — кто, что, доказательство, доступность.
- **Типографика:** сильная иерархия, читаемый текст, максимум 2 гарнитуры. Системные шрифты или self-hosted, без Google Fonts.
- **Цвет:** один акцент; достаточно контраста AA. Светлая/тёмная тема — на усмотрение, но не обе сразу, если это усложняет.
- **Сетка:** максимум 1080–1120px; текст кейса — 68–72ch; воздух.
- **Изображения:** реальные скриншоты, не сток; подписи; alt.
- **Анимации:** минимальные; `prefers-reduced-motion`.
- **Мобильные:** 360px без горизонтального скролла; читаемые карточки; tap targets ≥44px.
- **Никаких:** каруселей, autoplay-видео, параллакса, тяжёлых библиотек, иконочных наборов ради иконок.

### 8.2 Обязательные элементы

- Header: имя/бренд, навигация (Work, About, Contact), переключатель EN/RU.
- Hero: роль, лид, availability, локация/UTC, English B2, CTA (CV, GitHub, email).
- 3 карточки кейсов: статус, год, заголовок, 1–2 строки, 3 метрики, «View case».
- «What I do»: 3 направления.
- «About»: 2–3 абзаца + факты.
- Contact: email, GitHub, LinkedIn, CV.
- Footer: copyright, «static site · no trackers».
- Case page: Problem, Approach, Results, Stack, What is public, Links, Gallery.

### 8.3 Что исполнитель должен сдать вместе с дизайном

- `DESIGN.md`: 2–3 рассмотренных направления, выбранное, почему; что отвергнуто; как устроены токены (цвет, типографика, отступы); как менять.
- Обновлённые `templates/*.html` и `static/css/site.css`.
- Скриншоты 1280px и 390px (главная + кейс).
- Отчёт Lighthouse mobile.
- Подтверждение: `validate.py`, `build.py`, `check_dist.py` — exit 0.

### 8.4 Критерии приёмки дизайна

- Lighthouse mobile: Performance ≥95, Accessibility ≥95, Best Practices ≥95, SEO ≥95.
- Контраст текста ≥4.5:1; крупного ≥3:1.
- Фокус видим на всех интерактивных элементах.
- Нет горизонтального скролла на 360px.
- Нет layout shift (CLS <0.1): у изображений `width`/`height` или `aspect-ratio`.
- Страница кейса читается без картинок (контент не зависит от изображений).
- Переключатель языка ведёт на эквивалентную страницу, не на главную.

---

## 9. Хостинг и деплой

### 9.1 Cloudflare Pages (рекомендуется)

- Бесплатный план: статика, HTTPS, кастомный домен, 500 сборок/месяц.
- Домен по умолчанию: `https://kukhto.pages.dev`.
- Кастомный: `cv.qzz.io` или `kukhto.qzz.io` (CNAME на `kukhto.pages.dev`), либо купленный `.dev`.
- `_headers` и `_redirects` из `dist/` подхватываются автоматически.

**Вариант A — Git-интеграция (просто):**

1. Репозиторий `kukhtik/kukhto-site` (public или private — Pages умеет оба).
2. Cloudflare → Workers & Pages → Create → Pages → Connect to Git.
3. Build command: `python build.py`; Output directory: `dist`.
4. Environment: `PYTHON_VERSION=3.12`; при необходимости `pip install -r requirements.txt` в build command:
   `pip install -r requirements.txt && python build.py`.
5. Push в `main` → автодеплой.

**Вариант B — GitHub Actions (надёжнее для Python):**

```yaml
name: build-and-deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: pip install -r requirements.txt
      - run: python scripts/validate.py
      - run: python build.py
      - run: python scripts/check_dist.py
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist --project-name=kukhto-site
```

**Вариант C — локальная сборка + прямой деплой:**

```bash
npx wrangler pages deploy dist --project-name=kukhto-site
```

### 9.2 Почему не GitHub Pages

Можно, но: нет `_headers`/`_redirects`, меньше контроля кэша, нет встроенной аналитики. Cloudflare Pages уже используется для `familytree.qzz.io` — меньше нового.

### 9.3 Аналитика

- По умолчанию **нет**.
- Опционально: Cloudflare Web Analytics (без cookies). Добавить snippet перед `</body>` в `base.html`, если владелец хочет счётчик.
- Никаких GA/Meta Pixel.

---

## 10. Поддерживаемость: сценарии агента

### 10.1 Добавить проект

```bash
cd site-v2
cp -r content/projects/engineer-companion content/projects/my-project
# править content/projects/my-project/project.yaml:
#   slug: my-project
#   order: 4
#   published: true
#   featured: true
#   ...
# положить images/cover.png и остальные
"$PY" scripts/validate.py
"$PY" build.py
"$PY" scripts/check_dist.py
```

Проверить: `/work/my-project/` и `/ru/work/my-project/` открываются, карточка на главной, `sitemap.xml` содержит URL. Закоммитить и запушить — Cloudflare соберёт.

### 10.2 Скрыть проект (не удаляя)

```yaml
published: false
```

`validate.py` → `build.py` → `check_dist.py`. Страница исчезнет из `dist/` и `sitemap.xml`; исходники останутся в репозитории.

### 10.3 Удалить проект

```bash
rm -rf content/projects/my-project
"$PY" scripts/validate.py && "$PY" build.py && "$PY" scripts/check_dist.py
```

`build.py` полностью пересоздаёт `dist/`, поэтому stale-страниц не будет.

### 10.4 Обновить CV

```bash
cp ../rewrite/resume_master_en_20261026.pdf content/cv/cv-en.pdf
cp ../rewrite/resume_master_ru_20261026.pdf content/cv/cv-ru.pdf
"$PY" scripts/validate.py && "$PY" build.py && "$PY" scripts/check_dist.py
```

Проверить, что факты в PDF совпадают с `site.yaml` и кейсами.

### 10.5 Обновить availability / дату выхода

Одно поле в `content/site.yaml`:

```yaml
availability:
  en: "Available full-time from late November 2026"
  ru: "Доступен full-time с конца ноября 2026"
```

Пересобрать. Оно используется в hero, контактах, метаданных. **Не** дублировать дату в шаблонах.

### 10.6 Переверстать сайт

Менять только `templates/` и `static/css/site.css`. Контент не трогать. После — `build.py` + `check_dist.py`. Если меняются классы, шаблоны обновляются вместе; валидатор контента от этого не зависит.

### 10.7 Откат

- Контент: `git revert <commit>`.
- Деплой: Cloudflare → Deployments → предыдущий → Rollback.
- Локально: `git checkout -- content/` (если не закоммичено).

---

## 11. SEO, доступность, производительность

### SEO

- Уникальные `title` (≤60 символов) и `description` (≤160) на страницу.
- `canonical`, `hreflang` en/ru/x-default, OG/Twitter.
- `sitemap.xml`, `robots.txt`.
- Семантические заголовки: один `h1`, `h2` по секциям.
- Стабильные slug; редиректы при смене.
- JSON-LD `Person` на главной; опционально `CreativeWork` на кейсах.
- Без keyword stuffing.

### Доступность (WCAG 2.2 AA)

- Контраст, фокус, skip-link, alt, `lang`, семантические теги.
- Клавиатурная навигация; нет ловушек.
- `prefers-reduced-motion`.
- Формы отсутствуют; если появятся — labels и ошибки.

### Производительность

- 0 KB JS (кроме JSON-LD), CSS ≤30KB.
- Изображения WebP/AVIF, `srcset`, `width`/`height`, lazy below fold.
- Системные шрифты или self-hosted subset; без Google Fonts.
- Lighthouse mobile 95+.

---

## 12. Безопасность и приватность

- Только статика; нет форм, бэкенда, БД.
- Нет cookies/трекеров по умолчанию.
- `_headers`: `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, CSP.
- Нет телефона и домашнего адреса на публичной странице; email, GitHub, LinkedIn.
- NDA: не публиковать имена клиентов, суммы, внутренние данные; скриншоты обезличивать.
- Нет секретов в репозитории; токены — в GitHub Secrets / Cloudflare env.
- CV PDF не содержат домашнего адреса/телефона (проверить перед публикацией).

---

## 13. Контентные правила

1. **Только подтверждённые факты.** УЗ «Могилёвский областной онкологический диспансер» (УЗ МООД), 2022 — ноябрь 2026, ухожу. English B2. Доступен full-time с конца ноября 2026.
2. **Никаких выдуманных работодателей** (NeuralForge, DataRoot, ITech — запрещены), «7 лет опыта», фальшивых метрик.
3. **NDA-проекты** — статус `nda`/`commercial`, «source private», только архитектура/скриншоты/метрики. Не писать «open code» для закрытого репо.
4. **Публичный код** — только реально открытый репозиторий; проверить `curl -I` перед публикацией.
5. **Одна цифра на результат.** 21 214 фактов, 96/100, p50 130 мс, 4 ч → 15 мин, <1 мм.
6. **Кейс — 120–250 слов** на язык; 3–4 результата; без воды.
7. **Изображения** — реальные скриншоты; alt/caption на двух языках; без клиентских логотипов без разрешения.
8. **CV** — 1 страница, факты совпадают с сайтом; собирать из исходников, не править PDF руками.
9. **Язык** — человеческий, без AI-канцелярита; английский — без «passionate» и «leverage».
10. **Никаких обещаний**, которые нельзя подтвердить на интервью.

---

## 14. Приёмка

### 14.1 Техническая

- [ ] `python scripts/validate.py` → exit 0.
- [ ] `python build.py` → exit 0, `dist/` создан.
- [ ] `python scripts/check_dist.py` → exit 0.
- [ ] `dist/index.html`, `dist/ru/index.html`, 3 EN + 3 RU кейса, `404.html`.
- [ ] `sitemap.xml`, `robots.txt`, `_headers`, `_redirects`, CSS, оба CV.
- [ ] Нет битых внутренних ссылок; все `<img>` с `alt`.
- [ ] Нет запрещённых токенов.
- [ ] Локальный сервер: главная и кейсы открываются, картинки грузятся.

### 14.2 Контентная

- [ ] 3 кейса: Engineer Companion, VETKA_DWG, GeoConverter.
- [ ] Статусы: public / NDA / commercial — честные.
- [ ] Метрики совпадают с резюме и Open_space.
- [ ] Дата выхода и B2 совпадают с резюме/LinkedIn.
- [ ] Нет телефона/адреса; email/GitHub/LinkedIn.
- [ ] CV PDF актуальны и совпадают по фактам.

### 14.3 Дизайн

- [ ] Lighthouse mobile ≥95/95/95/95.
- [ ] 360px без горизонтального скролла.
- [ ] Контраст AA; фокус видим; skip-link.
- [ ] Нет каруселей/autoplay/тяжёлых анимаций.
- [ ] `DESIGN.md` с rationale.
- [ ] Скриншоты 1280/390.

### 14.4 Деплой

- [ ] Cloudflare Pages собирает `dist/`.
- [ ] HTTPS, домен/поддомен.
- [ ] `_headers`/`_redirects` работают.
- [ ] Rollback проверен.

---

## 15. План работ

| Этап | Что | Оценка |
|---|---|---|
| M1 | Каркас: content-схема, build, validate, check, 3 кейса | **готово** (`site-v2/`) |
| M2 | Дизайн: 2–3 направления, выбор, вёрстка, `DESIGN.md` | 1–2 дня |
| M3 | Деплой: Cloudflare Pages, домен, Lighthouse, скриншоты | 0.5 дня |
| M4 | Интеграция: ссылка в LinkedIn/hh.by/CV, первый пост | 0.5 дня |
| M5 | Поддержка: новый кейс, обновление availability, месячная проверка ссылок | по мере |

---

## 16. Открытые решения

1. **Домен:** `kukhto.pages.dev` (бесплатно) или `cv.qzz.io` / `kukhto.qzz.io` (если qzz.io даёт поддомены). Купленный `.dev` — позже, если сайт начнёт конвертировать.
2. **Язык по умолчанию:** EN в корне, RU в `/ru/` (рекомендация). Альтернатива — RU в корне, EN в `/en/`, если главный канал hh.by.
3. **Четвёртый кейс:** PenaPivo (живой бот) — сейчас в блоке «Ещё»; можно вынести в карточку, если нужен «продуктовый» акцент.
4. **Фото владельца:** не обязательно; если добавлять — нейтральное, 400×400, без стока.
5. **Услуги/цены:** не в v1. Если пойдёт фриланс — отдельная страница `/services/` с 3 офферами.
6. **Блог/заметки:** не в v1; не добавлять, пока нет регулярного потока.

---

## 17. Приложение

### 17.1 Дерево

```
site-v2/
├── AGENTS.md                 # краткий runbook для агента
├── README.md                 # человеческое введение
├── SPEC.md                   # этот файл
├── build.py                  # сборка
├── requirements.txt
├── content/
│   ├── site.yaml
│   ├── ui.yaml
│   ├── cv/
│   │   ├── cv-en.pdf
│   │   └── cv-ru.pdf
│   └── projects/
│       ├── engineer-companion/
│       │   ├── project.yaml
│       │   └── images/
│       ├── vetka-dwg/
│       └── geoconverter/
├── templates/
│   ├── base.html
│   ├── home.html
│   ├── project.html
│   └── 404.html
├── static/
│   └── css/site.css
├── scripts/
│   ├── validate.py
│   └── check_dist.py
└── dist/                     # генерируется, не коммитить
```

### 17.2 Команды одной строкой

```bash
cd site-v2 && \
"$PY" scripts/validate.py && \
"$PY" build.py && \
"$PY" scripts/check_dist.py
```

### 17.3 Статусы

| status | Бейдж EN | Бейдж RU | Когда |
|---|---|---|---|
| `public` | Public code | Публичный код | репозиторий реально открыт |
| `nda` | Source private · NDA | Исходники закрыты · NDA | коммерческий/гос. заказчик, NDA |
| `commercial` | Commercial · NDA | Коммерческий · NDA | проданный продукт, NDA |
| `rnd` | R&D · proprietary | R&D · закрытый код | внутренний R&D, код закрыт |

### 17.4 Чек-лист «добавить кейс»

- [ ] Папка `content/projects/<slug>/`.
- [ ] `slug` = имя папки.
- [ ] `order` уникален.
- [ ] `published: true`, `featured: true` (если на главную).
- [ ] `status` честный.
- [ ] `title/summary/problem/approach/results/stack/confidentiality/links/images` заполнены на EN и RU.
- [ ] Обложка + 1–2 скриншота, `alt`/`caption` на двух языках.
- [ ] `validate.py` → `build.py` → `check_dist.py`.
- [ ] Проверить `/work/<slug>/` и `/ru/work/<slug>/`.
- [ ] Commit + push.
