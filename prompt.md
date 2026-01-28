## Role
You are a **Senior Software Architect & Full-stack Developer** specializing in **lightweight, cross-platform desktop application development**.

## Project Context
I want to build a **desktop application for Windows (MVP)**, with an architecture that is **future-proof for macOS and Linux**.

The application combines:
- A **Desktop Pet system** (virtual pet rendered as a screen overlay)
- A **Productivity & Habit Management system**

## Project Name
**PetFocus** (working title — feel free to suggest a better name if appropriate)

---

## Non-Negotiable Core Requirements

### 1. Performance (Critical)
- The app must be **extremely lightweight**
- Minimal **RAM and CPU usage**
- Designed to **run continuously in the background**

### 2. Scalability & Portability
- Clean architecture that supports **multi-OS builds** (Windows → macOS/Linux)
- Clear separation of concerns to avoid platform lock-in

### 3. UI / UX
- Modern UI with **smooth animations**
- Support for:
  - **Frameless windows**
  - **Transparent backgrounds**
  - **Always-on-top overlays**
- The pet must appear as if it is **walking directly on the desktop wallpaper**

---

## Feature Specifications

### 1. Desktop Pet Engine

#### Visual
- Render a character (existing **cat assets**) as a **desktop overlay**
- Pet can freely move across the screen

#### Interaction & Physics
- **Left click (poke):** Pet reacts (animation / sound)
- **Drag & Drop:** User can grab and reposition the pet
- **Right click:** Open a **radial menu or elegant dropdown**, including:
  - Feed pet
  - Open main dashboard
  - Build / enter home base

#### Autonomous Behavior
- Idle animations when not interacted with:
  - Walking
  - Sleeping
  - Grooming
- Behavior should feel **alive, not scripted**

---

### 2. Productivity System

#### Focus Mode (Overlay Widget)
- Always-on-top overlay displaying:
  - Countdown timer (Pomodoro or custom)
- Smart reminders:
  - Break reminders
  - Posture reminders
  - Actual focused work time tracking

#### Task Management
- Lightweight todo list
- Simple completion tracking

#### Scheduler
- Calendar events
- Alarms / reminders

#### Subscription Manager
- Track recurring subscriptions (e.g., Netflix, Spotify)
- Notify before payment due dates

---

## Technical Assignment

### 1. Tech Stack Recommendation
Propose the **best tech stack** that satisfies:
- Ultra-lightweight runtime
- Cross-platform desktop support

Candidates to evaluate (not limited to):
- **Tauri + React / Vue / Svelte (Rust backend)**
- **Flutter Desktop**
- **Electron** (only if you can justify extreme optimization)

Explain **why** you chose the stack and the trade-offs.

---

### 2. Architecture Design
- Provide a **high-level architecture diagram**
- Propose a **module / folder structure**
- Clearly separate:
  - **Pet Overlay Engine**
  - **Main Dashboard / Productivity System**
- Ensure pet rendering does **not degrade overall app performance**

---

### 3. MVP Implementation Plan
- Step-by-step roadmap for building the MVP
- Focus on:
  - Core pet interaction
  - Basic focus mode
  - Performance safety

---

### 4. Core Code Examples (Critical)
Provide **concise but real** code examples for the hardest parts:

1. Creating a **transparent, frameless overlay window** on Windows
2. Handling **click-through behavior**:
   - Mouse clicks pass through transparent areas
   - Only the pet captures interaction
3. A basic **state machine** for pet behavior:
   - `Idle → Walk → Dragged`

---

## Expected Output Style
- Architecture-first thinking
- Clear technical reasoning
- Practical, production-ready decisions
- Avoid theoretical or purely academic explanations
