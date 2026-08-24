# RailOne — Railway Reservation System

A full-stack railway reservation platform designed to provide a simple and modern way to search trains, manage bookings, view PNR information and handle railway operations through an admin dashboard.

The application is built using **Next.js, TypeScript, Prisma and PostgreSQL**, with a responsive interface and role-based access for passengers and administrators.

## Features

### Passenger Features

* User registration and login
* Secure password-based authentication
* Train search by source and destination
* Train and fare information
* Seat/class selection
* Passenger details management
* Railway ticket booking
* Booking history
* PNR enquiry
* Ticket cancellation
* Refund calculation
* Train status/tracking interface
* Responsive user dashboard

### Authentication

* Email/password authentication
* Password hashing
* Form validation
* Session-based authentication
* Passenger and administrator roles
* Protected application routes

### Admin Features

* Admin dashboard
* User management
* Train management
* Booking management
* Booking status overview
* Passenger/account status management
* Train activation/deactivation
* Administrative statistics

### Database

The application uses **PostgreSQL with Prisma ORM**.

Main database entities include:

* User
* Train
* TrainClass
* Booking
* Payment
* Cancellation
* Account
* OTP

Prisma migrations are included in the project for database setup and version control.

## Tech Stack

| Technology                   | Purpose                           |
| ---------------------------- | --------------------------------- |
| Next.js                      | Full-stack web application        |
| TypeScript                   | Application development           |
| React                        | User interface                    |
| Tailwind CSS                 | Styling and responsive UI         |
| Prisma                       | Database ORM                      |
| PostgreSQL                   | Relational database               |
| Neon                         | Cloud PostgreSQL database         |
| NextAuth                     | Authentication/session management |
| Zod                          | Input validation                  |
| React Hook Form              | Form handling                     |
| Three.js / React Three Fiber | Interactive 3D UI elements        |
| Framer Motion                | UI animations                     |
| Lucide React                 | Icons                             |
| Git & GitHub                 | Version control                   |

## Application Modules

### Authentication

The authentication module handles:

* Registration
* Login
* Password validation
* Session management
* Role-based access

### Train Search

Users can search for available trains using:

* Source station
* Destination station
* Journey information
* Train class

### Booking

The booking workflow allows passengers to:

1. Search for a train
2. Select a class/seat
3. Enter passenger information
4. Review booking details
5. Complete the booking process
6. View the generated booking/PNR information

### PNR & Cancellation

Passengers can view booking information using their PNR and cancel eligible bookings through the cancellation module.

### Admin Dashboard

Administrators have a separate dashboard for managing:

* Users
* Trains
* Bookings
* Account status
* Train availability

## Database

The application uses Prisma ORM with PostgreSQL.

A simplified relationship structure is:

```text
User
 │
 ├── Booking
 │     ├── Payment
 │     └── Cancellation
 │
 └── Account

Train
 │
 ├── TrainClass
 └── Booking
```

## Project Structure

```text
RailOne-Railway-Reservation-System/
│
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
│
├── public/
│
├── src/
│   ├── app/
│   │   ├── login/
│   │   ├── register/
│   │   ├── dashboard/
│   │   ├── book-ticket/
│   │   ├── my-bookings/
│   │   ├── pnr-enquiry/
│   │   ├── cancellation/
│   │   ├── track-train/
│   │   ├── admin/
│   │   └── api/
│   │
│   ├── components/
│   └── lib/
│
├── .env.example
├── .gitignore
├── package.json
├── prisma.config.ts
└── README.md
```

> The exact structure may vary as the project evolves.

## Getting Started

### Prerequisites

Make sure the following are installed:

* Node.js
* npm
* Git
* PostgreSQL/Neon database

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd RailOne-Railway-Reservation-System
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a local `.env` file based on `.env.example`.

Example:

```env
DATABASE_URL="your-postgresql-connection-string"
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
```

Add any other credentials required by the enabled authentication, email and payment features.

### 4. Generate Prisma Client

```bash
npx prisma generate
```

### 5. Apply database migrations

```bash
npx prisma migrate dev
```

### 6. Seed the database

```bash
npx prisma db seed
```

### 7. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Environment Variables

The application uses environment variables for configuration and external services.

Typical variables include:

```text
DATABASE_URL
NEXTAUTH_SECRET
NEXTAUTH_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
NEXT_PUBLIC_RAZORPAY_KEY_ID
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASSWORD
```

Only configure the variables required by the features you use.

**Never commit your `.env` file or real API credentials to GitHub.**

## Database Seeding

The Prisma seed script creates the initial application data required for development and testing.

Run:

```bash
npx prisma db seed
```

If the database needs to be recreated during development, use the appropriate Prisma reset/migration workflow for your environment.

## Testing the Application

A typical manual test flow is:

1. Start the development server.
2. Register a new passenger account.
3. Log in.
4. Search for a train.
5. Select a train and class.
6. Enter passenger information.
7. Create a booking.
8. Open the booking history.
9. Check the generated PNR.
10. Test cancellation.
11. Log in using an administrator account.
12. Verify the admin dashboard and management features.

## Development Commands

```bash
npm run dev
```

Start the development server.

```bash
npm run build
```

Create a production build.

```bash
npm run start
```

Start the production server.

```bash
npm run lint
```

Run ESLint.

```bash
npx prisma generate
```

Generate Prisma Client.

```bash
npx prisma migrate dev
```

Run development database migrations.

```bash
npx prisma db seed
```

Populate the development database.

## Current Status

The application is actively being developed and tested locally.

The current implementation includes the core railway reservation workflow, PostgreSQL/Prisma database integration, authentication, passenger booking functionality and administrative management.

Some integrations and production-level configurations may require additional environment variables and deployment configuration.

## Future Improvements

Potential improvements include:

* Production deployment
* Improved train availability logic
* Real-time train tracking
* Additional payment scenarios
* Automated testing
* Improved accessibility
* Performance optimization
* More comprehensive administrative analytics
* CI/CD automation

## Author

**Fahmida Fathima**

Built as a full-stack software engineering project using modern web technologies.
