# Mobility Chef 🍽

A full-stack platform connecting customers with professional chefs who travel to their location.

## Project Structure

```
E-chef/
├── client_side/     # React frontend
├── server_side/     # Node.js + Express backend
└── database/        # MySQL schema & migrations
```

## Quick Start

### 1. Database Setup
```sql
mysql -u root -p < database/schema.sql
mysql -u root -p mobility_chef < database/seed.sql
```

### 2. Backend Setup
```bash
cd server_side
cp .env.example .env        # Fill in your credentials
npm install
npm run dev                 # Starts on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd client_side
cp .env.example .env        # Fill in your API keys
npm install
npm start                   # Starts on http://localhost:3000
```

## Default Credentials (after seeding)

| Role          | Email                          | Password     |
|---------------|--------------------------------|--------------|
| Admin         | admin@mobilitychef.com         | Admin@2024!  |
| Chef          | chef@mobilitychef.com          | Admin@2024!  |
| Customer      | customer@mobilitychef.com      | Admin@2024!  |

## API Base URL
`http://localhost:5000/api`

## Key Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET  /api/auth/me`

### Menu
- `GET /api/menu/categories`
- `GET /api/menu/items`
- `GET /api/menu/recommendations` (auth)

### Chefs
- `GET /api/chefs`
- `GET /api/chefs/:id`
- `PUT /api/chefs/me/profile` (chef auth)

### Bookings
- `POST /api/bookings` (customer)
- `GET  /api/bookings`
- `PATCH /api/bookings/:id/status`

### Payments
- `POST /api/payments/mpesa`
- `POST /api/payments/stripe`
- `POST /api/payments/paypal`

### Admin
- `GET  /api/admin/dashboard`
- `GET  /api/admin/users`
- `PATCH /api/admin/chefs/:id/verify`

## Payment Calculation
```
Total = Food Cost
      + Chef Fee (hourly_rate × estimated_hours)
      + Transport Fee (distance_km × rate_per_km)
      + Equipment Fee
      + Extra Service Fee (50% of chef_fee for emergency)
      + Platform Commission (15%)
      + VAT (16%)
      - Loyalty Discount
```

## Technology Stack
- **Frontend**: React 18, React Router 6, Socket.IO Client, Chart.js
- **Backend**: Node.js, Express.js, Socket.IO, JWT
- **Database**: MySQL 8.0
- **Payments**: M-Pesa Daraja API, Stripe, PayPal
- **Security**: bcrypt, JWT, CORS, Helmet, Rate Limiting
- **Real-time**: WebSocket (Socket.IO)
