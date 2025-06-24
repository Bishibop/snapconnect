# SnapConnect

An ephemeral messaging app with AI-powered features.

## Features

### Phase 1: Core
- Photo/video sharing with disappearing messages
- AR filters and camera effects
- Friend management
- Stories (24-hour posts)
- Group messaging

### Phase 2: AI Features
- AI-powered caption suggestions
- Personalized content recommendations
- Smart filter suggestions

## Tech Stack

- **Frontend:** React Native + Expo + TypeScript
- **Backend:** Supabase
- **AI:** OpenAI API + pgvector

See [docs/TECH_STACK.md](docs/TECH_STACK.md) for details.

## Getting Started

1. Install dependencies
```bash
pnpm install
```

2. Set up environment variables
```bash
cp .env.example .env.local
# Add your Supabase credentials
```

3. Start development
```bash
pnpm start
```

## Scripts

- `pnpm start` - Start Expo
- `pnpm android` - Run on Android
- `pnpm ios` - Run on iOS
- `pnpm web` - Run in browser