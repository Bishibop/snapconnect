# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SnapConnect is an ephemeral messaging app similar to Snapchat, built with React Native, Expo, and Supabase. The project is in its initial setup phase with plans for AR filters, real-time messaging, and AI-powered features.

## Development Commands

```bash
# Install dependencies (preferred)
pnpm install

# Start development server
pnpm start

# Platform-specific commands
pnpm android   # Run on Android
pnpm ios       # Run on iOS  
pnpm web       # Run in browser

# Alternative with npm
npm start
npm run android
npm run ios
npm run web
```

## Architecture Overview

### Frontend Structure
- **Entry Point**: `App.tsx` → Main application component
- **Registration**: `index.ts` → Expo root component registration
- **State Management**: Zustand (planned)
- **Navigation**: React Navigation (planned)
- **UI**: React Native StyleSheet with theme constants

### Backend Architecture (Supabase)
- **Database**: PostgreSQL with Row Level Security
- **Auth**: Supabase Auth for user management
- **Storage**: Supabase Storage for media files
- **Realtime**: WebSockets for instant messaging
- **Edge Functions**: Server-side logic for notifications and scheduled tasks

### Key Technical Decisions
1. **Client-Heavy Design**: AR filters and media compression happen on device
2. **Ephemeral by Design**: Auto-deletion with minimal storage
3. **Realtime First**: WebSocket connections for instant updates
4. **TypeScript**: Strict mode enabled for type safety

### Environment Configuration
- Copy `.env.example` to `.env.local`
- Use `EXPO_PUBLIC_` prefix for client-accessible variables
- Required: Supabase URL and anon key
- Future: OpenAI API key for AI features

## Database Schema (Planned)

Key tables:
- `profiles`: User information and push tokens
- `messages`: Ephemeral messages with expiration
- `stories`: 24-hour posts
- `friendships`: Friend connections
- `groups`: Group chat metadata

## Current State

The project is a fresh React Native Expo setup. Core features to be implemented:
- Phase 1: Camera, messaging, stories, AR filters
- Phase 2: AI-powered captions, recommendations using OpenAI + pgvector

No testing framework or linting is configured yet.