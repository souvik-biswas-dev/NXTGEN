# Nxt Gen Properties - Real Estate Mobile App

A complete React Native + Supabase real estate marketplace application inspired by 99acres.com, featuring property listings, advanced search filters, broker verification, and real-time messaging.

## 🎯 Features

### Core Features
- **Multi-role Authentication**: Phone OTP, Email/Password, and Social Login (Google/Facebook)
- **User Roles**: Buyer, Owner, and Broker with role-specific features
- **Property Listings**: Browse, search, and filter thousands of properties
- **Advanced Search**: 15+ filters including location, price, BHK, amenities, and more
- **Property Details**: Image galleries, specifications, and contact information
- **Broker Verification**: Verified badge system for trusted brokers
- **Favorites**: Save and manage favorite properties
- **In-app Messaging**: Chat with owners and brokers
- **Profile Management**: Update profile, manage listings, and preferences

### UI/UX Highlights
- Beautiful onboarding with background images
- Buy/Rent toggle on home screen
- Property cards with heart icons and price badges
- Full-screen image gallery with zoom
- Broker badges and ratings
- Settings with notification preferences
- Responsive design for all screen sizes

## 🛠 Tech Stack

- **Frontend**: React Native 0.81 + Expo SDK 54
- **Navigation**: Expo Router v6 (file-based routing)
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Styling**: NativeWind v4 (TailwindCSS for React Native)
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation
- **Images**: Expo Image Picker + Supabase Storage

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Studio (Windows/Mac/Linux)
- Supabase account (free tier works fine)

## 🚀 Quick Start (5 Minutes)

### 1. Clone and Install

```bash
git clone <>
cd nxtgenproperties

# Install dependencies
npm install
```

