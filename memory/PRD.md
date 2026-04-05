# Školski Kviz - Product Requirements Document

## Original Problem Statement
Build a school quiz application with Croatian language frontend, liquid glass design, minimalistic icons, and scroll animations. Features include multiple question types, optional login, anti-spam, leaderboard, timer, categories, and admin panel.

## Architecture
- **Frontend**: React with Tailwind CSS, Shadcn UI components, liquid glass design
- **Backend**: FastAPI with MongoDB (Motor async driver)
- **Auth**: JWT-based optional authentication with cookies
- **Anti-spam**: Rate limiting per IP/action

## User Personas
1. **Students**: Take quizzes, compete on leaderboard (optional login)
2. **Teachers/Admins**: Manage categories and questions

## Core Requirements
- [x] Croatian language UI
- [x] Liquid glass design with animations
- [x] Multiple question types (single choice, multiple choice, true/false)
- [x] Quiz timer with visual countdown
- [x] Score tracking with bonus points for quick answers
- [x] Optional user registration/login
- [x] Leaderboard for registered users
- [x] Admin panel for content management
- [x] Anti-spam rate limiting

## What's Been Implemented (Jan 2026)
- Complete quiz application with all core features
- 4 sample categories with 10 questions
- Admin panel with full CRUD operations
- Beautiful liquid glass UI with scroll animations
- Responsive design for mobile/desktop

## Admin Credentials
- Username: `admin`
- Password: `Admin123!`

## Deployment Notes for VPS (SQLite alternative)
The app currently uses MongoDB. For SQLite on your VPS:
1. Replace Motor with SQLAlchemy + aiosqlite
2. Update connection string in .env
3. Create SQLite database file

## Backlog
- P1: Add more sample questions per category
- P1: Image support in questions
- P2: Student progress tracking
- P2: Quiz difficulty levels
- P3: Export results to PDF
- P3: Sound effects for correct/incorrect answers

## Update Log - Jan 2026 (Session 2)

### Implemented:
- **GSAP CardNav**: Replaced old header with animated card-based navigation
- **Dark Mode**: Full dark theme with purple/pink gradients, starry background, font changes
- **Theme Persistence**: localStorage saves user preference
- **Tailwind v3.4.17**: Kept v3 for CRA compatibility (v4 requires Vite/Next.js)

### CardNav Features:
- Hamburger menu with smooth GSAP animations
- 3 navigation cards that slide in with stagger effect
- Theme toggle (☀️/🌙) in header
- Responsive design for mobile/desktop
- Auto-close on route change
