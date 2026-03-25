import React from 'react';

/**
 * Text Highlight Utility for Search Results
 */

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Smart Tokenization: Extract special keywords ('มือ 1', 'มือ 2', 'มือ1', 'มือ2') before splitting
 */
function smartTokenize(query: string): string[] {
  if (!query || typeof query !== 'string') return [];
  
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  
  const tokens: string[] = [];
  let remainingText = normalized;
  
  // Extract special keywords: 'มือ 1', 'มือ 2', 'มือ1', 'มือ2'
  const specialPatterns = [/มือ\s*1/g, /มือ\s*2/g];
  
  // Find all special keywords and their positions
  const specialMatches: Array<{ text: string; index: number }> = [];
  specialPatterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(remainingText)) !== null) {
      specialMatches.push({
        text: match[0],
        index: match.index,
      });
    }
  });
  
  // Sort by index (ascending)
  specialMatches.sort((a, b) => a.index - b.index);
  
  // Extract special keywords and remaining text
  let lastIndex = 0;
  specialMatches.forEach((match) => {
    if (match.index > lastIndex) {
      const beforeText = remainingText.substring(lastIndex, match.index).trim();
      if (beforeText) {
        const beforeTokens = beforeText.split(/\s+/).filter((t) => t.length > 0);
        tokens.push(...beforeTokens);
      }
    }
    
    const normalizedKeyword = match.text.replace(/\s+/g, ' ').trim();
    if (normalizedKeyword === 'มือ1' || normalizedKeyword === 'มือ 1') {
      tokens.push('มือ 1');
    } else if (normalizedKeyword === 'มือ2' || normalizedKeyword === 'มือ 2') {
      tokens.push('มือ 2');
    } else {
      tokens.push(normalizedKeyword);
    }
    
    lastIndex = match.index + match.text.length;
  });
  
  if (lastIndex < remainingText.length) {
    const afterText = remainingText.substring(lastIndex).trim();
    if (afterText) {
      const afterTokens = afterText.split(/\s+/).filter((t) => t.length > 0);
      tokens.push(...afterTokens);
    }
  }
  
  if (specialMatches.length === 0) {
    return normalized.split(/\s+/).filter((t) => t.length > 0);
  }
  
  return tokens.filter((t) => t.length > 0);
}

/**
 * Highlight text with search query (Multi-word support with Smart Tokenization)
 */
export function highlightText(text: string, query: string): React.ReactNode {
  if (!text || typeof text !== 'string') return text;
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return text;
  }

  try {
    const keywords = smartTokenize(query);

    if (keywords.length === 0) return text;

    const escapedKeywords = keywords.map((keyword) => escapeRegex(keyword));
    const pattern = new RegExp(`(${escapedKeywords.join('|')})`, 'gi');

    const parts = text.split(pattern);

    return parts.map((part, index) => {
      if (!part || part.length === 0) return '';
      
      const normalizedPart = part.toLowerCase().trim();
      
      const isMatch = keywords.some((keyword) => {
        const normalizedKeyword = keyword.toLowerCase().trim();
        if (normalizedKeyword.includes(' ')) {
          return normalizedPart === normalizedKeyword || normalizedPart.includes(normalizedKeyword);
        }
        return normalizedPart.includes(normalizedKeyword);
      });

      if (isMatch && part.length > 0) {
        return React.createElement(
          'mark',
          {
            key: index,
            className: 'bg-yellow-200 text-black rounded-sm px-0.5 font-medium',
          },
          part
        );
      }

      return part;
    });
  } catch (error) {
    console.error('highlightText error:', error);
    return text;
  }
}

/**
 * Highlight text in an array of tags
 */
export function highlightTags(tags: string[], query: string): React.ReactNode[] {
  if (!Array.isArray(tags) || tags.length === 0) return [];
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return tags;
  }

  try {
    return tags.map((tag, index) => {
      if (typeof tag !== 'string') return tag;
      return React.createElement(
        'span',
        { key: index, className: 'inline-block' },
        highlightText(tag, query)
      );
    });
  } catch (error) {
    console.error('highlightTags error:', error);
    return tags;
  }
}
