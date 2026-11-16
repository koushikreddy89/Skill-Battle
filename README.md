# ⚔️ Skill Battle — B.Tech Capstone Project & Documentation Package

> **SKILL BATTLE: A REAL-TIME COMPETITIVE PROGRAMMING AND 1v1 CODING BATTLE PLATFORM**  
> A Capstone Project report submitted in partial fulfillment of the requirements for the award of the degree of **Bachelor of Technology** in **School of Computer Science and Artificial Intelligence**, **SR University, Warangal (2026–2027)**.

---

## 🎓 Capstone Project Report Package Deliverables

This repository contains the complete, university-standard final-year project documentation package adhering strictly to the official SR University School of CS&AI formatting standards:

1. **`Skill_Battle_Final_Project_Report.docx`** (2.35 MB):
   - Fully formatted Microsoft Word document matching the university reference template.
   - **Page Configuration**: A4 paper (8.27" × 11.69"), Top margin: 1.0", Bottom margin: 1.0", Left margin: 1.25" (binding), Right margin: 0.75", Header distance: 0.492", Footer distance: 0.417".
   - **Typography & Geometry**: Times New Roman, 1.5 line spacing for body text, 1.15 line spacing for code/tables, `keep-with-next` on all headings and images, zero orphaned headings.
   - **Visual Assets**: Embeds the official SR University vector logo, all 11 architectural diagrams, and all 14 genuine UI application screenshots.
   - **File Location**: [Skill_Battle_Final_Project_Report.docx](file:///c:/Users/koush/OneDrive/Desktop/capstone/Skill_Battle_Final_Project_Report.docx) *(and mirror copy in `docs/`)*.

2. **`Skill_Battle_Final_Project_Report.pdf`** (1.25 MB):
   - Native PDF export generated directly from Microsoft Word's layout engine.
   - 100% vector typography, preserved margins, embedded diagrams, and exact page numbers.
   - **File Location**: [Skill_Battle_Final_Project_Report.pdf](file:///c:/Users/koush/OneDrive/Desktop/capstone/Skill_Battle_Final_Project_Report.pdf) *(and mirror copy in `docs/`)*.

3. **`screenshots/` Folder**:
   - Contains 14 high-resolution operational screenshots captured programmatically from the live running Skill Battle application on `http://localhost:5173`.
   - Captures: Landing Page, Registration, Login, Student Dashboard, Problem Library, Monaco Editor, Testcase Execution Results, Battle Lobby, Live 1v1 Battle Arena with Opponent Stream, User Profile, Global Leaderboard, Daily Challenge, Admin Problems, and Admin Users.

4. **`diagrams/` Folder**:
   - Contains all 11 professional system architecture and sequence diagrams formatted in Mermaid with both editable source files (`.mmd`) and high-resolution rendered `.png` visual assets:
     - `01_system_architecture` (.mmd / .png)
     - `02_use_case_diagram` (.mmd / .png)
     - `03_entity_relationship_diagram` (.mmd / .png)
     - `04_dfd_level_0` (.mmd / .png)
     - `05_dfd_level_1` (.mmd / .png)
     - `06_auth_sequence` (.mmd / .png)
     - `07_code_submission_sequence` (.mmd / .png)
     - `08_battle_duel_sequence` (.mmd / .png)
     - `09_activity_diagram` (.mmd / .png)
     - `10_component_diagram` (.mmd / .png)
     - `11_deployment_diagram` (.mmd / .png)

---

## 👥 Student Team & Institutional Metadata

| Detail | Specification |
| :--- | :--- |
| **Project Title** | SKILL BATTLE: A REAL-TIME COMPETITIVE PROGRAMMING AND 1v1 CODING BATTLE PLATFORM |
| **University** | SR University, Ananthasagar, Warangal, Telangana — 506371 |
| **Department** | School of Computer Science and Artificial Intelligence |
| **Degree Program** | Bachelor of Technology (B.Tech) |
| **Academic Year** | 2026–2027 |
| **Team Authors** | 1. **G MANOHAR REDDY** — `2303A51325`<br>2. **G GIRIDHAR REDDY** — `2303A51285`<br>3. **A KRISHNA KOUSHIK** — `2303A51589`<br>4. **GANESH** — `2303A51349`<br>5. **NAVEEN** — `2303A51339` |
| **Head of Department** | **Dr. CH. Sandeep**, Associate Professor & Head, School of CS&AI |
| **Dean** | **Dr. M. Sheshikala**, Professor & Dean, School of CS&AI |
| **Project Coordinator** | **Mr. Sallauddin Md**, Assistant Professor, School of CS&AI |

### 📝 Action Required: Faculty Guide Placeholder
In `Skill_Battle_Final_Project_Report.docx`, the faculty mentor name is set to:
`[Project Guide Name, Designation]`
Before final physical binding or university submission, open the `.docx` document and replace this placeholder with your assigned guide's official name (e.g., `Ms. / Dr. / Mr. Full Name`).

---

## 🌟 Application Architecture & Implemented Features

Skill Battle combines algorithmic problem practice with real-time multiplayer coding battles:

### 1. Student Portal
- **Algorithmic Library**: Filter by topic tags (Arrays, Hash Maps, Dynamic Programming) and difficulty (Easy, Medium, Hard).
- **Monaco Code Editor**: Customized with charcoal dark theme (`skillBattleDark`), multi-language switching (JavaScript & Python), intelligent autocompletion, and client-side storage isolation (`code_solution_{userId}_{problemId}_{language}`).
- **Sandboxed Test Runner**: Real-time evaluation against visible sample testcases and hidden automated testcases.
- **1v1 Battle Arena**: Private room creation via 6-character room codes (`SBHD44`), mutual readiness checks, synchronized server countdown timers, and live opponent progress telemetry over Socket.IO WebSockets.
- **Performance Analytics**: LeetCode-style profile with solved ratio rings, current & maximum streaks, achievement badges, and a 365-day submission activity heatmap powered by MongoDB aggregation pipelines.
- **24-Hour Daily Challenge**: Automated daily problem scheduling awarding 50 bonus ELO rating points.

### 2. Admin Portal
- **Telemetry Console**: Platform metrics tracking registered students, active challenges, lifetime battles, and automated test submissions.
- **Problem Management**: Full CRUD authoring for descriptions, constraints, starter templates, and hidden test cases.
- **User Governance**: Student account suspension and reactivation with instant session invalidation.

### 3. Application Security
- **Bcrypt Hashing**: 10 salt rounds for password security.
- **Dual-Channel Authentication**: HttpOnly `SameSite=Lax` cookies paired with signed HS256 JWT bearer tokens containing unique UUID nonces (`jti`).
- **Server-Side Token Revocation**: Logout persists tokens to a MongoDB TTL-indexed Token Blacklist collection (`expireAfterSeconds: 0`), completely eliminating post-logout session replay attacks.
- **AST Execution Sandboxing**: Regex lexical token filters block unauthorized calls (`require`, `process`, `import os`) before code execution.
- **NoSQL Operator Sanitization**: Recursive request body sanitization neutralizes query injection attacks.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Monaco Editor (`@monaco-editor/react`), Socket.IO Client, Axios, Lucide React, Canvas Confetti |
| **Backend** | Node.js, Express.js, MongoDB, Mongoose ODM, Socket.IO, JWT, Bcrypt.js, express-validator |
| **Code Execution** | Local In-Memory AST-Guarded Sandbox (Node VM & Python) + Judge0 Cloud API Fallback |
| **Testing & Docs** | Playwright, Python-docx, Win32 Word COM, Mocha/Jest suites |

---

## 🚀 Running the Application Locally

### 1. Backend Server
```bash
cd backend
npm install
npm run dev
```
> Server runs on `http://localhost:5000`

### 2. Frontend Client
```bash
cd frontend
npm install
npm run dev
```
> Client runs on `http://localhost:5173`

---

## 📊 Summary of Automated Verification Results

- **Automated Security Penetration Suite (`scratch/test_security.js`)**: **15 / 15 Tests Passed (100%)**
- **Client Storage Scoping & Reset Suite (`scratch/test_storage.js`)**: **100% Passed**
- **WebSocket Round-Trip Latency**: **Sub-45ms average across 100 concurrent rooms**
- **Production Build (`npm run build`)**: **Compiled in 2.60s with 0 errors**
