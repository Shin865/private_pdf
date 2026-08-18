# PDF Tool — Local PDF Toolbox

Aplikasi PDF Tool lokal untuk manipulasi dan konversi PDF secara cepat tanpa mengunggah dokumen ke server eksternal. Semua pemrosesan dilakukan di komputer Anda.

## ✨ Fitur

| Fitur | Deskripsi |
|-------|-----------|
| 📄 Merge PDF | Gabungkan beberapa PDF menjadi satu |
| ✂️ Split PDF | Pisahkan PDF berdasarkan range halaman |
| 🗜️ Compress PDF | Kurangi ukuran file PDF |
| 🔄 Rotate PDF | Rotasi halaman 90°, 180°, 270° |
| 📑 Page Editor | Hapus, ambil, dan susun ulang halaman |
| 🖼️ PDF → Image | Konversi PDF ke JPG/PNG |
| 📷 Image → PDF | Konversi gambar ke PDF |
| 💧 Watermark | Tambah watermark teks ke PDF |

## 🔒 Privasi

- ✅ 100% lokal — file tidak pernah meninggalkan komputer
- ✅ Tidak memerlukan internet setelah instalasi
- ✅ Tidak ada akun, login, atau database
- ✅ File temporary otomatis dihapus setelah 30 menit

## 📋 Requirements

- **Node.js** 18+
- **Python** 3.10+
- **pip** (Python package manager)

## 🚀 Installation

### 1. Clone / Download project

```bash
cd d:\PDF_tool
```

### 2. Install Backend

```bash
cd backend
pip install -r requirements.txt
```

### 3. Install Frontend

```bash
cd frontend
npm install
```

## ▶️ Running

### Terminal 1 — Backend (port 8000)

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

### Terminal 2 — Frontend (port 5173)

```bash
cd frontend
npm run dev
```

### Buka browser

```
http://localhost:5173
```

## 🛠️ Tech Stack

| Bagian | Teknologi |
|--------|-----------|
| Frontend | React + Vite + TypeScript |
| CSS | Tailwind CSS v4 |
| Backend | Python + FastAPI |
| PDF Engine | PyMuPDF (fitz) |
| PDF Security | pikepdf |
| Image Processing | Pillow |
| API | REST (internal) |
| Storage | Temporary local |

## 📁 Project Structure

```
PDF_tool/
├── frontend/           # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/ # FileUpload, Layout, PageThumbnail, ProgressBar
│   │   ├── pages/      # Home, Merge, Split, Compress, Rotate, Convert, PageEditor, Watermark
│   │   ├── services/   # API client
│   │   └── types/      # TypeScript interfaces
│   └── ...
│
├── backend/            # Python + FastAPI
│   ├── app/
│   │   ├── routes/     # pdf_routes, convert_routes, file_routes
│   │   ├── services/   # pdf_service, image_service, file_manager
│   │   └── utils/      # validators
│   └── temp/           # Temporary file storage (auto-cleanup)
│
└── README.md
```

## 🔌 API Endpoints

### PDF Operations
| Endpoint | Method | Fungsi |
|----------|--------|--------|
| `/api/pdf/info` | POST | Baca info PDF |
| `/api/pdf/merge` | POST | Gabung PDF |
| `/api/pdf/split` | POST | Pisah PDF |
| `/api/pdf/extract` | POST | Ambil halaman |
| `/api/pdf/delete-pages` | POST | Hapus halaman |
| `/api/pdf/reorder` | POST | Ubah urutan |
| `/api/pdf/rotate` | POST | Rotasi halaman |
| `/api/pdf/compress` | POST | Kompres PDF |
| `/api/pdf/watermark` | POST | Tambah watermark |
| `/api/pdf/page-numbers` | POST | Tambah nomor halaman |
| `/api/pdf/thumbnails` | POST | Generate thumbnail |

### Conversion
| Endpoint | Method | Fungsi |
|----------|--------|--------|
| `/api/convert/pdf-to-image` | POST | PDF → JPG/PNG |
| `/api/convert/image-to-pdf` | POST | JPG/PNG → PDF |

### File Management
| Endpoint | Method | Fungsi |
|----------|--------|--------|
| `/api/files/download/{id}` | GET | Download hasil |
| `/api/files/cleanup` | POST | Bersihkan temp |
| `/api/files/stats` | GET | Statistik storage |

## 📝 Version

**v0.1.0** — MVP

## Auto Run 

Run in D:\PDF_tool : 

```bash
.\run.bat
```
