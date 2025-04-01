# GenieFlow AI

A comprehensive AI-powered productivity platform with integrated email management, subscription tiers, and authentication.

## Core Platform Features

### Smart Email Management
- **Email Composer** with rich formatting options and AI suggestions
- **Email Organization** with smart filters and priority inbox
- **Attachment Management** for easy file handling
- **Email Templates** for quick responses

### Intelligent Calendar
- Smart scheduling with AI recommendations
- Meeting preparation with context
- Follow-up reminders
- Calendar analytics

### Document Analysis
- Extract key information from documents
- Summarize lengthy content
- Identify action items and deadlines
- Compare documents for differences

### AI Assistant
- Context-aware recommendations
- Task prioritization
- Communication drafting
- Research assistance

## Industry-Specific Modules

### Legal
- Contract analysis
- Legal research assistance
- Case management
- Compliance monitoring

### Real Estate
- Property analysis
- Market trend insights
- Document preparation
- Client communication

### Healthcare
- Patient data organization
- Appointment management
- Medical record analysis
- Compliance assistance

### Corporate
- Meeting summaries
- Task coordination
- Team performance analytics
- Business intelligence

## Subscription System

### Swipeable Plan Selection
- Interactive card interface to compare plans
- Smooth animations for better UX
- Plan feature comparison
- Visual indicators for popular plans

### Tiered Billing
- Free tier with basic features
- Pro tier with advanced capabilities
- Enterprise tier for organizations
- Custom solutions for specific needs

### Flexible Billing Options
- Monthly or annual billing
- Discounts for annual commitments
- Enterprise custom pricing
- Easy plan upgrades/downgrades

### Stripe Integration
- Secure payment processing
- Automatic billing and receipts
- Payment method management
- Subscription lifecycle handling

## Authentication System

### User Authentication
- Email and password login
- User registration with profile creation
- Secure authentication token management
- Protected routes for authenticated users

### User Profile Management
- View and edit profile information
- Profile picture customization
- Subscription details display
- Usage statistics

### Demo Mode
- Quick access with demo credentials
- Experience platform features without signup
- Simulated subscription data
- Easy transition to full account

## Project Structure

```
src/
├── components/         # UI components
│   ├── email/          # Email-related components
│   ├── subscription/   # Subscription components
│   └── ui/             # Basic UI elements
├── contexts/           # React contexts for state management
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── services/           # Service modules
│   ├── auth/           # Authentication services
│   ├── email/          # Email handling services
│   └── payment/        # Payment processing services
├── stores/             # Global state stores
└── utils/              # Utility functions
```

## Key Technologies

- **React** - Frontend UI library
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Zustand** - State management
- **Stripe** - Payment processing
- **React Router** - Navigation

## Getting Started

1. Clone the repository
   ```
   git clone https://github.com/yourusername/genieflowai.git
   cd genieflowai
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Start the development server
   ```
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

5. Login with demo credentials:
   - Email: demo@genieflowai.com
   - Password: demo123

## Authentication Demo

To test the authentication system:

1. Visit the login page at `/login`
2. Use the demo credentials or create a new account
3. Explore protected routes like `/profile` and `/subscription`
4. Test the logout functionality
5. Verify route protection by trying to access protected routes while logged out

## License
MIT License

## Built With
- React + Vite
- shadcn/ui components
- Lucide icons
- AI: Gemini, GPT-4, Grok
