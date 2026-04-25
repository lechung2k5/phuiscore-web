# Phủi Score - Local Football Live Data Platform

Phủi Score is a comprehensive platform designed to bring professional-grade data tracking and live streaming to local football tournaments. Built with a focus on performance, scalability, and code reusability.

## 🚀 Tech Stack

- **Frontend:** Next.js (App Router), Tamagui (UI Suite), Lucide Icons.
- **Backend:** Node.js, Express (or NestJS).
- **Database:** AWS DynamoDB (NoSQL).
- **Architecture:** Monorepo (Turborepo).
- **DevOps:** Docker, AWS.
- **Tools:** Axios, Cheerio/Puppeteer (for Crawler).

## ✨ Key Features

- **Real-time Scoreboard:** Live updates for ongoing local matches.
- **Automated Data Crawler:** Automatically gathers match schedules, results, and standings from various football sources.
- **Live Stream Integration:** Seamlessly embed live match feeds from social media platforms (Facebook, YouTube, TikTok).
- **Tournament Management:** Flexible data structures to support various league formats and knockout stages.
- **Cross-platform Ready:** Shared component library using Tamagui, ready for React Native mobile app expansion.

## 🏗️ Architecture

The project uses a **Monorepo** structure managed by **Turborepo**:
- `apps/web`: The Next.js web application.
- `apps/mobile`: (In-progress) React Native app.
- `packages/ui`: Shared UI components powered by Tamagui.
- `packages/core`: Shared business logic, API clients, and utilities.

## 🛠️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/lechung2k5/phui-score.git](https://github.com/lechung2k5/phui-score.git)
   cd phui-score