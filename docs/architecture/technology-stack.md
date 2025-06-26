# SnapConnect Technology Stack

## Core Technologies

### Language & Runtime
- **TypeScript 5.x** - Primary language with strict mode enabled
- **Node.js 18+** - JavaScript runtime
- **React Native 0.79.4** - Cross-platform mobile framework
- **Expo SDK 53** - React Native development platform

### Package Management
- **npm** - Primary package manager
- **pnpm** - Preferred for faster installs and disk efficiency

## Backend Technologies

### Backend as a Service
- **Supabase** - Complete backend platform
  - PostgreSQL database
  - Authentication service
  - Realtime subscriptions
  - Storage for media files
  - Row Level Security

### Database
- **PostgreSQL 15** - Primary database via Supabase
- **Database Migrations** - Version controlled schema changes
- **Row Level Security (RLS)** - Database-level access control

### APIs & Services
- **Supabase REST API** - Auto-generated from database schema
- **Supabase Realtime** - WebSocket connections for live updates
- **Supabase Auth** - User authentication and session management
- **Supabase Storage** - S3-compatible object storage for photos

## Frontend Technologies

### UI Framework
- **React Native** - Mobile UI framework
- **React Navigation 6** - Navigation library
  - Bottom tab navigator
  - Stack navigators
  - Composite navigation patterns

### State Management
- **React Built-in State** - useState, useContext, useReducer
- **Custom Hooks** - Encapsulated state logic
- **In-memory Cache** - Performance optimization layer

### Styling
- **React Native StyleSheet** - Native styling solution
- **Theme Constants** - Centralized design tokens

### UI Components
- **React Native Safe Area Context** - Handle device safe areas
- **Expo Camera** - Camera functionality
- **React Native Image Filter Kit** - Photo filters
- **Custom Components** - Reusable UI elements

## Infrastructure

### Cloud Provider
- **Supabase Cloud** - Managed PostgreSQL and services
- **Supabase Storage** - CDN-backed media storage

### Development Environment
- **Expo Go** - Development client
- **Expo Dev Client** - Custom development builds
- **iOS Simulator** - iOS testing
- **Android Emulator** - Android testing

### Deployment
- **Expo Application Services (EAS)** - Build and deploy pipeline
- **Over-the-air Updates** - Expo Updates for instant deployments

## Development Tools

### Version Control
- **Git** - Source control
- **GitHub** - Code repository and collaboration

### Code Quality
- **ESLint** - JavaScript/TypeScript linting
  - React Native specific rules
  - Custom configuration
- **Prettier** - Code formatting
  - Consistent style enforcement
  - Editor integration

### Development Tools
- **TypeScript Compiler** - Type checking
- **Expo CLI** - Development server and tools
- **React Native Debugger** - Debugging tool
- **Flipper** - Mobile app debugging platform

### Testing (Future)
- **Jest** - Unit testing framework (planned)
- **React Native Testing Library** - Component testing (planned)
- **Detox** - E2E testing (planned)

## External Services

### Media Processing
- **React Native Image Filter Kit** - Client-side image filters
- **Expo AV** - Audio/video playback (deprecation planned)
- **Expo Media Library** - Save media to device

### Developer Services
- **Sentry** - Error tracking (planned)
- **Analytics** - User behavior tracking (planned)

### Future Integrations
- **OpenAI API** - AI-powered features (Phase 2)
- **pgvector** - Vector database for AI (Phase 2)
- **Push Notification Service** - FCM/APNs (future)

## Architecture Patterns

### Design Patterns
- **Component-based Architecture** - Reusable UI components
- **Custom Hooks Pattern** - Logic encapsulation
- **Service Layer Pattern** - API abstraction
- **Error Boundary Pattern** - Graceful error handling

### Data Flow
- **Unidirectional Data Flow** - Props down, events up
- **Real-time Subscriptions** - Live data updates
- **Optimistic Updates** - Immediate UI feedback
- **Cache-first Strategy** - Performance optimization

### Security Patterns
- **Row Level Security** - Database access control
- **JWT Authentication** - Secure API access
- **Environment Variables** - Secure configuration
- **HTTPS Only** - Encrypted communication