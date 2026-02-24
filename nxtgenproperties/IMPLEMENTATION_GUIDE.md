# City Preference Feed Implementation - Complete Guide

## Overview
This implementation adds a personalized feed feature to the NxtGenProperties app similar to 99acres.com. When users search for properties in a city, that city is saved to their preferences, and the next time they open the app, their feed is populated with properties from their preferred cities.

## Changes Made

### 1. **Database Schema** (`supabase/schema.sql`)
Added `user_preferences` table to track user search history and preferences:
```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY
  user_id UUID (UNIQUE reference to users_profiles)
  preferred_cities TEXT[] (array of city names)
  preferred_types TEXT[] (array of buy/rent)
  preferred_categories TEXT[] (array of residential/commercial)
  search_history JSONB (array of search objects with timestamps)
  last_search_at TIMESTAMP
  created_at/updated_at TIMESTAMP
)
```

**RLS Policies:**
- Users can only view, create, and update their own preferences
- Automatic `updated_at` trigger added

### 2. **Type Definitions** (`types/index.ts`)
Added new TypeScript interfaces:
- `SearchHistory`: Tracks individual searches with query, filters, city, and timestamp
- `UserPreferences`: Root interface containing all user preference data

### 3. **New Hook** (`hooks/useUserPreferences.ts`)
Created comprehensive hook for preference management:

**Functions:**
- `fetchUserPreferences()`: Load user's preferences from Supabase
- `createUserPreferences()`: Initialize preferences for new users
- `addToSearchHistory()`: Log searches and auto-update preferred cities
- `updatePreferredCities()`: Manually update city preferences (max 5 cities)
- `updatePreferredTypes()`: Update preferred property types
- `updatePreferredCategories()`: Update preferred categories
- `clearSearchHistory()`: Clear all search history
- `getPreferredCities()`: Get current preferred cities
- `getSearchHistory()`: Get search history

**Key Features:**
- Auto-extracts cities from search filters
- Keeps latest 50 searches
- Auto-limits preferred cities to 5
- Syncs all changes to Supabase

### 4. **Authentication Store Updates** (`stores/authStore.ts`)
Enhanced with:
- `userPreferences` state field
- `setUserPreferences()` action
- Clear preferences on sign out

### 5. **Properties Store Updates** (`stores/propertiesStore.ts`)
Added new method:
- `filterByPreferredCities(cities: string[])`: Sorts properties with preferred cities first

### 6. **Search Screen Updates** (`app/(tabs)/search/index.tsx`)
- Imports `useUserPreferences` hook
- `handleSearch()`: Tracks text queries
- `applyFilters()`: Automatically logs city-based searches to preferences
- Records search intent for personalization

### 7. **Home Screen Updates** (`app/(tabs)/index.tsx`)
- Imports `useUserPreferences` hook
- Fetches preferred cities on component load
- Dynamic feed title shows preferred cities
- Falls back to featured properties if no preferences exist
- Displays properties sorted by user preferences

### 8. **New Hook** (`hooks/useProperties.ts`)
Added `usePreferredCitiesProperties()` hook:
- Fetches properties from preferred cities
- Supports pagination with limit parameter
- Returns loading, error, and refresh states
- Ideal for server-side filtering

## How It Works - User Flow

```
1. User searches "Noida" or filters by "Noida" city
   ↓
2. Search screen calls addToSearchHistory("Noida", filters)
   ↓
3. useUserPreferences hook:
   - Extracts city from search
   - Adds to preferred_cities array (max 5)
   - Records to search_history
   - Updates last_search_at
   ↓
4. Data persisted to Supabase user_preferences table
   ↓
5. User logs out and reopens app next day
   ↓
6. Home screen calls getPreferredCities()
   ↓
7. Feed displays properties filtered by preferred cities
   ↓
8. Title changes to "Properties in Noida, Delhi, Bangalore" etc.
```

## Usage Examples

### Track a Search
```typescript
const { addToSearchHistory } = useUserPreferences();

// Simple text search
await addToSearchHistory("2 BHK in Noida");

// Filter-based search
await addToSearchHistory(
  "Properties in Gurgaon",
  { city: "Gurgaon", type: "buy", minPrice: 5000000 },
  "Gurgaon"
);
```

