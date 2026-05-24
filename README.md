# feel-attendance

Mobile attendance app built with **React Native + Expo**, powered by the [Feel language](https://github.com/AgilS121/feel) backend. Part of the HRIS portfolio project.

## Features

| Screen | Description |
|---|---|
| **Login** | Authenticate with email + password |
| **Home** | Today's attendance status — clock-in & clock-out with front camera selfie + GPS |
| **Attendance History** | Monthly attendance log with status badges (present, late, absent, sick, leave, WFH) |
| **Leave** | View leave balance, submit leave requests, cancel pending requests |
| **Profile** | Employee info, change password, sign out |

### Clock-In / Clock-Out
- Front camera selfie (optional if permission denied)
- GPS coordinates captured automatically
- Late detection vs company work schedule — shows **minutes late** and **deduction amount**
- **Offline support** — if no connection, action is queued in AsyncStorage and auto-synced when back online. Pending badge shown in header.

### Device Binding
- A persistent `device_id` (UUID) is generated on first launch and stored in AsyncStorage
- Sent with every login — backend records it alongside `last_login` and `last_ip`

## Tech Stack

- **React Native** 0.85 + **Expo** SDK 56
- **React Navigation** v7 — bottom tabs + native stack
- **Axios** — HTTP client with JWT interceptor
- **AsyncStorage** — persistent token, device ID, and offline action queue
- **expo-camera** / **expo-image-picker** — selfie capture
- **expo-location** — GPS coordinates

## Project Structure

```
src/
  api/
    client.ts              # axios instance + attendanceApi, leaveApi, authApi
  context/
    AuthContext.tsx         # JWT auth state + employee profile + device ID
  navigation/
    index.tsx              # tab + stack navigator setup
  screens/
    LoginScreen.tsx
    HomeScreen.tsx          # clock-in/out, today's status, offline queue sync
    HistoryScreen.tsx
    LeaveScreen.tsx
    ProfileScreen.tsx
  utils/
    offlineQueue.ts         # AsyncStorage queue for offline clock-in/out
```

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo`)
- feel-hris-be running locally (see [feel-hris-be](../feel-hris-be))

### Install & Run

```bash
npm install

# Web (browser testing)
npm run web

# Android (with device/emulator)
npm run android

# iOS (macOS only)
npm run ios
```

### Configure API URL

Edit `src/api/client.ts` and set `BASE_URL` to your backend:

```ts
// Local development
const BASE_URL = 'http://localhost:3000/api'

// Physical device on same network
const BASE_URL = 'http://192.168.x.x:3000/api'
```

## Backend

This app connects to **feel-hris-be** — a REST API written in the [Feel language](https://github.com/AgilS121/feel).

Key endpoints used:

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/login` | Login with optional `device_id`, returns JWT |
| `GET` | `/auth/me` | Current user info |
| `GET` | `/hr/employees/me` | Employee profile linked to JWT user |
| `GET` | `/hr/attendance/today` | Today's attendance record |
| `POST` | `/hr/attendance/clock-in` | Clock in (multipart: selfie + lat/lng) |
| `POST` | `/hr/attendance/clock-out` | Clock out (multipart: selfie + lat/lng) |
| `GET` | `/hr/attendance/my` | Attendance history (year + month) |
| `GET` | `/hr/leave-balances` | Leave balance per type |
| `GET` | `/hr/leave-requests/mine` | My leave requests |
| `POST` | `/hr/leave-requests` | Submit leave request |
| `PUT` | `/hr/leave-requests/:id/cancel` | Cancel pending request |

## Permissions

| Permission | Usage |
|---|---|
| `CAMERA` | Front camera for selfie on clock-in/out |
| `ACCESS_FINE_LOCATION` | GPS for attendance location verification |
| `READ/WRITE_EXTERNAL_STORAGE` | Image access on Android |

All permissions are requested at runtime and are optional — clock-in/out still works if denied (selfie and coordinates will be skipped).

## Related Projects

- [feel](https://github.com/AgilS121/feel) — the backend language
- [feel-hris-be](../feel-hris-be) — REST API backend (Feel)
- [feel-hris-fe](../feel-hris-fe) — Admin web dashboard (React + Vite)

## Author

**Agil S** — [github.com/AgilS121](https://github.com/AgilS121)
