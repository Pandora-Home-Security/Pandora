# Live prijenos s mobitela na web (mobitel kao IP kamera)

Ova uputa objašnjava kako uživo prikazati sliku s kamere mobitela na stranici
**Kamere → detalji kamere**, i to za **Android** i za **iPhone**.

---

## Kako to radi

Mobitel pokreće besplatnu aplikaciju koja kameru emitira kao **MJPEG video stream**
preko WiFi-ja (npr. `http://192.168.0.13:8081/video`). Taj URL se upiše u polje
**Stream URL** kamere, a Pandora ga prikaže u playeru.

Stream **ne ide direktno iz preglednika**, nego kroz **Pandora backend (proxy)**:
backend dohvati sliku s mobitela (i po potrebi se prijavi lozinkom) pa je proslijedi
pregledniku. Razlog: preglednik ne može poslati lozinku kroz `<img>` tag, a ovako
i lozinka i eventualni HTTPS rade bez problema.

**Najvažnije pravilo:** mobitel i **računalo na kojem vrti Pandora backend** moraju
biti na **istom WiFi-ju / mreži** (isti router). Žica ili WiFi na računalu nije
bitno — bitno je da su na istoj mreži (npr. oboje `192.168.0.x`).

---

## Preduvjeti

- Mobitel i računalo (backend) na istoj mreži.
- Pokrenut backend (`cd backend && npm run dev`) i web (`cd web && npm run dev`).
- Znati IP adresu mobitela (pokaže ju sama aplikacija kad pokreneš server).

---

## Android — aplikacija "IP Webcam"

1. Instaliraj **IP Webcam** (Pavel Khlebovich) s Trgovine Play (besplatno).
2. Otvori je, na dnu izbornika pritisni **Start server**.
3. Na dnu ekrana piše adresa, npr. `http://192.168.0.20:8080`.
4. Stream URL je ta adresa **+ `/video`**:
   ```
   http://192.168.0.20:8080/video
   ```
   > IP Webcam po defaultu **ne traži lozinku**. Ako si je u postavkama uključio,
   > upiši ju u URL kao kod iPhonea (vidi dolje).

---

## iPhone — aplikacija "IP Camera Lite"

1. Instaliraj **IP Camera Lite** s App Storea (besplatno).
2. Pokreni server u aplikaciji. Pokaže adresu poput `http://192.168.0.13:8081`.
   MJPEG je na putanji **`/video`**.
3. Ta aplikacija **traži prijavu** — zadano korisničko ime/lozinka su `admin` / `admin`.
   Zato podatke za prijavu upiši **u sam URL**:
   ```
   http://admin:admin@192.168.0.13:8081/video
   ```
   > Ako u aplikaciji promijeniš korisničko ime/lozinku, upiši te nove podatke u URL.

---

## Postavljanje u Pandori

1. Otvori **Kamere** i odaberi kameru koja je **Online** (zelena točka).
   (Live prijenos se prikazuje samo za online kamere.)
2. Klikni **Uredi** (olovka).
3. U polje **Stream URL** zalijepi URL iz koraka iznad (Android ili iPhone).
4. **Spremi promjene.**
5. Otvori **detalje te kamere** — u playeru se vidi slika uživo. Pauza zaustavlja
   prijenos, radi i prikaz preko cijelog ekrana.

Ako stream URL ostaviš prazan, kamera prikazuje staru simulaciju — ništa se ne kvari.

---

## Mogu li gledati s drugog računala / mogu li kolege koristiti ovo?

Ovisi što želiš:

### A) Svatko pokreće projekt na svom računalu
Radi normalno. Svatko na svom računalu pokrene backend + web, spoji **svoj** mobitel
na **svoj** WiFi i upiše **IP svog mobitela** u Stream URL. (IP adrese se razlikuju
od mreže do mreže, pa URL nije isti za sve.)

### B) Više ljudi gleda JEDAN pokrenuti server (s različitih računala)
Po defaultu **ne radi**, jer web app radi na `localhost` (vidljiv samo na tom računalu).
Da bi i drugi na istoj mreži mogli gledati, na računalu-serveru treba:

1. Web pokrenuti tako da je dostupan na mreži:
   ```bash
   cd web
   npm run dev -- --host
   ```
2. Reći frontend-u gdje je backend (umjesto `localhost`), preko `web/.env`:
   ```
   VITE_API_URL=http://192.168.0.11:3001
   ```
   (zamijeni `192.168.0.11` IP-om računala na kojem vrti backend) pa ponovno pokreni `npm run dev`.
3. Drugi se onda spoje na `http://192.168.0.11:5173`.

> Bitno: i u ovom slučaju **mobitel-kamera mora biti na istoj mreži kao backend**,
> jer backend (ne preglednik gledatelja) dohvaća sliku s mobitela. Gledatelji samo
> trebaju doći do backenda.

---

## Najčešći problemi

- **"Stream nedostupan" poruka** → aplikacija na mobitelu nije pokrenula server,
  mobitel se uspavao, ili mobitel i backend nisu na istoj mreži.
- **App traži lozinku (HTTP 401)** → upiši korisničko ime i lozinku u URL:
  `http://korisnik:lozinka@IP:port/video` (za IP Camera Lite zadano `admin:admin`).
  Backend će se s tim podacima sam prijaviti.
- **Bila je slika pa stane** → mobitel se uspavao ili mu se promijenila IP adresa
  (DHCP). Provjeri IP u aplikaciji i po potrebi ažuriraj URL u kameri.
- **Radi na računalu sa serverom, ali ne s drugog računala** → vidi sekciju B gore
  (`--host` + `VITE_API_URL`). Moguća je i izolacija klijenata na ruteru ("AP isolation").
- **Provjera da stream uopće radi** → na računalu-serveru otvori URL mobitela u
  pregledniku (npr. `http://192.168.0.13:8081/video`); ako traži lozinku ili pokaže
  sliku, veza do mobitela radi.

---

## Napomena za produkciju

U developmentu web radi preko `http://`, pa se HTTP stream prikazuje bez problema
(ide kroz backend proxy). Ako se aplikacija ikad posluži preko `https://`, proxy i
dalje radi jer je na istom serveru — bitno je samo da `VITE_API_URL` pokazuje na taj backend.
