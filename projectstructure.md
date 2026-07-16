# BeeMacQueue - Project Structure

```
BeeMacQueue/
├── app/
│   ├── (auth)/
│   │   ├── forgot-password.tsx    # Password reset screen
│   │   ├── login.tsx              # User login screen
│   │   └── register.tsx           # New user registration screen
│   ├── (tabs)/
│   │   ├── _layout.tsx            # Tab navigator configuration
│   │   ├── admin.tsx              # Admin dashboard screen
│   │   ├── home.tsx               # Main home screen
│   │   ├── my-queue.tsx           # User's queue tickets screen
│   │   ├── notifications.tsx      # Notifications screen
│   │   └── profile.tsx            # User profile screen
│   └── _layout.tsx                # Root layout configuration
├── assets/
│   ├── adaptive-icon.png          # Adaptive app icon
│   ├── icon.png                   # App icon
│   └── splash.png                 # Splash screen image
├── components/
│   ├── EstablishmentCard.tsx      # Business/establishment card component
│   ├── FilterBar.tsx              # Filter bar component for searching
│   ├── JoinModal.tsx              # Modal for joining queues
│   ├── QueueTicketCard.tsx        # Queue ticket display component
│   └── ui.tsx                     # Reusable UI components
├── hooks/
│   ├── useAdminQueue.ts           # Admin queue management hook
│   ├── useAuth.ts                 # Authentication hook
│   ├── useEstablishments.ts       # Establishments data hook
│   ├── useNotifications.ts        # Notifications management hook
│   └── useQueue.ts                # Queue operations hook
├── lib/
│   ├── constants.ts               # Application constants
│   └── supabase.ts                # Supabase client configuration
├── types/
│   └── index.ts                   # TypeScript type definitions
├── .env.example                    # Environment variables template
├── .gitignore                      # Git ignore file
├── app.json                        # Expo app configuration
├── package-lock.json               # NPM lock file
├── package.json                    # NPM dependencies
├── README.md                       # Project documentation
├── supabase-setup.sql              # Supabase database schema
└── tsconfig.json                   # TypeScript configuration
```

## Technology Stack

- **Framework**: Expo (React Native)
- **Language**: TypeScript
- **Backend**: Supabase (PostgreSQL)
- **Navigation**: Expo Router (File-based routing)
- **Authentication**: Supabase Auth
- **File Structure**: Tabs-based navigation with auth group

## Key Features

- **Authentication Flow**: Login, Register, and Forgot Password screens
- **Main Tabs**: Home, My Queue, Notifications, Admin, and Profile
- **Queue Management**: Join queues, view tickets, and admin controls
- **Real-time Updates**: Live queue status and notifications
- **Responsive Components**: Reusable UI components for consistency