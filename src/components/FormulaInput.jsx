
import React, { useState, useRef, useEffect, useCallback } from 'react';
import useFormulaStore from '../store/formulaStore';
import { useQuery } from '@tanstack/react-query';
import { fetchSuggestions } from '../api/suggestions';

const OPERATORS = ['+', '-', '*', '/', '^'];
const PARENTHESES = ['(', ')'];

const FormulaInput = () => {
  const { items, addItem, removeLastItem, removeItemById, updateItemById } = useFormulaStore();
  
  const [currentInputText, setCurrentInputText] = useState('');
  
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const editorAreaRef = useRef(null);         
  const currentInputSpanRef = useRef(null); 
  const autocompleteRef = useRef(null);

  const dummyVariables = { x: 10, y: 5, z: 20, Sales: 1000, Expenses: 300, Revenue: 1500, Profit: 700, salam: 50, aa: 2, werfwer: 3, uiknt: 4 };

  // Prepare query for autocomplete, removing '@' if present for tag suggestions
  const autocompleteQuery = (currentInputText.startsWith('@') ? currentInputText.substring(1) : currentInputText).trim();

  const { data: suggestions = [], isLoading: isLoadingSuggestions } = useQuery({
    queryKey: ['suggestions', autocompleteQuery],
    queryFn: () => fetchSuggestions(autocompleteQuery),
    enabled: !!autocompleteQuery && showAutocomplete && !OPERATORS.includes(currentInputText.trim()) && isNaN(parseFloat(currentInputText.trim())),
  });

  const focusAndClearInputSpan = useCallback(() => {
    setTimeout(() => {
      if (currentInputSpanRef.current) {
        currentInputSpanRef.current.textContent = ''; 
        currentInputSpanRef.current.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        if (sel) {
          range.selectNodeContents(currentInputSpanRef.current);
          range.collapse(false); 
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    }, 0);
  }, []);

  // Processes the current input text and adds it as an item (operand, number, or tag)
  const processAndAddItem = (textToProcess) => {
    const text = textToProcess.trim();
    if (!text) { 
        setCurrentInputText('');
        setShowAutocomplete(false);
        focusAndClearInputSpan();
        return; 
    }

    if (OPERATORS.includes(text) || PARENTHESES.includes(text)) {
      addItem({ type: 'operand', value: text });
    } else if (!isNaN(parseFloat(text)) && isFinite(text)) {
      addItem({ type: 'number', value: parseFloat(text) });
    } else if (text.startsWith('@') && text.length > 1) {
      addItem({ type: 'tag', label: text.substring(1) });
    } else if (text) {
      addItem({ type: 'tag', label: text }); 
    }
    
    setCurrentInputText(''); 
    setShowAutocomplete(false);
    focusAndClearInputSpan(); 
  };

  // Handles key down events on the editable span
  const handleKeyDown = (e) => {
   
    if (showAutocomplete && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestionIndex((prev) => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestionIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        if (suggestions[activeSuggestionIndex]) {
          e.preventDefault();
          const selected = suggestions[activeSuggestionIndex];
          const queryStartIndex = currentInputText.toLowerCase().lastIndexOf(autocompleteQuery.toLowerCase());
          if (queryStartIndex > 0) {
              const textBeforeQuery = currentInputText.substring(0, queryStartIndex);
              processAndAddItem(textBeforeQuery.trim());
          }
          addItem({ type: 'tag', label: selected.name || selected });
          setCurrentInputText('');
          setShowAutocomplete(false);
          focusAndClearInputSpan();
          return;
        }
      }
    }

    // Operator and parenthesis handling
    if (OPERATORS.includes(e.key) || PARENTHESES.includes(e.key)) {
      e.preventDefault();
      processAndAddItem(currentInputText); 
      addItem({ type: 'operand', value: e.key });
      if (!currentInputText.trim()) {
          focusAndClearInputSpan();
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      processAndAddItem(currentInputText);
      return;
    }

    if (e.key === 'Backspace') {
      if (currentInputText.length > 0) {
        
      } else if (items.length > 0) {
        e.preventDefault(); 
        const lastItem = items[items.length - 1];
        let textToRestore = '';
        if (lastItem.type === 'tag') textToRestore = '@' + lastItem.label;
        else if (lastItem.type === 'number' || lastItem.type === 'operand') textToRestore = lastItem.value.toString();
        
        removeLastItem();
        setCurrentInputText(textToRestore); 
        setShowAutocomplete(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      setShowAutocomplete(false);
      return;
    }
    
   
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      setShowAutocomplete(true); 
    }
  };


  const calculateFormula = () => {
    let expressionString = '';
    let errorInExpression = false;
    if (items.length === 0) return "0";

    items.forEach(item => {
      if (item.type === 'tag') {
        expressionString += dummyVariables[item.label] !== undefined ? dummyVariables[item.label] : '0';
      } else if (item.type === 'number' || item.type === 'operand') {
        expressionString += item.value;
      } else {
        errorInExpression = true;
      }
      expressionString += ' ';
    });

    if (errorInExpression) return 'Invalid Expression';
    if (expressionString.trim() === "") return 'Invalid Expression';

    try {
      const result = new Function(`"use strict"; return (${expressionString.trim()})`)();
      return isNaN(result) || result === undefined || result === null ? 'Invalid Expression' : result.toString();
    } catch (err) {
      return 'Invalid Expression';
    }
  };

  // Handles selection of an autocomplete suggestion
  const handleSelectSuggestion = (suggestion) => {
    const label = suggestion.name || suggestion;
    const atIndex = currentInputText.lastIndexOf('@');

    if (atIndex > -1) { 
        const textBeforeAt = currentInputText.substring(0, atIndex).trim();
        if (textBeforeAt) {
            processAndAddItem(textBeforeAt); 
        }
    } else { 
        const queryStartIndex = currentInputText.toLowerCase().lastIndexOf(autocompleteQuery.toLowerCase());
        if (queryStartIndex > 0) {
            const textBeforeQuery = currentInputText.substring(0, queryStartIndex).trim();
            if(textBeforeQuery) processAndAddItem(textBeforeQuery);
        }
    }

    addItem({ type: 'tag', label: label });
    setCurrentInputText(''); 
    setShowAutocomplete(false);
    focusAndClearInputSpan();
  };
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        autocompleteRef.current && !autocompleteRef.current.contains(event.target) &&
        editorAreaRef.current && !editorAreaRef.current.contains(event.target)
      ) {
        setShowAutocomplete(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  useEffect(() => {
    if (currentInputSpanRef.current && currentInputSpanRef.current.textContent !== currentInputText) {
        currentInputSpanRef.current.textContent = currentInputText; // Update DOM
        
        setTimeout(() => { 
            if(currentInputSpanRef.current && window.getSelection) {
                const range = document.createRange();
                const sel = window.getSelection();
                if (sel) {
                    if (currentInputSpanRef.current.childNodes.length > 0) {
                        const textNode = currentInputSpanRef.current.childNodes[0];
                    
                        if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                            range.setStart(textNode, textNode.textContent.length);
                            range.collapse(true); 
                        } else {
                            range.selectNodeContents(currentInputSpanRef.current);
                            range.collapse(false);
                        }
                    } else {
                        range.selectNodeContents(currentInputSpanRef.current);
                        range.collapse(false); // Collapse to the end of the span
                    }
                    sel.removeAllRanges();
                    sel.addRange(range);
                 
                }
            }
        }, 0);
    }
  }, [currentInputText]);


  return (
    <div style={{ position: 'relative', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#f0f0f0' }}>
      {}
      <div
        className="formula-editor-area"
        ref={editorAreaRef}
        onClick={() => currentInputSpanRef.current?.focus()} 
        style={{
          border: '1px solid #bdbdbd', minHeight: '40px', padding: '8px',
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '5px',
          lineHeight: '1.8', cursor: 'text', outline: 'none',
          backgroundColor: 'white', color: '#333'
        }}
        data-placeholder={items.length === 0 && currentInputText === '' ? "Type formula, use @ for tags..." : ""}
      >
        {items.map((item) => (
          <FormulaTag
            key={item.id}
            item={item}
            removeItemById={removeItemById}
            updateItemById={updateItemById}
          />
        ))}
        {}
        <span
            ref={currentInputSpanRef}
            contentEditable="true"
            className="current-input-span"
            onKeyDown={handleKeyDown}
            onInput={(e) => { 
                const text = e.currentTarget.textContent || '';
                setCurrentInputText(text); 
                setShowAutocomplete(!!text.trim());
                if (text.trim()) setActiveSuggestionIndex(0);
            }}
            onFocus={() => setShowAutocomplete(!!currentInputText.trim())} 
            style={{
                display: 'inline-block', minWidth: '20px',
                outline: 'none', padding: '0 2px', border: 'none',
                flexGrow: 1, 
                color: '#333', 
                whiteSpace: 'pre' 
            }}
        />
      </div>

      {}
      {showAutocomplete && autocompleteQuery && ( 
        <ul ref={autocompleteRef} style={{
          listStyle: 'none', padding: 0, margin: '5px 0 0 0', position: 'absolute',
          background: '#fff', border: '1px solid #ccc', borderRadius: '4px',
          width: 'calc(100% - 18px)',
          maxHeight: '200px', overflowY: 'auto', 
          zIndex: 1010, boxShadow: '0 4px 6px rgba(0,0,0,0.1)', color: '#333'
        }}>
          {isLoadingSuggestions && <li style={{padding: '8px', color: '#777'}}>Loading...</li>}
          {!isLoadingSuggestions && suggestions.length > 0 && suggestions.map((suggestion, idx) => (
            <li
              key={suggestion.id || suggestion.name || idx} 
              onClick={() => handleSelectSuggestion(suggestion)}
              style={{ padding: '8px 12px', cursor: 'pointer',
                       backgroundColor: idx === activeSuggestionIndex ? '#e9ecef' : 'transparent', 
                       borderBottom: idx === suggestions.length - 1 ? 'none' : '1px solid #eee',
                       color: '#333'
                     }}
              onMouseEnter={() => setActiveSuggestionIndex(idx)}
            >
              {suggestion.name || suggestion} 
            </li>
          ))}
          {!isLoadingSuggestions && suggestions.length === 0 && autocompleteQuery &&
            <li style={{padding: '8px', color: '#777'}}>No suggestions for "{autocompleteQuery}"</li>
          }
        </ul>
      )}
      {}
      <div style={{marginTop: '10px'}}>
        <h3 style={{color: items.length > 0 && calculateFormula() === 'Invalid Expression' ? '#dc3545' : '#28a745' }}>
            Result: {calculateFormula()}
        </h3>
      </div>
    </div>
  );
};

// Component to render individual formula items
const FormulaTag = ({ item, removeItemById, updateItemById }) => {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.type === 'tag' ? item.label : '');
  const dropdownRef = useRef(null);

  const toggleDropdown = () => setDropdownVisible(prev => !prev);

  const handleDelete = () => {
    removeItemById(item.id);
    setDropdownVisible(false);
  };

  const handleEdit = () => {
    if (item.type === 'tag') {
      setIsEditing(true);
      setEditText(item.label);
      setDropdownVisible(false);
    }
  };

  const handleSaveEdit = () => {
    if (item.type === 'tag' && editText.trim()) {
      updateItemById(item.id, { label: editText.trim() });
    }
    setIsEditing(false);
  };
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownVisible(false);
      }
    };
    if (dropdownVisible) document.addEventListener('mousedown', handleClickOutside);
    else document.removeEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownVisible]);

  if (isEditing && item.type === 'tag') {
    return (
      <span data-is-tag-editor="true" style={{display: 'inline-flex'}}>
        <input
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleSaveEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); handleSaveEdit(); }
            else if (e.key === 'Escape') { setIsEditing(false); setEditText(item.label); }
          }}
          autoFocus
          style={{ 
            padding: '3px 6px', border: '1px solid #777', borderRadius: '3px', 
            background: '#fff', outline: 'none', marginRight: '4px', color: '#333'
          }}
        />
      </span>
    );
  }

  let displayValue = '';
  let tagStyle = { 
    padding: '3px 8px', borderRadius: '3px', display: 'inline-flex',
    alignItems: 'center', userSelect: 'none', marginRight: '4px',
    marginBottom: '4px', position: 'relative', whiteSpace: 'nowrap',
    color: '#333' 
  };

  if (item.type === 'tag') {
    displayValue = item.label;
    tagStyle.background = '#e0e0e0'; tagStyle.border = '1px solid #bdbdbd'; tagStyle.cursor = 'pointer';
  } else if (item.type === 'operand') {
    displayValue = item.value; tagStyle.background = '#f0f0f0'; tagStyle.fontWeight = 'bold'; tagStyle.color = '#555';
  } else if (item.type === 'number') {
    displayValue = item.value.toString(); tagStyle.background = '#d1ecf1'; tagStyle.border = '1px solid #bee5eb'; tagStyle.color = '#0c5460';
  }

  const dropdownMenuContainerStyle = { 
    position: 'absolute', top: 'calc(100% + 3px)', right: 0, background: '#fff',
    border: '1px solid #ccc', borderRadius: '4px', zIndex: 1010, minWidth: '100px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)', color: '#333'
  };
  const dropdownButtonStyle = {
    display: 'block', width: '100%', textAlign: 'left', padding: '6px 10px',
    cursor: 'pointer', background: 'none', border: 'none', fontSize: '13px',
    color: '#333'
  };

  return (
    <span style={tagStyle} onClick={item.type === 'tag' ? toggleDropdown : undefined} data-id={item.id} title={item.type === 'tag' ? `Tag: ${item.label}` : item.type}>
      {displayValue}
      {item.type === 'tag' && dropdownVisible && (
        <div ref={dropdownRef} style={dropdownMenuContainerStyle}>
          <button 
            onClick={handleEdit} 
            style={{ ...dropdownButtonStyle, borderBottom: '1px solid #eee' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'} 
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            Edit
          </button>
          <button 
            onClick={handleDelete} 
            style={dropdownButtonStyle} // Removed borderBottom for the last button
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'} 
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            Delete
          </button>
        </div>
      )}
    </span>
  );
};

export default FormulaInput;