### Get Preferred Cities
```typescript
const { getPreferredCities } = useUserPreferences();

const cities = getPreferredCities(); // ['Noida', 'Delhi', 'Gurgaon']
```

### Filter Properties by Preferences
```typescript
const { filterByPreferredCities } = usePropertiesStore();

const sorted = filterByPreferredCities(['Noida', 'Delhi']);
// Returns all properties with Noida/Delhi first, others after
```

## Features Implemented

✅ **Search Tracking**
- Tracks text searches
- Tracks filter-based searches
- Records full filter context

✅ **Auto City Detection**
- Automatically extracts cities from searches
- Updates preferred_cities array
- Limits to 5 cities

✅ **Preference Management**
- Create/read/update preferences
- Clear search history
- Manual preference updates

✅ **Data Persistence**
- All data synced to Supabase
- Row-level security enabled
- User isolation guaranteed

✅ **Intelligent Feed**
- Shows preferred city properties first
- Falls back to featured if no preferences
- Dynamic title based on preferences

✅ **Search History**
- Last 50 searches retained
- Full filter context saved
- Timestamped entries

## Advanced Features to Add Later

1. **Search Frequency Analytics**
   - Track how many times each city is searched
   - Rank by frequency

2. **Time-Based Decay**
   - Weight recent searches higher
   - Fade old searches over time

3. **Smart Trending**
   - Show trending cities across user base
   - Recommend cities based on interests

4. **Preference Management UI**
   - Visual interface to manage preferred cities
   - Edit/remove individual cities
   - Set up to 5 favorites

5. **Notification Integration**
   - Alert when new properties in preferred cities
   - Push notifications for price drops

## Database Query Examples

### Get User's Preferred Cities
```sql
SELECT preferred_cities FROM user_preferences 
WHERE user_id = $1;
```

### Get Properties from Preferred Cities
```sql
SELECT * FROM properties 
WHERE city = ANY($1) 
ORDER BY created_at DESC;
```

### Get Recent Searches for User
```sql
SELECT search_history FROM user_preferences 
WHERE user_id = $1;
```

## Testing Checklist

- [ ] Sign up and create account
- [ ] Search for or filter by a city (e.g., "Noida")
- [ ] Verify `user_preferences` record created in Supabase
- [ ] Verify city added to `preferred_cities` array
- [ ] Log out and log back in
- [ ] Verify home feed shows properties from that city first
- [ ] Search for different city
- [ ] Verify multiple cities in feed title
- [ ] Check search history grows in `search_history` field
- [ ] Test manual preference updates
- [ ] Test clearing search history

## Notes for Developers

1. **Supabase Setup Required**: Run the updated schema.sql in your Supabase project first
2. **RLS Policies**: Make sure RLS is enabled on `user_preferences` table
3. **User Authentication**: Feature only works for authenticated users
4. **Fallback**: Shows featured properties for new users without preferences
5. **Performance**: Preferred cities are fetched from hook on component mount
6. **Sync**: All updates are real-time via Supabase

## File Structure Summary

```
hooks/
├── useProperties.ts (added usePreferredCitiesProperties)
├── useUserPreferences.ts (NEW - main preference logic)

stores/
├── authStore.ts (added userPreferences state)
├── propertiesStore.ts (added filterByPreferredCities)

app/(tabs)/
├── index.tsx (home - uses preferences for feed)
└── search/
    └── index.tsx (search - logs searches)

types/
└── index.ts (added SearchHistory, UserPreferences)

supabase/
└── schema.sql (added user_preferences table)
```

## Debugging Tips

1. **Check Supabase Data**
   - Go to Supabase dashboard → user_preferences table
   - Verify data is being saved

2. **Check Hook State**
   - Use React DevTools to inspect useUserPreferences state
   - Verify preferences are being fetched

3. **Check Feed Update**
   - Log preferredCities value in home screen
   - Verify filterByPreferredCities is working

4. **Check Logs**
   - Monitor browser console for errors
   - Check Supabase error logs

## Future Optimization Ideas

1. **Caching**: Cache preferences in device storage with sync
2. **Batch Updates**: Batch multiple searches before syncing
3. **Compression**: Compress search_history if it grows large
4. **Analytics**: Track which cities users return to most
5. **A/B Testing**: Test different sorting algorithms for feed
