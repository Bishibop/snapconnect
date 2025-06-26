# SnapConnect

An ephemeral messaging app similar to Snapchat, built with React Native, Expo, and Supabase. Features photo/video sharing with disappearing messages, image filters, friend management, and stories.

## Prerequisites

- **Node.js** (v18 or later) - [Download here](https://nodejs.org/)
- **Expo Go app** on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

## Installation

1. Clone the repository:

```bash
git clone https://github.com/Bishibop/snapconnect.git
cd snapconnect
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
# Edit .env.local and add your Supabase credentials
```

## Running the App

Start the Expo development server:

```bash
npm start
```

This will display a QR code in your terminal. Open the **Expo Go** app on your phone and scan the QR code to run the app.

### Alternative Commands

- `npm run android` - Run on Android emulator
- `npm run ios` - Run on iOS simulator
- `npm run web` - Run in web browser
