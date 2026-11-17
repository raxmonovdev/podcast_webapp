# English Podcast (Telegram Mini App) — TZ

> Ingliz tilini o'rganuvchilar uchun podcast ilovasi.
> Interfeys va bot matnlari **o'zbek tilida**. Podcast nomi, tavsifi, audio va transcript **ingliz tilida**.
> Dasturchi boshlovchi: kodni sodda yoz, muhim joyga qisqa izoh qo'sh.

## 1. Maqsad

Telegram ichida ochiladigan WebApp. Foydalanuvchi botga kiradi, «🎧 Eshitish» tugmasini bosadi, o'z darajasiga mos inglizcha podcastni tanlaydi, sekin tezlikda eshitadi, transcriptni o'qiydi va notanish so'zni saqlaydi.

## 2. Texnologiyalar

| Qism | Texnologiya |
|---|---|
| Bot | Python 3.9+ (TZ dagi maqsad 3.11), aiogram 3 |
| Backend | FastAPI, SQLAlchemy, SQLite |
| Frontend | React + Vite (mobile-first) |
| Audio | HTML5 `<audio>` |
| Sozlamalar | `.env` (python-dotenv) |

## 3. Papka tuzilmasi

```
bot/            main.py, handlers.py, config.py
backend/        main.py, database.py, models.py, schemas.py, auth.py, seed.py
backend/routers podcasts.py, favorites.py, progress.py, words.py
frontend/src    sahifalar: Home, Search, PodcastPage, Favorites, Profile
```

## 4. `.env`

```
BOT_TOKEN=
WEBAPP_URL=
ADMIN_IDS=123456789
DATABASE_URL=sqlite:///./podcast.db
ALLOW_DEV_AUTH=true
```

`ALLOW_DEV_AUTH=true` faqat brauzerda sinash uchun. Serverda `false`.

## 5. Funksiyalar

### 5.1. Bot
- `/start`: «Ingliz tilini podcast orqali o'rganing 🎧» + «🎧 Eshitish» (https WebApp).
- Foydalanuvchini bazaga yozish.
- `/admin`: faqat @raxmonovdev. Tugma admin panelni ochadi.

### 5.2. Bosh sahifa
- Kategoriyalar: Daily Life, Travel, Food & Cooking, Movies & Music, Technology, Health & Fitness, Stories, Business English, Culture.
- Daraja chipi: Barchasi, A1, A2, B1, B2, C1.
- Yangi epizodlar va mashhur podcastlar.
- Pastda: Bosh sahifa, Qidiruv, Sevimlilar, Profil.

### 5.3. Qidiruv
- Podcast va epizod nomi bo'yicha, yozish paytida yangilanadi.
- Daraja bo'yicha filtr.

### 5.4. Podcast sahifasi
- Muqova, nom, muallif, daraja belgisi, tavsif, epizodlar, sevimlilar.
- Epizodda «Matn» tugmasi: ingliz transcript ochiladi va yopiladi.
- So'zni bosish: kichik oyna, tarjima maydoni, «Saqlash». Tarjimani foydalanuvchi o'zi yozadi.

### 5.5. Pleyer
- Play/Pause, −15, +15, oxirgi 5 soniyani qayta eshitish (⟲5), suriladigan progress.
- Tezlik: 0.5x, 0.75x, 1x, 1.25x, 1.5x.
- Mini pleyer sahifa almashganda to'xtamaydi. Bosilsa to'liq pleyer ochiladi.
- Oldingi va keyingi epizod.
- To'xtagan soniya saqlanadi va keyingi safar shu joydan davom etadi.

### 5.6. Sevimlilar
- Podcastni qo'shish va olib tashlash. Qayta kirganda saqlanib turadi.

### 5.7. Profil
- Ism.
- «Mening so'zlarim»: saqlangan so'z va yozilgan tarjima.

### 5.8. Admin panel
- Yagona admin: @raxmonovdev.
- Podcast qo'shishda kategoriya va daraja (A1–C1).
- Epizod qo'shishda audio va transcript.
- Foydalanuvchilar soni va eng ko'p eshitilgan podcastlar.

## 6. Ma'lumotlar bazasi

- **users:** id, telegram_id, first_name, username, created_at
- **categories:** id, name
- **podcasts:** id, title, author, description, cover_url, category_id, level, created_at
- **episodes:** id, podcast_id, title, description, audio_url, duration, transcript, created_at
- **favorites:** id, user_id, podcast_id
- **progress:** id, user_id, episode_id, position_seconds, updated_at
- **saved_words:** id, user_id, word, translation, episode_id, created_at

`level` qiymatlari: A1, A2, B1, B2, C1.

SQLite yangi ustunni o'zi qo'shmaydi. Schema o'zgarganda `podcast.db` ni o'chirib, `python backend/seed.py` bilan qayta yarating. Eski sinov sevimlilari ketadi.

## 7. API

- `POST /auth`
- `GET /categories`
- `GET /podcasts?category=&level=&search=`
- `GET /podcasts/{id}`, `GET /podcasts/{id}/episodes`
- `GET /episodes/latest?category=&level=`
- `GET /search?q=&level=`
- `POST /favorites`, `DELETE /favorites/{podcast_id}`, `GET /favorites`
- `POST /progress`, `GET /progress/{episode_id}`
- `POST /words`, `GET /words`, `DELETE /words/{id}`
- Admin (faqat @raxmonovdev): `GET /admin/stats`, `GET /admin/podcasts`, `POST /admin/podcasts`, `DELETE /admin/podcasts/{id}`, `POST /admin/podcasts/{id}/episodes`, `DELETE /admin/episodes/{id}`

Har so'rovda Telegram `initData` imzosi tekshiriladi. `ALLOW_DEV_AUTH` yoqilgan bo'lsa, brauzer `X-Dev-Auth: 1` yuboradi. Token kodga yozilmaydi.

## 8. Dizayn

- Telegram `themeParams`, mobile-first (360–430 px), asosiy tugmalar kamida 44 px.
- Skeleton, Telegram `BackButton`.
- Qorong'i va yorug' mavzu. Transcript o'qishga qulay shriftda.

## 9. Hozirgi holat

1. MVP ishlaydi: bot, ro'yxat, pleyer, sevimlilar.
2. Shu tahrir: ingliz kontenti, daraja, qidiruv, transcript, so'zlar, sekin tezlik, ⟲5, to'xtagan joy.
3. Admin panel bor. Keyin: bildirishnoma va avtomatik tarjima.
