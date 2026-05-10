import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

const app: Application = express();

// Seguridad
app.use(helmet());
app.use(cors({ 
  origin: process.env.FRONTEND_URL || 'https://mi-finanzas.onrender.com', 
  credentials: true 
}));

// Rate limiting
app.use(rateLimit({ 
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: 'Demasiadas solicitudes. Intenta más tarde.' 
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'API Mi Finanzas - OK' });
});

export default app;