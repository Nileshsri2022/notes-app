import { createApp } from '../server/index.js'

// Vercel serverless handler: exposes the existing Express app so every
// /api/* request (routed here via vercel.json) is handled by it.
export default createApp()
