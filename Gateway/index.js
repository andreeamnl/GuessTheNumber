const express = require('express');
const axios = require('axios');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 5004;

const limiter = rateLimit({
    windowMs: 5 * 1000, // 5 seconds
    max: 2, // Maximum 2 requests per window
    message: 'Too many requests!',
});
app.use(limiter);

const ACCOUNTS_SERVICE_URL = process.env.ACCOUNTS_SERVICE_URL || 'http://accounts_service:5001';
const GAME_SERVICE_URL = process.env.GAME_SERVICE_URL || 'http://game_service:5002';

app.post('/accounts/sign-up', async (req, res) => {
    try {
        const { data } = await axios.post(`${ACCOUNTS_SERVICE_URL}/api/users`, req.body);
        res.status(201).json(data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ msg: error.message });
    }
});

app.post('/accounts/login', async (req, res) => {
    try {
        const { data } = await axios.post(`${ACCOUNTS_SERVICE_URL}/api/users/login`, req.body);
        res.status(200).json(data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ msg: error.message });
    }
});

app.post('/game/start/:user_id', async (req, res) => {
    try {
        const { data } = await axios.post(`${GAME_SERVICE_URL}/start-game/${req.params.user_id}`, req.body);
        res.status(201).json(data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ msg: error.message });
    }
});

app.post('/game/guess/:game_id', async (req, res) => {
    try {
        const { data } = await axios.post(`${GAME_SERVICE_URL}/guess/${req.params.game_id}`, req.body);
        res.status(200).json(data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ msg: error.message });
    }
});

// Route for getting the game status (Game Service)
app.get('/game/status/:game_id', async (req, res) => {
    try {
        const { data } = await axios.get(`${GAME_SERVICE_URL}/game/status/${req.params.game_id}`);
        res.status(200).json(data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ msg: error.message });
    }
});

// Proxy middleware for accounts and game services
app.use('/accounts', createProxyMiddleware({
    target: ACCOUNTS_SERVICE_URL,
    changeOrigin: true,
}));

app.use('/game', createProxyMiddleware({
    target: GAME_SERVICE_URL,
    changeOrigin: true,
}));

app.get('/service-status', async (req, res) => {
    try {
        const accountsStatus = await axios.get(`${ACCOUNTS_SERVICE_URL}/status`);
        const gameStatus = await axios.get(`${GAME_SERVICE_URL}/status`);

        res.status(200).json({
            accounts_service: accountsStatus.data,
            game_service: gameStatus.data
        });
    } catch (error) {
        res.status(500).json({
            msg: 'Error fetching status from one or more services.',
            details: error.message
        });
    }
});

app.get('/status', (req, res) => {
    res.json({ status: 'Gateway is up and running!' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Gateway listening on port ${PORT}`);
});
