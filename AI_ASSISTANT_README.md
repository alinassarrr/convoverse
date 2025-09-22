# ConvoVerse AI Assistant

## Overview

The ConvoVerse AI Assistant is a smart, context-aware AI that helps users manage and find information across their communication platforms (Slack, Gmail). It provides intelligent answers based on conversation history, summaries, and action items.

## Features

### ✅ Core Functionality
- **Intelligent Query Processing**: Understands user intent and context
- **Multi-source Search**: Searches across messages, summaries, and action items
- **Semantic Search**: Uses vector embeddings for better search relevance
- **Conversation Memory**: Maintains context across conversation sessions
- **Security**: Built-in prompt injection protection and response sanitization
- **Real-time Responses**: Fast, streaming-like responses with confidence scoring

### ✅ Smart Capabilities
- **Intent Recognition**: Automatically detects query types (questions, searches, actions, summaries)
- **Context Building**: Builds relevant context from multiple data sources
- **Follow-up Handling**: Understands follow-up questions and conversation flow
- **Action Item Tracking**: Finds and tracks tasks, deadlines, and action items
- **Summary Generation**: Provides conversation summaries and insights

## Architecture

### Backend Components
```
ai-assistant/
├── controllers/
│   └── ai-assistant.controller.ts    # REST API endpoints
├── services/
│   ├── ai-assistant.service.ts       # Main AI logic
│   ├── vector-search.service.ts      # Semantic search
│   ├── context-builder.service.ts    # Context generation
│   ├── conversation-memory.service.ts # Session management
│   └── security.service.ts           # Security & validation
├── dto/
│   └── assistant.dto.ts              # API contracts
└── config/
    └── assistant.config.ts           # Configuration
```

### Frontend Components
```
client/src/
├── app/(dashboard)/assistant/
│   └── page.tsx                      # AI Assistant UI
├── lib/
│   └── ai-assistant.ts               # Service layer
└── components/ui/                    # UI components
```

## API Endpoints

### POST /ai-assistant/ask
Ask the AI Assistant a question.

**Request:**
```json
{
  "query": "What are my upcoming deadlines?",
  "sessionId": "optional-session-id"
}
```

**Response:**
```json
{
  "answer": "Based on your conversations, you have 2 upcoming deadlines...",
  "sources": [
    {
      "type": "action",
      "content": "Complete project proposal",
      "relevance": 0.95,
      "metadata": { "dueDate": "2025-01-25", "importance": "high" }
    }
  ],
  "confidence": 0.85,
  "reasoning": "Found relevant action items with high confidence",
  "sessionId": "conv_abc123"
}
```

### GET /ai-assistant/search/:query
Perform semantic search across content.

**Parameters:**
- `conversationId` (optional): Limit to specific conversation
- `provider` (optional): Filter by platform (slack, gmail)
- `limit` (optional): Max results (default: 10)
- `sourceTypes` (optional): Comma-separated types (message,summary,action)

## Usage Examples

### Basic Questions
```
"What are my upcoming deadlines?"
"Show me recent project discussions"
"What action items are assigned to me?"
```

### Contextual Queries
```
"What did we decide about the budget?"
"When is the next team sync?"
"Who is working on the API integration?"
```

### Follow-up Questions
```
User: "Tell me about the project timeline"
AI: "The project has 3 phases scheduled over 6 months..."
User: "When is phase 2 due?"  // AI understands the context
```

## Configuration

### Environment Variables
```env
# Required
GEMINI_API_KEY=your-gemini-api-key
MONGO_URL=mongodb://localhost:27017/convoverse
JWT_SECRET=your-jwt-secret

# Optional
BASE_URL=http://localhost:3000
NODE_ENV=development
```

### AI Assistant Config
Located in `server/src/modules/ai-assistant/config/assistant.config.ts`:

```typescript
export const ASSISTANT_CONFIG = {
  MAX_SEARCH_RESULTS: 20,
  MIN_RELEVANCE_SCORE: 0.15,
  CONTEXT_WINDOW_SIZE: 8000,
  MAX_QUERY_LENGTH: 500,
  MIN_CONFIDENCE_THRESHOLD: 0.4,
  MODEL_TEMPERATURE: 0.3,
  MAX_TOKENS: 1500,
};
```

## Development

### Running the AI Assistant

1. **Start Backend:**
```bash
cd server
npm run start:dev
```

2. **Start Frontend:**
```bash
cd client  
npm run dev
```

3. **Test API:**
```bash
curl -X POST http://localhost:3000/ai-assistant/ask \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt-token>" \
  -d '{"query": "What are my tasks?"}'
```

### Adding New Features

1. **New Query Types:**
   - Update `analyzeQuery()` in `ai-assistant.service.ts`
   - Add intent patterns in `extractIntent()`

2. **New Data Sources:**
   - Extend `vector-search.service.ts`
   - Add new search methods
   - Update `SearchResult` interface

3. **Custom Prompts:**
   - Modify `ASSISTANT_PROMPTS` in config
   - Adjust system prompt for different behaviors

## Security

### Built-in Protections
- **Prompt Injection Prevention**: Blocks malicious queries
- **Response Sanitization**: Removes sensitive information
- **Authentication Required**: All endpoints require valid JWT
- **Input Validation**: Validates query length and format
- **Rate Limiting**: Prevents abuse (configurable)

### Security Patterns
The security service blocks:
- Instructions to ignore previous instructions
- Database commands (DELETE, DROP, TRUNCATE)
- Requests for sensitive data (passwords, tokens, credentials)
- Role manipulation attempts

## Performance

### Optimizations
- **Vector Search**: Fast semantic search with cosine similarity
- **Result Caching**: Context and embedding caching
- **Session Management**: Efficient conversation memory
- **Relevance Scoring**: Multi-factor relevance calculation
- **Source Weighting**: Prioritizes important content types

### Monitoring
- Detailed logging for debugging
- Confidence scoring for response quality
- Performance metrics tracking
- Error handling and recovery

## Troubleshooting

### Common Issues

1. **No AI Responses:**
   - Check GEMINI_API_KEY is set
   - Verify MongoDB connection
   - Check server logs for errors

2. **Low Relevance Results:**
   - Lower `MIN_RELEVANCE_SCORE` in config
   - Check if embeddings are generated for content
   - Verify search query format

3. **Authentication Errors:**
   - Ensure valid JWT token
   - Check token expiration
   - Verify user permissions

### Debug Mode
Enable debug logging:
```env
LOG_LEVEL=debug
```

View logs:
```bash
# Backend logs
cd server && npm run start:dev

# Check AI assistant specific logs
grep "AiAssistantService" logs/app.log
```

## Future Enhancements

### Planned Features
- **Multi-language Support**: Support for different languages
- **Voice Input**: Voice-to-text query processing  
- **Export Functionality**: Export conversations and summaries
- **Advanced Analytics**: Usage patterns and insights
- **Custom Workflows**: User-defined automation rules
- **Integration Webhooks**: Real-time data sync improvements

### Architecture Improvements
- **Caching Layer**: Redis-based response caching
- **Load Balancing**: Multiple AI service instances
- **Streaming Responses**: Real-time response streaming
- **Background Processing**: Async query processing
- **Advanced ML**: Custom embeddings and ranking models

## Support

For issues or questions:
1. Check this documentation
2. Review server logs for errors
3. Test with simple queries first
4. Verify environment configuration
5. Check API endpoint responses

---

**Note**: The AI Assistant requires proper environment setup and data seeding to work effectively. Make sure to have some conversation data in your database for meaningful responses.
