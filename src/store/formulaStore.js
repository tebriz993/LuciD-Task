import { create } from 'zustand'

const useFormulaStore = create((set) => ({
  // We store the elements within the formula (numbers, operators, etc.)
  formula: [],
  setFormula: (newFormula) => set({ formula: newFormula }),
  addTag: (tag) => set((state) => ({ formula: [...state.formula, tag] })),
  removeTag: (index) => set((state) => ({
    formula: state.formula.filter((_, i) => i !== index)
  })),
  updateTag: (index, newTag) =>
    set((state) => ({
      formula: state.formula.map((tag, i) => (i === index ? newTag : tag)),
    })),
}))

export default useFormulaStore
