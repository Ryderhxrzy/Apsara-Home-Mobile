📚 Documentation Created

# Document What It Covers

1
01-project-overview.md
Big picture — What is AFHome, tech stack table, complete folder structure, and the high-level app flow diagram (loading → onboarding → auth → main app)
2
02-screens-guide.md
Every screen explained — All 53 screens grouped by feature (Auth, Main Tabs, Shopping, Profile, Wallet, Settings, Info pages). Each entry explains what it does and why it exists. Includes the navigation architecture and deep link table
3
03-api-reference.md
Complete API reference — Every HTTP endpoint (60+ endpoints), organized by domain. Each endpoint shows the HTTP method, path, required data fields, and example response JSON. Covers Auth, Products, Cart, Wishlist, Orders, Payments, Notifications, Search, Referrals, Wallet, Sessions, Address lookup, Brand following, Pusher real-time events, and Meilisearch
4
04-architecture-deep-dive.md
How it all works — Service layer design, every service file explained, hooks layer, state management architecture (Context vs React Query vs SecureStore vs AsyncStorage), caching strategy, and data flow diagrams for key operations (add-to-cart, authentication). Covers design patterns like optimistic updates, response normalization, and error handling
5
05-performance-audit-and-roadmap.md
Performance, re-render & regression audit + Shopee-grade improvement roadmap (2026-06-10) — Evidence-based findings with file:line refs across five problem areas (timers/startup, context/re-renders, list virtualization, data layer, code health), severity/effort ratings, what's already good (don't regress), the gap-to-Shopee table, and a 3-phase roadmap. Supersedes the older rough notes in audit.md.
