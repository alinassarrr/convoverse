<img src="./readme/title1.svg"/>
<br><br>
<!-- project overview -->
<img src="./readme/title2.svg"/>

> **ConvoVerse** is an AI-powered solution that brings all your conversations in one place.
It unifies your Slack messages and Gmail threads into a single, intelligent dashboard, so you never waste time jumping between apps.

>  The Problem  
Important conversations are scattered, tasks get buried, and deadlines slip through the cracks.

> ✅ The Solution  
**ConvoVerse** acts like your second brain. It automatically summarizes discussions, identifies action items, and surfaces the context you need, keeping your team aligned, making decisions faster, and ensuring critical information is always visible.  


<br><br>

<!-- System Design -->
<img src="./readme/title3.svg"/>

## ER Diagram
<img src="./readme/demo/ER.png"/>  

## System Architecture
<img src="./readme/demo/component.png"/>

## N8N Automation Workflow
### Slack  
<img src="./readme/demo/Slack-n8n.png"/>  

### Gmail  
<img src="./readme/demo/Gmail-n8n.png"/>

<br><br>

<!-- Project Highlights -->
<img src="./readme/title4.svg"/>

## ConvoVerse Key Features  

-  **One Hub for All Conversations**  
Bring Slack, Gmail, and more into a single hub. Connect your account with just one click and enjoy seamless, real-time syncing across all platforms.  

-  **AI Side Assistant (Per Conversation)**  
Every conversation comes with its own AI-powered sidekick that summarizes what’s happening, highlights key points, and extracts tasks, events, and actions directly from the chat.  

-  **Global AI Assistant – Your Second Brain**  
Go beyond single conversations. Ask the global assistant about tasks, deadlines, or decisions across *all* your platforms no matter where the conversation started.  

-  **Real-Time Replying**  
Don’t just read, act. Reply to messages directly from ConvoVerse as if you were replying on Slack, Gmail, or any connected platform, making collaboration seamless and natural.  

<p align="center">
  <img src="./readme/demo/features.png" width="600"/>
</p>

<br><br>

<!-- Demo -->
<img src="./readme/title5.svg"/>

### Landing Screen

| Landing Screen                          |
| --------------------------------------- |
| ![Landing](./readme/demo/LandingPage.png) |


### Login/Signup Screens

| Login screen                            | Signup screen                       |
| --------------------------------------- | ------------------------------------- |
| ![Landing](./readme/demo/Login.png) | ![fsdaf](./readme/demo/Signup.png) |


### Live Integration Demo
| Integration               |       
| ----------------------------------- | 
| ![Landing](./readme/int-live.gif) |

### Unified Inbox Screen
| Unified Inbox Screen                       |
| --------------------------------------- |
| ![Landing](./readme/demo/Unified-Inbox.png) |

### Live Conversation Demo
| Live Chat with Slack              |       
| ----------------------------------- | 
| ![Landing](./readme/inbox-live.gif) |

### Slack Conversations Screen                  
| Slack Chat Screen                       |  Gmail Chat Screen                      |
| --------------------------------------- | ------------------------------------- |
| ![Landing](./readme/demo/Channel.png)   | ![Landing](./readme/demo/Mail.png) |

### Conversation AI Assistant Screen                  
<p align="center">
  <a href="./readme/Chat-Summary.png">
    <img src="./readme/Chat-Summary.png" width="250"/>
  </a>
  &nbsp;&nbsp;&nbsp; <!-- optional spacing between images -->
  <a href="./readme/Chat-Actions.png">
    <img src="./readme/Chat-Actions.png" width="250"/>
  </a>
</p>




### Live AI Assistant Demo
| Live Chat with AI assistant              |       
| ----------------------------------- | 
| ![Landing](./readme/ai-live.gif) |

<br><br>

<!-- Development & Testing -->
<img src="./readme/title6.svg"/>

### Services, Validation, and Testing

<p align="center">
  <a href="./readme/demo/service.png">
    <img src="./readme/demo/service.png" width="250"/>
  </a>
  &nbsp;&nbsp;&nbsp;
  <a href="./readme/demo/validation.png">
    <img src="./readme/demo/validation.png" width="250"/>
  </a>
  &nbsp;&nbsp;&nbsp;
  <a href="./readme/demo/test.png">
    <img src="./readme/demo/test.png" width="250"/>
  </a>
