# Guess the Number Multiplayer Tournament

**Andreea Manole**  
**FAF-212, Distributed Systems Course**

## Application Suitability Assessment

Why is the "Guess the Number" Multiplayer Tournament a good candidate for microservices?

Think about the different parts of the game — player login, matchmaking, game rules, leaderboards — all these things have unique functions. Doesn’t it make sense to manage each one separately? Microservices allow me to build and update them individually without involving the entire system.

What happens when a tournament gets busy? Not all parts of the game will experience the same traffic. Matchmaking and game rules might need to handle way more requests. Microservices let those parts scale up to meet demand while others stay steady.

And what if you need to update the game? Wouldn’t it be easier if you could fix one part, like the login system, without affecting everything else? Microservices make this possible, allowing you to fix bugs and add features smoothly, without downtime.

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

Both Service A and Service B share a cache to quickly access player stats and room info. This keeps data consistent and speeds up responses. Queues handle requests for creating rooms and matchmaking, preventing system overload and making the app run smoothly.

### Endpoint Access Order

1. Start by registering a new user using the `POST /accounts/api/users` endpoint to create an account.
2. Next, log in the user with the `POST /accounts/api/users/login` endpoint to authenticate their session.
3. Once logged in, the user can start a game using the `POST /game/start-game/:user_id` endpoint.
4. After the game has started, the user can make guesses with the `POST /game/guess/:game_id` endpoint to participate in the gameplay.

### Service A (Accounts) Endpoints

- **POST /accounts/api/users** (Register a user)

  - **Request**:
    ```json
    {
      "name": "john_doe",
      "password": "securepassword"
    }
    ```
  - **Response**:
    ```json
    {
      "message": "User registered successfully"
    }
    ```

- **POST /accounts/api/users/login** (Login a user)

  - **Request**:
    ```json
    {
      "name": "john_doe",
      "password": "securepassword"
    }
    ```
  - **Response**:
    ```json
    {
      "message": "Login successful",
      "user_id": 1
    }
    ```

- **GET /accounts/api/users/:user_id** (Get user info)

  - **Response**:
    ```json
    {
      "id": 1,
      "name": "john_doe"
    }
    ```

- **DELETE /accounts/api/users/:user_id** (Delete user)

  - **Response**:
    ```json
    {
      "message": "User deleted successfully"
    }
    ```

- **GET /accounts/api/users** (Get all users)
  - **Response**:
    ```json
    [
      {
        "id": 1,
        "name": "john_doe"
      }
    ]
    ```

### Service B (Game Logic) Endpoints

- **POST /game/start-game/:user_id** (Start a game)

  - **Request**:
    ```json
    {
      "target_number": 42
    }
    ```
  - **Response**:
    ```json
    {
      "message": "Game started!",
      "game_id": 123,
      "player_scores": {
        "1": {
          "attempts": 0,
          "target_number": 42
        }
      }
    }
    ```

- **POST /game/guess/:game_id** (Make a guess in a game)

  - **Request**:
    ```json
    {
      "user_id": 1,
      "guess": 35
    }
    ```
  - **Response**:
    ```json
    {
      "message": "Higher!",
      "attempts": 1
    }
    ```

- **GET /game/status/:game_id** (Get the status of the game)

  - **Response**:
    ```json
    {
      "game_id": 123,
      "status": "in_progress",
      "players_scores": {
        "1": {
          "attempts": 1,
          "target_number": 42
        }
      }
    }
    ```

- **GET /game/status** (Health check)
  - **Response**:
    ```json
    {
      "status": "Service is running",
      "service": "Guess The Number Game Service",
      "version": "1.0.0"
    }
    ```

### Improved Architecture Diagram

![Improved Diagram](Diagrams/PAD2.drawio.png)

## Improvements Explained

The updated architecture in **PAD2.png** includes several important enhancements:

1. **Data Warehouse**:

   - **Purpose**: Centralizes data storage, allowing for efficient querying and analysis of player data, game statistics, and overall system performance. This supports better decision-making and reporting capabilities, as well as historical data analysis for future improvements.

2. **ELK Stack (Elasticsearch, Logstash, Kibana)**:

   - **Purpose**: Implements powerful logging and monitoring solutions. Elasticsearch allows for efficient storage and retrieval of logs, Logstash processes and ingests log data from various sources, and Kibana provides a user-friendly interface for visualizing and analyzing this data. This stack enhances troubleshooting, performance monitoring, and provides insights into user behavior and system issues.

3. **Grafana**:

   - **Purpose**: Integrates with the ELK stack to provide advanced monitoring and visualization capabilities. Grafana enables the creation of custom dashboards to monitor key performance indicators (KPIs) in real-time, making it easier to detect anomalies and optimize system performance.

4. **Prometheus**:
   - **Purpose**: Acts as a monitoring tool that collects metrics from the various services. This allows for alerting based on defined thresholds, enhancing operational efficiency and ensuring that the system can proactively handle issues before they impact users.

Together, these additions improve the overall architecture by enabling better data handling, robust monitoring, and enhanced insights into the application's performance and usage patterns. This not only enhances user experience but also supports ongoing development and maintenance efforts.

## Deployment and Scaling

### Deployment

- **Containers**: Docker to containerize services.
- **Orchestration**: Docker Compose for managing container services, to ensure load balancing, and automatic scaling.

```bash
docker-compose down
docker-compose up --build
```

---

## Resources

1. [Monoliths vs. Microservices in Gaming Architecture](https://www.reddit.com/r/gamedev/comments/xdurgt/monoliths_vs_microservices_in_gaming_architecture/)
2. [Building a Microservices Example Game with Distributed Messaging](https://blog.risingstack.com/building-a-microservices-example-game-with-distributed-messaging/)
3. [Microservices Examples](https://blog.dreamfactory.com/microservices-examples)
4. [Docker Curriculum](https://docker-curriculum.com/)
5. [ELI5: What is Docker and How Do You Use It?](https://www.reddit.com/r/Frontend/comments/yvem0t/eli5_what_is_docker_and_how_do_you_use_it/)
6. [Distributed Game Architectures](http://www.dbs.ifi.lmu.de/cms/VO_Managing_Massive_Multiplayer_Online_Games)
   [Chapter 3: Distributed Game Architectures (PDF)](https://www.dbs.ifi.lmu.de/Lehre/mmmo/sose17/slides/MMMO-3-Network.pdf)

```

```
