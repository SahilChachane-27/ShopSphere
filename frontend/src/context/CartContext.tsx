import React, { createContext, useContext, useState, useEffect } from 'react';
import { Cart } from '../types';
import { apiClient } from '../api/client';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  addToCart: (productId: number, variantId?: number, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchCart = async () => {
    if (!user) {
      setCart(null);
      return;
    }
    setIsLoading(true);
    try {
      const res = await apiClient.get('/cart');
      if (res.data.success) {
        setCart(res.data.data);
      }
    } catch {
      setCart(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  const addToCart = async (productId: number, variantId?: number, quantity: number = 1) => {
    const res = await apiClient.post('/cart/items', {
      product_id: productId,
      variant_id: variantId,
      quantity,
    });
    if (res.data.success) {
      setCart(res.data.data);
    }
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    const res = await apiClient.put(`/cart/items/${itemId}`, { quantity });
    if (res.data.success) {
      setCart(res.data.data);
    }
  };

  const removeItem = async (itemId: number) => {
    const res = await apiClient.delete(`/cart/items/${itemId}`);
    if (res.data.success) {
      setCart(res.data.data);
    }
  };

  const clearCart = async () => {
    const res = await apiClient.delete('/cart');
    if (res.data.success) {
      setCart(null);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
