const DUMMY_SUGGESTIONS = [
  "Sales", "Revenue", "Expenses", "Profit", "COGS",
  "Marketing Spend", "Salaries", "Rent", "Utilities",
  "Net Income", "Gross Profit", "Operating Expenses"
];

export const fetchSuggestions = async (query) => {
  console.log("Fetching suggestions for:", query);
  if (!query || query.trim() === "") {
    return [];
  }

  const lowerCaseQuery = query.toLowerCase();
  const filtered = DUMMY_SUGGESTIONS.filter(suggestion =>
    suggestion.toLowerCase().includes(lowerCaseQuery)
  );

  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

  console.log("Filtered suggestions:", filtered);
  return filtered;
};
