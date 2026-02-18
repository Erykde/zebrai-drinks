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
  'Drinks',
  'Cervejas',
  'Refrigerantes',
  'Sucos',
  'Energéticos',
  'Destilados',
];

export const initialProducts: Product[] = [
  {
    id: '1',
    name: 'Caipirinha Clássica',
    description: 'Cachaça, limão, açúcar e gelo. O clássico brasileiro.',
    price: 18.00,
    costPrice: 6.00,
    category: 'Drinks',
    image: '🍹',
    stock: 50,
    sold: 120,
  },
  {
    id: '2',
    name: 'Mojito Zebrai',
    description: 'Rum, hortelã, limão, açúcar e água com gás.',
    price: 22.00,
    costPrice: 8.00,
    category: 'Drinks',
    image: '🍸',
    stock: 35,
    sold: 85,
  },
  {
    id: '3',
    name: 'Gin Tônica Premium',
    description: 'Gin importado com tônica artesanal e especiarias.',
    price: 28.00,
    costPrice: 12.00,
    category: 'Drinks',
    image: '🥂',
    stock: 25,
    sold: 60,
  },
  {
    id: '4',
    name: 'Cerveja Artesanal IPA',
    description: 'IPA artesanal com notas cítricas. 350ml.',
    price: 16.00,
    costPrice: 7.00,
    category: 'Cervejas',
    image: '🍺',
    stock: 100,
    sold: 200,
  },
  {
    id: '5',
    name: 'Heineken Long Neck',
    description: 'Cerveja premium holandesa. 330ml.',
    price: 12.00,
    costPrice: 5.50,
    category: 'Cervejas',
    image: '🍺',
    stock: 150,
    sold: 300,
  },
  {
    id: '6',
    name: 'Coca-Cola Lata',
    description: 'Refrigerante Coca-Cola. 350ml.',
    price: 6.00,
    costPrice: 3.00,
    category: 'Refrigerantes',
    image: '🥤',
    stock: 200,
    sold: 180,
  },
  {
    id: '7',
    name: 'Suco Natural de Laranja',
    description: 'Suco de laranja espremido na hora. 400ml.',
    price: 10.00,
    costPrice: 4.00,
    category: 'Sucos',
    image: '🧃',
    stock: 40,
    sold: 70,
  },
  {
    id: '8',
    name: 'Red Bull Energy',
    description: 'Energético Red Bull. 250ml.',
    price: 14.00,
    costPrice: 8.00,
    category: 'Energéticos',
    image: '⚡',
    stock: 60,
    sold: 90,
  },
  {
    id: '9',
    name: 'Whisky Jack Daniels',
    description: 'Dose de Jack Daniel\'s Tennessee Whiskey.',
    price: 25.00,
    costPrice: 10.00,
    category: 'Destilados',
    image: '🥃',
    stock: 30,
    sold: 45,
  },
  {
    id: '10',
    name: 'Margarita Tropical',
    description: 'Tequila, licor de laranja, limão e frutas tropicais.',
    price: 24.00,
    costPrice: 9.00,
    category: 'Drinks',
    image: '🍹',
    stock: 40,
    sold: 55,
  },
];
