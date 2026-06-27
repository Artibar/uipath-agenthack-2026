import dotenv from 'dotenv'
dotenv.config();
import express from 'express';
import cors from 'cors'
import extractionRoutes from './routes/extractionRoutes.js'
import workflowRoutes from "./routes/workflowRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import { indexRegulations } from "./scripts/indexRegulations.js";
import connectDB from './config/db.js'
import intakeRoutes from './routes/intakeRoutes.js';
import {seedRegulations} from './seed.js'

const app = express();

app.use(express.json())
app.use(cors({
  origin: [
    "https://uipath-agenthack-2026-1.onrender.com", 
    "https://uipath-agenthack-2026.onrender.com",    
                               
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}))
// ✅ ADD HEALTH CHECK HERE
app.get('/health', (req, res) => {
    res.status(200).json({ 
        success: true, 
        message: 'Server is running!',
        timestamp: new Date()
    });
});
await connectDB()
await seedRegulations()
app.use('/api/intake', intakeRoutes);
app.use('/api/extraction', extractionRoutes)
app.use("/api/workflow", workflowRoutes);

app.use("/api", testRoutes);
await indexRegulations();
const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=>{
    
    console.log(`Server is running on PORT : ${PORT}`)
})

export default app

