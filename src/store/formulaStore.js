// src/store/formulaStore.js
import { create } from 'zustand';

// Elementlər üçün unikal ID yaratmaq üçün sadə bir köməkçi funksiya
// Bu, hər bir elementin (tag, operand, rəqəm) DOM-da və state-də
// fərqləndirilməsi üçün vacibdir, xüsusilə silmə və yeniləmə zamanı.
const generateId = () => `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const useFormulaStore = create((set) => ({
  /**
   * Formula elementlərini saxlayan array.
   * Hər bir element bir obyektdir və aşağıdakı struktura malikdir:
   * - id: string (unikal identifikator, generateId() ilə yaradılır)
   * - type: 'tag' | 'operand' | 'number' (elementin növü)
   * - label: string (yalnız 'tag' növü üçün, görünən adı, məsələn, "Sales")
   * - value: string | number (yalnız 'operand' və 'number' növü üçün, məsələn, "+" və ya 100)
   *
   * Nümunə elementlər:
   * { id: 'item_123_abc', type: 'tag', label: 'Satışlar' }
   * { id: 'item_456_def', type: 'operand', value: '+' }
   * { id: 'item_789_ghi', type: 'number', value: 100 }
   */
  items: [], // Əvvəlki 'formula' array-ini 'items' ilə əvəz edirik

  // Bütün elementləri birdən təyin etmək üçün (məsələn, saxlanmış bir formulu yükləyərkən)
  setItems: (newItems) => set({ items: newItems }),

  /**
   * Yeni bir formula elementi (tag, operand, və ya rəqəm) əlavə edir.
   * @param {object} itemData - Əlavə ediləcək elementin məlumatları.
   *                         Məsələn: { type: 'tag', label: 'MənimTagim' }
   *                         və ya { type: 'operand', value: '*' }
   *                         və ya { type: 'number', value: 55 }
   *                         'id' avtomatik olaraq generateId() ilə əlavə olunacaq (əgər verilməyibsə).
   */
  addItem: (itemData) =>
    set((state) => ({
      items: [...state.items, { ...itemData, id: itemData.id || generateId() }],
    })),

  /**
   * Bir formula elementini onun unikal ID-si ilə silir.
   * @param {string} itemIdToRemove - Silinəcək elementin ID-si.
   */
  removeItemById: (itemIdToRemove) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== itemIdToRemove),
    })),

  /**
   * `items` array-indəki sonuncu elementi silir.
   * Bu, məsələn, contentEditable sahəsi boş olduqda Backspace basıldıqda istifadə oluna bilər.
   */
  removeLastItem: () =>
    set((state) => ({
      items: state.items.length > 0 ? state.items.slice(0, -1) : [],
    })),

  /**
   * Bir formula elementini onun unikal ID-si ilə tapıb yeniləyir.
   * @param {string} itemIdToUpdate - Yenilənəcək elementin ID-si.
   * @param {object} updatedProps - Elementə tətbiq ediləcək yeni və ya dəyişdirilmiş xüsusiyyətlər.
   *                              Məsələn, bir tag-in label-ini dəyişmək üçün: { label: 'Yeni Ad' }
   */
  updateItemById: (itemIdToUpdate, updatedProps) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemIdToUpdate ? { ...item, ...updatedProps } : item
      ),
    })),

  // Əgər əvvəlki `addTag`, `removeTag`, `updateTag` funksiyalarınıza
  // hələ də ehtiyacınız varsa, onları da bu yeni obyekt strukturuna
  // uyğunlaşdıra bilərsiniz. Amma yuxarıdakı ID-əsaslı funksiyalar
  // contentEditable ilə işləmək üçün daha etibarlıdır.
  // Məsələn, köhnə addTag:
  // addTag_legacy: (tagString) => set((state) => ({ items: [...state.items, { type: 'tag', label: tagString, id: generateId() }] })),
}));

export default useFormulaStore;