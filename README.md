# Speak Influencer Management Platform

A comprehensive, production-ready web application for managing influencer marketing campaigns with sophisticated workflow automation and real-time collaboration features. Built for Speak, an AI-powered English learning platform, to streamline partnerships with content creators across multiple platforms.

## 🎯 Purpose & Vision

This platform serves as the central hub for managing complex influencer marketing campaigns, transforming what was once a manual, spreadsheet-based process into an automated, user-friendly experience. The system bridges the gap between brand managers and content creators, providing transparency, accountability, and seamless workflow management throughout the entire campaign lifecycle.

### Key Problems Solved
- **Manual Process Automation**: Eliminates tedious spreadsheet management and email coordination
- **Real-time Collaboration**: Enables instant communication between admins and influencers
- **Workflow Transparency**: Provides clear visibility into campaign progress and next steps
- **Scalable Operations**: Supports managing hundreds of concurrent campaigns efficiently
- **Quality Control**: Built-in approval workflows ensure content meets brand standards

## 🏗️ System Architecture

### Data Integration
The platform integrates directly with Google Sheets as the primary data source, providing:
- **Live Data Synchronization**: Real-time updates between the web interface and Google Sheets
- **Flexible Data Management**: Leverages familiar spreadsheet interface for data entry
- **Backup & Recovery**: Google Sheets serves as both database and backup system
- **Multi-user Access**: Supports concurrent access from multiple team members

### Workflow Engine
Sophisticated state management system that handles:
- **Campaign Status Tracking**: 15+ distinct campaign states from initiation to completion
- **Automated Transitions**: Smart progression through campaign milestones
- **Approval Workflows**: Built-in review and feedback loops for content submissions
- **Deadline Management**: Automatic tracking and alerts for important dates

## 🚀 Core Features

### 🎭 Role-Based Access Control
- **Influencer Portal**: Personalized dashboard showing only relevant campaigns and actions
- **Admin Console**: Comprehensive overview with management capabilities across all campaigns
- **Secure Authentication**: Session-based login with role-specific permissions
- **Protected Routes**: Automatic redirection based on user roles and authentication status

### 📊 Influencer Dashboard
**Campaign Management**
- Personal campaign overview with progress tracking
- Interactive status visualization showing current step and next actions
- Automated next-step guidance with clear instructions
- Real-time earnings summary and payment status

**Content Workflow**
- Step-by-step content creation guidance
- Built-in submission system for plans, drafts, and final content
- Revision management with feedback integration
- Automated scheduling and publishing coordination

**Premium Account Integration**
- Automatic provisioning of Speak premium accounts for influencers
- Secure credential distribution with copy-to-clipboard functionality
- Direct app download links and onboarding guidance

### 🎛️ Admin Dashboard
**Campaign Overview**
- Real-time statistics: total contract value, active campaigns, pending approvals
- Comprehensive campaign table with sorting and filtering capabilities
- Advanced search functionality across influencer names and campaign details
- Export capabilities for reporting and analysis

**Workflow Management**
- Interactive approval system for submitted content
- Bulk status updates and campaign management
- Automated notification system for status changes
- Built-in communication tools for feedback and revisions

**Analytics & Reporting**
- Campaign performance tracking across multiple platforms
- ROI analysis and budget management
- Timeline visualization for campaign milestones
- Custom reporting with data export capabilities

### 🔄 Automated Workflows

**Campaign Lifecycle Management**
1. **Onboarding**: Interactive survey for campaign setup and requirements gathering
2. **Meeting Coordination**: Automated scheduling and completion tracking
3. **Content Planning**: Structured submission and approval process for content plans
4. **Content Creation**: Draft submission, review, and revision workflows
5. **Publishing**: Scheduling coordination and go-live management
6. **Payment Processing**: Automated invoice generation and payment tracking

**Smart Notifications**
- Real-time updates feed showing all campaign activities
- Automated email notifications for status changes
- Deadline reminders and overdue alerts
- Admin action requirements with direct action buttons

## Design

- **Dark theme** inspired by GitHub's interface
- **Apple-style** clean and minimalist design
- **Fully responsive** for all screen sizes
- **Accessible** with proper contrast and navigation

## 🛠️ Technical Architecture

### Frontend Stack
- **Next.js 14** with App Router - Modern React framework with server-side rendering
- **TypeScript** - Full type safety and enhanced developer experience
- **Tailwind CSS** - Utility-first CSS framework with custom design system
- **Lucide React** - Consistent icon library with 1000+ icons
- **React Context** - Global state management for authentication and themes

### Backend Integration
- **Google Sheets API** - Primary data source with real-time synchronization
- **Google Service Account** - Secure server-to-server authentication
- **REST API Routes** - Next.js API routes for data operations and workflow management
- **Server-Side Rendering** - Optimized performance with SSR and static generation

