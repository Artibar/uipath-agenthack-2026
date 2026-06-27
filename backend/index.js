import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes
import extractionRoutes from './routes/extractionRoutes.js';
import workflowRoutes from "./routes/workflowRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import intakeRoutes from './routes/intakeRoutes.js';

// Database & Scripts
import connectDB from './config/db.js';
import { indexRegulations } from "./scripts/indexRegulations.js";
import { seedRegulations } from './seed.js';

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ CREATE UPLOADS DIRECTORY AT STARTUP
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log(`📁 Created uploads directory at: ${uploadsDir}`);
}

// ============================================
// MIDDLEWARE
// ============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
    origin: [
        "https://uipath-agenthack-2026-1.onrender.com",
        "https://uipath-agenthack-2026.onrender.com",
        "http://localhost:3000",
        "http://localhost:5173",  // Vite dev server
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running!',
        timestamp: new Date(),
        env: process.env.NODE_ENV || 'development'
    });
});

// ============================================
// INITIALIZE & STARTUP
// ============================================
async function startServer() {
    try {
        console.log('🚀 Starting server initialization...');

        // Connect to database
        console.log('🔌 Connecting to database...');
        await connectDB();
        console.log('✅ Database connected');

        // Seed regulations
        console.log('🌱 Seeding regulations...');
        await seedRegulations();
        console.log('✅ Regulations seeded');

        // Index regulations (Groq)
        console.log('🔍 Indexing regulations...');
        await indexRegulations();
        console.log('✅ Regulations indexed');

        // ============================================
        // ROUTES
        // ============================================
        app.use('/api/intake', intakeRoutes);
        app.use('/api/extraction', extractionRoutes);
        app.use('/api/workflow', workflowRoutes);
        app.use('/api', testRoutes);

        // ============================================
        // ERROR HANDLING MIDDLEWARE
        // ============================================
        app.use((err, req, res, next) => {
            console.error('❌ Error:', err.message);
            res.status(err.status || 500).json({
                success: false,
                error: err.message || 'Internal server error'
            });
        });

        // 404 handler
        app.use((req, res) => {
            res.status(404).json({
                success: false,
                error: 'Route not found'
            });
        });

        // ============================================
        // START LISTENING
        // ============================================
        app.listen(PORT, () => {
            console.log(`\n✅ Server is running on PORT: ${PORT}`);
            console.log(`📁 Uploads directory: ${uploadsDir}`);
            console.log(`🌍 CORS enabled for frontend URLs`);
            console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`\n🎯 Ready to accept requests!\n`);
        });

    } catch (error) {
        console.error('❌ FATAL ERROR during startup:', error);
        process.exit(1);
    }
}

// Start the server
startServer();

export default app;