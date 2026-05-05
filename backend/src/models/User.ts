import mongoose, { Document, Schema } from 'mongoose';
import { hashPassword } from '../config/security';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  pin: string;
  createdAt: Date;
  lastLogin?: Date;
}

const UserSchema: Schema = new Schema({
  email: {
    type: String,
    required: [true, 'Email es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email inválido']
  },
  password: {
    type: String,
    required: [true, 'Password es requerido'],
    minlength: 8,
    select: false
  },
  name: {
    type: String,
    required: [true, 'Nombre es requerido'],
    trim: true,
    maxlength: 50
  },
  pin: {
    type: String,
    required: [true, 'PIN es requerido'],
    minlength: 4,
    maxlength: 6
  },
  lastLogin: Date
}, {
  timestamps: true
});

// Busca esta parte del código (alrededor de la línea 40-47)
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await hashPassword(this.password as string);
  next();
});

export default mongoose.model<IUser>('User', UserSchema);