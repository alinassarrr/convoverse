<img src="./readme/title1.svg"/>

<br><br>

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB
- Slack App (for Slack integration)
- Google Cloud Project (for Gmail & AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/convoverse.git
cd convoverse

# Install dependencies
npm install --prefix server
npm install --prefix client

# Setup environment variables
cp .env.example .env.development
# Edit .env.development with your API keys

# Start the development servers
npm run dev --prefix server  # Backend on port 3000
npm run dev --prefix client  # Frontend on port 3001
```

### Docker Setup

```bash
# Run with Docker Compose
docker-compose up -d

# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

### API Documentation

Access the interactive API documentation at: `http://localhost:3000/api`

## 📚 Technology Stack

| Category | Technologies |
|----------|-------------|
| **Backend** | NestJS, TypeScript, Socket.io |
| **Frontend** | Next.js 15, React 19, Tailwind CSS |
| **Database** | MongoDB, Mongoose |
| **AI/ML** | Google Gemini, Vector Embeddings |
| **Authentication** | JWT, OAuth2 |
| **Testing** | Jest, Supertest |
| **Deployment** | Docker, GitHub Actions |
| **APIs** | Slack API, Gmail API |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📧 Contact

- **Project Link**: [https://github.com/your-username/convoverse](https://github.com/your-username/convoverse)
- **Documentation**: [API Docs](http://localhost:3000/api)
- **Issues**: [GitHub Issues](https://github.com/your-username/convoverse/issues)

---

**ConvoVerse** - Unifying conversations, amplifying productivity with AI 🚀

<br><br>

<!-- project overview -->
<img src="./readme/title2.svg"/>

> **ConvoVerse** is a smart, AI-powered dashboard that unifies Slack and Gmail in one place. It delivers instant summaries, extracts action items, automates replies and scheduling, and enables fast cross-platform search, keeping you organized, responsive, and in control.

<br><br>

<!-- System Design -->
<img src="./readme/title3.svg"/>

## 🏠 System Architecture

### Backend (NestJS + TypeScript)
- **Authentication Module**: JWT-based auth with refresh tokens
- **Integrations Module**: OAuth2 connections for Slack & Gmail APIs  
- **Conversations Module**: Real-time message processing and storage
- **AI Assistant Module**: Google Gemini integration for smart features
- **Summaries Module**: Automated conversation analysis and insights
- **WebSocket Gateway**: Real-time bidirectional communication

### Frontend (Next.js 15 + React 19)
- **Server-Side Rendering**: Optimized performance with SSR
- **Real-time UI**: Socket.io client for live updates
- **Component Architecture**: Modular design with Shadcn/UI
- **State Management**: React Query for server state
- **Responsive Design**: Mobile-first approach with Tailwind CSS

### Database & Storage
- **MongoDB**: Document-based storage for conversations and metadata
- **Vector Embeddings**: AI-powered semantic search capabilities
- **Indexed Collections**: Optimized queries for large datasets

### External Integrations
- **Slack API**: Complete workspace integration
- **Gmail API**: Email conversation management  
- **Google Gemini AI**: Advanced language processing
- **OAuth2 Providers**: Secure third-party authentication

<br><br>

<!-- Project Highlights -->
<img src="./readme/title4.svg"/>

### 🚀 Key Features

- **🤖 AI-Powered Summaries**: Automatically generate intelligent conversation summaries using Google Gemini AI
- **📋 Smart Action Items**: Extract and track action items from conversations across platforms
- **🔗 Multi-Platform Integration**: Seamlessly connect Slack and Gmail in one unified dashboard
- **⚡ Real-time Sync**: Live updates and real-time messaging with WebSocket integration
- **🔍 Advanced Search**: Fast cross-platform search across all your conversations
- **📊 Vector Embeddings**: AI-powered semantic search and content analysis
- **🛡️ Secure Authentication**: JWT-based authentication with refresh token support
- **📱 Responsive Design**: Modern React/Next.js frontend with Tailwind CSS

<br><br>

<!-- Demo -->
<img src="./readme/title5.svg"/>

### Authentication Screens

| Login Page                              | Sign Up Page                          | Integration Setup                     |
| --------------------------------------- | ------------------------------------- | ------------------------------------- |
| ![Landing](./readme/demo/1440x1024.png) | ![fsdaf](./readme/demo/1440x1024.png) | ![fsdaf](./readme/demo/1440x1024.png) |


### Dashboard Screens

| Unified Inbox                           | AI Assistant                          |
| --------------------------------------- | ------------------------------------- |
| ![Landing](./readme/demo/1440x1024.png) | ![fsdaf](./readme/demo/1440x1024.png) |


<br><br>

<!-- Development & Testing -->
<img src="./readme/title6.svg"/>

### 🛠️ Development & Architecture


| Backend Services                        | Database Schema                       | API Testing                           |
| --------------------------------------- | ------------------------------------- | ------------------------------------- |
| ![Landing](./readme/demo/1440x1024.png) | ![fsdaf](./readme/demo/1440x1024.png) | ![fsdaf](./readme/demo/1440x1024.png) |


<br><br>

<!-- Deployment -->
<img src="./readme/title7.svg"/>

### 🚀 API Documentation & Deployment

- **Complete API Documentation**: Comprehensive Swagger/OpenAPI documentation with interactive testing
- **Docker Support**: Containerized deployment with Docker Compose for easy setup
- **Environment Configuration**: Production-ready environment variables and configuration
- **CI/CD Pipeline**: GitHub Actions workflow for automated testing and deployment


| API Documentation                       | Docker Deployment                     | Environment Config                    |
| --------------------------------------- | ------------------------------------- | ------------------------------------- |
| ![Landing](./readme/demo/1440x1024.png) | ![fsdaf](./readme/demo/1440x1024.png) | ![fsdaf](./readme/demo/1440x1024.png) |

<br><br>
