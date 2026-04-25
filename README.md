# Wingman — Pilot Management System

A mobile backend REST API for pilots (boosters) to manage their boosting business. Built with Laravel 13 and consumed by a React Native Expo mobile app.

---

## What is Wingman?

Wingman is a personal management tool designed for game boosters (pilots) to organize and track their boosting work in one place. Instead of managing everything manually, pilots can log their jobs, track progress, manage their customer list, and set their own pricing — all from a mobile app.

---

## Features

### Account & Authentication
- Secure pilot registration with **email verification** (6-digit OTP)
- Email verification cooldown — resend limited to once every **5 minutes**
- Token-based authentication via **Laravel Sanctum**
- Login protection — accounts blocked until email is verified

### Profile Management
- Update display name, bio, and profile information
- Set games expertise (CODM, MLBB, Valorant)
- Dashboard stats — total grinds, completed, and active jobs at a glance

### Customer Management
- Maintain a personal customer contact list
- Save customer details (name, email, phone, notes)
- Reuse saved customers when logging new grinds — no re-entering details
- View a customer's full grind history

### Grind Logging & Tracking
- Log boosting jobs (grinds) with full details
- Supports two service types:
  - **Rank Boost** — from one rank tier to another
  - **Win Count** — a set number of wins at a fixed price per win
- Auto-calculated price based on your own pricing setup
- Full grind lifecycle:
  ```
  Not Started → In Progress → Completed
       ↓               ↓
   Cancelled       Cancelled
  ```
- Track progress percentage and current rank in real time
- Unique grind number per pilot (GRD-0001, GRD-0002...)

### Pricing Management
- Set custom pricing ranges per game
- Define price per tier step for each rank range
- Optional major rank crossing fee for significant rank boundaries
- Reorder pricing tiers for display
- Deactivate pricing ranges without losing history

### Pricing Audit Log
- Every pricing change is automatically logged — nothing is lost
- Full history of old vs. new prices
- Reason tracking — pilots can record why they changed a price
- Immutable logs — audit history cannot be edited or deleted

### Price Calculator
- Preview the exact price of any rank boost before logging it
- Step-by-step breakdown showing which pricing range applies at each tier
- Detects major rank group crossings automatically

### Reference Data
- Full rank tier lists for all supported games
- Used to populate rank pickers in the mobile app

---

## Supported Games

| Game | Ranks |
|------|-------|
| Call of Duty: Mobile | Veteran → Elite → Pro → Master → GrandMaster → Legendary |
| Mobile Legends: Bang Bang | Warrior → Elite → Master → Grandmaster → Epic → Legend → Mythic |
| Valorant | Iron → Bronze → Silver → Gold → Platinum → Diamond → Ascendant → Immortal → Radiant |

---

## Security

- **Rate limiting** on all authentication endpoints:
  - Login — 5 attempts per minute
  - Register — 3 attempts per minute
  - Resend verification code — 2 attempts per minute
- **Email verification** required before login
- **Token-based auth** — no sessions, no cookies
- **Pilot data isolation** — pilots can only access their own data
- Protected against mass assignment attacks
- SQL injection protection via Eloquent ORM

---

## Tech Stack

- **Framework:** Laravel 13
- **Language:** PHP 8.3
- **Database:** MySQL
- **Authentication:** Laravel Sanctum
- **Email:** Gmail SMTP
- **Mobile Frontend:** React Native (Expo)

---

## API

All endpoints are REST and return JSON. Authentication uses Bearer tokens.

Base URL:
```
https://api.wingman-app.online/api
```

> See API documentation for full endpoint reference.
