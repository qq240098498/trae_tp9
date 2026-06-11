/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import buildingsRoutes from './routes/buildings.js'
import roomsRoutes from './routes/rooms.js'
import bedsRoutes from './routes/beds.js'
import workersRoutes from './routes/workers.js'
import dormitoryRoutes from './routes/dormitory.js'
import devicesRoutes from './routes/devices.js'
import maintenanceRoutes from './routes/maintenance.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/buildings', buildingsRoutes)
app.use('/api/rooms', roomsRoutes)
app.use('/api/beds', bedsRoutes)
app.use('/api/workers', workersRoutes)
app.use('/api/dormitory', dormitoryRoutes)
app.use('/api/devices', devicesRoutes)
app.use('/api/maintenance', maintenanceRoutes)

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
