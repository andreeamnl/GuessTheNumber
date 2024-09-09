# Guess the Number Multiplayer Tournament

**Andreea Manole**  
**FAF-212, Distributed Systems Course**

## Application Suitability Assessment

Why is the "Guess the Number" Multiplayer Tournament a good candidate for microservices?

Think about the different parts of the game — player login, matchmaking, game rules, leaderboards — all these things have unique functions. Doesn’t it make sense to manage each one separately? Microservices allow me to build and update them individually without involving the entire system.

What happens when a tournament gets busy? Not all parts of the game will experience the same traffic. Matchmaking and game rules might need to handle way more requests. Microservices let those parts scale up to meet demand while others stay steady.

And what if you need to update the game? Wouldn’t it be easier if you could fix one part, like the login system, without affecting everything else? Microservices make this possible, allowing you to fix bugs, add features smoothly, without downtime.

### Real-World Examples

1. **Fortnite**

   - Fortnite uses microservices to handle matchmaking, game status, and player stats. This setup helps manage a large number of players and frequent updates smoothly.

2. **Minecraft**

   - Minecraft uses microservices to manage game worlds, player interactions, and server connections, making it easier to scale and maintain the game.

3. **PUBG**
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

### Caching and Queues

**Service A** uses a cache system to quickly retrieve frequently accessed data, such as player statistics and room status, which speeds up responses and reduces database load. This improves performance and handles high traffic more efficiently, ensuring a smoother user experience.

Additionally, queues help manage the flow of requests for room creation and matchmaking by temporarily storing them until they can be processed. This prevents overloading the system, improves scalability, and enhances responsiveness during peak demand (if there will ever be any for my poor app).

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
- **Orchestration**: Kubernetes for managing container services, to ensure load balancing, automatic scaling.

---

## Resources

1. [Monoliths vs. Microservices in Gaming Architecture](https://www.reddit.com/r/gamedev/comments/xdurgt/monoliths_vs_microservices_in_gaming_architecture/)
2. [Building a Microservices Example Game with Distributed Messaging](https://blog.risingstack.com/building-a-microservices-example-game-with-distributed-messaging/)
3. [Microservices Examples](https://blog.dreamfactory.com/microservices-examples)
4. [Docker Curriculum](https://docker-curriculum.com/)
5. [ELI5: What is Docker and How Do You Use It?](https://www.reddit.com/r/Frontend/comments/yvem0t/eli5_what_is_docker_and_how_do_you_use_it/)
6. [Distributed Game Architectures](http://www.dbs.ifi.lmu.de/cms/VO_Managing_Massive_Multiplayer_Online_Games)  
   [Chapter 3: Distributed Game Architectures (PDF)](https://www.dbs.ifi.lmu.de/Lehre/mmmo/sose17/slides/MMMO-3-Network.pdf)
