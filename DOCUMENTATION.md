# Sarana Interview API — Dokumentasi

> REST API yang dibangun menggunakan **Express** dan **TypeScript** sebagai jembatan antara client dan **Google Gemini AI**. Mendukung dua mode respons: jawaban langsung dan streaming real-time.

---

## Struktur Project

```
sarana-interview-api/
├── src/
│   ├── server.ts       — entry point, menjalankan HTTP server
│   ├── setup.ts        — inisialisasi, validasi environment, middleware
│   └── endpoints.ts    — route handler
├── .env                — variabel environment (tidak di-commit)
├── .env.example        — contoh isi .env
├── package.json        — konfigurasi project dan dependencies
├── package-lock.json   — lock file versi dependency
└── tsconfig.json       — konfigurasi TypeScript compiler
```

---

## `package.json`

Berisi metadata project, script, dan daftar dependency.

```json
{
  "scripts": {
    "start": "ts-node src/server.ts"
  },
  "dependencies": {
    "@google/genai": "^1.50.1",
    "dotenv": "^17.4.2",
    "express": "^5.2.1"
  },
  "devDependencies": {
    "@types/express": "^5.0.6",
    "@types/node": "^25.6.0",
    "ts-node": "^10.9.2",
    "typescript": "^6.0.3"
  }
}
```

**Scripts**
- `start` — menjalankan server langsung dari TypeScript menggunakan `ts-node`, tanpa perlu compile ke JavaScript terlebih dahulu

**Dependencies** (dibutuhkan saat runtime)
| Package | Versi | Fungsi |
|---------|-------|--------|
| `@google/genai` | ^1.50.1 | Client library resmi untuk Google Gemini AI |
| `dotenv` | ^17.4.2 | Memuat variabel dari file `.env` ke `process.env` |
| `express` | ^5.2.1 | Framework HTTP server |

**DevDependencies** (hanya dibutuhkan saat development)
| Package | Versi | Fungsi |
|---------|-------|--------|
| `@types/express` | ^5.0.6 | Type definitions untuk Express agar TypeScript mengenali tipenya |
| `@types/node` | ^25.6.0 | Type definitions untuk Node.js built-in (Buffer, process, dll) |
| `ts-node` | ^10.9.2 | Menjalankan file TypeScript langsung tanpa compile |
| `typescript` | ^6.0.3 | TypeScript compiler |

> Simbol `^` berarti versi kompatibel ke atas — npm boleh install versi patch/minor yang lebih baru, tapi tidak boleh ganti major version.

---

## `package-lock.json`

File yang di-generate otomatis oleh npm. Mencatat versi **exact** dari setiap dependency dan sub-dependency yang terinstall, termasuk hash integritas untuk verifikasi keamanan.

Contoh entri:
```json
"node_modules/express": {
  "version": "5.2.1",
  "resolved": "https://registry.npmjs.org/express/-/express-5.2.1.tgz",
  "integrity": "sha512-...",
  "dependencies": {
    "accepts": "^2.0.0",
    "body-parser": "^2.2.1",
    ...
  }
}
```

File ini **harus di-commit** ke git agar semua developer dan environment produksi menggunakan versi dependency yang persis sama. Jangan diedit manual.

**Sub-dependency penting yang terinstall otomatis:**
| Package | Dibutuhkan oleh | Fungsi |
|---------|-----------------|--------|
| `body-parser` | express | Parsing request body (JSON, URL-encoded) |
| `google-auth-library` | @google/genai | Autentikasi ke Google API |
| `ws` | @google/genai | WebSocket untuk streaming |
| `protobufjs` | @google/genai | Serialisasi data Protocol Buffers |
| `debug` | express | Logging internal Express |
| `acorn` | ts-node | JavaScript parser untuk TypeScript transpilation |

---

## `tsconfig.json`

Konfigurasi TypeScript compiler yang menentukan bagaimana kode TypeScript dikompilasi.

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["server.ts"]
}
```

**Penjelasan setiap opsi:**

| Opsi | Nilai | Penjelasan |
|------|-------|------------|
| `target` | `ES2020` | Output JavaScript yang dihasilkan menggunakan sintaks ES2020, mendukung fitur seperti `async/await`, `for await...of`, optional chaining |
| `module` | `commonjs` | Sistem modul yang digunakan adalah CommonJS (`require`/`module.exports`), sesuai dengan Node.js |
| `strict` | `true` | Mengaktifkan semua pengecekan tipe yang ketat: `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, dll. Mencegah penggunaan `any` secara implisit |
| `esModuleInterop` | `true` | Memungkinkan import default dari modul CommonJS seperti `import express from 'express'` tanpa error |
| `skipLibCheck` | `true` | Melewati pengecekan tipe pada file `.d.ts` di `node_modules`, mempercepat kompilasi |
| `forceConsistentCasingInFileNames` | `true` | Memastikan konsistensi huruf besar/kecil pada nama file saat import, mencegah bug di sistem file case-insensitive (Windows) |

> **Catatan:** `"include": ["server.ts"]` masih mengarah ke file lama di root. Perlu diupdate ke `["src/**/*"]` agar mencakup semua file di folder `src/`.

