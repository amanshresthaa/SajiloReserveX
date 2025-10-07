# 3. Content Finalization

**Tone Guidelines**: Professional yet approachable, benefit-first, action-oriented, second person, active voice, present tense.

**Terminology Standards**:

- "Booking" (not "reservation" in UI)
- "Restaurant" (not "venue" except legal docs)
- "Dashboard" (not "my account" or "bookings page")
- UK English spelling ("favourite", "colour", "centre")

**Trust Signals**: Real-time availability, instant confirmation, free cancellation, secure account management, GDPR-compliant.

**Microcopy Principles**:

- Button text: Verb + outcome ("Book this restaurant", "Save changes", "Cancel booking")
- Empty states: Empathetic + actionable ("No bookings yet → Make your first reservation")
- Errors: Specific + recovery ("Payment failed → Update card details")

---

## Home Page

```yaml
slug: '/'
seoTitle: 'Reserve a table · SajiloReserveX'
seoDescription: 'Pick a SajiloReserveX partner restaurant and book your next visit in seconds.'
schemaType: 'WebSite'
canonical: 'https://example.com/'
ogImage: '/og-home.png'
```

### Content

**Eyebrow**: SajiloReserveX

**H1**: Pick your restaurant and reserve in moments

**Lead Paragraph**:  
Explore participating SajiloReserveX locations and book a table in just a few taps. Sign in to revisit previous reservations and keep your preferences synced.

**Primary CTA**:

- **Authenticated**: "View My Bookings" (navigate to `/dashboard`)
- **Unauthenticated**: "Sign In" (navigate to `/signin`)

**Secondary CTA**: "Browse Restaurants" (scroll to `#restaurants` anchor)

---

**Section: Available Restaurants**

**H2**: Available restaurants

**Description**:  
Choose a partner location below to open the full reservation flow. We keep availability updated in real-time so you can book with confidence.

**Restaurant Card** (repeated for each):

- **Title**: [Restaurant Name] (e.g., "The Ivy London")
- **Badge**: [Timezone] (e.g., "Europe/London")
- **Meta**: "[Capacity] seats · Select to open the booking flow"
- **CTA Button**: "Book this restaurant" → `/reserve/r/[slug]`
- **Aria-label**: "Start booking at [Restaurant Name]"

**Empty State** (no restaurants loaded):

- **H3**: "No restaurants available"
- **Body**: "Check back soon or reach out to our concierge team for personalised assistance."
- **CTA**: "Contact Support" → `mailto:support@example.com`

**Error State** (API failure):

- **Alert** (destructive): "We couldn't load restaurants right now. Please refresh, or contact support if the issue persists."
- **CTA**: "Retry" button (refetch query)

---

## Booking Assistance Section

```yaml
slug: '/reserve'
seoTitle: 'Reserve a table · SajiloReserveX'
seoDescription: 'Pick a partner restaurant, hold a table instantly, and manage every reservation from one place.'
schemaType: 'Service'
canonical: 'https://example.com/reserve'
```

### Content

**H1**: Book in under two minutes

**Lead Paragraph**:  
Tell us when and where you’d like to dine. We’ll surface live availability and keep you posted at every step—no phone calls required.

---

**Highlights List**

- **Badge**: "Instant confirmation"
- **Title**: Get a table locked in right away
- **Body**: Every reservation is confirmed with the restaurant before we show it to you.

- **Badge**: "Flexible changes"
- **Title**: Plans change? No stress.
- **Body**: Modify or cancel bookings up to two hours before your seating, straight from your dashboard.

- **Badge**: "Stay in the loop"
- **Title**: Notifications that work for you
- **Body**: Choose email, SMS, or both. We’ll nudge you about arrivals, changes, and special requests.

---

**CTA Section**

- **Primary CTA**: "Start a reservation" → `/reserve/r/discover` (opens restaurant browser, focus starts at filters panel)
- **Secondary CTA**: "Browse restaurants" → `/` (scrolls to listings section via `#restaurants`)
- **Helper Text**: "Need help hosting a group of 8 or more? Email concierge@example.com and we’ll take it from there."

---

**FAQ Section** (below highlights)

**H2**: Frequently asked questions

**Q1**: Can I edit my booking after confirmation?  
**A**: Yes. Visit your dashboard to adjust time, party size, or special requests. We’ll confirm changes instantly or offer alternatives.

**Q2**: Do I need an account?  
**A**: You can start browsing without one, but we’ll ask you to sign in (or create an account) when you confirm a reservation so we can send updates.

**Q3**: How far in advance can I book?  
**A**: Most restaurants accept bookings up to 60 days ahead. Availability windows appear in the date picker so you never guess.