### Data Architecture

#### Google Sheets Integration
The platform uses Google Sheets as its primary database, providing several advantages:

**Data Structure**
```
campaigns!A:CZ - Main campaign data with 70+ columns including:
├── Core Campaign Info (id, name, platform, status, pricing)
├── Influencer Details (contact, channel URLs, follower counts)
├── Schedule Management (meeting, submission, and live dates)
├── Content URLs (plan, draft, and published content links)
├── Payment Information (pricing, forms, payout status)
├── Analytics Data (impressions, performance metrics)
└── Administrative Fields (notes, internal tracking)
```

**Real-time Data Flow**
1. **Read Operations**: Google Sheets API fetches live data on every request
2. **Write Operations**: Updates are immediately written back to Google Sheets
3. **Data Validation**: TypeScript interfaces ensure data consistency
4. **Error Handling**: Graceful fallbacks for API failures or missing data

**Authentication Methods**
- **Service Account**: Server-side authentication for write operations
- **API Key**: Read-only access for public data (fallback method)
- **Automatic Detection**: System automatically chooses best available method

#### Campaign Status Management
Sophisticated workflow engine with 15+ distinct states:

```typescript
Campaign Lifecycle:
not_started → meeting_scheduling → meeting_scheduled → 
plan_creating → plan_submitted → plan_revising → 
draft_creating → draft_submitted → draft_revising → 
scheduling → scheduled → payment_processing → completed
```

**State Transitions**
- **Automated**: System-triggered transitions based on user actions
- **Manual**: Admin-controlled status updates for special cases
- **Validation**: Business logic ensures valid state transitions only
- **Audit Trail**: All changes tracked with timestamps and user attribution

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** - Latest LTS version recommended
- **npm** or **yarn** - Package manager
- **Google Cloud Project** - For Sheets API access (production)
- **Google Sheets Document** - Configured with proper schema

### Installation & Setup

1. **Clone and Install**
   ```bash
   git clone https://github.com/naokispeak/influencer.git
   cd speak-influencer-management
   npm install
   ```

2. **Environment Configuration**
   Create a `.env.local` file with the following variables:
   ```env
   # Google Sheets Configuration
   GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
   GOOGLE_SHEETS_RANGE=campaigns!A:CZ
   
   # Authentication (choose one method)
   # Method 1: Service Account (recommended for production)
   GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   
   # Method 2: API Key (read-only fallback)
   GOOGLE_SHEETS_API_KEY=your_api_key
   
   # Optional: Custom configuration
   NEXT_PUBLIC_APP_NAME="Speak Influencer Management"
   ```

3. **Google Sheets Setup**
   - Create a Google Sheets document with the required schema
   - Set up proper column headers (70+ columns for campaign data)
   - Configure sharing permissions for service account or public access
   - Ensure data validation and formatting rules are in place

4. **Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application

5. **Production Build**
   ```bash
   npm run build
   npm start
   ```

### 🔐 Authentication Setup

The platform supports multiple authentication methods for Google Sheets:

#### Service Account (Recommended)
1. Create a Google Cloud Project
2. Enable Google Sheets API
3. Create a Service Account with appropriate permissions
4. Download the JSON key file
5. Extract email and private key for environment variables
6. Share your Google Sheet with the service account email

#### API Key (Read-Only)
1. Create an API key in Google Cloud Console
2. Restrict the key to Google Sheets API
3. Make your Google Sheet publicly readable
4. Add the API key to environment variables

### 🎭 Demo Accounts

The platform includes demo accounts for testing:

**Influencer Accounts:**
- `actre_vlog_yt` - Active campaign with debug features
- `eigatube_yt` - Multiple campaign scenarios

**Admin Account:**
- Email: `admin@speak.com` - Full administrative access

**Note**: Demo accounts include special debugging features and enhanced logging for development purposes.

## 📁 Project Structure

```
speak-influencer-management/
├── app/                          # Next.js 14 App Router
│   ├── api/                     # API Routes
│   │   ├── admin/actions/       # Admin workflow actions
│   │   ├── auth/login/         # Authentication endpoints
│   │   ├── campaigns/          # Campaign CRUD operations
│   │   │   ├── onboarding/     # Survey submission
│   │   │   └── update/         # Status updates
│   │   ├── updates/            # Activity feed
│   │   └── users/              # User management
│   ├── dashboard/              # Main application pages
│   │   ├── admin/              # Admin console
│   │   └── influencer/         # Influencer portal
│   ├── login/                  # Authentication pages
│   └── globals.css             # Global styles
├── components/                  # Reusable UI Components
│   ├── CampaignCard.tsx        # Campaign detail display
│   ├── Modal.tsx               # Modal dialogs
│   ├── Navigation.tsx          # Top navigation bar
│   ├── OnboardingSurvey*.tsx   # Survey components
│   ├── StatusBadge.tsx         # Status indicators
│   ├── StatusSection.tsx       # Workflow visualization
│   └── Tooltip.tsx             # Interactive tooltips
├── contexts/                   # React Context Providers
│   ├── AuthContext.tsx         # Authentication state
│   └── ThemeContext.tsx        # Theme management
├── hooks/                      # Custom React Hooks
│   └── useDesignSystem.ts      # Design system utilities
├── lib/                        # Core Libraries
│   ├── data-service.ts         # Data layer abstraction
│   ├── design-system.ts        # Design tokens and utilities
│   └── google-sheets.ts        # Google Sheets integration
├── types/                      # TypeScript Definitions
│   └── index.ts                # Core type definitions
├── docs/                       # Documentation
│   ├── guideline_youtube.md    # Content guidelines
│   └── google_sheet/           # Sheet schema docs
└── public/                     # Static assets
    └── assets/                 # Brand assets and logos
```

