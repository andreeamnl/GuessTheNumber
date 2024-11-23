const express = require('express');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 5004;

// Rate Limiter to prevent abuse
const limiter = rateLimit({
    windowMs: 5 * 1000, // 5 seconds
    max: 10, // Increase to 10 requests per window temporarily
    message: 'Too many requests!',
});
app.use(limiter);

const getServiceURLs = async (serviceNameBase, maxIndex = 3) => {
    const serviceURLs = [];
    for (let i = 1; i <= maxIndex; i++) {
        const serviceName = `${serviceNameBase}${i}`;
        try {
            const addressResponse = await axios.get(`http://discovery:3005/service/${serviceName}/address`);
            const portResponse = await axios.get(`http://discovery:3005/service/${serviceName}/port`);
            if (addressResponse.data && portResponse.data) {
                const address = addressResponse.data.address;
                const port = portResponse.data.port;
                serviceURLs.push(`http://${address}:${port}`);
            } else {
                console.warn(`Service ${serviceName} does not have a valid address or port`);
            }
        } catch (error) {
            console.warn(`Service ${serviceName} not found or unreachable: ${error.message}`);
        }
    }

    return serviceURLs;
};

const tryServiceCall = async (serviceNameBase, url, method, data, retriesPerInstance = 3, timeout = 5000, maxIndex = 3) => {
    const serviceURLs = await getServiceURLs(serviceNameBase, maxIndex);

    if (serviceURLs.length === 0) {
        console.error(`No reachable instances for service: ${serviceNameBase}`);
        return { success: false, error: `No reachable instances for ${serviceNameBase}` };
    }

    let totalRetries = 0; // Counter for total retries
    for (let retry = 0; retry < retriesPerInstance; retry++) {
        for (const serviceURL of serviceURLs) {
            totalRetries++;
            try {
                console.log(`Trying service instance: ${serviceURL}, Retry #${totalRetries}`);
                const response = await axios({
                    method,
                    url: `${serviceURL}${url}`,
                    data,
                    timeout,
                });
                console.log(`Service call succeeded after ${totalRetries} retries.`);
                return { success: true, data: response.data }; // Return successful response
            } catch (error) {
                console.error(`Error with ${serviceURL} (Retry #${totalRetries}): ${error.message}`);
            }
        }
    }

    console.error(`All attempts failed for service base ${serviceNameBase}.`);
    return { success: false, error: `All instances of ${serviceNameBase} failed.` };
};

// Account Sign-up endpoint
app.post('/accounts/sign-up', async (req, res) => {
    try {
        console.log('Request body:', req.body); // Log the request body
        const serviceNameBase = 'accounts_service_';
        const data = await tryServiceCall(serviceNameBase, '/api/users', 'POST', req.body);
        res.status(201).json(data);
    } catch (error) {
        console.error(error); // Log the error for further investigation
        res.status(500).json({ msg: `All instances of accounts_service_ failed: ${error.message}` });
    }
});

// Account Login endpoint
app.post('/accounts/login', async (req, res) => {
    try {
        const serviceNameBase = 'accounts_service_'; // Base name of the service
        const data = await tryServiceCall(serviceNameBase, '/api/users/login', 'POST', req.body);
        res.status(200).json(data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ msg: error.message });
    }
});

// Game Start endpoint
app.post('/game/start/:user_id', async (req, res) => {
    try {
        const serviceNameBase = 'game_service_'; // Base name of the service
        const data = await tryServiceCall(serviceNameBase, `/start-game/${req.params.user_id}`, 'POST', req.body);
        res.status(201).json(data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ msg: error.message });
    }
});

// Game Guess endpoint
app.post('/game/guess/:game_id', async (req, res) => {
    try {
        const serviceNameBase = 'game_service_'; // Base name of the service
        const data = await tryServiceCall(serviceNameBase, `/guess/${req.params.game_id}`, 'POST', req.body);
        res.status(200).json(data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ msg: error.message });
    }
});

// Game Status endpoint
app.get('/game/status/:game_id', async (req, res) => {
    try {
        const serviceNameBase = 'game_service_'; // Base name of the service
        const data = await tryServiceCall(serviceNameBase, `/game/status/${req.params.game_id}`, 'GET');
        res.status(200).json(data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ msg: error.message });
    }
});

// Service Status endpoint
app.get('/service-status', async (req, res) => {
    try {
        const accountsStatus = await axios.get(`${(await getServiceURLs('accounts_service_'))[0]}/status`);
        const gameStatus = await axios.get(`${(await getServiceURLs('game_service_'))[0]}/status`);

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

// Gateway status endpoint (simple health check)
app.get('/status', (req, res) => {
    res.json({ status: 'Gateway is up and running!' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Gateway listening on port ${PORT}`);
});
