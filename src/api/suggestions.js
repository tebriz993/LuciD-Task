// src/api/suggestions.js

const DUMMY_SUGGESTIONS = [
  "Sales", "Revenue", "Expenses", "Profit", "COGS",
  "Marketing Spend", "Salaries", "Rent", "Utilities",
  "Net Income", "Gross Profit", "Operating Expenses"
];

export const fetchSuggestions = async (query) => {
  console.log("Fetching suggestions for:", query); // Konsolda yoxlamaq üçün
  if (!query || query.trim() === "") {
    return [];
  }

  // Sadə bir filterləmə (real API-də bu server tərəfində olar)
  const lowerCaseQuery = query.toLowerCase();
  const filtered = DUMMY_SUGGESTIONS.filter(suggestion =>
    suggestion.toLowerCase().includes(lowerCaseQuery)
  );

  // API cavabını simulyasiya etmək üçün kiçik bir gecikmə (opsional)
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

  console.log("Filtered suggestions:", filtered); // Konsolda yoxlamaq üçün
  return filtered;
};