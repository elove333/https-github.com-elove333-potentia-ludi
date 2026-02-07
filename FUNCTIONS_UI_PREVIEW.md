# Functions Architecture UI Preview

## Overview

This document provides a visual description of the updated UI in `app/page.tsx` that showcases the new Functions architecture.

## Page Layout

### 1. Header Section
```
┌─────────────────────────────────────────────────────────────┐
│  Potentia_Ludi: Universal Gaming Wallet Hub                  │
│  (Large, bold, white text)                                   │
└─────────────────────────────────────────────────────────────┘
```

### 2. Status Messages Section (Dynamic)

**Loading State:**
```
┌─────────────────────────────────────────────────────────────┐
│  ⏳ Seeding games...                                         │
│  (Blue background with border)                              │
└─────────────────────────────────────────────────────────────┘
```

**Error State:**
```
┌─────────────────────────────────────────────────────────────┐
│  ❌ Failed to fetch balances                                │
│  (Red background with border)                               │
└─────────────────────────────────────────────────────────────┘
```

**Success State:**
```
┌─────────────────────────────────────────────────────────────┐
│  ✅ Successfully seeded 6 games!                            │
│  (Green background with border)                             │
└─────────────────────────────────────────────────────────────┘
```

### 3. Demo Mode Toggle
```
┌─────────────────────────────────────────────────────────────┐
│  [ Use Real Wallet ] or [ Demo w/ Test Wallet (0x742d...) ]│
│  (Green button, toggles between modes)                      │
└─────────────────────────────────────────────────────────────┘
```

### 4. Chain Selector
```
┌──────────────────────────────────────────────────────────────┐
│  [ Polygon ]  [ Polygon Mumbai ]  [ Ethereum ]               │
│  (Active chain highlighted in blue, others in transparent)   │
└──────────────────────────────────────────────────────────────┘
```

### 5. Functions API Section (NEW)
```
┌─────────────────────────────────────────────────────────────┐
│  🎮 Functions API                                           │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ 🔧 Check     │  │ 🌱 Seed      │  │ 💰 Get       │    │
│  │    Config    │  │    Games     │  │    Balances  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐                       │
│  │ 🔗 Setup     │  │ 🧪 Test      │                       │
│  │    Webhook   │  │    Webhook   │                       │
│  └──────────────┘  └──────────────┘                       │
│                                                             │
│  (Gradient colored buttons with emojis)                    │
│  (Disabled state when loading)                             │
└─────────────────────────────────────────────────────────────┘
```

Button Colors:
- **Check Config**: Cyan to Blue gradient
- **Seed Games**: Green to Emerald gradient
- **Get Balances**: Yellow to Orange gradient
- **Setup Webhook**: Purple to Pink gradient
- **Test Webhook**: Red to Rose gradient

### 6. Wallet Dashboard (Existing)
```
┌─────────────────────────────────────────────────────────────┐
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Native       │  │ Game Token   │  │ NFTs Owned   │    │
│  │ Balance      │  │ (USDC)       │  │              │    │
│  │              │  │              │  │              │    │
│  │ 1.2345 MATIC │  │ 100.00       │  │ 12           │    │
│  │ 0x742d...    │  │ 0x2791...    │  │ Across games │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
│  (Glassmorphism cards with colored text)                   │
└─────────────────────────────────────────────────────────────┘
```

### 7. Creator Dashboard (Existing)
```
┌─────────────────────────────────────────────────────────────┐
│  Creator Dashboard                                          │
│                                                             │
│  Total Earnings: $1,247.50 | Sessions: 42 | Highlights: 15 │
│                                                             │
│  [ Export Clips ]  [ Copy Referral ]                       │
│  (Gradient buttons with hover effects)                     │
└─────────────────────────────────────────────────────────────┘
```

## Interactive Features

### Button Behaviors

**1. Check Config Button**
- **On Click**: Console logs `🔧 Check Config button clicked`
- **Action**: Calls `/api/config` endpoint
- **Success**: Shows webhook URL in success message
- **Console Output**:
  ```
  🔧 Check Config button clicked
  ✅ Config checked: {...}
  ```

**2. Seed Games Button**
- **On Click**: Console logs `🌱 Seed Games button clicked`
- **Action**: Calls `/api/games/seed` endpoint
- **Success**: Shows count of seeded games
- **Console Output**:
  ```
  🌱 Seed Games button clicked
  🌱 Starting game database seeding...
  🎮 Processing: Axie Infinity (SLP) on ronin
    ✅ Saved with ID: 1
  ...
  ✅ Games seeded successfully: {...}
  ```

**3. Get Balances Button**
- **On Click**: Console logs `💰 Get Token Balances button clicked`
- **Action**: Calls `/api/alchemy/get-token-balances` with wallet address
- **Success**: Shows number of tokens found
- **Console Output**:
  ```
  💰 Get Token Balances button clicked
  🔗 Wallet: 0x742d35Cc6634C0532925a3b8D7De2665B81b5fE4
  🔗 Chain: 137
  ✅ Balances fetched: {...}
  ```

