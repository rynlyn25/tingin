# TINGIN: Autonomous YOLO Vision-Based Classroom Attendance Application for De La Salle Araneta University

**TINGIN** is a faculty-focused classroom attendance mobile application built for **De La Salle Araneta University (DLSAU)**. It combines real-time computer vision (Ultralytics YOLO and facial recognition) with a liquid-glass mobile interface to automate student attendance tracking, seat mapping, and anomaly detection.

---

## Team Members

| Role | Name |
| :--- | :--- |
| **Frontend / Mobile UI Developer** | *Reynalyn Ruth V. Morbo* |
| **Backend & Database Engineer** | *Louievince Kyle I. Laguidao* |

---

## Key Features

- **DLSAU Institutional Authentication**: Restricted faculty login and registration (`@dlsau.edu.ph`).
- **Liquid-Glass Wallet Deck Dashboard**:
  - Stacked, color-coded course cards with translucent glassmorphism and dynamic ambient lighting.
  - **Long-press and drag** to reorder class cards in the stack.
  - **Double-tap** (or tap **Edit**) to update subject name, schedule, room, enrolled student count, and card theme color/shades.
- **Interactive Section Management**:
  - Horizontal `LiquidSectionBar` with **tap** to switch sections, **double-tap** to rename, and **long-press + drag** to reorder section hierarchy across screens.
- **Live Seat Map & Camera Feed**:
  - Supports **Wi-Fi IP/CCTV Camera** streams and **On-Device Phone Camera** feeds.
  - Interactive classroom layout diagram with seat status inspection (`Present`, `Late`, `Anomaly`, `Empty`) and manual faculty overrides.
  - Reusable room and lab row-by-row seat plan capture.
- **Student Roster & DPA Biometric Enrollment**:
  - Swipeable student rows for instant attendance status updates.
  - **RA 10173 (Data Privacy Act of 2012)** compliant biometric enrollment flow with zero raw-image retention.

---

## System Architecture

### Hardware Requirements
- **Processor**: 7th Generation Intel Core i3 or newer
- **Memory**: 8GB DDR4 RAM or more
- **Storage**: Minimum 128GB (SSD recommended)
- **Access Devices**: Desktop, Laptop, or Mobile / Tablet
- **Camera Input**: CCTV / IP Camera or Mobile Device Camera
- **Connectivity**: Wi-Fi / Local Network Connection

### Software & Tech Stack
- **Mobile Frontend**: React Native, Expo (`Animated`, `PanResponder`, `expo-blur`, `expo-camera`, `expo-image-picker`, `react-native-svg`)
- **Vision & Processing**: Python, Ultralytics YOLO, OpenCV
- **Database**: MySQL
- **Development Environment**: Visual Studio Code, Windows 10 or newer

### Core System Modules
1. **Camera Feed Module**: Captures live classroom video streams via local Wi-Fi RTSP or mobile camera.
2. **YOLO Detection Module**: Detects seated students and maps them to classroom coordinates.
3. **Face Recognition Module**: Performs preprocessing, feature extraction, and identity matching.
4. **Attendance Processing Module**: Verifies attendance status, flags anomalies, and logs records to MySQL.
5. **User Interface Module**: Displays real-time seat maps, rosters, and analytics on faculty devices.

---

## Project Structure

```text
tingin-app/
├── App.js                        # Root state management & screen router
├── components/
│   ├── EditCourseModal.js        # Liquid-glass modal for editing class metadata & colors
│   ├── LiquidCardStack.js        # Draggable wallet-style class card stack
│   └── LiquidSectionBar.js       # Draggable horizontal section switcher
└── screens/
    ├── LoginScreen.js            # DLSAU faculty authentication
    ├── DashboardScreen.js        # Main class deck & weekly attendance analytics
    ├── LiveFeedScreen.js         # Live camera feed, seat plan setup & classroom map
    ├── RosterScreen.js           # Student list, swipe actions & DPA enrollment
    ├── ProfileScreen.js          # Faculty profile & academic settings
    └── HealthScreen.js           # System diagnostics & camera/model health
```

---

## Getting Started

1. **Navigate to the project directory**:
   ```bash
   cd tingin-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the Expo development server**:
   ```bash
   npx expo start -c
   ```

4. **Run on your device**:
   - Scan the QR code using the **Expo Go** app on Android or iOS, or press `a` / `i` to launch an emulator.

---

## Methodology & Compliance

- **Methodology**: Agile Software Development Life Cycle (SDLC)
- **Data Privacy**: Designed in compliance with **Republic Act No. 10173 (Data Privacy Act of 2012)**—storing mathematical facial embeddings rather than raw student photographs.
