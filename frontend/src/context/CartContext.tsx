import React, { createContext, useContext, useState, useCallback } from 'react';
import { CartItem, Repuesto } from '../types/types';

interface CartContextType {
    items: CartItem[];
    count: number;
    total: number;
    addItem: (repuesto: Repuesto, cantidad?: number) => void;
    removeItem: (repuesto_id: number) => void;
    updateQuantity: (repuesto_id: number, cantidad: number) => void;
    clearCart: () => void;
    isInCart: (repuesto_id: number) => boolean;
    getQuantity: (repuesto_id: number) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);

    const count = items.reduce((sum, item) => sum + item.cantidad, 0);
    const total = items.reduce((sum, item) => sum + item.repuesto.precio_venta * item.cantidad, 0);

    const addItem = useCallback((repuesto: Repuesto, cantidad = 1) => {
        setItems(prev => {
            const existing = prev.find(i => i.repuesto.id === repuesto.id);
            if (existing) {
                return prev.map(i =>
                    i.repuesto.id === repuesto.id
                        ? { ...i, cantidad: Math.min(i.cantidad + cantidad, repuesto.stock_actual) }
                        : i
                );
            }
            return [...prev, { repuesto, cantidad: Math.min(cantidad, repuesto.stock_actual) }];
        });
    }, []);

    const removeItem = useCallback((repuesto_id: number) => {
        setItems(prev => prev.filter(i => i.repuesto.id !== repuesto_id));
    }, []);

    const updateQuantity = useCallback((repuesto_id: number, cantidad: number) => {
        if (cantidad <= 0) {
            removeItem(repuesto_id);
            return;
        }
        setItems(prev =>
            prev.map(i =>
                i.repuesto.id === repuesto_id ? { ...i, cantidad } : i
            )
        );
    }, [removeItem]);

    const clearCart = useCallback(() => setItems([]), []);

    const isInCart = useCallback(
        (repuesto_id: number) => items.some(i => i.repuesto.id === repuesto_id),
        [items]
    );

    const getQuantity = useCallback(
        (repuesto_id: number) => items.find(i => i.repuesto.id === repuesto_id)?.cantidad ?? 0,
        [items]
    );

    return (
        <CartContext.Provider value={{ items, count, total, addItem, removeItem, updateQuantity, clearCart, isInCart, getQuantity }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be used inside CartProvider');
    return ctx;
}
