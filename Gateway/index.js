const redis = require('redis');
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 5004;

const rateLimit = require('express-rate-limit');



const limiter = rateLimit({
    windowMs: 5 * 1000, // 1 second
    max: 2,
    message: 'Too many requests!',
});


app.use(limiter);


const redisClient = redis.createClient({
    url: 'redis://redis:6379',
});

redisClient.connect().catch((err) => {
    console.error("Redis connection error:", err);
});

const cacheMiddleware = async (req, res, next) => {
    if (req.method !== 'GET') {
        return next();
    }

    const cacheKey = req.originalUrl;
    console.log(`Checking cache for: ${cacheKey}`);
    try {
        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
            console.log('Serving from cache for:', cacheKey);
            return res.status(200).json(JSON.parse(cachedData));
        } else {
            console.log('Cache miss for:', cacheKey);
            next();
        }
    } catch (err) {
        console.error('Redis error:', err);
        next();
    }
};

app.use('/accounts', cacheMiddleware, createProxyMiddleware({
    target: 'http://accounts_service:5001', // Target service for accounts
    changeOrigin: true,
    onProxyRes: async (proxyRes, req, res) => {
        const body = await streamToString(proxyRes);
        const cacheKey = req.originalUrl;
        await redisClient.setEx(cacheKey, 300, body); // Cache for 5 minutes
    },
}));

// Proxy middleware for game_service
app.use('/game', cacheMiddleware, createProxyMiddleware({
    target: 'http://game_service:5002', // Target service for game
    changeOrigin: true,
    onProxyRes: async (proxyRes, req, res) => {
        const body = await streamToString(proxyRes);
        const cacheKey = req.originalUrl;
        await redisClient.setEx(cacheKey, 300, body); // Cache for 5 minutes
    },
}));

// Health check endpoint
app.get('/status', (req, res) => {
    res.json({ status: 'Gateway is up and running!' });
});

const streamToString = (stream) => {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', chunk => {
            chunks.push(Buffer.from(chunk));
        });
        stream.on('error', reject);
        stream.on('end', () => {
            resolve(Buffer.concat(chunks).toString('utf8'));
        });
    });
};

//  start gateway
app.listen(PORT, () => {
    console.log(`Gateway listening on port ${PORT}`);
});
