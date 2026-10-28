import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Product } from '@/types';

interface WishlistContextValue {
  wishlistId: string | null;
  items: Product[];
  loading: boolean;
  toggleWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [wishlistId, setWishlistId] = useState<string | null>(null);
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlistId(null);
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      const { data: existing } = await supabase
        .from('wishlists')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      let wId = existing?.id as string | undefined;

      if (!wId) {
        const { data: newWishlist } = await supabase
          .from('wishlists')
          .insert({ user_id: user.id })
          .select('id')
          .single();
        wId = newWishlist?.id;
      }

      if (wId) {
        setWishlistId(wId);
        const { data: wItems } = await supabase
          .from('wishlist_items')
          .select(`
            product:products(
              *,
              product_images(*),
              product_variants(*)
            )
          `)
          .eq('wishlist_id', wId);

        if (wItems) {
          setItems(wItems.map((wi: Record<string, unknown>) => wi.product as Product));
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const toggleWishlist = useCallback(async (productId: string) => {
    if (!wishlistId || !user) return;
    const existing = items.find(p => p.id === productId);
    if (existing) {
      await supabase
        .from('wishlist_items')
        .delete()
        .eq('wishlist_id', wishlistId)
        .eq('product_id', productId);
    } else {
      await supabase
        .from('wishlist_items')
        .insert({ wishlist_id: wishlistId, product_id: productId });
    }
    await fetchWishlist();
  }, [wishlistId, user, items, fetchWishlist]);

  const isInWishlist = useCallback((productId: string) => {
    return items.some(p => p.id === productId);
  }, [items]);

  const refreshWishlist = useCallback(() => fetchWishlist(), [fetchWishlist]);

  return (
    <WishlistContext.Provider value={{ wishlistId, items, loading, toggleWishlist, isInWishlist, refreshWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
