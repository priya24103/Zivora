import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:2409/api';
const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const getHeaders = () => {
    const token = localStorage.getItem('zivora_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchCart = async () => {
    const token = localStorage.getItem('zivora_token');
    if (!token) {
      setCartItems([]);
      setCartTotal(0);
      setCartCount(0);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/cart`, {
        headers: getHeaders()
      });
      if (response.data.status === 'success') {
        const cart = response.data.data.cart;
        setCartItems(cart.items || []);
        const total = cart.cartTotal || 0;
        setCartTotal(total);
        
        // Calculate item count
        const count = (cart.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
        setCartCount(count);
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError(err.response?.data?.message || 'Error loading cart');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    const token = localStorage.getItem('zivora_token');
    if (!token) {
      setError('Please log in to add items to your shopping bag.');
      return false;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE}/cart/add`,
        { productId, quantity },
        { headers: getHeaders() }
      );
      if (response.data.status === 'success') {
        const cart = response.data.data.cart;
        setCartItems(cart.items || []);
        setCartTotal(cart.cartTotal || 0);
        const count = (cart.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
        setCartCount(count);
        // Open the drawer on successful add to cart
        setIsCartOpen(true);
        // Trigger storage event for legacy local-storage syncing components if any
        window.dispatchEvent(new Event('storage'));
        return true;
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      const errMsg = err.response?.data?.message || 'Could not add product to cart';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (productId) => {
    setLoading(true);
    try {
      const response = await axios.delete(`${API_BASE}/cart/remove/${productId}`, {
        headers: getHeaders()
      });
      if (response.data.status === 'success') {
        const cart = response.data.data.cart;
        setCartItems(cart.items || []);
        setCartTotal(cart.cartTotal || 0);
        const count = (cart.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
        setCartCount(count);
        window.dispatchEvent(new Event('storage'));
        return true;
      }
    } catch (err) {
      console.error('Error removing from cart:', err);
      setError(err.response?.data?.message || 'Could not remove item');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, quantity) => {
    setLoading(true);
    try {
      const response = await axios.put(
        `${API_BASE}/cart/update-quantity`,
        { productId, quantity },
        { headers: getHeaders() }
      );
      if (response.data.status === 'success') {
        const cart = response.data.data.cart;
        setCartItems(cart.items || []);
        setCartTotal(cart.cartTotal || 0);
        const count = (cart.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
        setCartCount(count);
        window.dispatchEvent(new Event('storage'));
        return true;
      }
    } catch (err) {
      console.error('Error updating quantity:', err);
      setError(err.response?.data?.message || 'Could not update quantity');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const checkoutCart = async (selectedProductIds) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        `${API_BASE}/cart/checkout`,
        { selectedProductIds },
        { headers: getHeaders() }
      );
      if (response.data.status === 'success') {
        const orderId = response.data.data.orderId;
        // Re-sync local cart state with backend
        await fetchCart();
        setIsCartOpen(false);
        window.dispatchEvent(new Event('storage'));
        return orderId;
      }
    } catch (err) {
      console.error('Checkout error:', err);
      const errMsg = err.response?.data?.message || 'Checkout failed. An item may be out of stock.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Fetch cart on mount and when authentication token changes
  useEffect(() => {
    fetchCart();
    
    // Listen for custom login/logout storage updates
    const handleAuthChange = () => {
      fetchCart();
    };
    window.addEventListener('storage', handleAuthChange);
    return () => window.removeEventListener('storage', handleAuthChange);
  }, []);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartTotal,
        cartCount,
        loading,
        error,
        isCartOpen,
        setIsCartOpen,
        fetchCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        checkoutCart,
        setError
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
