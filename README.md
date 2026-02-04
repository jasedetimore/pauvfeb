# Pauv

A modern web application built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Tech Stack

- **Frontend Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend/Database**: Supabase (PostgreSQL, Auth, Storage)
- **Hosting**: AWS Amplify

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components (Atomic Design)
│   ├── atoms/            # Basic building blocks
│   ├── molecules/        # Combinations of atoms
│   ├── organisms/        # Complex components
│   └── templates/        # Page layouts
├── lib/                  # Utility functions and libraries
│   └── supabase/        # Supabase client configuration
└── middleware.ts         # Next.js middleware for auth
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- AWS account (for Amplify deployment)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   
4. Add your Supabase credentials to `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Deployment

This project is configured for AWS Amplify deployment. The `amplify.yml` file contains the build configuration.

## License

ISC
