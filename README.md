<div align="center">
  <img src="/public/logo.png" alt="Devion Logo" width="200"/>
  
  # Devion Dashboard
  
  [![Nuxt](https://img.shields.io/badge/Nuxt-4.2. 2-00DC82?logo=nuxt. js&logoColor=white)](https://nuxt.com)
  [![Vue](https://img.shields.io/badge/Vue-3-4FC08D?logo=vue.js&logoColor=white)](https://vuejs.org)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6? logo=typescript&logoColor=white)](https://www.typescriptlang.org)
  [![License](https://img.shields.io/badge/License-MIT-blue. svg)](LICENSE)
  
  **Platform dashboard profesional yang dibangun dengan Nuxt UI, menawarkan antarmuka modern dan responsif untuk kebutuhan manajemen data dan visualisasi.**
  
  [Demo](#) • [Dokumentasi](#dokumentasi) • [Fitur](#-fitur) • [Instalasi](#-instalasi)
</div>

---

## 📸 Preview

<div align="center">
  <img src="/public/Devion. png" alt="Devion Dashboard Preview" width="800"/>
</div>

## ✨ Fitur

- 🎨 **UI Modern & Responsif** - Dibangun dengan Nuxt UI dan Tailwind CSS v4
- 🌓 **Dark/Light Mode** - Mode tema yang dapat disesuaikan dengan preferensi sistem
- 📊 **Visualisasi Data** - Integrasi Chart.js dan Unovis untuk grafik interaktif
- 🔐 **Autentikasi** - Sistem autentikasi yang aman
- 📱 **PWA Ready** - Dilengkapi dengan web manifest dan icon set lengkap
- 🎯 **TypeScript** - Full type safety dengan TypeScript
- 🔄 **Hot Module Replacement** - Development experience yang cepat
- ⚡ **Optimized Performance** - Dioptimasi untuk performa maksimal
- 🎭 **Component Library** - Komponen UI yang dapat digunakan kembali
- 🛠️ **Developer Friendly** - ESLint, Prettier, dan TypeChecker terintegrasi

## 🚀 Tech Stack

- **Framework:** [Nuxt 4. 2.2](https://nuxt.com) - The Intuitive Vue Framework
- **UI Library:** [Nuxt UI](https://ui.nuxt.com) - Fully styled and customizable components
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com) - Utility-first CSS framework
- **Charts:** 
  - [Chart.js](https://www.chartjs.org) + [Vue ChartJS](https://vue-chartjs.org)
  - [Unovis](https://unovis.dev) - Modular data visualization framework
- **Icons:** [Iconify](https://iconify.design) (Lucide + Simple Icons)
- **Utilities:**
  - [VueUse](https://vueuse.org) - Collection of Vue Composition Utilities
  - [date-fns](https://date-fns.org) - Modern JavaScript date utility library
  - [Zod](https://zod.dev) - TypeScript-first schema validation
- **3D Graphics:** [OGL](https://github.com/oframe/ogl) - Minimal WebGL Library

## 📦 Instalasi

### Prerequisites

- Node.js >= 18.x
- pnpm >= 10.26.1 (recommended) atau npm/yarn

### Clone Repository

```bash
git clone https://github.com/yawwnann/Devion-Frontend. git
cd Devion-Frontend
```

### Install Dependencies

```bash
# Menggunakan pnpm (recommended)
pnpm install

# Atau menggunakan npm
npm install

# Atau menggunakan yarn
yarn install
```

### Environment Variables

Salin file `.env.example` menjadi `.env` dan sesuaikan konfigurasinya:

```bash
cp .env.example .env
```

Konfigurasi environment variables:

```env
NUXT_PUBLIC_USE_MOCK=false
NUXT_PUBLIC_API_URL=http://localhost:3000/api
```

## 🛠️ Development

Jalankan development server pada `http://localhost:5173`:

```bash
# Development mode
pnpm dev

# Development mode dengan hot reload
pnpm dev --open
```

## 🏗️ Build

Build aplikasi untuk production:

```bash
# Build untuk production
pnpm build

# Preview production build
pnpm preview
```

## 📝 Scripts

| Command | Deskripsi |
|---------|-----------|
| `pnpm dev` | Start development server di port 5173 |
| `pnpm build` | Build aplikasi untuk production |
| `pnpm preview` | Preview production build |
| `pnpm lint` | Linting dengan ESLint |
| `pnpm typecheck` | Type checking dengan Vue TSC |
| `pnpm postinstall` | Prepare Nuxt (auto run after install) |

## 📂 Struktur Proyek

```
Devion-Frontend/
├── app/
│   ├── assets/          # Static assets (CSS, images)
│   ├── components/      # Vue components
│   ├── composables/     # Vue composables
│   ├── layouts/         # Layout components
│   ├── middleware/      # Route middleware
│   ├── pages/           # Page components (auto-routing)
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── app.config.ts    # App configuration
│   ├── app.vue          # Root component
│   └── error.vue        # Error page
├── public/              # Public static files
│   ├── logo.png         # Main logo
│   ├── logo-w. png       # White version logo
│   ├── logo. svg         # SVG logo
│   ├── Devion.png       # Preview image
│   └── favicon.ico      # Favicon
├── server/              # Server API routes
├── nuxt.config.ts       # Nuxt configuration
├── package.json         # Dependencies
└── tsconfig.json        # TypeScript configuration
```

## 🎨 Kustomisasi

### Warna Tema

Edit file `app/app.config.ts` untuk mengubah warna tema:

```typescript
export default defineAppConfig({
  ui: {
    colors:  {
      primary: 'green',
      neutral: 'zinc'
    }
  }
})
```

### Dark/Light Mode

Aplikasi mendukung dark mode secara otomatis berdasarkan preferensi sistem.  Mode dapat dikustomisasi di `nuxt.config.ts`:

```typescript
colorMode: {
  preference: 'system', // 'system' | 'light' | 'dark'
  fallback:  'dark',
  classSuffix: ''
}
```

## 🔧 Konfigurasi

### API Configuration

Konfigurasi API endpoint di file `.env`:

```env
NUXT_PUBLIC_API_URL=http://localhost:3000/api
NUXT_PUBLIC_USE_MOCK=false
```

### Port Configuration

Development server berjalan di port 5173 secara default. Untuk mengubahnya, edit `nuxt.config.ts`:

```typescript
devServer: {
  port: 5173 // ubah sesuai kebutuhan
}
```

## 📱 PWA Support

Aplikasi dilengkapi dengan Progressive Web App support:

- ✅ Web Manifest (`/public/site.webmanifest`)
- ✅ Multiple icon sizes (16x16, 32x32, 192x192, 512x512)
- ✅ Apple Touch Icon
- ✅ Favicon

## 🤝 Contributing

Kontribusi selalu diterima! Silakan ikuti langkah berikut:

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Project ini dilisensikan di bawah [MIT License](LICENSE).

## 👨‍💻 Author

**yawwnann**

- GitHub: [@yawwnann](https://github.com/yawwnann)

## 🙏 Acknowledgments

- [Nuxt Team](https://nuxt.com) - Amazing framework
- [Nuxt UI](https://ui.nuxt.com) - Beautiful UI components
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS
- All open-source contributors

---

<div align="center">
  <p>Made  by yawwnann</p>
  <img src="/public/logo.svg" alt="Devion" width="100"/>
</div>
