1. LayoutAnimation warning — suppressed in app/_layout.tsx via LogBox.ignoreLogs. It's a no-op from a 3rd-party lib (react-native-reanimated) on the New Architecture — nothing to fix in your code.

2. Broken routes fixed — registered chat/[id] and shortlist/index in the root app/_layout.tsx. They were missing from the <Stack> so Expo Router couldn't navigate to them.

3. Full-screen nav drawer — replaced the partial w-4/5 slide-out with a full-screen Modal (animationType="slide", transparent={false}) in index.tsx. Added:

Close × button top-right in the header
User avatar (real image if avatar_url exists, fallback to icon)
Chevron arrows on each row
Larger touch targets (40px icons)
4. Chat — full Supabase Realtime — rewrote chatStore.ts with two separate channels:

Channel	Purpose
chat:messages:{id}	INSERT → appends new messages live; UPDATE → syncs read status (double-tick)
chat:inbox:{userId}	INSERT → updates last_message preview + increments unread badge; UPDATE → decrements badge when messages are read
Chat room screen now passes currentUserId to subscribeToMessages so incoming messages are auto-marked read while the chat is open
Inbox subscribes on focus, unsubscribes on blur (no stale channels)
sendMessage now re-throws on error so the UI can restore the draft text
