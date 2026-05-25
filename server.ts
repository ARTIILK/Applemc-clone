import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import checkoutHandler from './api/checkout';
import sendOrderHandler from './api/send-order';

// Load environment variables
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parser for payloads
  app.use(express.json());

  // API router - Map the Vercel serverless function to our Express route
  app.post('/api/checkout', async (req, res) => {
    try {
      await checkoutHandler(req as any, res as any);
    } catch (err) {
      console.error('API checkout execution error:', err);
      res.status(500).json({ success: false, error: 'Internal API route error.' });
    }
  });

  app.post('/api/send-order', async (req, res) => {
    try {
      await sendOrderHandler(req as any, res as any);
    } catch (err) {
      console.error('API send-order execution error:', err);
      res.status(500).json({ success: false, error: 'Internal API route error.' });
    }
  });

  // Serve static UI assets based on system environment
  if (process.env.NODE_ENV !== 'production') {
    console.log('Running in development mode. Initializing Vite middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Running in production mode. Serving static assets from dist...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MineBerry Store Server running secure ports on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Fatal Storefront Server Startup Error:', error);
});
