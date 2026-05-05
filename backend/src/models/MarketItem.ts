import mongoose, { Document, Schema } from 'mongoose';

export interface IMarketItem extends Document {
  user: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  unitPrice?: number;
  category: string;
  completed: boolean;
}

const MarketItemSchema: Schema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Nombre es requerido'],
    trim: true,
    maxlength: 100
  },
  price: {
    type: Number,
    required: [true, 'Precio es requerido'],
    min: [0, 'Precio debe ser positivo']
  },
  quantity: {
    type: Number,
    required: [true, 'Cantidad es requerida'],
    min: [1, 'Cantidad mínima es 1'],
    default: 1
  },
  unitPrice: {
    type: Number,
    min: [0, 'Precio unitario debe ser positivo']
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export default mongoose.model<IMarketItem>('MarketItem', MarketItemSchema);