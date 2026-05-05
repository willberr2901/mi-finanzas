import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import Transaction from '../models/Transaction';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { sanitizeInput } from '../config/security';

const router = Router();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.userId })
      .sort({ date: -1 })
      .limit(100);

    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    res.json({
      success: true,
      transactions,
      summary: {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo transacciones' });
  }
});

router.post('/',
  body('type').isIn(['income', 'expense']),
  body('amount').isFloat({ min: 0, max: 999999999 }),
  body('category').trim().notEmpty(),
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { type, amount, category, description } = req.body;

      const transaction = new Transaction({
        user: req.user.userId,
        type,
        amount,
        category: sanitizeInput(category),
        description: description ? sanitizeInput(description) : undefined
      });

      await transaction.save();

      res.status(201).json({ success: true, transaction });
    } catch (error) {
      res.status(500).json({ error: 'Error creando transacción' });
    }
  }
);

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error eliminando transacción' });
  }
});

export default router;