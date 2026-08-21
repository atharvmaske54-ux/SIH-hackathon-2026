# SafeRoute - Component Structure & Navigation Flow

## Navigation Flow
The application uses a standard authentication and bottom-tab navigation flow.

1. **Splash Screen** (`/`) 
   - Initial entry point. Displays logo and tagline.
   - Automatically navigates to Login after 2 seconds.
2. **Auth Stack**
   - **Login Screen** (`/auth/login`) - User authentication.
   - **Registration Screen** (`/auth/register`) - New user onboarding.
   - Upon successful auth, navigates to Main Tabs.
3. **Main Tabs (Bottom Navigation)**
   - **Home Tab** (`/tabs/home`) - Dashboard (Location, Safety Status, Quick SOS, Create Group).
   - **Map Tab** (`/tabs/map`) - Live location, Safe/Unsafe zones, Route suggestion.
   - **SOS Tab** (`/tabs/sos`) - Dedicated emergency screen with One-tap, Silent, and Voice options.
   - **Group Tab** (`/tabs/group`) - Manage groups, view members on map, start journey.
   - **Settings Tab** (`/tabs/settings`) - Profile, Permissions, SOS settings.
4. **Secondary Screens (Stack Navigation from Tabs)**
   - **Contacts Screen** (`/contacts`) - Add and manage trusted contacts.
   - **Alerts Screen** (`/alerts`) - Notifications for risky areas.

## Component Structure (React Native)
```
SafeRoute/
├── src/
│   ├── app/
│   │   ├── _layout.tsx           (Root Layout, configures Stack & Theme)
│   │   ├── index.tsx             (Splash Screen)
│   │   ├── auth/                 (Auth Layout Group)
│   │   │   ├── _layout.tsx
│   │   │   ├── login.tsx
│   │   │   └── register.tsx
│   │   ├── (tabs)/               (Bottom Tabs Group)
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx         (Home)
│   │   │   ├── map.tsx           (Map View)
│   │   │   ├── sos.tsx           (SOS Trigger)
│   │   │   ├── group.tsx         (Group Features)
│   │   │   └── settings.tsx      (Settings)
│   │   ├── contacts.tsx          (Contacts Screen)
│   │   └── alerts.tsx            (Alerts Screen)
│   ├── components/               (Reusable UI Components)
│   │   ├── ui/
│   │   │   ├── Button.tsx        (Primary, Secondary, Danger, Outline)
│   │   │   ├── Card.tsx          (Containers for dashboard elements)
│   │   │   └── Input.tsx         (Text inputs)
│   │   ├── SOSButton.tsx         (Highlighted quick SOS button)
│   │   └── StatusIndicator.tsx   (Safe/Medium/Risky status badge)
│   └── constants/
│       ├── Colors.ts             (Design tokens: Green, Yellow, Red, Dark, Light)
│       └── Typography.ts         (Text styles)
```

## Design System Overview
- **Typography:** Clean sans-serif fonts, large readable headers.
- **Colors:**
  - `Safe (Green)`: #10B981
  - `Medium (Yellow)`: #F59E0B
  - `Risky/Danger (Red)`: #EF4444
  - `Background`: #F9FAFB (Light Mode), #111827 (Dark Mode)
  - `Primary Action`: #3B82F6 (Blue) or Deep Charcoal for unisex feel.
- **Buttons:** Large tap targets (min 48px height), clear rounded corners.
- **Icons:** Standard recognizable icons (Lucide/Expo vector icons).