**4. Setup Webhook Button**
- **On Click**: Console logs `🔗 Setup Webhook button clicked`
- **Action**: Calls `/api/alchemy/setup-webhook` with game contracts
- **Success**: Shows configuration prepared message
- **Console Output**:
  ```
  🔗 Setup Webhook button clicked
  ✅ Webhook setup response: {...}
  ```

**5. Test Webhook Button**
- **On Click**: Console logs `🧪 Test Webhook button clicked`
- **Action**: Calls `/api/webhooks/test` to simulate webhook
- **Success**: Shows test completion message
- **Console Output**:
  ```
  🧪 Test Webhook button clicked
  🔗 Wallet: 0x742d35Cc6634C0532925a3b8D7De2665B81b5fE4
  ✅ Test webhook complete: {...}
  ```

### State Management

**Loading State:**
- All buttons disabled
- Blue loading message displayed at top
- Prevents multiple concurrent operations

**Error State:**
- Red error message displayed at top
- Error details shown
- Buttons re-enabled

**Success State:**
- Green success message displayed at top
- Operation result shown
- Buttons re-enabled

## Console Output Examples

### Successful Game Seeding
```
🌱 Seed Games button clicked
🌱 Starting game database seeding...
🗑️ Cleared existing games (development mode)
🎮 Processing: Axie Infinity (SLP) on ronin
  ✅ Saved with ID: 550e8400-e29b-41d4-a716-446655440000
🎮 Processing: The Sandbox (SAND) on ethereum
  ✅ Saved with ID: 550e8400-e29b-41d4-a716-446655440001
🎮 Processing: Gods Unchained (GODS) on ethereum
  ✅ Saved with ID: 550e8400-e29b-41d4-a716-446655440002
🎮 Processing: Decentraland (MANA) on ethereum
  ✅ Saved with ID: 550e8400-e29b-41d4-a716-446655440003
🎮 Processing: Illuvium (ILV) on ethereum
  ✅ Saved with ID: 550e8400-e29b-41d4-a716-446655440004
🎮 Processing: Gala Games (GALA) on ethereum
  ✅ Saved with ID: 550e8400-e29b-41d4-a716-446655440005
✅ Game database seeded successfully
💾 Total games seeded: 6
```

### Successful Webhook Test
```
🧪 Test Webhook button clicked
🔗 Wallet: 0x742d35Cc6634C0532925a3b8D7De2665B81b5fE4
🧪 Test webhook simulation started
🔗 Wallet: 0x742d35Cc6634C0532925a3b8D7De2665B81b5fE4
🔗 Contract: 0x3845badade8e6dff049820680d1f14bd3903a5d0
🔗 Chain ID: 1
📦 Mock webhook payload created
🔗 Transaction hash: 0x1234567890abcdef...
🔗 Sending to webhook handler: http://localhost:3001/api/webhooks/game-event-transfer
✅ Webhook handler responded
💾 Response: {...}
✅ Test webhook complete
```

## Design Features

### Color Scheme
- **Background**: Purple to Blue gradient
- **Cards**: White with transparency (glassmorphism)
- **Primary Text**: White
- **Secondary Text**: Gray-300
- **Accent Colors**: Varied gradients per button

### Typography
- **Title**: 4xl, bold
- **Section Headers**: 2xl, bold
- **Card Headers**: lg, semibold
- **Button Text**: Base, semibold
- **Values**: 3xl, bold with colored accents

### Spacing
- **Container**: Max width 4xl, centered
- **Padding**: 8 units on main container
- **Gap**: 6 units between cards, 4 units between buttons
- **Margins**: Consistent spacing between sections

### Interactive Elements
- **Hover Effects**: Color intensification on buttons
- **Disabled State**: 50% opacity, no pointer cursor
- **Active State**: Solid colors for selected chain
- **Transitions**: Smooth color transitions

## Accessibility

- **Color Contrast**: High contrast white text on dark backgrounds
- **Button States**: Clear visual feedback for all states
- **Loading Indicators**: Emoji and text for screen readers
- **Error Messages**: Red color with emoji for visibility
- **Success Messages**: Green color with emoji for confirmation

## Responsive Design

The layout adapts to different screen sizes:
- **Mobile**: Single column layout for cards
- **Tablet**: 2 columns for dashboard cards
- **Desktop**: 3 columns for dashboard cards, 3 columns for function buttons

## Browser Console Integration

All button clicks and API calls log to the browser console with:
- Emoji prefixes for easy scanning
- Request parameters
- Response data
- Success/error status
- Timing information

This makes debugging and monitoring the application straightforward for developers.
