const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const promClient = require('prom-client');
dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3005;

const servicesRegistry = {};

// Create a registry for Prometheus
const register = new promClient.Registry();

// Collect default metrics like memory usage, process uptime, etc.
promClient.collectDefaultMetrics({ register });

// Example of a custom metric: number of registered services
const serviceCount = new promClient.Gauge({
  name: 'service_discovery_service_count',
  help: 'Number of services currently registered in the service discovery',
});
register.registerMetric(serviceCount);

// Endpoint to register services
app.post('/register', (req, res) => {
    const { name, address, port, replicaId } = req.body;

    if (!name || !address || !port || !replicaId) {
        return res.status(400).json({ message: 'Service name, address, port, and replicaId are required' });
    }

    // Ensure the service registry exists for the given service name
    if (!servicesRegistry[name]) {
        servicesRegistry[name] = [];
    }

    // Check if this specific replica is already registered
    const serviceExists = servicesRegistry[name].some(
        (service) => service.address === address && service.port === port && service.replicaId === replicaId
    );

    if (!serviceExists) {
        servicesRegistry[name].push({ address, port, replicaId });
        console.log(`Service registered: ${name} at ${address}:${port} with replicaId ${replicaId}`);
        res.status(201).json({ message: 'Service registered successfully' });
    } else {
        res.status(409).json({ message: 'Service replica already registered' });
    }
});

// Endpoint to get a service's details by its name
app.get('/service/:name', (req, res) => {
    const { name } = req.params;
    const serviceDetails = servicesRegistry[name];

    if (serviceDetails) {
        res.status(200).json(serviceDetails);
    } else {
        res.status(404).json({ message: 'Service not found' });
    }
});

// Endpoint to delete a specific service replica
app.delete('/service', (req, res) => {
    const { name, address, port, replicaId } = req.body;

    if (servicesRegistry[name]) {
        servicesRegistry[name] = servicesRegistry[name].filter(
            (service) => service.address !== address || service.port !== port || service.replicaId !== replicaId
        );

        if (servicesRegistry[name].length === 0) {
            delete servicesRegistry[name];
        }
        res.status(200).json({ message: 'Service replica deleted successfully' });
    } else {
        res.status(404).json({ message: 'Service not found' });
    }
});

// New endpoint to get the address of a service by its name
app.get('/service/:name/address', (req, res) => {
    const { name } = req.params;
    const serviceDetails = servicesRegistry[name];

    if (serviceDetails && serviceDetails.length > 0) {
        // Assuming you want to return the first instance's address
        res.status(200).json({ address: serviceDetails[0].address });
    } else {
        res.status(404).json({ message: 'Service not found' });
    }
});

// New endpoint to get the port of a service by its name
app.get('/service/:name/port', (req, res) => {
    const { name } = req.params;
    const serviceDetails = servicesRegistry[name];

    if (serviceDetails && serviceDetails.length > 0) {
        // Assuming you want to return the first instance's port
        res.status(200).json({ port: serviceDetails[0].port });
    } else {
        res.status(404).json({ message: 'Service not found' });
    }
});

// Endpoint to list all registered services and their info
app.get('/services', (req, res) => {
    const allServices = Object.entries(servicesRegistry).map(([name, instances]) => ({
        name,
        instances
    }));

    res.status(200).json({
        message: 'Registered services retrieved successfully',
        services: allServices
    });
});

// Function to attempt health check with retry logic
async function checkHealth(address, port, retries = 3) {
    const url = `http://${address}:${port}/status`;
    let attempt = 0;

    while (attempt < retries) {
        try {
            const response = await axios.get(url);
            if (response.status === 200) {
                return true; // Health check passed
            } else {
                throw new Error('Service unhealthy');
            }
        } catch (error) {
            console.error(`Attempt ${attempt + 1} failed: ${error.message}`);
            attempt++;
            if (attempt === retries) {
                return false; // After retries, return unhealthy
            }
        }
    }
    return false;
}

// Health check for all services in the registry
setInterval(async () => {
    for (const [name, instances] of Object.entries(servicesRegistry)) {
        for (let i = 0; i < instances.length; i++) {
            const { address, port } = instances[i];
            try {
                const isHealthy = await checkHealth(address, port);
                if (!isHealthy) {
                    console.log(`Removing unhealthy service: ${name} at ${address}:${port}`);
                    servicesRegistry[name].splice(i, 1);
                    i--; // Adjust index after removal
                }
            } catch (error) {
                console.error(`Error checking health of service: ${name} at ${address}:${port}`);
                console.error(`Error message: ${error.message}`);
                console.error(`Stack trace: ${error.stack}`);
                servicesRegistry[name].splice(i, 1);
                i--; // Adjust index after removal
            }
        }
        if (servicesRegistry[name].length === 0) {
            delete servicesRegistry[name];
        }
    }
}, 25000); // Run every 25 seconds

// Update the service count metric dynamically
setInterval(() => {
    const numberOfRegisteredServices = Object.keys(servicesRegistry).reduce(
        (total, name) => total + servicesRegistry[name].length, 0
    );
    serviceCount.set(numberOfRegisteredServices);
}, 5000); // Update every 5 seconds

// Expose a metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Status endpoint for the service discovery
app.get('/status', (req, res) => {
    res.status(200).json({ message: 'Service discovery is running' });
});

app.listen(PORT, () => {
    console.log(`Service Discovery HTTP Server running on port ${PORT}`);
});
