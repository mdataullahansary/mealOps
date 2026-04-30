# MealOps Backend

MealOps is a backend service built for managing a mess / canteen system with membership, meal scheduling, expense tracking, monthly settlement, payments, and fund management.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Folder Structure](#folder-structure)
- [API Reference](#api-reference)
  - [Health Check](#health-check)
  - [Authentication](#authentication)
  - [Member Management](#member-management)
  - [Meal Management](#meal-management)
  - [Expense Management](#expense-management)
  - [Monthly Summary](#monthly-summary)
  - [Recurring Bill Management](#recurring-bill-management)
  - [Payment Management](#payment-management)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Notes](#notes)

## Overview

MealOps is designed to support mess and meal operations with role-based access, recurring expenses, vendor payments, member dues, and monthly financial settlement. It is implemented as an Express.js API server backed by MongoDB.

## Tech Stack

- Node.js (ESM)
- Express.js
- MongoDB / Mongoose
- JWT authentication
- bcrypt password hashing
- Cloudinary media uploads
- dotenv configuration
- nodemon for local development

## Architecture

The backend is organized into:

- `src/app.js` — Express app setup, middleware, and route mounting
- `src/index.js` — application bootstrap and database connection
- `src/routes/` — route definitions for each functional area
- `src/controllers/` — business logic and request handlers
- `src/models/` — Mongoose schemas and models
- `src/middlewares/` — auth and role guard middleware
- `src/utils/` — helpers, error/response wrappers, finance utilities

## Getting Started

```bash
cd c:/Programming/MealOps/backend
npm install
```

Create a `.env` file in the backend root and supply required values.

Start the server in development:

```bash
npm run dev
```

Or start production build directly:

```bash
npm start
```

## Environment Configuration

Required environment variables:

- `PORT` — server port
- `MONGODB_URI` — MongoDB connection base URI
- `CORS_ORIGIN` — allowed front-end origin
- `ACCESS_TOKEN_SECRET` — JWT access token secret
- `REFRESH_TOKEN_SECRET` — JWT refresh token secret
- `ACCESS_TOKEN_EXPIRES_IN` — access token TTL (e.g. `15m`)
- `REFRESH_TOKEN_EXPIRES_IN` — refresh token TTL (e.g. `7d`)

Example `.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017
CORS_ORIGIN=http://localhost:3000
ACCESS_TOKEN_SECRET=yourAccessSecret
REFRESH_TOKEN_SECRET=yourRefreshSecret
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
```

> The database name is fixed to `mealops` by `src/constants.js`.

## Folder Structure

- `src/app.js` — middleware and route registrations
- `src/index.js` — environment load and DB bootstrap
- `src/controllers/` — all HTTP handlers
- `src/routes/` — API route definitions
- `src/models/` — mongoose schemas
- `src/middlewares/` — authentication and authorization
- `src/utils/` — reusable helpers, API response/error wrappers
- `public/` — static assets and uploaded files

## API Reference

### Health Check

- `GET /api/v1/healthCheck`
  - Returns server readiness and status.

### Authentication

#### Register User

- `POST /api/v1/auth/register`
- Request body:
  - `fullname` (string)
  - `email` (string)
  - `phoneNumber` (string)
  - `password` (string)
  - `avatar` (file, optional)
- Response: user profile without password/refresh token.

#### Login User

- `POST /api/v1/auth/login`
- Request body:
  - `email` or `phoneNumber`
  - `password`
- Response: authenticated user object and JWT access token.

#### Logout User

- `GET /api/v1/auth/logout`
- Clears auth cookies.

#### Delete Account

- `POST /api/v1/auth/delete`
- Deletes authenticated user.

#### Update Account Info

- `PUT /api/v1/auth/update-account`
- Request body may include:
  - `fullname`
  - `phoneNumber`
  - `email`

#### Get Account Info

- `GET /api/v1/auth/account-info`
- Returns the authenticated user profile.

### Member Management

#### Create Mess

- `PUT /api/v1/admin/create-mess`
- Required: authenticated user
- Request body:
  - `messName` (string)
- Creates a new mess and makes the requesting user a mess admin.

#### Get All Members (Admin)

- `GET /api/v1/admin/all-mem`
- Optional query parameters:
  - `status` (pending, approved, rejected)
  - `active` (true/false)

#### Approve Member Request

- `PUT /api/v1/admin/approve-req/:memberId`

#### Reject Member Request

- `PUT /api/v1/admin/reject-req/:memberId`

#### Remove Member

- `PUT /api/v1/admin/remove/:memberId`

### Member Self-Service

#### List Visible Members

- `GET /api/v1/member/allmembers`

#### Join Mess by Code

- `PUT /api/v1/member/join-mess/:code`
- Accepts a mess join code and submits a member request.

### Meal Management

#### Create Menu

- `POST /api/v1/meals/create-menu`
- Request body:
  - `date` (ISO date)
  - `mealType` (`lunch` or `dinner`)
  - `items` (array)

#### Toggle Meal

- `PATCH /api/v1/meals/toggle`
- Request body:
  - `date`
  - `mealType`
  - `status` (boolean)
  - `mode` (`continuous` to toggle global preference)

#### Resume Meals

- `PATCH /api/v1/meals/resume`
- Enables meal preference for the member.

#### Get My Meals

- `GET /api/v1/meals/get-my-meals?startDate=...&endDate=...`

#### Get All Meals

- `GET /api/v1/meals/allmeals?date=...`

#### Get Meal Summary

- `GET /api/v1/meals/getsummery?startDate=...&endDate=...`

### Expense Management

#### Create Expense

- `POST /api/v1/expanses`
- Request body:
  - `title`
  - `category`
  - `expenseDate`
  - `notes`
  - `items`: array of `{ name, quantity, unit, pricePerUnit }`

#### Get Pending Expenses

- `GET /api/v1/expanses/pending`
- Admin-only endpoint.

#### Approve Expense

- `PATCH /api/v1/expanses/:id/approve`

#### Reject Expense

- `PATCH /api/v1/expanses/:id/reject`
- Request body:
  - `reason` (string)

#### Get All Expenses

- `GET /api/v1/expanses?status=&category=&startDate=&endDate=`

### Monthly Summary

#### Generate Monthly Summary

- `POST /api/v1/summary/generate`
- Request body:
  - `month` (number)
  - `year` (number)

#### Finalize Monthly Summary

- `POST /api/v1/summary/finalize/:summaryId`
- Adds final unsettled dues to member balances.

### Recurring Bill Management

#### Create Recurring Bill

- `POST /api/v1/bills/recurring-bills`
- Request body:
  - `vendorName`
  - `category`
  - `amount`
  - `frequency` (`DAILY`, `WEEKLY`, `MONTHLY`)
  - `splitType` (`EQUAL`, `PERMEAL`, `CUSTOM`)
  - `customSplit` (optional)
  - `dueDate` (for monthly bills)
  - `weekDay` (for weekly bills)
  - `startDate`
  - `endDate`

#### Read Active Recurring Bills

- `GET /api/v1/bills/recurring-bills`

#### Update Recurring Bill

- `PATCH /api/v1/bills/recurring-bills/:id`

#### Generate Recurring Bill Expenses

- `POST /api/v1/bills/bills/generate`

#### Toggle Recurring Bill Active State

- `PATCH /api/v1/bills/recurring-bills/toggle/:id`

### Payment Management

#### Initiate Fund Payment

- `POST /api/v1/payment/initiate/:memberId`
- Request body:
  - `amount`
  - `method` (`cash`, `upi`)
  - `note`

#### List Pending Fund Payments

- `GET /api/v1/payment/pending`
- Admin-only endpoint.

#### List My Pending Payments

- `GET /api/v1/payment/my-pending`

#### Confirm Payment

- `POST /api/v1/payment/confirm/:paymentId`

#### Reject Payment

- `POST /api/v1/payment/reject/:paymentId`

#### Refund Member Payment

- `POST /api/v1/payment/refund/:memberId`
- Request body:
  - `amount`
  - `method`
  - `note`
  - `reference`

#### Vendor Payment for Recurring Bill

- `POST /api/v1/payment/vendor/:billId/pay`
- Request body:
  - `method` (defaults to `cash`)
  - `note`
  - `reference`

#### Pay From Fund

- `POST /api/v1/payment/pay-from-fund`
- Request body:
  - `amount`
  - `title`

## Data Models

The backend uses the following core models:

- `User` — handles authentication, profile, role, and refresh tokens
- `Member` — maps a user into a mess and stores member status, role, and balance
- `Mess` — tracks a mess entity and fund status
- `Payment` — records member fund payments, dues, vendor payments, and refunds
- `RecurringBill` — defines vendor bill schedules and split behavior
- `Expense` — captures approved and pending expenses
- `ExpenseItem` — stores individual expense line items
- `MemberDue` — stores split dues for each member per expense
- `MonthlySummary` — holds monthly settlement data and member balances
- `FundTransaction` — ledger for fund credits and debits

## Error Handling

All errors are returned in a consistent JSON format:

```json
{
  "success": false,
  "message": "Error message",
  "errors": [],
  "stack": "..."
}
```

The server sets status codes from `err.statusCode` or defaults to `500`.

## Deployment

1. Ensure MongoDB is available and `.env` is configured.
2. Run `npm install`.
3. Use `npm start` or `npm run dev`.

For production, use a process manager such as PM2 and a secure environment for JWT secrets.

## Contributing

- Follow the existing Express/Mongoose structure.
- Keep controllers focused on business logic and routes focused on request mapping.
- Write meaningful API errors with `ApiError` and use `ApiResponse` for success responses.
- Add route tests and validation when introducing new endpoints.

## Notes

- The database name is fixed to `mealops` in `src/constants.js`.
- `src/app.js` serves static assets from the `public` directory.
- Route-level authorization is enforced using `verifyJWT`, `requireActiveMember`, and `verifyAdmin`.
- `src/models/payment.model.js` includes payment types: `FUND`, `DUES`, `VENDOR`, and `REFUND`.

## License

This backend is licensed under the ISC License. See `LICENSE` for full terms.

## Author

- Name: Md Ataullah Ansary
- Email: `mdataullahansari2003@gmail.com`
- GitHub: `https://github.com/mdataullahansary`
- LinkedIn: `https://www.linkedin.com/in/mdataullahansary`

## Future Upgrades

- Add comprehensive API test coverage for authentication, payments, refunds, and recurring bills.
- Introduce request validation and schema enforcement using a library like Joi or Zod.
- Add reporting dashboards for mess finances, meal trends, dues, and vendor payments.
- Enable CSV/Excel export for summaries, payment history, and member balances.
- Support multi-mess tenancy and advanced role-based separation.
- Add email/SMS notifications for payment receipts, refund confirmations, and bill reminders.
- Implement audit logging for financial and administrative actions.
- Containerize with Docker and add CI/CD pipelines for automated deployment.
- Provide frontend integration examples and API documentation generation.