### 2. Setup Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to initialize (~2 minutes)
3. Go to **Project Settings → API** and copy:
   - `Project URL` (looks like https://xxxxx.supabase.co)
   - `anon public` key (long JWT token)

4. Run the SQL schema:
   - Go to **SQL Editor** in Supabase dashboard
   - Click **New Query**
   - Copy the entire contents of `supabase-schema.sql`
   - Paste and click **Run**
   - Wait for "Success. No rows returned"

### 3. Configure Environment

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Start the App

```bash
# Start Expo development server
npx expo start

# Press 'i' for iOS simulator
# Press 'a' for Android emulator
# Scan QR code with Expo Go app for physical device
```

## 📱 App Structure

```
nxtgenproperties/
├── app/                          # Expo Router screens
│   ├── _layout.tsx              # Root layout
│   ├── index.tsx                # Entry point & redirect
│   ├── (auth)/                  # Authentication flow
│   │   ├── _layout.tsx
│   │   ├── index.tsx           # Login screen
│   │   ├── signup.tsx          # Registration
│   │   └── verify.tsx          # OTP verification
│   └── (tabs)/                  # Main app tabs
│       ├── _layout.tsx         # Tab navigation
│       ├── index.tsx           # Home screen
│       ├── search/
│       │   ├── index.tsx       # Search screen
│       │   └── [id].tsx        # Property detail
│       ├── post/
│       │   └── index.tsx       # Post property
│       ├── inbox/
│       │   └── index.tsx       # Messages
│       └── profile/
│           └── index.tsx       # Profile & settings
├── components/                  # Reusable components
│   ├── PropertyCard.tsx
│   ├── BrokerBadge.tsx
│   └── ImageGallery.tsx
├── hooks/                       # Custom React hooks
│   ├── useAuth.ts
│   └── useProperties.ts
├── stores/                      # Zustand state management
│   ├── authStore.ts
│   ├── favoritesStore.ts
│   └── searchStore.ts
├── types/                       # TypeScript definitions
│   └── index.ts
├── lib/                         # Utilities
│   └── supabase.ts             # Supabase client
├── supabase-schema.sql         # Database schema
└── README.md                   # This file
```

## 🔑 Test Credentials

For development/testing, you can use these credentials after signing up:

**Test Buyer Account:**
- Email: `buyer@test.com`
- Password: `Test1234!`

**Test Broker Account:**
- Email: `broker@test.com`  
- Password: `Test1234!`
- Role: Broker (with verified badge)

## 📸 Screenshots Match

The app closely matches the provided screenshots:

1. ✅ Splash screen with property image and "NxtGenProperties" logo
2. ✅ Login with phone number input and country selector
3. ✅ OTP verification with 4-digit input
4. ✅ Registration form with username, email, password fields
5. ✅ Home screen with Buy/Rent toggle
6. ✅ Property cards in grid layout with heart icons
7. ✅ Property detail with image gallery and stats
8. ✅ Search screen with recent searches
9. ✅ Chats list with avatars and timestamps
10. ✅ Shortlist/favorites page
11. ✅ Profile/Settings with notifications toggles

## 🗄 Database Schema

The app uses these main tables:

- **users_profiles**: Extended user data (name, role, avatar, rating)
- **properties**: Property listings with all details
- **inquiries**: Messages between users about properties
- **favorites**: Saved properties per user
- **locality_reviews**: Ratings and reviews for localities

All tables have Row Level Security (RLS) enabled for security.

## 🎨 Customization

### Colors
Edit `tailwind.config.js`:
```js
colors: {
  primary: '#FF6B35',    // Orange
  secondary: '#2E86AB',  // Blue
  success: '#27AE60',    // Green
}
```

### Fonts
Add custom fonts in `assets/fonts/` and update `tailwind.config.js`

### Splash Screen
Replace `assets/image.png` with your own (1284x2778px)

### App Icon
Replace `assets/icon.png` (1024x1024px)

## 📦 Building for Production

### iOS Build (requires Mac)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure iOS build
eas build:configure

# Build for iOS
eas build --platform ios
```

### Android Build

```bash
# Build for Android
eas build --platform android

# Or build APK for testing
eas build --platform android --profile preview
```

## 🐛 Troubleshooting

### Metro bundler issues
```bash
# Clear cache and restart
npx expo start -c
```

### Supabase connection errors
- Verify `.env` file exists with correct credentials
- Check Supabase project is not paused (free tier pauses after 1 week of inactivity)
- Run schema SQL again if tables are missing

### Images not loading
- Check Supabase storage buckets are created
- Verify storage policies are set correctly
- Use placeholder images initially for testing

### TypeScript errors
```bash
# Regenerate types
npx expo customize tsconfig.json
```

## 🔐 Security Best Practices

1. **Never commit `.env` file** - Add to `.gitignore`
2. **Use environment variables** for all sensitive keys
3. **Enable Row Level Security** on all Supabase tables
4. **Validate all user inputs** with Zod schemas
5. **Rate limit API calls** to prevent abuse
6. **Sanitize user uploads** before storage

## 📝 TODO / Roadmap

Phase 1 (MVP - Current):
- [x] Authentication (Phone OTP, Email, Social)
- [x] Home screen with property listings
- [x] Property detail screen
- [x] Favorites functionality
- [x] Basic profile management

Phase 2 (Next):
- [ ] Advanced search filters modal
- [ ] Post property wizard (multi-step form)
- [ ] Real-time chat functionality
- [ ] Push notifications
- [ ] Broker dashboard with analytics

Phase 3 (Future):
- [ ] Map integration for property locations
- [ ] Virtual tours (360° photos)
- [ ] Payment gateway for featured listings
- [ ] Property comparison tool
- [ ] Saved searches with alerts

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Design inspiration from 99acres.com
- Icons from Expo Icons (Ionicons)
- Images from Unsplash
- Backend powered by Supabase

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Email: support@nxtgenproperties.com
- Discord: [Join our community](#)

---

**Built with ❤️ using React Native + Supabase**

Happy coding! 🚀
