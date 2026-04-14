# NFC Selector App - Specification

## Project Overview

Persistent client application for NFC-based employee selection/attendance marking. Designed to run continuously on devices (Raspberry Pi, mini PC, desktop, kiosk) without repeated logins.

## Architecture

### Layers
1. **App Runtime/Session Layer** - Manages login-once, token lifecycle, persistent sessions
2. **Scanning Layer** - NFC card detection and processing
3. **API Communication Layer** - HTTP client with retries, queueing, and offline support

## Requirements

### 1. Login-Once Authentication
- Single login at app startup
- Session persists for app lifetime
- Credentials stored securely in localStorage/electron-store
- Login screen shown only when no valid session exists

### 2. Token Refresh (Every 30 minutes)
- Background automatic refresh
- Silent refresh - no user interaction required
- Retry mechanism on refresh failure
- Clear session on permanent auth failures

### 3. Device/Scanner Session Model (Kiosk Mode)
- Full-screen always-on mode
- Auto-lock disabled
- Touch-optimized UI for scanner device
- Status indicators for connection/auth state

### 4. Network Failure Handling
- Automatic retry with exponential backoff
- Request queue for offline operations
- Visual feedback for connectivity issues
- Queue processing when connection restored

### 5. Token Refresh Failure Handling
- Retry 3 times with 5-second delay
- After failures: show login prompt
- Preserve last known state
- Log failures for debugging

## API Integration

### Endpoints Used
- POST `/api/v1/auth/login` - Initial login
- GET `/api/v1/auth/me` - Token validation
- POST `/api/v1/auth/refresh` - Token refresh (if supported)
- POST `/api/v1/attendance/nfc/checkin` - NFC check-in

### Configuration
- Backend URL configurable at build/runtime
- Environment: Vercel backend (`https://backend-n-lac.vercel.app`)

## Tech Stack

- React 18 + TypeScript
- Vite for build
- TailwindCSS for styling
- Custom hooks for auth/session management
