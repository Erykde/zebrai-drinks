export interface MixerOption {
  mixer: string;
  price: number;
}

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
  mixerOptions?: MixerOption[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedMixer?: string;
  finalPrice?: number;
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
  { id: '1', name: 'Smirnoff', description: 'Copo 500ml com 50ml de dose.', price: 19.90, costPrice: 0, category: 'Copão 500ml', image: '🍹', stock: 99, sold: 0, mixerOptions: [{ mixer: 'Bally', price: 19.90 }, { mixer: 'Monster', price: 22.50 }, { mixer: 'Red Bull', price: 22.50 }] },
  { id: '3', name: 'Gin Eternity', description: 'Copo 500ml com 50ml de dose.', price: 17.90, costPrice: 0, category: 'Copão 500ml', image: '🍸', stock: 99, sold: 0, mixerOptions: [{ mixer: 'Bally', price: 17.90 }, { mixer: 'Monster', price: 21.50 }, { mixer: 'Red Bull', price: 21.50 }] },
  { id: '5', name: 'Passaport Tradicional', description: 'Copo 500ml com 50ml de dose.', price: 20.90, costPrice: 0, category: 'Copão 500ml', image: '🍹', stock: 99, sold: 0, mixerOptions: [{ mixer: 'Bally', price: 20.90 }, { mixer: 'Monster', price: 23.90 }, { mixer: 'Red Bull', price: 23.90 }] },
  { id: '7', name: 'Passaport Mel', description: 'Copo 500ml com 50ml de dose.', price: 21.90, costPrice: 0, category: 'Copão 500ml', image: '🍹', stock: 99, sold: 0, mixerOptions: [{ mixer: 'Bally', price: 21.90 }, { mixer: 'Monster', price: 25.50 }, { mixer: 'Red Bull', price: 25.50 }] },
  { id: '9', name: 'Passaport Maçã Verde', description: 'Copo 500ml com 50ml de dose.', price: 24.90, costPrice: 0, category: 'Copão 500ml', image: '🍹', stock: 99, sold: 0, mixerOptions: [{ mixer: 'Bally', price: 24.90 }, { mixer: 'Monster', price: 27.50 }, { mixer: 'Red Bull', price: 27.50 }] },
  { id: '11', name: 'Ballantines', description: 'Copo 500ml com 50ml de dose.', price: 23.50, costPrice: 0, category: 'Copão 500ml', image: '🥃', stock: 99, sold: 0, mixerOptions: [{ mixer: 'Bally', price: 23.50 }, { mixer: 'Monster', price: 27.50 }, { mixer: 'Red Bull', price: 27.50 }] },
  { id: '13', name: 'Red Label', description: 'Copo 500ml com 50ml de dose.', price: 27.90, costPrice: 0, category: 'Copão 500ml', image: '🥃', stock: 99, sold: 0, mixerOptions: [{ mixer: 'Bally', price: 27.90 }, { mixer: 'Monster', price: 31.90 }, { mixer: 'Red Bull', price: 31.90 }] },
  { id: '15', name: 'Red Horse', description: 'Copo 500ml com 50ml de dose.', price: 21.90, costPrice: 0, category: 'Copão 500ml', image: '🍺', stock: 99, sold: 0, mixerOptions: [{ mixer: 'Bally', price: 21.90 }, { mixer: 'Monster', price: 23.50 }, { mixer: 'Red Bull', price: 23.50 }] },
  { id: '17', name: "Jack Daniel's Preto", description: 'Copo 500ml com 50ml de dose.', price: 37.90, costPrice: 0, category: 'Copão 500ml', image: '🥃', stock: 99, sold: 0, mixerOptions: [{ mixer: 'Bally', price: 37.90 }, { mixer: 'Monster', price: 41.50 }, { mixer: 'Red Bull', price: 41.50 }] },
  { id: '19', name: "Jack Daniel's Maçã Verde", description: 'Copo 500ml com 50ml de dose.', price: 39.90, costPrice: 0, category: 'Copão 500ml', image: '🥃', stock: 99, sold: 0, mixerOptions: [{ mixer: 'Bally', price: 39.90 }, { mixer: 'Monster', price: 45.90 }, { mixer: 'Red Bull', price: 45.90 }] },
  { id: '21', name: 'Maromba', description: 'Maçã verde, tradicional e dark.', price: 21.50, costPrice: 0, category: 'Copão 500ml', image: '💪', stock: 99, sold: 0 },

  // === COPÃO 700ML ===
  { id: '30', name: 'Smirnoff', description: 'Copo 700ml com 100ml de dose.', price: 24.50, costPrice: 0, category: 'Copão 700ml', image: '🍹', stock: 99, sold: 0, mixerOptions: [{ mixer: 'Bally', price: 24.50 }, { mixer: 'Monster', price: 27.90 }, { mixer: 'Red Bull', price: 27.90 }] },
  { id: '32', name: 'Gin Dober', description: 'Copo 700ml com 100ml de dose.', price: 20.90, costPrice: 0, category: 'Copão 700ml', image: '🍸', stock: 99, sold: 0, mixerOptions: [{ mixer: 'Bally', price: 20.90 }, { mixer: 'Monster', price: 21.90 }, { mixer: 'Red Bull', price: 21.90 }] },
  { id: '34', name: 'Gin Eternity', description: 'Copo 700ml com 100ml de dose.', price: 23.50, costPrice: 0, category: 'Copão 700ml', image: '🍸', stock: 99, sold: 0, mixerOptions: [{ mixer: 'Bally', price: 23.50 }, { mixer: 'Monster', price: 24.00 }, { mixer: 'Red Bull', price: 24.00 }] },
  { id: '36', name: 'Passaport Tradicional', description: 'Copo 700ml com 100ml de dose.', price: 28.90, costPrice: 0, category: 'Copão 700ml', image: '🍹', stock: 99, sold: 0, mixerOptions: [{ mixer: 'Bally', price: 28.90 }, { mixer: 'Monster', price: 32.90 }, { mixer: 'Red Bull', price: 32.90 }] },
  { id: '38', name: 'Passaport Mel', description: 'Copo 700ml com 100ml de dose.', price: 29.90, costPrice: 0, category: 'Copão 700ml', image: '🍹', stock: 99, sold: 0, mixerOptions: [{ mixer: 'Bally', price: 29.90 }, { mixer: 'Monster', price: 34.50 }, { mixer: 'Red Bull', price: 34.50 }] },
  { id: '40', name: 'Passaport Maçã Verde', description: 'Copo 700ml com 100ml de dose.', price: 33.90, costPrice: 0, category: 'Copão 700ml', image: '🍹', stock: 99, sold: 0, mixerOptions: [{ mixer: 'Bally', price: 33.90 }, { mixer: 'Monster', price: 36.90 }, { mixer: 'Red Bull', price: 36.90 }] },
  { id: '42', name: 'Ballantines', description: 'Copo 700ml com 100ml de dose.', price: 30.90, costPrice: 0, category: 'Copão 700ml', image: '🥃', stock: 99, sold: 0, mixerOptions: [{ mixer: 'Bally', price: 30.90 }, { mixer: 'Monster', price: 34.50 }, { mixer: 'Red Bull', price: 34.50 }] },
  { id: '44', name: 'Red Label', description: 'Copo 700ml com 100ml de dose.', price: 36.90, costPrice: 0, category: 'Copão 700ml', image: '🥃', stock: 99, sold: 0, mixerOptions: [{ mixer: 'Bally', price: 36.90 }, { mixer: 'Monster', price: 41.50 }, { mixer: 'Red Bull', price: 41.50 }] },
  { id: '46', name: 'Red Horse', description: 'Copo 700ml com 100ml de dose.', price: 30.90, costPrice: 0, category: 'Copão 700ml', image: '🍺', stock: 99, sold: 0, mixerOptions: [{ mixer: 'Bally', price: 30.90 }, { mixer: 'Monster', price: 34.50 }, { mixer: 'Red Bull', price: 34.50 }] },
  { id: '48', name: "Jack Daniel's Preto", description: 'Copo 700ml com 100ml de dose.', price: 49.90, costPrice: 0, category: 'Copão 700ml', image: '🥃', stock: 99, sold: 0, mixerOptions: [{ mixer: 'Bally', price: 49.90 }, { mixer: 'Monster', price: 53.90 }, { mixer: 'Red Bull', price: 53.90 }] },
  { id: '50', name: "Jack Daniel's Maçã Verde", description: 'Copo 700ml com 100ml de dose.', price: 54.90, costPrice: 0, category: 'Copão 700ml', image: '🥃', stock: 99, sold: 0, mixerOptions: [{ mixer: 'Bally', price: 54.90 }, { mixer: 'Monster', price: 57.90 }, { mixer: 'Red Bull', price: 57.90 }] },

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