---

## Setup

### Install dependencies

```bash
npm install
```

### Environment variables

Buat file `.env` berdasarkan `.env.example`:

```
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-2.0-flash
```

Dapatkan API key di https://aistudio.google.com/app/apikey

### Menjalankan server

```bash
npm start
```

Server berjalan di http://localhost:3000

---

## Penjelasan File Source

### `src/server.ts`

Entry point aplikasi. Mengimpor `app` dan `port` dari `setup.ts`, mendaftarkan semua endpoint dengan mengimpor `endpoints.ts`, lalu mulai mendengarkan koneksi masuk.

```typescript
import { app, port } from "./setup";
import "./endpoints";

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

---

### `src/setup.ts`

Menangani semua inisialisasi sebelum server mulai menerima request.

**Validasi environment** — mengecek keberadaan variabel environment yang dibutuhkan saat startup. Jika salah satu tidak ada, proses langsung dihentikan sebelum server sempat menerima request apapun.

```typescript
if (!process.env.GEMINI_API_KEY) {
  console.error("Error: GEMINI_API_KEY not set in .env");
  process.exit(1);
}

if (!process.env.GEMINI_MODEL) {
  console.error("Error: GEMINI_MODEL not set in .env");
  process.exit(1);
}
```

**Gemini client** — dibuat sekali di level atas agar tidak membuat koneksi baru setiap ada request masuk.

```typescript
export const ai = new GoogleGenAI({ apiKey });
```

**Type guard** — memvalidasi bahwa request body sesuai dengan `{ question: string }` secara runtime, sekaligus mempersempit tipe TypeScript sehingga `req.body.question` bisa diakses tanpa error kompilasi.

```typescript
export interface QuestionBody {
  question: string;
}

export function isQuestionBody(body: unknown): body is QuestionBody {
  return (
    typeof body === "object" &&
    body !== null &&
    "question" in body &&
    typeof (body as QuestionBody).question === "string"
  );
}
```

**JSON middleware** — menggunakan hook `verify` untuk memvalidasi raw request body sebelum di-parse oleh Express. Jika body bukan JSON valid, dilempar error yang ditangkap oleh error handler di bawahnya.

```typescript
app.use(
  express.json({
    verify: (_req, _res, buf: Buffer, _encoding) => {
      try {
        JSON.parse(buf.toString());
      } catch (e) {
        throw new Error("Invalid JSON");
      }
    },
  }),
);
```

**Error handler** — dikenali Express sebagai error handler karena memiliki 4 parameter. Menangkap error yang dilempar oleh `verify` dan mengembalikan response yang sesuai.

```typescript
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err.message === "Invalid JSON") {
    return res.status(400).json({ error: "Invalid JSON format in request body" });
  }
  console.error("Unexpected error:", err);
  return res.status(500).json({ error: "Internal server error" });
});
```

---

### `src/endpoints.ts`

Mendefinisikan semua route handler. Mengimpor `app`, `ai`, `model`, dan `isQuestionBody` dari `setup.ts`.

---

## API Endpoints

### GET /health

Endpoint untuk mengecek apakah server berjalan.

**Response**
```
200 Healthy
```

---

### POST /ask

Mengirim pertanyaan ke Gemini dan mengembalikan jawaban lengkap sekaligus.

**Request**
```json
{
  "question": "Apa itu AI?"
}
```

**Response**
```json
{
  "answer": "AI adalah..."
}
```

**Error response**

| Status | Penyebab |
|--------|----------|
| 400 | Body bukan `{ question: string }` |
| 400 | Body bukan JSON valid |
| 500 | Error dari Gemini API |

---

### POST /ask/stream

Mengirim pertanyaan ke Gemini dan mengalirkan jawaban secara bertahap menggunakan **Server-Sent Events (SSE)**. Setiap potongan teks dikirim begitu tersedia tanpa menunggu jawaban selesai sepenuhnya.

**Request**
```json
{
  "question": "Apa itu AI?"
}
```

**Response**
```
data: {"text": "AI"}
data: {"text": " adalah..."}
data: [DONE]
```

Sinyal `data: [DONE]` menandakan stream telah selesai.

**Error response**

| Status | Penyebab |
|--------|----------|
| 400 | Body bukan `{ question: string }` |
| 400 | Body bukan JSON valid |
| 500 | Error dari Gemini API (dikirim sebagai SSE event) |

---

## Pengujian dengan curl

```bash
# Health check
curl http://localhost:3000/health

# Ask
curl -X POST http://localhost:3000/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "Apa itu AI?"}'

# Stream
curl -N -X POST http://localhost:3000/ask/stream \
  -H "Content-Type: application/json" \
  -d '{"question": "Apa itu AI?"}'

# JSON tidak valid (harus return 400)
curl -X POST http://localhost:3000/ask \
  -H "Content-Type: application/json" \
  -d '{invalid}'

# Field question tidak ada (harus return 400)
curl -X POST http://localhost:3000/ask \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## Hasil Pengujian

*(Tambahkan screenshot atau output di sini)*
