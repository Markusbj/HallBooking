import { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export function usePageContent(pageName, sectionName = null) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const url = sectionName 
          ? `${API}/api/page-content/${pageName}?section_name=${sectionName}`
          : `${API}/api/page-content/${pageName}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Kunne ikke hente sideinnhold');
        }
        
        const data = await response.json();
        
        if (sectionName) {
          setContent(data);
        } else {
          // Group content by section_name for easy access
          const groupedContent = {};
          if (data.content) {
            data.content.forEach(item => {
              groupedContent[item.section_name] = item;
            });
          }
          setContent(groupedContent);
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching page content:', err);
      } finally {
        setLoading(false);
      }
    };

    if (pageName) {
      fetchContent();
    }
  }, [pageName, sectionName]);

  return { content, loading, error };
}

export function getContentValue(content, sectionName, fallback = '') {
  if (!content) return fallback;
  
  if (typeof content === 'object' && content.section_name === sectionName) {
    return content.content || fallback;
  }
  
  if (typeof content === 'object' && content[sectionName]) {
    return content[sectionName].content || fallback;
  }
  
  return fallback;
}
