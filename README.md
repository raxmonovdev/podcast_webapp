# English Podcast

Telegram ichida ochiladigan ingliz tili podcasti. Interfeys o'zbekcha, audio va transcript inglizcha.

Bor: daraja filtri, qidiruv, sekin tezlik, ⟲5, to'xtagan joy, transcript, saqlangan so'zlar, sevimlilar.

Keyingi bosqich: admin panel (daraja va transcript maydonlari bilan), statistika, avtomatik tarjima.

Namunaviy audio [SoundHelix](https://www.soundhelix.com/audio-examples) dagi ochiq sinov musiqasi. Matn esa dars uchun yozilgan.

Baza sxemasi o'zgarganda eski fayl yangi ustunni qo'shmaydi:

```bash
rm -f podcast.db
python backend/seed.py
```

TZ da Python 3.11 yozilgan. Bu kompyuterdagi Python 3.9, kod shu versiyada ham ishlaydi.

Buyruqlarning hammasini loyiha papkasida yozing (`Podcast proekt`).

## 1. Bir marta sozlash

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
cp .env.example .env
python backend/seed.py
```

`.env` allaqachon lokal sinov uchun yozilgan bo'lishi mumkin. `ALLOW_DEV_AUTH=true` brauzerda, Telegram siz, kirishni ochadi. Serverga qo'yishdan oldin uni `false` qiling.

Tekshirish:

```bash
python -m uvicorn backend.main:app --port 8000
```

Boshqa terminalda:

```bash
curl -s -H "X-Dev-Auth: 1" http://127.0.0.1:8000/podcasts
```

JSON da 9 ta podcast chiqishi kerak, har birida `level` bor. To'xtatish: `Ctrl+C`. Hujjatlar: http://127.0.0.1:8000/docs

## 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Brauzerda oching: http://127.0.0.1:5173

Tekshirish:

1. Bosh sahifada kategoriyalar, yangi epizodlar va podcastlar ko'rinadi.
2. Podcastga kiring, epizodni bosing — pastda mini pleyer chiqadi.
3. Boshqa sahifaga o'ting: musiqa to'xtamasligi kerak.
4. Mini pleyerni bosing: to'liq pleyer (pauza, ±15 soniya, tezlik, oldingi/keyingi).
5. «Sevimlilarga qo'shish» ni bosing, Sevimlilar sahifasiga o'ting, sahifani yangilang — yozuv qoladi.

`/api` so'rovlari Vite orqali backendga (8000-port) boradi. Backend ham ishlab turishi kerak.

## 3. Bot

BotFather dan token oling va `.env` ga yozing:

```
BOT_TOKEN=123456:ABC...
```

```bash
source .venv/bin/activate
python bot/main.py
```

Token bo'sh bo'lsa, bot nima qilish kerakligini yozib to'xtaydi.

`/start` foydalanuvchini bazaga yozadi. `WEBAPP_URL` `https://` bilan boshlansa, «🎧 Eshitish» tugmasi chiqadi. Hali http bo'lsa, bot sababini tushuntiradi — Telegram http manzilni ochmaydi.

`/admin` faqat `ADMIN_IDS` dagi Telegram id lar uchun. Panelning o'zi keyingi bosqich.

## 4. Telefonda sinash (HTTPS)

Backend (8000) va `npm run dev` (5173) ishlab tursin. Tunnelni **frontend** portiga oling, chunki API shu yerdan proksi qilinadi.

Cloudflare:

```bash
cloudflared tunnel --url http://127.0.0.1:5173
```

yoki ngrok:

```bash
ngrok http 5173
```

Chiqqan `https://....` manzilni `.env` dagi `WEBAPP_URL` ga yozing, botni qayta ishga tushiring. Telegramda `/start` → «🎧 Eshitish».

Kompyuter va telefon bir tarmoqda bo'lsa, tunnel siz brauzerda `http://KOMPYUTER_IP:5173` ham ochiladi. Telegram tugmasi baribir https talab qiladi.