</p>




<!-- AI Workflow -->
## 🧠 AI Workflow -> Two-Agent System  

| AI Agents Workflow |
| ------------------------------------- |
|<img src="./readme/demo/ai-flow.png"/> |

<br>
ConvoVerse’s AI runs on two powerful agents:  
one that keeps conversations summarized automatically, and another that answers your questions across all platforms.  

---

### Agent 1: Conversation Summarization (Automatic)  

This agent works in the background, making sure conversations never get out of hand.  

**How it works:**  
- **Triggers:**  
  - Every **5–10 minutes**  
  - When a conversation passes a message threshold  
  - Or when old messages have been waiting too long  
- **Steps:**  
  1. Monitors conversations across Slack, Gmail, and more  
  2. Collects new messages and enriches them with user info  
  3. Builds context from past summaries and conversation history  
  4. Uses AI (Gemini) to:  
     - Create a fresh **summary**  
     - Extract **action items** (tasks, deadlines, events)  
  5. Saves everything to the database and marks messages as summarized  
  6. Loops back to monitor again  

**Output:** Always up-to-date summaries with clear action lists.  

---

### Agent 2: Query Response (On Demand)  

This is the agent you talk to directly — your personal conversation assistant.  

**How it works:**  
- **Trigger:** When you ask a question through the interface  
- **Steps:**  
  1. Receives and secures the query (filters unsafe inputs)  
  2. Understands intent (question, task lookup, summary request, etc.)  
  3. Converts your query into embeddings and searches across:  
     - Saved Messages
     - Previously Generated Summaries and Actions
  4. Builds context
  5. Generates a natural answer with references
  6. Returns the response and keeps the session open for follow-ups  

**Output:** Fast, clear answers powered by your entire workspace.  

---

### Key Technical Features  

- **Vector Search & Embeddings** – Gemini embeddings + cosine similarity across messages, summaries, and actions  
- **Smart Triggers** – Message count + time-based checks prevent missed updates  
- **Context Continuity** – **RAG** (Retrieval Augmented Generation) ensures summaries connect smoothly over time  
- **Multi-Platform Support** – Works across Slack, Gmail, and more, with a unified data model  

---

### Why It Matters  

Together, these agents act as your **conversation brain**:  
- Summaries + actions delivered automatically  
- No tasks or deadlines slip through the cracks  
- Instant answers, no matter where the info lives  
- Smarter over time with continuous context building  
---
 <br>
 
### Linear Workflow  
To keep development structured and transparent, every feature and bug fix was tracked through **Linear** and linked directly with GitHub:  

-  **Branching:** Each ticket started with a dedicated Git branch, keeping changes isolated and organized.  
-  **Commits:** Code was committed regularly with clear, descriptive messages referencing the Linear ticket.  
-  **Collaboration:** Changes were pushed to the remote repository, ensuring the team stayed in sync.  
-  **Pull Requests:** A PR was opened for review, enabling feedback, discussion, and quality checks.  
   **Integration with Linear:** PRs were linked to their tickets, automatically updating progress and status.  
-  **Done:** Once merged, the ticket was moved to **“Done”**, completing the development cycle smoothly.  

| Linear Workflow |
| ------------------------------------- |
| ![Linear Placeholder](./readme/demo/Linear.png) |



<br><br>

<!-- Deployment -->
<img src="./readme/title7.svg"/>

### Swagger API Documentation  

<a href="https://alinassarrr.github.io/convoverse/#/">Access the full API documentation here</a>  

The Swagger UI provides an **interactive playground** for developers:  
-  Explore available endpoints with detailed descriptions.  
-  Test requests and view real-time responses directly in the browser.  
-  Understand required parameters, authentication, and request/response formats.  
-  Speeds up integration and ensures consistent use of APIs across the project.  

| GET Conversations API                 | POST Ask AI Assistant API             | GET Latest Summary API                |
| --------------------------------------- | ------------------------------------- | ------------------------------------- |
| ![Landing](./readme/demo/api2.png)       | ![fsdaf](./readme/demo/api3.png) | ![fsdaf](./readme/demo/api1.png)     |

<br><br>
