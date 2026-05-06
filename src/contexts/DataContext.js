import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { getItemAsync, setItemAsync } from '../../components/utils/customSecureStore';
import addAndSave from '../../components/utils/addAndSave';

/**
 * DataContext — Centralized data layer for the app.
 *
 * Instead of every screen independently calling getItemAsync(),
 * data is loaded ONCE and shared everywhere via context.
 *
 * Usage:
 *   const { buyers, quotations, invoices, refresh, saveBuyer } = useData();
 */

const DataContext = createContext(null);

const KEYS = ['buyer', 'quotation', 'invoice', 'supplier', 'product', 'bankDetails', 'signature', 'termsandconditions'];

export function DataProvider({ children }) {
  const [data, setData] = useState({
    buyer: [],
    quotation: [],
    invoice: [],
    supplier: null,
    product: [],
    bankDetails: [],
    signature: [],
    termsandconditions: [],
  });
  const [loading, setLoading] = useState(true);
  const loadedRef = useRef(false);

  // Load all data from storage
  const refresh = useCallback(async () => {
    try {
      const results = await Promise.all(
        KEYS.map(async key => {
          const raw = await getItemAsync(key);
          if (!raw) return null;
          try { return JSON.parse(raw); } catch { return null; }
        })
      );

      const newData = {};
      KEYS.forEach((key, i) => {
        const val = results[i];
        // supplier is an object, everything else is array
        if (key === 'supplier') {
          newData[key] = val || null;
        } else {
          newData[key] = Array.isArray(val) ? val : [];
        }
      });

      setData(newData);
    } catch (e) {
      console.error('DataContext refresh error:', e);
    } finally {
      setLoading(false);
      loadedRef.current = true;
    }
  }, []);

  // Save helper — updates local state immediately, then persists
  const saveItem = useCallback(async (propertyName, newValue, propertyCheck) => {
    await addAndSave({ propertyName, newValue, propertyCheck });
    // Optimistic update: refresh data from storage
    const raw = await getItemAsync(propertyName);
    if (raw) {
      const parsed = JSON.parse(raw);
      setData(prev => ({
        ...prev,
        [propertyName]: Array.isArray(parsed) ? parsed : parsed,
      }));
    }
  }, []);

  // Delete item from a list
  const deleteItem = useCallback(async (propertyName, matchFn) => {
    const raw = await getItemAsync(propertyName);
    let list = raw ? JSON.parse(raw) : [];
    list = list.filter(item => !matchFn(item));
    await setItemAsync(propertyName, JSON.stringify(list));
    setData(prev => ({ ...prev, [propertyName]: list }));
  }, []);

  // Compute client status based on quotation/invoice data
  const getClientStatusKey = useCallback((client) => {
    if (client.leadStatus === 'Inactive') return 'INACTIVE';
    const name = (client.companyName || '').toLowerCase();
    if (data.invoice.some(i => (i.buyerDetails?.companyName || '').toLowerCase() === name)) return 'CONVERTED';
    if (data.quotation.some(q => (q.buyerDetails?.companyName || '').toLowerCase() === name)) return 'QUOTED';
    return 'ACTIVE';
  }, [data.invoice, data.quotation]);

  const getClientStatusLabel = useCallback((client) => {
    if (client.leadStatus === 'Inactive') return '😔 INACTIVE';
    const name = (client.companyName || '').toLowerCase();
    const invCount = data.invoice.filter(i => (i.buyerDetails?.companyName || '').toLowerCase() === name).length;
    if (invCount > 0) return '✅ CONVERTED';
    const quoCount = data.quotation.filter(q => (q.buyerDetails?.companyName || '').toLowerCase() === name).length;
    if (quoCount > 0) return `📋 QUOTED ${quoCount > 1 ? quoCount + 'x' : ''}`;
    return '😊 ACTIVE';
  }, [data.invoice, data.quotation]);

  const value = {
    // Data
    buyers: data.buyer,
    quotations: data.quotation,
    invoices: data.invoice,
    supplier: data.supplier,
    products: data.product,
    bankDetails: data.bankDetails,
    signatures: data.signature,
    termsAndConditions: data.termsandconditions,

    // State
    loading,
    loaded: loadedRef.current,

    // Actions
    refresh,
    saveItem,
    deleteItem,

    // Computed
    getClientStatusKey,
    getClientStatusLabel,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

/**
 * Hook to access the data context.
 * Throws if used outside DataProvider.
 */
export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside <DataProvider>');
  return ctx;
}

export default DataContext;
