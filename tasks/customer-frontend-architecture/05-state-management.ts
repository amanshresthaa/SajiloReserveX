/**
 * 5. State Management & Data Flow
 * 
 * SajiloReserveX uses TanStack React Query v5 for server state management
 * and React Context for minimal UI state. This file documents patterns,
 * cache strategies, and data flow.
 */

import { type QueryClient } from "@tanstack/react-query";

// ============================================================================
// QUERY KEY FACTORY (Type-Safe)
// ============================================================================

/**
 * Centralized query key definitions
 * 
 * Pattern: Hierarchical keys for easy invalidation
 * - Level 1: Resource type
 * - Level 2: Operation (list, detail, etc.)
 * - Level 3: Parameters
 * 
 * Based on existing: /lib/query/keys.ts
 */
export const queryKeys = {
  bookings: {
    all: ["bookings"] as const,
    list: (params: BookingListParams = {}) => ["bookings", "list", params] as const,
    detail: (id: string) => ["bookings", "detail", id] as const,
    history: (id: string, params: Record<string, unknown> = {}) => 
      ["bookings", "history", id, params] as const,
  },
  profile: {
    self: () => ["profile", "self"] as const,
  },
  restaurants: {
    all: ["restaurants"] as const,
    list: (params: RestaurantListParams = {}) => ["restaurants", "list", params] as const,
    detail: (slug: string) => ["restaurants", "detail", slug] as const,
  },
  blog: {
    all: ["blog"] as const,
    articles: (params: ArticleListParams = {}) => ["blog", "articles", params] as const,
    article: (id: string) => ["blog", "article", id] as const,
    authors: () => ["blog", "authors"] as const,
    author: (id: string) => ["blog", "author", id] as const,
    categories: () => ["blog", "categories"] as const,
    category: (id: string) => ["blog", "category", id] as const,
  },
} as const;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface BookingListParams {
  status?: "upcoming" | "past" | "cancelled";
  page?: number;
  pageSize?: number;
}

interface RestaurantListParams {
  city?: string;
  cuisine?: string;
}

interface ArticleListParams {
  categoryId?: string;
  authorId?: string;
  page?: number;
  pageSize?: number;
}

export interface BookingDTO {
  id: string;
  restaurantId: string;
  restaurantName: string;
  date: string; // ISO 8601
  time: string; // HH:MM
  guests: number;
  status: "confirmed" | "completed" | "cancelled";
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantDTO {
  id: string;
  slug: string;
  name: string;
  timezone: string;
  capacity: number | null;
  address: string;
  phone: string;
  email: string;
}

export interface ProfileDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  diningPreferences?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// REACT QUERY CONFIGURATION
// ============================================================================

/**
 * Default query client configuration
 * 
 * Applied in /app/providers.tsx (AppProviders component)
 */
export const queryClientConfig = {
  defaultOptions: {
    queries: {
      // Stale time: How long data is considered fresh (don't refetch)
      staleTime: 5 * 60 * 1000, // 5 minutes
      
      // GC time: How long unused data stays in cache
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      
      // Retry configuration
      retry: (failureCount: number, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.response?.status && error.response.status < 500) {
          return false;
        }
        // Retry up to 3 times for 5xx errors
        return failureCount < 3;
      },
      
      // Exponential backoff
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch on window focus (useful for dashboard)
      refetchOnWindowFocus: true,
      
      // Refetch on mount if data is stale
      refetchOnMount: true,
      
      // Don't refetch on reconnect by default
      refetchOnReconnect: false,
    },
    mutations: {
      // Retry mutations (POST/PATCH/DELETE) only on network errors
      retry: (failureCount: number, error: any) => {
        // Only retry on network errors, not business logic errors
        if (error?.message?.includes("network") || error?.code === "ECONNREFUSED") {
          return failureCount < 2;
        }
        return false;
      },
    },
  },
};

// ============================================================================
// CACHE INVALIDATION PATTERNS
// ============================================================================

/**
 * Invalidation strategies for common operations
 */
export const invalidationPatterns = {
  // After creating a booking:
  afterCreateBooking: (queryClient: QueryClient) => {
    // Invalidate all booking lists (to show new booking)
    queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
    
    // Optionally: Invalidate restaurant availability (if tracked)
    // queryClient.invalidateQueries({ queryKey: queryKeys.restaurants.all });
  },

  // After updating a booking:
  afterUpdateBooking: (queryClient: QueryClient, bookingId: string) => {
    // Invalidate the specific booking detail
    queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(bookingId) });
    
    // Invalidate booking lists (status might have changed)
    queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
  },

  // After cancelling a booking:
  afterCancelBooking: (queryClient: QueryClient, bookingId: string) => {
    // Invalidate the specific booking detail
    queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(bookingId) });
    
    // Invalidate booking lists
    queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
  },

  // After updating profile:
  afterUpdateProfile: (queryClient: QueryClient) => {
    // Invalidate profile query
    queryClient.invalidateQueries({ queryKey: queryKeys.profile.self() });
  },

  // After sign out:
  afterSignOut: (queryClient: QueryClient) => {
    // Clear all cached data on sign out
    queryClient.clear();
  },
};

