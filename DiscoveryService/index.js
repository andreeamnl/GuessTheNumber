// index.js

const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3005;


const servicesRegistry = {};

app.post('/register', (req, res) => {
    const { name, address, port } = req.body;
    
    if (!name || !address || !port) {
        return res.status(400).json({ message: 'Service name, address, and port are required' });
    }

    if (!servicesRegistry[name]) {
        servicesRegistry[name] = [];
    }

    const serviceExists = servicesRegistry[name].some(
        (service) => service.address === address && service.port === port
    );

    if (!serviceExists) {
        servicesRegistry[name].push({ address, port });
        console.log(`Service registered: ${name} at ${address}:${port}`);
        res.status(201).json({ message: 'Service registered successfully' });
    } else {
        res.status(409).json({ message: 'Service already registered' });
    }
});

app.get('/service/:name', (req, res) => {
    const { name } = req.params;
    const serviceDetails = servicesRegistry[name];

    if (serviceDetails) {
        res.status(200).json(serviceDetails);
    } else {
        res.status(404).json({ message: 'Service not found' });
    }
});

app.delete('/service', (req, res) => {
    const { name, address, port } = req.body;

    if (servicesRegistry[name]) {
        servicesRegistry[name] = servicesRegistry[name].filter(
            (service) => service.address !== address || service.port !== port
        );

        if (servicesRegistry[name].length === 0) {
            delete servicesRegistry[name];
        }
        res.status(200).json({ message: 'Service instance deleted successfully' });
    } else {
        res.status(404).json({ message: 'Service not found' });
    }
});

setInterval(async () => {
    for (const [name, instances] of Object.entries(servicesRegistry)) {
        for (let i = 0; i < instances.length; i++) {
            const { address, port } = instances[i];
            try {
                const response = await axios.get(`http://${address}:${port}/status`);
                
                if (response.status !== 200) {
                    throw new Error('Service unhealthy');
                }
            } catch (error) {
                console.log(`Removing unhealthy service: ${name} at ${address}:${port}`);
                servicesRegistry[name].splice(i, 1);
                i--; // Adjust index after removal
            }
        }
        if (servicesRegistry[name].length === 0) {
            delete servicesRegistry[name];
        }
    }
}, 25000); // Run every 25 seconds

app.get('/status', (req, res) => {
    res.status(200).json({ message: 'Service discovery is running' });
});

app.listen(PORT, () => {
    console.log(`Service Discovery HTTP Server running on port ${PORT}`);
});
