# 🏛️ Democracy Engine

**Democracy Engine** is an educational, swipe-based card game framework (inspired by *Reigns*) designed specifically for high school classrooms to teach political science, civics, and the delicate balance of power.

This project was built to help students explore the complexities of political administration by making tough choices that affect the 4 Pillars of State Power.

![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)

---

## ✨ Features

- **🃏 Swipe-Based Gameplay (Tinder-style):** Players make binary policy decisions by swiping Left or Right, balancing state pillars.
- **⚙️ Custom Game Editor:** Teachers or students can create, edit, and publish their own custom scenarios, questions, and outcomes.
- **⚖️ The 4 Pillars of Power:** By default configured for Thai Politics:
  - 🏛️ Legislative (นิติบัญญัติ)
  - 💼 Executive (บริหาร)
  - ⚖️ Judiciary (ตุลาการ)
  - 🪖 Military/Popular Support (กองทัพ/มวลชน)
- **🛟 Dynamic Rescue Mechanism:** A built-in "Game Changer" card injection system that gives players a chance to bounce back when a pillar drops too low or goes too high.
- **📊 Teacher Dashboard:** A real-time analytics dashboard tracking total plays, card win rates (A vs B), and highlighting the most "controversial" cards for classroom debriefing.
- **🖼️ Automated Image Hosting:** Integrated ImgBB API for lightweight, cloud-based image storage.

---

## 🚀 Getting Started

This is a [Next.js](https://nextjs.org) application. It supports dual databases: local **SQLite** for development and **Neon PostgreSQL** for production.

### Prerequisites
- Node.js 18.x or later
- npm or yarn

### Installation & Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/cutoutppp/Democracy-Engine.git
   cd Democracy-Engine
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the local development server:**
   ```bash
   npm run dev
   ```
   *The local server automatically uses `better-sqlite3` and generates a local database (`democracy_engine.db`). No extra setup is required for local testing!*

4. **Open the App:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Built With
- **[Next.js](https://nextjs.org)** - The React Framework (App Router)
- **[Tailwind CSS](https://tailwindcss.com/)** - Styling and UI layout
- **[Framer Motion](https://www.framer.com/motion/)** - Smooth card swipe animations
- **[Neon Serverless Postgres](https://neon.tech)** - Production Database
- **[Better-SQLite3](https://github.com/WiseLibs/better-sqlite3)** - Local Development Database
- **[ImgBB API](https://imgbb.com/)** - Cloud Image Hosting

---

## 👩‍🏫 Classroom Usage (For Teachers)

1. **Create a Game:** Go to the Editor (`/editor`), set a password, and build your cards.
2. **Publish:** Set your game to "Published" to allow students to select it from the main menu.
3. **Analyze:** During or after the session, open the **Dashboard** inside the Editor Settings to view the "Most Controversial Cards" and use them as discussion prompts for Debriefing!

---

*This project was developed to make civics education interactive, engaging, and critically challenging.*