## 🔧 Key Components Deep Dive

### Core Architecture Components

**`lib/google-sheets.ts`** - Google Sheets Integration Engine
- Real-time data synchronization with Google Sheets API
- Automatic authentication method detection
- Data transformation and validation
- Error handling and retry logic
- Support for both read and write operations

**`lib/data-service.ts`** - Data Layer Abstraction
- Unified interface for data operations
- Campaign and user management
- Update tracking and notification generation
- Caching and performance optimization

**`contexts/AuthContext.tsx`** - Authentication Management
- Role-based access control
- Session state management
- Route protection and redirection
- User preference storage

### UI Component System

**`components/StatusSection.tsx`** - Workflow Visualization
- Interactive campaign timeline
- Progress tracking with visual indicators
- Step-by-step guidance
- Responsive design for mobile and desktop

**`components/OnboardingSurveyInline.tsx`** - Dynamic Form System
- Multi-step survey with progress tracking
- Real-time validation and formatting
- Automatic data submission to Google Sheets
- Embedded and standalone modes

**`hooks/useDesignSystem.ts`** - Design System Integration
- Centralized theme management
- Consistent color schemes and spacing
- Dark/light mode support
- Responsive design utilities

## 🚀 Development Workflow

### Adding New Features

1. **Define Data Types** (`types/index.ts`)
   ```typescript
   export interface NewFeature {
     id: string;
     // Define your interface
   }
   ```

2. **Create API Endpoints** (`app/api/`)
   ```typescript
   // app/api/feature/route.ts
   export async function POST(request: Request) {
     // Handle the request
   }
   ```

3. **Build UI Components** (`components/`)
   ```tsx
   // components/FeatureComponent.tsx
   export default function FeatureComponent() {
     // Your component logic
   }
   ```

4. **Integrate with Data Layer** (`lib/data-service.ts`)
   ```typescript
   async getFeatureData(): Promise<FeatureData[]> {
     // Data fetching logic
   }
   ```

5. **Add to Navigation** (if needed)
   Update `components/Navigation.tsx` with new routes

### 🎨 Styling Guidelines

**Design System Principles**
- **Consistent Theme**: Use `useDesignSystem()` hook for all styling
- **Dark-First Design**: Primary interface uses dark theme inspired by GitHub
- **Responsive Layout**: Mobile-first approach with progressive enhancement
- **Accessibility**: Proper contrast ratios and keyboard navigation

**Component Styling Pattern**
```tsx
const ds = useDesignSystem();

<div style={{ 
  backgroundColor: ds.bg.card,
  borderColor: ds.border.primary,
  color: ds.text.primary 
}}>
```

**Tailwind Integration**
- Use Tailwind for layout and spacing
- Use design system for colors and themes
- Custom utilities for common patterns
- Responsive breakpoints: `mobile-*` classes

### 🧪 Testing Strategy

**Development Testing**
- Demo accounts with special debugging features
- Manual refresh capabilities for real-time testing
- Enhanced logging for troubleshooting
- Status manipulation tools for workflow testing

**Data Validation**
- TypeScript interfaces ensure type safety
- Google Sheets schema validation
- API response validation
- User input sanitization

## 🌟 Advanced Features

### Real-time Collaboration
- Live updates across multiple user sessions
- Automatic data synchronization
- Conflict resolution for concurrent edits
- Activity feed with real-time notifications

### Workflow Automation
- Smart state transitions based on user actions
- Automated deadline tracking and alerts
- Email notification integration
- Approval workflow management

### Analytics & Reporting
- Campaign performance metrics
- ROI tracking and budget analysis
- Custom report generation
- Data export capabilities

### Mobile Optimization
- Responsive design for all screen sizes
- Touch-friendly interface elements
- Mobile-specific navigation patterns
- Progressive Web App capabilities

## License

Private project for Speak Influencer Management platform.
# Test deployment trigger
