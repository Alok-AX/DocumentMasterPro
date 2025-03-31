# DocManager - Document Management System

## Project Overview

DocManager is a full-stack web application for managing documents with a secure and user-friendly interface. It provides role-based access controls, document uploading, management, and activity tracking.

## Technology Stack

### Frontend
- React 18
- Redux Toolkit (state management)
- React Query (data fetching)
- Framer Motion (animations)
- Shadcn UI components
- TailwindCSS (styling)
- Wouter (routing)

### Backend
- Express.js
- PostgreSQL (via NeonDB)
- Drizzle ORM
- Express-session (authentication)
- Zod (validation)

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and store
│   │   │   └── store/      # Redux store and slices
│   │   └── pages/          # Application pages
├── server/                 # Backend Express application
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Data access layer
│   ├── index.ts            # Main server entry point
│   └── vite.ts             # Vite configuration for development
├── shared/                 # Shared code between frontend and backend
│   └── schema.ts           # Zod schemas for validation
├── migrations/             # Database migration files
├── .env                    # Environment variables
├── package.json            # Project dependencies and scripts
└── drizzle.config.ts       # Drizzle ORM configuration
```

## Features

- **User Authentication**: Secure login and registration system
- **Role-Based Access Control**: Admin, User, and Viewer roles with different permissions
- **Document Management**: Upload, view, edit, delete documents
- **Activity Tracking**: Log all user actions within the system
- **Responsive UI**: Works on mobile, tablet, and desktop devices

## User Roles

1. **Admin**:
   - Can access all documents in the system
   - Can manage users (create, update, delete)
   - Has full system access

2. **User**:
   - Can manage their own documents
   - Limited access to other users' documents

3. **Viewer**:
   - Read-only access to permitted documents

## Setup Instructions

### Prerequisites

- Node.js (v16+)
- PostgreSQL database (or NeonDB account)
- npm or yarn

### Environment Setup

Create a `.env` file in the project root:

```
DATABASE_URL=postgresql://username:password@localhost:5432/your_db_name
# Or for NeonDB
# DATABASE_URL=postgres://your_username:your_password@your_host/your_db_name
SESSION_SECRET=your_secure_random_string
PORT=3000
```

### Installation Steps

```bash
# Clone the repository
git clone https://github.com/yourusername/docmanager.git
cd docmanager

# Install dependencies
npm install

# Push database schema
npm run db:push

# Start development server
npm run dev
```

## Running the Application

### Development Mode

```bash
npm run dev
```

This starts the development server with hot reloading at http://localhost:3000.

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Authentication

### Default Admin Account

The system creates a default admin user on first run:
- Username: `admin`
- Password: `admin123`

### Registration

New users can register at `/signup` with the following information:
- Full Name
- Email
- Username
- Password

By default, new users are assigned the "user" role.

### API Endpoints

#### Authentication
- `POST /api/auth/signup` - Create a new user account
- `POST /api/auth/login` - Authenticate and retrieve a session

#### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)

#### Documents
- `GET /api/documents` - Get documents (admins see all, others see their own)
- `POST /api/documents` - Create a new document
- `GET /api/documents/:id` - Get document by ID
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document

#### Health Check
- `GET /api/health` - Check API availability

## Database Schema

### Users
- id: Primary key
- username: Unique username
- email: User email
- name: Full name
- password: Password (stored in plain text in development - would be hashed in production)
- role: "admin", "user", or "viewer"
- createdAt: Timestamp

### Documents
- id: Primary key
- name: Document name
- type: Document type
- size: File size
- path: Storage path
- userId: Owner of document
- createdAt: Creation timestamp
- updatedAt: Last update timestamp
- starred: Favorite status

### Activities
- id: Primary key
- userId: User who performed action
- action: Description of action
- type: Activity type
- documentId: Related document (if applicable)
- createdAt: Timestamp

## Troubleshooting

### Common Issues

1. **Database Connection Error**:
   - Verify DATABASE_URL is correctly formatted
   - Check database server is running

2. **Authentication Issues**:
   - Make sure SESSION_SECRET is set
   - Clear browser cookies if sessions are behaving unexpectedly

3. **Role Permission Errors**:
   - The system allows "admin", "user", and "viewer" roles only
   - Check user role assignment

## Security Notes

- In a production environment, passwords should be hashed
- The SESSION_SECRET should be a long, random string
- For production deployment, enable secure cookies and proper CORS settings

## License

This project is licensed under the MIT License.

## Testing

### Test Setup

The project uses Jest and React Testing Library for testing. Tests are located in the `tests/` directory.

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate test coverage report
npm run test:coverage
```

### Test Structure

```
tests/
├── unit/                  # Unit tests
│   ├── components/        # Component tests
│   ├── hooks/            # Custom hook tests
│   └── utils/            # Utility function tests
├── integration/          # Integration tests
│   ├── api/             # API endpoint tests
│   └── flows/           # User flow tests
└── e2e/                 # End-to-end tests
```

### Key Test Cases

#### Authentication Tests
- User login with valid credentials
- User login with invalid credentials
- User registration flow
- Password validation
- Session management

#### Document Management Tests
- Document creation
- Document update
- Document deletion
- File upload validation
- Permission checks

#### User Management Tests
- User role assignment
- User profile updates
- Password changes
- Admin user management capabilities

#### API Integration Tests
- API endpoint responses
- Error handling
- Rate limiting
- Authentication middleware
- Role-based access control

#### Component Tests
- UI component rendering
- User interaction handling
- State management
- Form validation
- Error message display

### Test Utilities

The project includes several test utilities:

- `testUtils.ts`: Common test helper functions
- `mockData.ts`: Test fixtures and mock data
- `setupTests.ts`: Global test setup and configuration

### Writing Tests

Example of a component test:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginForm } from '../components/LoginForm';

describe('LoginForm', () => {
  it('should display validation error for invalid email', async () => {
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText('Email');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);
    
    expect(await screen.findByText('Please enter a valid email')).toBeInTheDocument();
  });
});
```

### Test Coverage Requirements

The project maintains the following test coverage requirements:

- Statements: >80%
- Branches: >75%
- Functions: >80%
- Lines: >80%

Run `npm run test:coverage` to generate a detailed coverage report.
