# Speak Influencer Management

A clean, modern web application for managing influencer campaigns with separate dashboards for influencers and administrators.

## Features

### Authentication
- Role-based login system (Influencer/Admin)
- Secure session management
- Protected routes

### Influencer Dashboard
- Personal campaign overview
- Status tracking and next steps
- Campaign flow visualization
- Earnings summary
- Detailed campaign information including:
  - Contract details and pricing
  - Submission deadlines
  - Requirements and reference links

### Admin Dashboard
- Overview of all campaigns and influencers
- Real-time updates feed
- Campaign filtering by influencer
- Comprehensive analytics
- Status management across all campaigns

## Design

- **Dark theme** inspired by GitHub's interface
- **Apple-style** clean and minimalist design
- **Fully responsive** for all screen sizes
- **Accessible** with proper contrast and navigation

## Tech Stack

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **React Context** for state management

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd speak-influencer-management
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Demo Accounts

**Influencers:**
- Email: `sarah@example.com` | Password: `password`
- Email: `mike@example.com` | Password: `password`

**Admin:**
- Email: `admin@speak.com` | Password: `password`

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Dashboard pages
│   │   ├── admin/        # Admin dashboard
│   │   └── influencer/   # Influencer dashboard
│   └── login/            # Authentication
├── components/           # Reusable UI components
├── contexts/            # React Context providers
├── lib/                # Utilities and mock data
└── types/              # TypeScript type definitions
```

## Key Components

- **Navigation**: Top navigation bar with user info and logout
- **CampaignCard**: Detailed campaign information display
- **StatusBadge**: Visual status indicators
- **AuthContext**: Authentication state management

## Future Enhancements

This UI is built with backend integration in mind. Future additions will include:

- Real authentication API integration
- Database connectivity for campaigns and users
- File upload for content submissions
- Real-time notifications
- Advanced filtering and search
- Campaign analytics and reporting
- Email notifications
- Mobile app version

## Development

### Adding New Features

1. Define types in `types/index.ts`
2. (Removed) Demo mock data previously located in `lib/mock-data.ts` has been deleted. The app now relies solely on Google Sheets. Ensure your environment variables are configured.
3. Create components in `components/`
4. Implement pages in `app/`
5. Update navigation if needed

### Styling Guidelines

- Use Tailwind's dark theme utilities
- Follow the existing color scheme (dark-*)
- Maintain consistent spacing and typography
- Ensure responsive design with appropriate breakpoints

## License

Private project for Speak Influencer Management platform.
# Test deployment trigger
