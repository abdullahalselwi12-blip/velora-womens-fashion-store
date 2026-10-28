import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { supabase, getGuestSessionId } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { CartItem, Product, ProductVariant } from '@/types';

interface CartContextValue {
  items: CartItem[];
  loading: boolean;
  cartId: string | null;
  addItem: (variantId: string, quantity: number) => Promise<{ error: string | null }>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartId, setCartId] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      let cart;
      if (user) {
        const { data: existingCart } = await supabase
          .from('carts')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingCart) {
          cart = existingCart;
        } else {
          const { data: newCart, error } = await supabase
            .from('carts')
            .insert({ user_id: user.id })
            .select('id')
            .single();
          if (error) throw error;
          cart = newCart;
        }
      } else {
        const guestId = getGuestSessionId();
        const { data: existingCart } = await supabase
          .from('carts')
          .select('id')
          .eq('guest_session_id', guestId)
          .maybeSingle();

        if (existingCart) {
          cart = existingCart;
        } else {
          const { data: newCart, error } = await supabase
            .from('carts')
            .insert({ guest_session_id: guestId })
            .select('id')
            .single();
          if (error) throw error;
          cart = newCart;
        }
      }

      if (cart) {
        setCartId(cart.id);
        const { data: cartItems } = await supabase
          .from('cart_items')
          .select(`
            *,
            product_variant:product_variants(
              *,
              product:products(
                *,
                product_images(*)
              )
            )
          `)
          .eq('cart_id', cart.id);

        if (cartItems) {
          const formattedItems: CartItem[] = cartItems.map((ci: Record<string, unknown>) => {
            const pv = ci.product_variant as ProductVariant & { product: Product & { product_images: { image_url: string | null; is_primary: boolean }[] } };
            return {
              id: ci.id as string,
              cart_id: ci.cart_id as string,
              product_variant_id: ci.product_variant_id as string,
              quantity: ci.quantity as number,
              created_at: ci.created_at as string,
              updated_at: ci.updated_at as string,
              product_variant: pv,
              product: pv?.product,
            };
          });
          setItems(formattedItems);
        }
      }
    } catch {
      // Cart fetch failed, likely no cart yet
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addItem = useCallback(async (variantId: string, quantity: number) => {
    if (!cartId) return { error: 'No cart' };
    const { data: existing } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_id', cartId)
      .eq('product_variant_id', variantId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: (existing as { quantity: number }).quantity + quantity })
        .eq('id', (existing as { id: string }).id);
      if (error) return { error: error.message };
    } else {
      const { error } = await supabase
        .from('cart_items')
        .insert({ cart_id: cartId, product_variant_id: variantId, quantity });
      if (error) return { error: error.message };
    }
    await fetchCart();
    return { error: null };
  }, [cartId, fetchCart]);

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(itemId);
      return;
    }
    await supabase.from('cart_items').update({ quantity }).eq('id', itemId);
    await fetchCart();
  }, [fetchCart]);

  const removeItem = useCallback(async (itemId: string) => {
    await supabase.from('cart_items').delete().eq('id', itemId);
    await fetchCart();
  }, [fetchCart]);

  const clearCart = useCallback(async () => {
    if (!cartId) return;
    await supabase.from('cart_items').delete().eq('cart_id', cartId);
    await fetchCart();
  }, [cartId, fetchCart]);

  const refreshCart = useCallback(() => fetchCart(), [fetchCart]);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, loading, cartId, addItem, updateQuantity, removeItem, clearCart, refreshCart, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