**Q4**: What happens if I lose internet mid-booking?  
**A**: We save your progress locally. Reconnect and we’ll resume exactly where you left off, with helpful prompts if anything needs review.

---

## Sign In Page

```yaml
slug: '/signin'
seoTitle: 'Sign In · SajiloReserveX'
seoDescription: 'Access your dashboard and manage your restaurant reservations.'
schemaType: 'WebPage'
canonical: 'https://example.com/signin'
```

### Content

**H1**: Welcome back

**Lead Paragraph**:  
Sign in to view your bookings and manage your reservations. New user? Signing in creates your account automatically.

---

**Sign In Form**:

- **OAuth Button (Google)**: "Continue with Google" (icon: Google logo)
- **Divider**: "or"
- **Email Input**:
  - Label: "Email address"
  - Placeholder: "you@example.com"
  - Type: `email`
  - Autocomplete: `email`
  - Required: `true`
- **Password Input**:
  - Label: "Password"
  - Placeholder: "Enter your password"
  - Type: `password`
  - Autocomplete: `current-password`
  - Required: `true`
- **Forgot Password Link**: "Forgot password?" (navigate to `/reset-password` - future)
- **Submit Button**: "Sign In"

**Loading State**: Button shows spinner + "Signing in…"

**Error States**:

- Invalid credentials: "Email or password is incorrect. Please try again."
- Network error: "Connection failed. Please check your internet and retry."
- Too many attempts: "Too many sign-in attempts. Please wait 5 minutes and try again."

**Success State**: Redirect to `/dashboard` (or `?redirectedFrom` query param if present)

---

**New User Message** (below form):  
"Don't have an account? No problem! Signing in with your email will create an account automatically. By continuing, you agree to our [Terms of Service](#) and [Privacy Policy](#)."

---

## Booking Flow: Step 1 (Date/Time Selection)

```yaml
slug: '/reserve/r/[slug]'
seoTitle: 'Book [Restaurant Name] · SajiloReserveX'
seoDescription: 'Reserve your table at [Restaurant Name] with SajiloReserveX.'
schemaType: 'Service'
```

### Content

**Breadcrumb**: All restaurants > [Restaurant Name]

**H1**: Book your table at [Restaurant Name]

**Progress Indicator**:

- Step 1 of 4: Choose date & time
- Visual: Progress bar (25% filled)

---

**Date Picker**:

- **Label**: "When would you like to dine?"
- **Component**: Calendar (react-day-picker)
- **Constraints**: Min date = today, Max date = +90 days
- **Disabled Dates**: Past dates, fully booked dates
- **Hint**: "Select a date to see available times"

**Party Size Selector**:

- **Label**: "How many guests?"
- **Component**: Dropdown or increment/decrement buttons
- **Options**: 1-10 guests (default: 2)
- **Hint**: "For parties larger than 10, please contact the restaurant directly"

**Time Slot Selector** (appears after date selected):

- **Label**: "Available times"
- **Component**: Grid of buttons (e.g., "12:00 PM", "12:30 PM", "1:00 PM")
- **Availability Indicator**:
  - Available: Green dot + "Available"
  - Few left: Amber dot + "Only 2 tables left"
  - Unavailable: Disabled button
- **Hint**: "All times shown in [Restaurant Timezone]"

**CTA**: "Continue" (disabled until date + party + time selected)

**Empty State** (no times available on selected date):

- **Body**: "No availability on this date. Try another date or adjust your party size."
- **CTA**: "Choose another date"

---

## Booking Flow: Step 2 (Customer Details)

### Content

**H1**: Your details

**Progress Indicator**: Step 2 of 4: Your details (50% filled)

---

**Form Fields**:

1. **First Name**:
   - Label: "First name"
   - Placeholder: "John"
   - Autocomplete: `given-name`
   - Required: `true`

2. **Last Name**:
   - Label: "Last name"
   - Placeholder: "Doe"
   - Autocomplete: `family-name`
   - Required: `true`

3. **Email**:
   - Label: "Email address"
   - Placeholder: "john@example.com"
   - Type: `email`
   - Autocomplete: `email`
   - Required: `true`
   - Hint: "We'll send your confirmation here"

4. **Phone**:
   - Label: "Phone number"
   - Placeholder: "+44 7700 900000"
   - Type: `tel`
   - Autocomplete: `tel`
   - Required: `true`
   - Hint: "For booking reminders and updates"

5. **Special Requests** (optional):
   - Label: "Special requests"
   - Placeholder: "Dietary restrictions, seating preferences, occasion…"
   - Component: Textarea (maxlength: 500)
   - Hint: "Let the restaurant know of any special requirements"

**CTA**: "Continue to review" (disabled until required fields valid)

**Back Button**: "← Back" (navigate to Step 1, preserve state)

---

## Booking Flow: Step 3 (Review & Confirm)

