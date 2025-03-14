import axios from 'axios'

export const fetchSuggestions = async (query) => {
  // If query is empty, return an empty array
  if (!query) return []
  const { data } = await axios.get(`https://your-api-endpoint.com/autocomplete?q=${query}`)
  return data
}
