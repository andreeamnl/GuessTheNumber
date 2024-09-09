# Guess the Number Multiplayer Tournament

**Andreea Manole**  
**FAF-212, Distributed Systems Course**

## Application Suitability Assessment

The "Guess the Number" Multiplayer Tournament is a great fit for using microservices because:

- **Complex Functionality**: The game includes several different parts, such as player login, matchmaking, game rules, and leaderboards. Each part does something unique and can be developed and managed on its own.

- **Scalability**: Different parts of the game will handle different amounts of work. For example, during busy times like tournaments, the parts that handle matchmaking and game rules will be in high demand. Microservices allow each part to grow or shrink as needed to manage this demand.

- **Modularity**: With microservices, you can update or change one part of the game (like the login system or game rules) without affecting the others. This makes it easier to fix problems and add new features quickly.

### Real-World Examples

1. **Fortnite**

   - Fortnite uses microservices to handle matchmaking, game status, and player stats. This setup helps manage a large number of players and frequent updates smoothly.

2. **Minecraft**

   - Minecraft uses microservices to manage game worlds, player interactions, and server connections, making it easier to scale and maintain the game.

3. **PUBG: Battlegrounds**
   - PUBG uses microservices to handle matchmaking, player data, and game sessions, which helps manage the high demands of its players and real-time gameplay.

## Service Boundaries

### Architecture Diagram

![Diagram](Diagrams/PAD1.jpg)

### Service Definitions

1. **Authentication and Matchmaking Service (Service A)**

   - **Purpose**: Manages player authentication, matchmaking, room management, and player statistics.
   - **Technology Stack**: Python with Flask, SQLite, Redis.

2. **Game Logic and Leaderboard Service (Service B)**

   - **Purpose**: Handles core game mechanics, number generation, guess validation, scoring, and leaderboard management.
   - **Technology Stack**: Python with Flask, SQLite.

3. **API Gateway**
   - **Purpose**: Routes client requests to appropriate services.
   - **Technology Stack**: Node.js with Express Gateway.

## Technology Stack and Communication Patterns

### Service A (Authentication & Matchmaking)

- **Programming Language/Framework**: Python with Flask
- **Database**: SQLite
- **Caching**: Redis
- **Communication Pattern**: RESTful API

### Service B (Game Logic & Leaderboard)

- **Programming Language/Framework**: Python with Flask
- **Database**: SQLite
- **Caching**: Redis
- **Communication Pattern**: RESTful API, WebSocket for real-time multiplayer play

### API Gateway

- **Programming Language/Framework**: Node.js with Express Gateway
- **Communication Pattern**: Request routing

## Data Management

### Service A Endpoints

- **POST /register**
  - **Request**: `{ "username": "string", "password": "string" }`
  - **Response**: `{ "message": "User registered successfully" }`
- **POST /login**
  - **Request**: `{ "username": "string", "password": "string" }`
  - **Response**: `{ "token": "jwt-token" }`
- **POST /logout**
  - **Request**: `{ "token": "jwt-token" }`
  - **Response**: `{ "message": "User logged out successfully" }`
- **POST /matchmake**
  - **Request**: `{ "token": "jwt-token" }`
  - **Response**: `{ "roomId": "string", "role": "string" }`
- **GET /room-status**
  - **Request**: `{ "roomId": "string" }`
  - **Response**: `{ "status": "string", "players": [{ "playerId": "string", "role": "string" }] }`
- **POST /players/{playerId}/update-stats**
  - **Request**: `{ "points": "integer" }`
  - **Response**: `{ "message": "Player stats updated successfully" }`

### Service B Endpoints

- **POST /start-game**
  - **Request**: `{ "roomId": "string", "number": "integer" }`
  - **Response**: `{ "message": "Game started", "status": "waiting for guesses" }`
- **POST /submit-guess**
  - **Request**: `{ "roomId": "string", "guess": "integer" }`
  - **Response**: `{ "result": "string", "feedback": "string" }`
- **GET /game/{roomId}/state**
  - **Request**: `{ "roomId": "string" }`
  - **Response**: `{ "status": "string", "currentTurn": "string", "guesserAttempts": "integer" }`
- **GET /leaderboard**
  - **Response**: `{ "topPlayers": [{ "playerId": "string", "points": "integer" }] }`

## Deployment and Scaling

### Deployment

- **Containers**: Docker to containerize services.
- **Orchestration**: Kubernetes for managing container services, ensuring load balancing, automatic scaling.