// ============================================================================
// OPTIMISTIC UPDATE PATTERNS
// ============================================================================

/**
 * Optimistic update for booking cancellation
 * 
 * Immediately updates UI before server confirms, rolls back on error
 */
export function optimisticCancelBooking(
  queryClient: QueryClient,
  bookingId: string
) {
  // Get current booking data
  const bookingQueryKey = queryKeys.bookings.detail(bookingId);
  const previousBooking = queryClient.getQueryData<BookingDTO>(bookingQueryKey);

  // Optimistically update to "cancelled"
  queryClient.setQueryData<BookingDTO>(bookingQueryKey, (old) => {
    if (!old) return old;
    return { ...old, status: "cancelled" };
  });

  // Return rollback function (used in onError)
  return () => {
    queryClient.setQueryData(bookingQueryKey, previousBooking);
  };
}

/**
 * Optimistic update for profile changes
 */
export function optimisticUpdateProfile(
  queryClient: QueryClient,
  updates: Partial<ProfileDTO>
) {
  const profileQueryKey = queryKeys.profile.self();
  const previousProfile = queryClient.getQueryData<ProfileDTO>(profileQueryKey);

  // Optimistically update profile
  queryClient.setQueryData<ProfileDTO>(profileQueryKey, (old) => {
    if (!old) return old;
    return { ...old, ...updates };
  });

  return () => {
    queryClient.setQueryData(profileQueryKey, previousProfile);
  };
}

// ============================================================================
// CUSTOM HOOKS (EXAMPLES)
// ============================================================================

/**
 * Hook to fetch bookings with pagination and filtering
 * 
 * Based on existing: /hooks/useBookings.ts
 */
export function useBookings(params: BookingListParams) {
  // Implementation example (actual hook in /hooks/useBookings.ts)
  // const { data, isLoading, error, refetch, isFetching } = useQuery({
  //   queryKey: queryKeys.bookings.list(params),
  //   queryFn: () => fetchBookings(params),
  // });
  
  // return { data, isLoading, error, refetch, isFetching };
}

/**
 * Hook to cancel a booking with optimistic update
 * 
 * Based on existing: /hooks/useCancelBooking.ts
 */
export function useCancelBooking() {
  // const queryClient = useQueryClient();
  
  // return useMutation({
  //   mutationFn: (bookingId: string) => cancelBookingApi(bookingId),
  //   onMutate: async (bookingId) => {
  //     // Cancel outgoing refetches
  //     await queryClient.cancelQueries({ queryKey: queryKeys.bookings.detail(bookingId) });
  //     
  //     // Optimistic update
  //     const rollback = optimisticCancelBooking(queryClient, bookingId);
  //     
  //     return { rollback };
  //   },
  //   onError: (err, bookingId, context) => {
  //     // Rollback on error
  //     context?.rollback();
  //   },
  //   onSuccess: (data, bookingId) => {
  //     // Invalidate queries after success
  //     invalidationPatterns.afterCancelBooking(queryClient, bookingId);
  //   },
  // });
}

/**
 * Hook to update booking details
 * 
 * Based on existing: /hooks/useUpdateBooking.ts
 */
export function useUpdateBooking() {
  // Similar pattern to useCancelBooking, with optimistic updates
}

/**
 * Hook to fetch current user profile
 * 
 * Based on existing: /hooks/useProfile.ts
 */
export function useProfile() {
  // const { data, isLoading, error } = useQuery({
  //   queryKey: queryKeys.profile.self(),
  //   queryFn: fetchProfile,
  //   enabled: !!session, // Only fetch if authenticated
  // });
  
  // return { profile: data, isLoading, error };
}

// ============================================================================
// AUTH STATE MANAGEMENT
// ============================================================================

/**
 * Supabase Auth state sync
 * 
 * Based on existing: /hooks/useSupabaseSession.ts
 */
export function useSupabaseSession() {
  // Implementation:
  // - Subscribe to Supabase auth state changes
  // - Update React state when session changes
  // - Handle token refresh automatically
  
  // const [session, setSession] = useState<Session | null>(null);
  // const supabase = getSupabaseBrowserClient();
  
  // useEffect(() => {
  //   supabase.auth.getSession().then(({ data: { session } }) => {
  //     setSession(session);
  //   });
  //   
  //   const { data: { subscription } } = supabase.auth.onAuthStateChange(
  //     (_event, session) => {
  //       setSession(session);
  //     }
  //   );
  //   
  //   return () => subscription.unsubscribe();
  // }, [supabase]);
  
  // return session;
}

/**
 * Auth flow patterns
 */