### Content

**H1**: Review your booking

**Progress Indicator**: Step 3 of 4: Review & confirm (75% filled)

---

**Summary Card**:

- **Restaurant**: [Restaurant Name]
- **Date**: [Day, DD Month YYYY] (e.g., "Saturday, 15 March 2025")
- **Time**: [HH:MM AM/PM] ([Timezone])
- **Guests**: [N] guests
- **Contact**: [Name] · [Email] · [Phone]
- **Special Requests**: [Text or "None"]

**Edit Links**: Each section has "Edit" link (navigate back to relevant step, preserve state)

---

**Cancellation Policy** (info box):

- Icon: Info circle
- **Title**: "Free cancellation"
- **Body**: "Cancel up to 2 hours before your reservation with no charge. Changes can be made from your dashboard."

---

**Terms Acceptance** (checkbox):

- [ ] "I agree to the [Terms of Service](#) and [Privacy Policy](#)"
- Required: `true`

**CTA**: "Confirm Booking" (primary button, disabled until terms accepted)

**Loading State**: Button shows spinner + "Processing…"

**Back Button**: "← Back to details"

---

## Booking Flow: Step 4 (Confirmation)

### Content

**H1**: Your table is confirmed!

**Progress Indicator**: Step 4 of 4: Confirmation (100% filled)

---

**Success Icon**: Large checkmark (animated scale-in)

**Confirmation Message**:  
"We've sent a confirmation email to **[email]** with all the details. You can also view this booking in your dashboard."

---

**Booking Reference Card**:

- **Reference**: [ABC123] (large, bold)
- **Restaurant**: [Restaurant Name]
- **Date**: [Day, DD Month YYYY]
- **Time**: [HH:MM AM/PM]
- **Guests**: [N] guests
- **Address**: [Restaurant Address]

---

**Next Steps**:

- **CTA Primary**: "View in Dashboard" (navigate to `/dashboard`)
- **CTA Secondary**: "Book Another Restaurant" (navigate to `/`)
- **Add to Calendar**: Button/link (generates ICS file with booking details)
- **Share**: Button (opens share dialog with booking URL `/reserve/[id]`)

---

**Support Message**:  
"Need to make changes? Visit your [dashboard](#) to edit or cancel this booking up to 2 hours before your reservation."

---

## Dashboard Page

```yaml
slug: '/dashboard'
seoTitle: 'My Bookings · SajiloReserveX'
seoDescription: 'View and manage your restaurant reservations.'
schemaType: 'CollectionPage'
auth: 'protected'
```

### Content

**H1**: Your reservations

**Lead Paragraph**:  
View, edit, or cancel your upcoming bookings. Past reservations are shown below for your records.

---

**Status Filter** (button group):

- **All** (default)
- **Upcoming** (status: confirmed, count badge)
- **Past** (status: completed, cancelled)

---

**Bookings Table**:

**Columns**:

1. **Restaurant** (name + logo/image)
2. **Date** (formatted: "15 Mar 2025")
3. **Time** (formatted: "7:00 PM")
4. **Guests** (e.g., "4 guests")
5. **Status** (chip: Confirmed/Completed/Cancelled)
6. **Actions** (dropdown: Edit, Cancel, Rebook)

**Row Actions**:

- **Edit**: Opens `EditBookingDialog` (change date/time/party if >24hrs before)
- **Cancel**: Opens `CancelBookingDialog` (confirm cancellation, show policy)
- **Rebook**: Navigates to `/reserve/r/[slug]` with pre-filled details

**Empty State** (no bookings):

- Icon: Empty calendar illustration
- **H3**: "No bookings yet"
- **Body**: "Ready to make your first reservation? Browse our partner restaurants and book a table in moments."
- **CTA**: "Find a Restaurant" (navigate to `/`)

**Loading State**: Skeleton rows (3 rows with shimmer effect)

**Error State**: Alert with "Failed to load bookings. Please refresh or contact support."

---

**Pagination** (if >10 bookings):

- **Format**: "Showing 1-10 of 45 bookings"
- **Controls**: "Previous" / "Next" buttons + page number input

---

## Profile Page

```yaml
slug: '/profile/manage'
seoTitle: 'Profile Settings · SajiloReserveX'
seoDescription: 'Update your profile and booking preferences.'
schemaType: 'ProfilePage'
auth: 'protected'
```

### Content

**H1**: Your profile

**Lead Paragraph**:  
Keep your details up to date to ensure smooth bookings and accurate communications.

---

**Profile Form**:

1. **First Name**:
   - Label: "First name"
   - Autocomplete: `given-name`
   - Required: `true`

2. **Last Name**:
   - Label: "Last name"
   - Autocomplete: `family-name`
   - Required: `true`

