import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import useFormulaStore from '../store/formulaStore'
import { fetchSuggestions } from '../api/suggestions'

const FormulaInput = () => {
  const { formula, addTag, removeTag } = useFormulaStore()
  const [inputValue, setInputValue] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  // Dummy Variables for calculation
  const dummyVariables = {
    x: 10,
    y: 5,
    z: 20,
  }

  // Fetch autocomplete suggestions only when there is input
  const { data: suggestions = [] } = useQuery({
    queryKey: ['suggestions', inputValue],
    queryFn: () => fetchSuggestions(inputValue),
    enabled: inputValue.trim().length > 0,
  })

  // Calculate result from the formula
  const calculateFormula = () => {
    const expression = formula.join(' ')

    // Replace variables with their values
    const updatedExpression = expression.replace(/x|y|z/g, (match) => dummyVariables[match])

    // Check if the updated expression is safe to evaluate
    if (/[^a-zA-Z0-9+\-*/^(). ]/g.test(updatedExpression)) {
      return 'Invalid Expression'
    }

    try {
      // Use eval for simplicity (can be replaced with a safer parser if needed)
      const result = eval(updatedExpression)
      return result
    } catch (error) {
      return 'Invalid Expression'
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      addTag(inputValue.trim())
      setInputValue('')
      setShowDropdown(false)
    }
    if (e.key === 'Backspace' && !inputValue) {
      removeTag(formula.length - 1)
    }
  }

  return (
    <div style={{ position: 'relative', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
        {formula.map((tag, index) => (
          <FormulaTag key={index} tag={tag} index={index} />
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowDropdown(true)}
          style={{ flex: 1, border: 'none', outline: 'none', minWidth: '100px' }}
          placeholder="Enter formula..."
        />
      </div>
      {showDropdown && suggestions.length > 0 && (
        <ul style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          position: 'absolute',
          background: '#fff',
          border: '1px solid #ccc',
          width: '200px',
          zIndex: 100,
          marginTop: '2px'
        }}>
          {suggestions.map((suggestion, idx) => (
            <li
              key={idx}
              onClick={() => {
                addTag(suggestion)
                setInputValue('')
                setShowDropdown(false)
              }}
              style={{ padding: '5px', cursor: 'pointer' }}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
      <div>
        {/* Calculate and display the result */}
        <h3>Result: {calculateFormula()}</h3>
      </div>
    </div>
  )
}

const FormulaTag = ({ tag, index }) => {
  const { removeTag } = useFormulaStore()
  const [dropdownVisible, setDropdownVisible] = useState(false)

  const toggleDropdown = () => {
    setDropdownVisible(!dropdownVisible)
  }

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <span
        style={{
          padding: '5px 10px',
          background: '#e0e0e0',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
        onClick={toggleDropdown}
      >
        {tag}
      </span>
      {dropdownVisible && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          background: '#fff',
          border: '1px solid #ccc',
          borderRadius: '4px',
          zIndex: 100
        }}>
          <button
            onClick={() => { removeTag(index); setDropdownVisible(false) }}
            style={{ padding: '5px', cursor: 'pointer' }}
          >
            Delete
          </button>
          <button
            onClick={() => { setDropdownVisible(false) }}
            style={{ padding: '5px', cursor: 'pointer' }}
          >
            Edit
          </button>
        </div>
      )}
    </div>
  )
}

export default FormulaInput
