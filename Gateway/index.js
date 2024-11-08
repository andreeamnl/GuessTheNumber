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

const getServiceURL = async (serviceName) => {
    try {
        const response = await axios.get(`http://discovery:3005/service/${serviceName}`); 
        if (response.data && response.data.length > 0) {
            const { address, port } = response.data[0]; 
            return `http://${address}:${port}`;
        } else {
            throw new Error(`Service ${serviceName} not found`);
        }
    } catch (error) {
        throw new Error(`Error fetching service details for ${serviceName}: ${error.message}`);
    }
};

app.post('/accounts/sign-up', async (req, res) => {
    try {
        const ACCOUNTS_SERVICE_URL = await getServiceURL('accounts'); 
        const { data } = await axios.post(`${ACCOUNTS_SERVICE_URL}/api/users`, req.body);
        res.status(201).json(data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ msg: error.message });
    }
});

app.post('/accounts/login', async (req, res) => {
    try {
        const ACCOUNTS_SERVICE_URL = await getServiceURL('accounts');
        const { data } = await axios.post(`${ACCOUNTS_SERVICE_URL}/api/users/login`, req.body);
        res.status(200).json(data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ msg: error.message });
    }
});

app.post('/game/start/:user_id', async (req, res) => {
    try {
        const GAME_SERVICE_URL = await getServiceURL('game');
        const { data } = await axios.post(`${GAME_SERVICE_URL}/start-game/${req.params.user_id}`, req.body);
        res.status(201).json(data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ msg: error.message });
    }
});

app.post('/game/guess/:game_id', async (req, res) => {
    try {
        const GAME_SERVICE_URL = await getServiceURL('game');
        const { data } = await axios.post(`${GAME_SERVICE_URL}/guess/${req.params.game_id}`, req.body);
        res.status(200).json(data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ msg: error.message });
    }
});

app.get('/game/status/:game_id', async (req, res) => {
    try {
        const GAME_SERVICE_URL = await getServiceURL('game');
        const { data } = await axios.get(`${GAME_SERVICE_URL}/game/status/${req.params.game_id}`);
        res.status(200).json(data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ msg: error.message });
    }
});

app.get('/service-status', async (req, res) => {
    try {
        const accountsStatus = await axios.get(`${await getServiceURL('accounts')}/status`);
        const gameStatus = await axios.get(`${await getServiceURL('game')}/status`);

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

app.listen(PORT, () => {
    console.log(`Gateway listening on port ${PORT}`);
});