3. **Email** (read-only):
   - Label: "Email address"
   - Hint: "Contact support to change your email"

4. **Phone**:
   - Label: "Phone number"
   - Type: `tel`
   - Autocomplete: `tel`
   - Required: `true`

5. **Dining Preferences** (optional):
   - Label: "Dietary restrictions or preferences"
   - Component: Textarea
   - Placeholder: "Vegetarian, nut allergy, prefer window seats…"
   - Hint: "This will be pre-filled in future bookings"

**CTA**: "Save Changes" (disabled if no changes)

**Success Toast**: "Profile updated successfully"

**Error Toast**: "Failed to update profile. Please try again."

---

## Blog Article Page

```yaml
slug: '/blog/[articleId]'
seoTitle: '[Article Title] · SajiloReserveX Blog'
seoDescription: '[First 155 chars of article content]'
schemaType: 'BlogPosting'
author: '[Author Name]'
datePublished: 'YYYY-MM-DD'
dateModified: 'YYYY-MM-DD'
canonical: 'https://example.com/blog/[slug]'
```

### Content Structure

**Breadcrumb**: Home > Blog > [Article Title]

**Category Badge**: [Category Name] (e.g., "Dining Tips")

**H1**: [Article Title]

**Byline**:  
"By [Author Name] · [Published Date] · [Read Time] min read"

**Hero Image**: [Image with alt text]

---

**Article Body**: (Markdown content with H2-H6 headings)

---

**Author Bio** (card at end):

- **Image**: Author headshot
- **Name**: [Author Name]
- **Bio**: [Short bio, 1-2 sentences]
- **CTA**: "View all posts by [Author]" (navigate to `/blog/author/[id]`)

---

**Related Articles** (if available):

- **H2**: "You might also like"
- **Grid**: 3 cards with image, title, excerpt, "Read more" link

---

**Social Share Buttons**:

- Twitter, Facebook, LinkedIn (native share API if available)

---

## Legal Pages (Privacy Policy, Terms)

```yaml
# Privacy Policy
slug: '/privacy-policy'
seoTitle: 'Privacy Policy · SajiloReserveX'
schemaType: 'WebPage'
lastUpdated: '2024-10-07'
```

### Content Template

**H1**: Privacy Policy

**Last Updated**: [Date]

**Lead Paragraph**:  
At SajiloReserveX, we take your privacy seriously. This policy explains what data we collect, how we use it, and your rights under GDPR and UK DPA 2018.

---

**Sections** (H2 headings):

1. What data we collect
2. How we use your data
3. Data retention
4. Your rights (GDPR)
5. Cookies and tracking
6. Third-party services (Supabase, Plausible)
7. Changes to this policy
8. Contact us

**Tone**: Formal but accessible, avoid legalese where possible, use plain English

**CTA**: "Contact us about privacy" (mailto:privacy@example.com)

---

## 404 Page

```yaml
slug: '/404'
seoTitle: 'Page Not Found · SajiloReserveX'
schemaType: 'WebPage'
```

### Content

**H1**: 404: Page not found

**Body**:  
"The page you're looking for doesn't exist or has been moved. Try one of these common destinations, or head back home."

**Suggestions** (grid of cards):

- Home
- Browse Restaurants
- My Bookings (if authenticated)
- Pricing
- Blog

**CTA Primary**: "Go to Home"

---

## 500 Error Page

```yaml
slug: '/500'
seoTitle: 'Server Error · SajiloReserveX'
schemaType: 'WebPage'
```

### Content

**H1**: Something went wrong

**Body**:  
"We're experiencing technical difficulties and our team has been notified. Please try again in a few moments, or check our status page for updates."

**Error ID**: "Error ID: [UUID]" (for support reference)

**CTA Primary**: "Reload Page"

**CTA Secondary**: "Check Service Status" (external link)

**Support**: "If this persists, contact [support@example.com] with the error ID above."

---

## Localization Notes

**Terms to Keep in English**:

- Brand name: "SajiloReserveX" (never translated)
- UI components from libraries: "Dashboard", "Profile" (standard terminology)

**Variables**:

- `{restaurant_name}` → Dynamic restaurant name
- `{date}` → Formatted per locale (en-GB: "15 March 2025")
- `{time}` → 12-hour format for en-GB/en-US
- `{currency}` → £ for en-GB, $ for en-US (future)

**Pluralization Rules**:

- "1 guest" vs "2 guests"
- "1 booking" vs "10 bookings"
- Use libraries like `react-intl` or custom helper functions

**Date/Time Formatting**:

- Always show restaurant's timezone, not user's
- Format: "Day, DD Month YYYY" for dates
- Format: "H:MM AM/PM ([Timezone])" for times

---

**Next**: See `04-routing-config.ts` for Next.js App Router implementation.
