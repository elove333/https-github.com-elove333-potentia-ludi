# STEPFLOW Mobile App

A React Native mobile application for rhythm and motion training.

## Project Structure

```
mobile/
├── src/
│   ├── navigation/          # Navigation configuration
│   │   ├── RootNavigator.tsx
│   │   ├── AppStack.tsx
│   │   └── AuthStack.tsx
│   ├── screens/             # Screen components
│   ├── components/          # Reusable UI components
│   ├── hooks/               # Custom React hooks
│   ├── services/            # Business logic and integrations
│   │   ├── motion-tracking/ # Motion detection services
│   │   ├── ai-models/       # AI/ML integrations
│   │   ├── api/             # Backend API
│   │   └── audio/           # Audio management
│   ├── styles/              # Global styles and themes
│   ├── utils/               # Utility functions
│   └── assets/              # Static resources
│       ├── images/
│       ├── fonts/
│       └── sounds/
└── tests/                   # Test files
    ├── unit/
    ├── integration/
    └── e2e/

```

## Navigation

The app uses React Navigation with the following structure:

- **RootNavigator**: Main navigator that switches between Auth and App stacks
- **AuthStack**: Handles unauthenticated user flows (Welcome, Login, Signup)
- **AppStack**: Contains main app screens (Home, Training, Results, Settings)

## Getting Started

### Prerequisites

- Node.js 18+
- React Native development environment
- iOS: Xcode (for iOS development)
- Android: Android Studio (for Android development)

### Installation

```bash
cd mobile
npm install
```

### Running the App

```bash
# iOS
npm run ios

# Android
npm run android
```

## Development

See individual README files in each directory for specific guidelines:

- [src/README.md](src/README.md) - Source code structure
- [src/assets/README.md](src/assets/README.md) - Assets organization
- [src/components/README.md](src/components/README.md) - Component guidelines
- [src/hooks/README.md](src/hooks/README.md) - Custom hooks
- [src/screens/README.md](src/screens/README.md) - Screen components
- [src/services/README.md](src/services/README.md) - Service modules
- [src/styles/README.md](src/styles/README.md) - Styling guidelines
- [src/utils/README.md](src/utils/README.md) - Utility functions
- [tests/README.md](tests/README.md) - Testing guidelines
