# Lipi ✦

> "Turn your handwriting into identity."

Lipi is a modern, aesthetic web application that allows users to turn their own handwriting into a fully functional, downloadable custom font (TTF/OTF). Users can either draw their letters digitally directly in the browser or upload a photograph of their handwritten alphabet.

## Features

- **Digital Drawing Canvas:** Draw your alphabet letter-by-letter using a mouse, touch screen, or stylus on a digital grid with baseline and x-height guides.
- **Handwriting Upload:** Download a calibration sheet, write out your alphabet in sequence, take a photo, and upload it.
- **Computer Vision Extraction:** Built-in client-side image processing automatically binarizes, detects blobs, and extracts skeleton strokes from your uploaded handwriting photos.
- **Font Generation:** Convert your vectorized strokes directly into standard `.ttf` or `.otf` font files that can be installed on Windows, macOS, or used as web fonts.
- **Real-time Preview:** Test your font instantly in the browser before exporting.
- **Cloud Sync:** Save your progress and manage multiple font projects seamlessly via Firebase.

## Technology Stack

Lipi is built with a modern React stack, focusing on performance, client-side processing, and beautiful brutalist-inspired UI design.

### Core
- **Framework:** [Next.js](https://nextjs.org/) (App Router, v16+)
- **UI Library:** [React](https://react.dev/) (v19)
- **Language:** [TypeScript](https://www.typescriptlang.org/)

### Styling & UI
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Utility:** `clsx` and `tailwind-merge` for dynamic class construction
- **Icons:** [Lucide React](https://lucide.dev/)

### State Management & Backend
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/) (with `immer` for immutable state updates)
- **Backend/Auth:** [Firebase](https://firebase.google.com/) (Authentication & Firestore)

### Specialized Libraries
- **Font Generation:** [opentype.js](https://opentype.js.org/) (Parses and creates OpenType/TrueType fonts entirely in the browser)
- **PDF Generation:** [jsPDF](https://parall.ax/products/jspdf) (Used for generating the handwriting calibration templates)
- **Analytics:** [PostHog](https://posthog.com/)

## Getting Started

First, install the dependencies:
```bash
npm install
```

Set up your `.env.local` file with your Firebase and PostHog credentials:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=your_posthog_host
```

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Architecture Notes

Lipi performs **heavy image processing on the client side** to respect user privacy and save server costs. The `imageProcessor.ts` file utilizes HTML5 `<canvas>` and `Uint8ClampedArray` manipulation to perform Otsu's thresholding, blob detection, spatial hashing for skeleton tracing, and sequential character mapping directly in the browser memory.
