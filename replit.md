# Microservices Manager

## Overview

This is a full-stack web application built for managing microservice versions across different environments (BAU, UAT, PROD). The application provides a dashboard interface where users can view, monitor, and update microservice versions across multiple deployment environments. It features a React frontend with a modern UI built using shadcn/ui components, an Express.js backend API, and PostgreSQL database integration using Drizzle ORM.

The system allows users to track microservice deployments, view recent activity, and manage version switches through an intuitive web interface. It's designed to provide visibility and control over microservice version management in enterprise environments.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Build Tool**: Vite for development and production builds
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JSON responses
- **Middleware**: Custom logging middleware for API request tracking
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Development**: Hot reload with tsx and Vite integration

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM
- **Database Client**: Neon Database serverless driver
- **Schema Management**: Drizzle migrations with type-safe schema definitions
- **Development Storage**: In-memory storage implementation for development/testing
- **Data Models**: Services, Activities, and Users with proper relationships

### Authentication and Authorization
- **Current Implementation**: Basic admin user setup (development phase)
- **Session Management**: Express sessions with PostgreSQL session store
- **Security**: CORS configuration and input validation with Zod schemas

### API Structure
The backend provides the following key endpoints:
- `GET /api/services` - Retrieve all microservices
- `GET /api/services/:id` - Get specific service details
- `POST /api/services` - Create new microservice entry
- `PATCH /api/services/version` - Update service version for specific environment
- `GET /api/activities` - Fetch recent deployment activities
- `GET /api/stats` - Dashboard statistics and metrics

### Component Architecture
The frontend follows a modular component structure:
- **Pages**: Dashboard as the main application view
- **Components**: Reusable UI components (services table, activity feed, stats cards)
- **UI Components**: shadcn/ui component library for consistent design
- **Hooks**: Custom hooks for mobile detection and toast notifications
- **Utils**: Utility functions for styling and API interactions

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless database client
- **drizzle-orm**: Type-safe ORM for database operations
- **drizzle-kit**: Database migration and schema management tools
- **express**: Node.js web framework for API server
- **react**: Frontend framework with hooks and modern features
- **@tanstack/react-query**: Server state management and caching

### UI and Styling Dependencies
- **@radix-ui/***: Headless UI components for accessibility
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **clsx**: Conditional CSS class composition
- **lucide-react**: Icon library for consistent iconography

### Development and Build Tools
- **vite**: Build tool and development server
- **typescript**: Type safety and development experience
- **tsx**: TypeScript execution for Node.js
- **@replit/vite-plugin-runtime-error-modal**: Development error handling
- **@replit/vite-plugin-cartographer**: Replit-specific development tools

### Form and Validation
- **react-hook-form**: Form handling and validation
- **@hookform/resolvers**: Form validation resolver adapters
- **zod**: Runtime type validation and schema definition
- **drizzle-zod**: Integration between Drizzle and Zod schemas

### Date and Time
- **date-fns**: Date manipulation and formatting utilities

### Session and State Management
- **connect-pg-simple**: PostgreSQL session store for Express
- **wouter**: Lightweight routing for React applications