export const authFlows = {
  // Sign in flow:
  signIn: async (email: string, password: string) => {
    // 1. Call Supabase Auth API
    // const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    // 2. On success, session automatically stored in cookies (Supabase SSR)
    // 3. Middleware will allow access to protected routes
    // 4. Redirect to callbackUrl or dashboard
  },

  // Sign in with OAuth (Google):
  signInWithGoogle: async () => {
    // 1. Initiate OAuth flow
    // const { data, error } = await supabase.auth.signInWithOAuth({
    //   provider: 'google',
    //   options: {
    //     redirectTo: `${window.location.origin}/api/auth/callback`,
    //   },
    // });
    
    // 2. User redirected to Google
    // 3. After auth, Google redirects to /api/auth/callback
    // 4. Callback route sets session and redirects to dashboard
  },

  // Sign out flow:
  signOut: async (queryClient: QueryClient) => {
    // 1. Call Supabase Auth API
    // await supabase.auth.signOut();
    
    // 2. Clear React Query cache
    invalidationPatterns.afterSignOut(queryClient);
    
    // 3. Redirect to home or signin
    // router.push('/');
  },

  // Token refresh (automatic via Supabase):
  // - Supabase SSR handles token refresh automatically
  // - No manual refresh needed in client code
  // - Middleware refreshes session on every request
};

// ============================================================================
// CSRF PROTECTION
// ============================================================================

/**
 * CSRF protection is handled by:
 * 1. Supabase Auth (session tokens in HTTP-only cookies)
 * 2. Same-Site cookie policy (Lax)
 * 3. CORS configuration on API routes
 * 
 * No additional CSRF tokens needed for this architecture.
 */

// ============================================================================
// OFFLINE & SKELETON/LOADING STRATEGIES
// ============================================================================

/**
 * Offline detection
 */
export function useOnlineStatus() {
  // const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  
  // useEffect(() => {
  //   const handleOnline = () => setIsOnline(true);
  //   const handleOffline = () => setIsOnline(false);
  //   
  //   window.addEventListener('online', handleOnline);
  //   window.addEventListener('offline', handleOffline);
  //   
  //   return () => {
  //     window.removeEventListener('online', handleOnline);
  //     window.removeEventListener('offline', handleOffline);
  //   };
  // }, []);
  
  // return isOnline;
}

/**
 * Offline behavior patterns:
 * 
 * 1. Read-only cache access:
 *    - Show cached booking history with banner: "You're offline. Showing cached data."
 *    - Disable mutations (create/update/delete)
 * 
 * 2. Offline banner:
 *    - Display prominent banner at top of page
 *    - "No internet connection. Some features are unavailable."
 *    - Auto-dismiss when online
 * 
 * 3. Mutation queue (future enhancement):
 *    - Queue mutations while offline
 *    - Sync when online
 *    - Requires conflict resolution strategy
 */

/**
 * Skeleton/loading patterns:
 * 
 * 1. Page-level loading:
 *    - Use Next.js loading.tsx for route-level loading states
 *    - Show skeleton matching final layout
 * 
 * 2. Component-level loading:
 *    - Use Shadcn Skeleton component
 *    - Match dimensions of loaded content to prevent layout shift
 * 
 * 3. Button loading:
 *    - Disable button, show spinner, keep original text
 *    - "Save Changes" → [Spinner] "Saving…"
 * 
 * 4. Table loading:
 *    - Show 3-5 skeleton rows matching table structure
 *    - Shimmer animation (CSS keyframes)
 */

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Error types
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Error handling in queries
 */
export function handleQueryError(error: unknown): string {
  if (error instanceof ApiError) {
    // Business logic error (4xx)
    return error.message;
  }
  
  if (error instanceof Error) {
    if (error.message.includes("network")) {
      return "Connection failed. Please check your internet and try again.";
    }
  }
  
  // Unknown error
  return "Something went wrong. Please try again.";
}

/**
 * Global error boundary (React)
 * 
 * Catches unhandled errors in component tree
 * Displays error UI with recovery options
 * Logs to monitoring service (Sentry, Datadog, etc.)
 */

// ============================================================================
// UI STATE (REACT CONTEXT)
// ============================================================================

/**
 * Minimal UI state (not in React Query):
 * - Toast notifications
 * - Modal open/close state
 * - Theme (light/dark mode)
 * - Sidebar collapsed/expanded (if applicable)
 * 
 * Use React Context for these, not React Query.
 */

/**
 * Example: Toast context
 */
interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration?: number;
}

export interface ToastContextValue {
  toasts: Toast[];
  showToast: (message: string, type: Toast["type"]) => void;
  dismissToast: (id: string) => void;
}

// Implementation in /context/ToastContext.tsx
// Used by: react-hot-toast library (already installed)

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  queryKeys,
  queryClientConfig,
  invalidationPatterns,
  optimisticCancelBooking,
  optimisticUpdateProfile,
  authFlows,
};
