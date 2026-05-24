# feel-attendance

Mobile attendance app built with **React Native + Expo**, powered by the [Feel language](https://github.com/AgilS121/feel) backend. Part of the HRIS (Human Resource Information System) portfolio project.

## Features

| Screen | Description |
|---|---|
| **Login** | Authenticate with email or employee number |
| **Home** | Today's attendance status — clock-in & clock-out with front camera selfie + GPS |
| **Attendance History** | Monthly attendance log with status badges (present, late, absent, sick, leave, WFH) |
| **Leave** | View leave balance, submit leave requests, cancel pending requests |
| **Profile** | Employee info, change password, sign out |

### Clock-In / Clock-Out
- Front camera selfie (optional if permission denied)
- GPS coordinates captured automatically
- Late detection: compared against company work schedule (`08:00`, 15-min grace by default)
- Shows **minutes late** and **salary deduction** on Home screen if late

## Tech Stack

- **React Native** 0.85 + **Expo** SDK 56
- **React Navigation** v7 — bottom tabs + native stack
- **Axios** — HTTP client with JWT interceptor
- **AsyncStorage** — persistent token storage
- **expo-camera** / **expo-image-picker** — selfie capture
- **expo-location** — GPS coordinates

## Project Structure

```
src/
  api/
    client.ts        # axios instance + attendanceApi
  context/
    AuthContext.tsx  # JWT auth state + employee profile
  navigation/
    index.tsx        # tab + stack navigator setup
  screens/
    LoginScreen.tsx
    HomeScreen.tsx   # clock-in/out, today's status
    HistoryScreen.tsx
    LeaveScreen.tsx
    ProfileScreen.tsx
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

// Device on same network
const BASE_URL = 'http://192.168.x.x:3000/api'
```

## Backend

This app connects to **feel-hris-be** — a REST API written in the [Feel language](https://github.com/AgilS121/feel).

Key endpoints used:

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/login` | Login, returns JWT |
| `GET` | `/auth/me` | Current user info |
| `GET` | `/hr/employees/me` | Employee profile linked to JWT user |
| `GET` | `/hr/attendance/today` | Today's attendance record |
| `POST` | `/hr/attendance/clock-in` | Clock in (multipart: selfie + lat/lng) |
| `POST` | `/hr/attendance/clock-out` | Clock out (multipart: selfie + lat/lng) |
| `GET` | `/hr/attendance/mine` | Attendance history |
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
