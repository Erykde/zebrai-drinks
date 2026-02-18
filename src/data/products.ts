export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  costPrice: number;
  category: string;
  image: string;
  stock: number;
  sold: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  deliveryType: 'delivery' | 'pickup';
  paymentMethod: 'pix' | 'card' | 'cash';
  cashChange?: number;
  items: CartItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'delivered';
  createdAt: string;
}

export const categories = [
  'Todos',
  'Copão 500ml',
  'Copão 700ml',
  'Batidinhas 500ml',
  'Batidinhas 1,5L',
  'Bebidas sem Álcool',
];

export const initialProducts: Product[] = [
  // === COPÃO 500ML ===
  { id: '1', name: 'Smirnoff + Bally', description: 'Copo 500ml com 50ml de dose.', price: 19.90, costPrice: 0, category: 'Copão 500ml', image: '🍹', stock: 99, sold: 0 },
  { id: '2', name: 'Smirnoff + Monster/Red Bull', description: 'Copo 500ml com 50ml de dose.', price: 22.50, costPrice: 0, category: 'Copão 500ml', image: '🍹', stock: 99, sold: 0 },
  { id: '3', name: 'Gin Eternity + Bally', description: 'Copo 500ml com 50ml de dose.', price: 17.90, costPrice: 0, category: 'Copão 500ml', image: '🍹', stock: 99, sold: 0 },
  { id: '4', name: 'Gin Eternity + Monster/Red Bull', description: 'Copo 500ml com 50ml de dose.', price: 21.50, costPrice: 0, category: 'Copão 500ml', image: '🍹', stock: 99, sold: 0 },
  { id: '5', name: 'Passaport Tradicional + Bally', description: 'Copo 500ml com 50ml de dose.', price: 20.90, costPrice: 0, category: 'Copão 500ml', image: '🍹', stock: 99, sold: 0 },
  { id: '6', name: 'Passaport Tradicional + Monster/Red Bull', description: 'Copo 500ml com 50ml de dose.', price: 23.90, costPrice: 0, category: 'Copão 500ml', image: '🍹', stock: 99, sold: 0 },
  { id: '7', name: 'Passaport Mel + Bally', description: 'Copo 500ml com 50ml de dose.', price: 21.90, costPrice: 0, category: 'Copão 500ml', image: '🍹', stock: 99, sold: 0 },
  { id: '8', name: 'Passaport Mel + Monster/Red Bull', description: 'Copo 500ml com 50ml de dose.', price: 25.50, costPrice: 0, category: 'Copão 500ml', image: '🍹', stock: 99, sold: 0 },
  { id: '9', name: 'Passaport Maçã Verde + Bally', description: 'Copo 500ml com 50ml de dose.', price: 24.90, costPrice: 0, category: 'Copão 500ml', image: '🍹', stock: 99, sold: 0 },
  { id: '10', name: 'Passaport Maçã Verde + Monster/Red Bull', description: 'Copo 500ml com 50ml de dose.', price: 27.50, costPrice: 0, category: 'Copão 500ml', image: '🍹', stock: 99, sold: 0 },
  { id: '11', name: 'Ballantines + Bally', description: 'Copo 500ml com 50ml de dose.', price: 23.50, costPrice: 0, category: 'Copão 500ml', image: '🥃', stock: 99, sold: 0 },
  { id: '12', name: 'Ballantines + Monster/Red Bull', description: 'Copo 500ml com 50ml de dose.', price: 27.50, costPrice: 0, category: 'Copão 500ml', image: '🥃', stock: 99, sold: 0 },
  { id: '13', name: 'Red Label + Bally', description: 'Copo 500ml com 50ml de dose.', price: 27.90, costPrice: 0, category: 'Copão 500ml', image: '🥃', stock: 99, sold: 0 },
  { id: '14', name: 'Red Label + Monster/Red Bull', description: 'Copo 500ml com 50ml de dose.', price: 31.90, costPrice: 0, category: 'Copão 500ml', image: '🥃', stock: 99, sold: 0 },
  { id: '15', name: 'Red Horse + Bally', description: 'Copo 500ml com 50ml de dose.', price: 21.90, costPrice: 0, category: 'Copão 500ml', image: '🍺', stock: 99, sold: 0 },
  { id: '16', name: 'Red Horse + Monster/Red Bull', description: 'Copo 500ml com 50ml de dose.', price: 23.50, costPrice: 0, category: 'Copão 500ml', image: '🍺', stock: 99, sold: 0 },
  { id: '17', name: "Jack Daniel's Preto + Bally", description: 'Copo 500ml com 50ml de dose.', price: 37.90, costPrice: 0, category: 'Copão 500ml', image: '🥃', stock: 99, sold: 0 },
  { id: '18', name: "Jack Daniel's Preto + Monster/Red Bull", description: 'Copo 500ml com 50ml de dose.', price: 41.50, costPrice: 0, category: 'Copão 500ml', image: '🥃', stock: 99, sold: 0 },
  { id: '19', name: "Jack Daniel's Maçã Verde + Bally", description: 'Copo 500ml com 50ml de dose.', price: 39.90, costPrice: 0, category: 'Copão 500ml', image: '🥃', stock: 99, sold: 0 },
  { id: '20', name: "Jack Daniel's Maçã Verde + Monster/Red Bull", description: 'Copo 500ml com 50ml de dose.', price: 45.90, costPrice: 0, category: 'Copão 500ml', image: '🥃', stock: 99, sold: 0 },
  { id: '21', name: 'Maromba', description: 'Maçã verde, tradicional e dark.', price: 21.50, costPrice: 0, category: 'Copão 500ml', image: '💪', stock: 99, sold: 0 },

  // === COPÃO 700ML ===
  { id: '30', name: 'Smirnoff + Bally', description: 'Copo 700ml com 100ml de dose.', price: 24.50, costPrice: 0, category: 'Copão 700ml', image: '🍹', stock: 99, sold: 0 },
  { id: '31', name: 'Smirnoff + Monster/Red Bull', description: 'Copo 700ml com 100ml de dose.', price: 27.90, costPrice: 0, category: 'Copão 700ml', image: '🍹', stock: 99, sold: 0 },
  { id: '32', name: 'Gin Dober + Bally', description: 'Copo 700ml com 100ml de dose.', price: 20.90, costPrice: 0, category: 'Copão 700ml', image: '🍸', stock: 99, sold: 0 },
  { id: '33', name: 'Gin Dober + Monster/Red Bull', description: 'Copo 700ml com 100ml de dose.', price: 21.90, costPrice: 0, category: 'Copão 700ml', image: '🍸', stock: 99, sold: 0 },
  { id: '34', name: 'Gin Eternity + Bally', description: 'Copo 700ml com 100ml de dose.', price: 23.50, costPrice: 0, category: 'Copão 700ml', image: '🍹', stock: 99, sold: 0 },
  { id: '35', name: 'Gin Eternity + Monster/Red Bull', description: 'Copo 700ml com 100ml de dose.', price: 24.00, costPrice: 0, category: 'Copão 700ml', image: '🍹', stock: 99, sold: 0 },
  { id: '36', name: 'Passaport Tradicional + Bally', description: 'Copo 700ml com 100ml de dose.', price: 28.90, costPrice: 0, category: 'Copão 700ml', image: '🍹', stock: 99, sold: 0 },
  { id: '37', name: 'Passaport Tradicional + Monster/Red Bull', description: 'Copo 700ml com 100ml de dose.', price: 32.90, costPrice: 0, category: 'Copão 700ml', image: '🍹', stock: 99, sold: 0 },
  { id: '38', name: 'Passaport Mel + Bally', description: 'Copo 700ml com 100ml de dose.', price: 29.90, costPrice: 0, category: 'Copão 700ml', image: '🍹', stock: 99, sold: 0 },
  { id: '39', name: 'Passaport Mel + Monster/Red Bull', description: 'Copo 700ml com 100ml de dose.', price: 34.50, costPrice: 0, category: 'Copão 700ml', image: '🍹', stock: 99, sold: 0 },
  { id: '40', name: 'Passaport Maçã Verde + Bally', description: 'Copo 700ml com 100ml de dose.', price: 33.90, costPrice: 0, category: 'Copão 700ml', image: '🍹', stock: 99, sold: 0 },
  { id: '41', name: 'Passaport Maçã Verde + Monster/Red Bull', description: 'Copo 700ml com 100ml de dose.', price: 36.90, costPrice: 0, category: 'Copão 700ml', image: '🍹', stock: 99, sold: 0 },
  { id: '42', name: 'Ballantines + Bally', description: 'Copo 700ml com 100ml de dose.', price: 30.90, costPrice: 0, category: 'Copão 700ml', image: '🥃', stock: 99, sold: 0 },
  { id: '43', name: 'Ballantines + Monster/Red Bull', description: 'Copo 700ml com 100ml de dose.', price: 34.50, costPrice: 0, category: 'Copão 700ml', image: '🥃', stock: 99, sold: 0 },
  { id: '44', name: 'Red Label + Bally', description: 'Copo 700ml com 100ml de dose.', price: 36.90, costPrice: 0, category: 'Copão 700ml', image: '🥃', stock: 99, sold: 0 },
  { id: '45', name: 'Red Label + Monster/Red Bull', description: 'Copo 700ml com 100ml de dose.', price: 41.50, costPrice: 0, category: 'Copão 700ml', image: '🥃', stock: 99, sold: 0 },
  { id: '46', name: 'Red Horse + Bally', description: 'Copo 700ml com 100ml de dose.', price: 30.90, costPrice: 0, category: 'Copão 700ml', image: '🍺', stock: 99, sold: 0 },
  { id: '47', name: 'Red Horse + Monster/Red Bull', description: 'Copo 700ml com 100ml de dose.', price: 34.50, costPrice: 0, category: 'Copão 700ml', image: '🍺', stock: 99, sold: 0 },
  { id: '48', name: "Jack Daniel's Preto + Bally", description: 'Copo 700ml com 100ml de dose.', price: 49.90, costPrice: 0, category: 'Copão 700ml', image: '🥃', stock: 99, sold: 0 },
  { id: '49', name: "Jack Daniel's Preto + Monster/Red Bull", description: 'Copo 700ml com 100ml de dose.', price: 53.90, costPrice: 0, category: 'Copão 700ml', image: '🥃', stock: 99, sold: 0 },
  { id: '50', name: "Jack Daniel's Maçã Verde + Bally", description: 'Copo 700ml com 100ml de dose.', price: 54.90, costPrice: 0, category: 'Copão 700ml', image: '🥃', stock: 99, sold: 0 },
  { id: '51', name: "Jack Daniel's Maçã Verde + Monster/Red Bull", description: 'Copo 700ml com 100ml de dose.', price: 57.90, costPrice: 0, category: 'Copão 700ml', image: '🥃', stock: 99, sold: 0 },

  // === BATIDINHAS 500ML ===
  { id: '60', name: 'Batidinha de Morango', description: 'Vodka, morango, leite condensado, creme de leite e gelos. Copo 500ml.', price: 27.90, costPrice: 0, category: 'Batidinhas 500ml', image: '🍓', stock: 99, sold: 0 },
  { id: '61', name: 'Batidinha de Maracujá', description: 'Vodka, maracujá, leite condensado, creme de leite e gelos. Copo 500ml.', price: 27.90, costPrice: 0, category: 'Batidinhas 500ml', image: '🥭', stock: 99, sold: 0 },
  { id: '62', name: 'Batidinha de Vinho', description: 'Vinho, leite condensado e gelos. Copo 500ml.', price: 19.50, costPrice: 0, category: 'Batidinhas 500ml', image: '🍷', stock: 99, sold: 0 },
  { id: '63', name: 'Batidinha Morango com Yakult', description: 'Vodka, morango, yakult, leite condensado, creme de leite e gelos. Copo 500ml.', price: 34.50, costPrice: 0, category: 'Batidinhas 500ml', image: '🍓', stock: 99, sold: 0 },
  { id: '64', name: 'Batidinha de Maracujá com Laka', description: 'Vodka, maracujá, Lacta Laka, leite condensado, creme de leite e gelos. Copo 500ml.', price: 34.50, costPrice: 0, category: 'Batidinhas 500ml', image: '🍫', stock: 99, sold: 0 },

  // === BATIDINHAS BALDINHO 1,5L ===
  { id: '70', name: 'Batidinha de Morango', description: 'Vodka, morango, leite condensado, creme de leite e gelos. Baldinho 1,5L.', price: 50.90, costPrice: 0, category: 'Batidinhas 1,5L', image: '🍓', stock: 99, sold: 0 },
  { id: '71', name: 'Batidinha de Maracujá', description: 'Vodka, maracujá, leite condensado, creme de leite e gelos. Baldinho 1,5L.', price: 50.90, costPrice: 0, category: 'Batidinhas 1,5L', image: '🥭', stock: 99, sold: 0 },
  { id: '72', name: 'Batidinha de Vinho', description: 'Vinho, leite condensado e gelos. Baldinho 1,5L.', price: 41.50, costPrice: 0, category: 'Batidinhas 1,5L', image: '🍷', stock: 99, sold: 0 },
  { id: '73', name: 'Batidinha Morango com Yakult', description: 'Vodka, morango, yakult, leite condensado, creme de leite e gelos. Baldinho 1,5L.', price: 56.50, costPrice: 0, category: 'Batidinhas 1,5L', image: '🍓', stock: 99, sold: 0 },
  { id: '74', name: 'Batidinha de Maracujá com Laka', description: 'Vodka, maracujá, Lacta Laka, leite condensado, creme de leite e gelos. Baldinho 1,5L.', price: 56.50, costPrice: 0, category: 'Batidinhas 1,5L', image: '🍫', stock: 99, sold: 0 },

  // === BEBIDAS SEM ÁLCOOL ===
  { id: '80', name: 'Água com Gás', description: 'Água mineral com gás.', price: 4.90, costPrice: 0, category: 'Bebidas sem Álcool', image: '💧', stock: 99, sold: 0 },
  { id: '81', name: 'Água sem Gás', description: 'Água mineral sem gás.', price: 4.50, costPrice: 0, category: 'Bebidas sem Álcool', image: '💧', stock: 99, sold: 0 },
  { id: '82', name: 'Red Bull Lata', description: 'Energético Red Bull. 275ml.', price: 15.50, costPrice: 0, category: 'Bebidas sem Álcool', image: '⚡', stock: 99, sold: 0 },
  { id: '83', name: 'Monster Lata', description: 'Energético Monster. 473ml.', price: 15.50, costPrice: 0, category: 'Bebidas sem Álcool', image: '⚡', stock: 99, sold: 0 },
  { id: '84', name: 'Bally Lata', description: 'Bally. 473ml.', price: 10.50, costPrice: 0, category: 'Bebidas sem Álcool', image: '🥤', stock: 99, sold: 0 },
];
