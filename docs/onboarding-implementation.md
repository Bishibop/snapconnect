# SnapConnect Onboarding Implementation Guide

## Overview

This document outlines the implementation plan for a simple, effective onboarding flow that guides new users to create their first VibeReel. The onboarding is designed to be lightweight and non-intrusive while ensuring users understand the core value proposition of the app.

## User Journey

### 1. First App Launch
- New user opens the app after signing up
- App detects this is their first time (no onboarding completion flag)
- Welcome screen is displayed

### 2. Welcome Screen
- **Full-screen presentation** with SnapConnect branding
- **Key messaging:**
  - App logo/name
  - Tagline: "Create & Share Your Vibe Through Art"
  - Brief description: "Turn your photos into collaborative art experiences that disappear after 24 hours"
- **Single CTA:** "Get Started" button

### 3. Camera Tab Discovery
- User lands on main app (VibeReels tab)
- Semi-transparent overlay dims all UI except camera tab
- Animated arrow points to camera icon with bounce effect
- Tooltip: "Tap here to create your first VibeReel!"
- Camera icon pulses with subtle glow

### 4. First Photo Capture
- Camera opens with brief instructional overlay
- Message: "Take a photo of something that inspires you"
- Tip: "Your photo will be matched with similar art from the community"
- User takes photo and proceeds to preview

### 5. VibeReel Creation
- Art matching screen appears
- Contextual messaging based on available art:
  - If matches exist: "Select pieces that match your vibe"
  - If no matches: "You're the first! Your VibeReel will inspire others"
- Create button is highlighted

### 6. Success & Education
- Confetti animation on first VibeReel creation
- Success message: "Your first VibeReel is live for 24 hours!"
- Quick tips carousel:
  - "VibeReels disappear after 24 hours"
  - "Get more vibes by creating unique content"
  - "Add friends to share private VibeChecks"
- "Explore" CTA to discover other content

## Technical Implementation

### 1. Onboarding Context (`contexts/OnboardingContext.tsx`)

```typescript
interface OnboardingState {
  hasSeenWelcome: boolean;
  hasCreatedFirstVibeReel: boolean;
  hasTappedCamera: boolean;
}

interface OnboardingContextType {
  state: OnboardingState;
  completeWelcome: () => void;
  completeFirstVibeReel: () => void;
  markCameraTapped: () => void;
  resetOnboarding: () => void; // For testing
}
```

**Key features:**
- Persist state to AsyncStorage
- Load state on app launch
- Provide hooks for components to check/update progress
- Export `useOnboarding` hook

### 2. Welcome Screen (`screens/onboarding/WelcomeScreen.tsx`)

**Component structure:**
```typescript
- SafeAreaView wrapper
- Logo/branding section (top 40%)
- Text content section (middle 40%)
- CTA button section (bottom 20%)
- Animated entrance (fade in + slight scale)
```

**Key behaviors:**
- Navigate to main app on "Get Started" tap
- Update onboarding context (hasSeenWelcome = true)
- No skip option (single path forward)

### 3. Camera Tab Hint (`components/onboarding/CameraTabHint.tsx`)

**Component features:**
- Absolute positioned overlay
- Semi-transparent background (rgba(0,0,0,0.7))
- Cutout/highlight for camera tab
- Animated arrow component
- Tooltip with instructional text

**Animation details:**
- Arrow: Bounce animation (transform translateY)
- Camera icon: Pulse effect (scale + opacity)
- Auto-dismiss on camera tab press

### 4. Navigation Updates

**RootNavigator.tsx modifications:**
```typescript
const { state } = useOnboarding();

// Show welcome screen for new users
if (!state.hasSeenWelcome) {
  return <WelcomeScreen />;
}

// Otherwise show normal app flow
return <TabNavigator />;
```

**TabNavigator.tsx modifications:**
- Wrap in OnboardingProvider
- Add CameraTabHint overlay conditionally
- Track camera tab interactions

### 5. VibeReel Creation Success

**Updates to VibeReelPreview.tsx:**
- Detect if this is user's first VibeReel
- Show confetti animation (using react-native-confetti-cannon)
- Display educational tooltips
- Update onboarding state

## State Management Flow

```
App Launch
    ↓
Load Onboarding State from AsyncStorage
    ↓
hasSeenWelcome? → No → Show WelcomeScreen
    ↓ Yes
Show Main App
    ↓
hasCreatedFirstVibeReel? → No → Show Camera Hint
    ↓ Yes
Normal App Experience
```

## UI/UX Considerations

### Visual Design
- **Consistency:** Use existing theme colors and typography
- **Clarity:** High contrast overlays for visibility
- **Delight:** Subtle animations to engage without overwhelming
- **Accessibility:** Ensure all text meets WCAG contrast requirements

### Interaction Design
- **Progressive disclosure:** One concept at a time
- **Clear CTAs:** Single, obvious next action
- **Quick completion:** Entire flow under 2 minutes
- **Non-blocking:** Users can explore if they dismiss hints

### Copy Guidelines
- **Concise:** Maximum 2 lines of text per screen
- **Action-oriented:** Use verbs ("Create", "Explore", "Share")
- **Benefit-focused:** Explain the "why" not just the "what"
- **Friendly tone:** Casual but not overly playful

## Implementation Checklist

- [ ] Create OnboardingContext with AsyncStorage persistence
- [ ] Build WelcomeScreen component
- [ ] Create CameraTabHint overlay component
- [ ] Add arrow animation component
- [ ] Update RootNavigator with onboarding logic
- [ ] Modify TabNavigator to show hints
- [ ] Add success state to VibeReelPreview
- [ ] Implement confetti animation
- [ ] Create educational tooltips component
- [ ] Test complete flow on iOS and Android
- [ ] Add analytics events for funnel tracking

## Future Enhancements

### Phase 2 (Post-MVP)
- Interactive tutorial for AR filters
- Friend addition prompts after first VibeReel
- Gamification elements (achievements for first actions)
- Personalized tips based on user behavior

### Phase 3 (Growth)
- A/B testing different welcome messages
- Video tutorial option
- Social proof (show popular VibeReels during onboarding)
- Referral prompts after successful creation

## Analytics Events

Track these events to measure onboarding effectiveness:

```typescript
// Onboarding funnel
'onboarding_started'
'welcome_screen_viewed'
'welcome_get_started_tapped'
'camera_hint_shown'
'camera_hint_dismissed'
'camera_opened_first_time'
'first_photo_taken'
'first_vibereel_created'
'onboarding_completed'

// Drop-off points
'onboarding_abandoned_welcome'
'onboarding_abandoned_camera'
'onboarding_abandoned_creation'
```

## Testing Considerations

### Manual Testing
1. Fresh install flow
2. Returning user (no onboarding)
3. Partial completion scenarios
4. Device rotation handling
5. Background/foreground transitions

### Automated Testing
- Unit tests for OnboardingContext
- Component tests for each screen
- E2E test for complete flow
- AsyncStorage persistence tests

## Accessibility

- All images have proper labels
- Interactive elements have touch targets ≥ 44pt
- Screen reader announces onboarding steps
- Animations respect reduce motion preferences
- Color contrast meets WCAG AA standards

## Performance

- Lazy load confetti library
- Optimize animation frame rates
- Minimal AsyncStorage reads
- Preload next screen during transitions
- Total bundle size impact < 50KB