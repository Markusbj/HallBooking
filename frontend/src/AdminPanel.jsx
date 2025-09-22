import React, { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function AdminPanel() {
  const [activeTab, setActiveTab] = useState('content');
  const [pageContent, setPageContent] = useState([]);
  const [editingContent, setEditingContent] = useState(null);
  const [blockedTimes, setBlockedTimes] = useState([]);
  const [editingBlockedTime, setEditingBlockedTime] = useState(null);
  const [selectedPage, setSelectedPage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [bookingFilter, setBookingFilter] = useState({
    search: '',
    hall: '',
    dateFrom: '',
    dateTo: ''
  });
  const [users, setUsers] = useState([]);
  const [userFilter, setUserFilter] = useState({
    search: '',
    role: '',
    status: ''
  });
  const [editingBooking, setEditingBooking] = useState(null);
  const [bookingEditForm, setBookingEditForm] = useState({
    hall: '',
    start_time: '',
    end_time: ''
  });

  useEffect(() => {
    if (activeTab === 'content') {
      fetchPageContent();
    } else if (activeTab === 'blocking') {
      fetchBlockedTimes();
    } else if (activeTab === 'bookings') {
      fetchBookings();
    } else if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchPageContent = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/api/page-content`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Kunne ikke hente sideinnhold');
      }
      
      const data = await response.json();
      setPageContent(data.content || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveContent = async (contentId, content, contentType) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/api/page-content/${contentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: content,
          content_type: contentType
        })
      });
      
      if (!response.ok) {
        throw new Error('Kunne ikke lagre endringer');
      }
      
      await fetchPageContent();
      setEditingContent(null);
      setSelectedPage('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createContent = async (pageName, sectionName, content, contentType) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/api/page-content`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          page_name: pageName,
          section_name: sectionName,
          content: content,
          content_type: contentType
        })
      });
      
      if (!response.ok) {
        throw new Error('Kunne ikke opprette innhold');
      }
      
      await fetchPageContent();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlockedTimes = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/api/blocked-times`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Kunne ikke hente blokkerte tider');
      }
      
      const data = await response.json();
      setBlockedTimes(data.blocked_times || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createBlockedTime = async (blockType, startDate, endDate, hour, dayOfWeek, reason) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/api/blocked-times`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          block_type: blockType,
          start_date: startDate,
          end_date: endDate,
          hour: hour,
          day_of_week: dayOfWeek,
          reason: reason
        })
      });
      
      if (!response.ok) {
        throw new Error('Kunne ikke opprette blokkering');
      }
      
      await fetchBlockedTimes();
      setEditingBlockedTime(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteBlockedTime = async (blockedTimeId) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/api/blocked-times/${blockedTimeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Kunne ikke slette blokkering');
      }
      
      await fetchBlockedTimes();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/api/admin/bookings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Kunne ikke hente bookinger');
      }
      
      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Kunne ikke hente brukere');
      }
      
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const editBooking = async (booking) => {
    setEditingBooking(booking);
    setBookingEditForm({
      hall: booking.hall || '',
      start_time: booking.start_time ? new Date(booking.start_time).toISOString().slice(0, 16) : '',
      end_time: booking.end_time ? new Date(booking.end_time).toISOString().slice(0, 16) : ''
    });
  };

  const saveBookingEdit = async () => {
    if (!editingBooking) return;
    
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/bookings/${editingBooking.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hall: bookingEditForm.hall,
          start_time: bookingEditForm.start_time,
          end_time: bookingEditForm.end_time
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Kunne ikke oppdatere booking');
      }
      
      // Refresh bookings
      await fetchBookings();
      setEditingBooking(null);
      setBookingEditForm({ hall: '', start_time: '', end_time: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelBookingEdit = () => {
    setEditingBooking(null);
    setBookingEditForm({ hall: '', start_time: '', end_time: '' });
  };

  const deleteBooking = async (bookingId) => {
    if (!window.confirm('Er du sikker på at du vil slette denne bookingen?')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Kunne ikke slette booking');
      }
      
      await fetchBookings();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = !bookingFilter.search || 
      booking.user?.name?.toLowerCase().includes(bookingFilter.search.toLowerCase()) ||
      booking.user?.email?.toLowerCase().includes(bookingFilter.search.toLowerCase()) ||
      booking.user?.phone?.toLowerCase().includes(bookingFilter.search.toLowerCase()) ||
      booking.hall?.toLowerCase().includes(bookingFilter.search.toLowerCase());
    
    const matchesHall = !bookingFilter.hall || booking.hall === bookingFilter.hall;
    
    const bookingDate = new Date(booking.start_time);
    const fromDate = bookingFilter.dateFrom ? new Date(bookingFilter.dateFrom) : null;
    const toDate = bookingFilter.dateTo ? new Date(bookingFilter.dateTo) : null;
    
    const matchesDateFrom = !fromDate || bookingDate >= fromDate;
    const matchesDateTo = !toDate || bookingDate <= toDate;
    
    return matchesSearch && matchesHall && matchesDateFrom && matchesDateTo;
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = !userFilter.search || 
      user.full_name?.toLowerCase().includes(userFilter.search.toLowerCase()) ||
      user.email?.toLowerCase().includes(userFilter.search.toLowerCase());
    
    const matchesRole = !userFilter.role || 
      (userFilter.role === 'admin' && user.is_superuser) ||
      (userFilter.role === 'user' && !user.is_superuser);
    
    const matchesStatus = !userFilter.status || 
      (userFilter.status === 'active' && user.is_active) ||
      (userFilter.status === 'inactive' && !user.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getUniqueHalls = () => {
    const halls = [...new Set(bookings.map(b => b.hall).filter(Boolean))];
    return halls;
  };

  // Mapping for user-friendly section names
  const sectionLabels = {
    'hero_title': 'Hovedtittel',
    'hero_subtitle': 'Undertekst under hovedtittel',
    'features_title': 'Tittel for funksjoner',
    'about_title': 'Tittel for "Om oss"',
    'about_text1': 'Første avsnitt "Om oss"',
    'about_text2': 'Andre avsnitt "Om oss"',
    'cta_title': 'Tittel for "Book nå"',
    'cta_text': 'Tekst for "Book nå"',
    'pageTitle': 'Sidetittel',
    'pageSubtitle': 'Undertekst på siden',
    'contactTitle': 'Tittel for kontaktinformasjon',
    'addressTitle': 'Tittel for adresse',
    'addressText': 'Adresse og beskrivelse',
    'phoneTitle': 'Tittel for telefon',
    'phoneText': 'Telefonnummer og beskrivelse',
    'emailTitle': 'Tittel for e-post',
    'emailText': 'E-postadresse og beskrivelse',
    'hoursTitle': 'Tittel for åpningstider',
    'socialTitle': 'Tittel for sosiale medier',
    'formTitle': 'Tittel for kontaktformular',
    'mapTitle': 'Tittel for kart',
    'mapText': 'Beskrivelse av kart',
    'locationTitle': 'Tittel for lokasjon',
    'locationText': 'Beskrivelse av lokasjon',
    'instructorsTitle': 'Tittel for instruktører',
    'instructorsDescription': 'Beskrivelse av instruktører',
    'historyTitle': 'Tittel for historie',
    'historyText': 'Historietekst',
    'missionTitle': 'Tittel for misjon',
    'missionText': 'Misjonstekst'
  };

  // Descriptions for each section to help users understand what they're editing
  const sectionDescriptions = {
    'hero_title': 'Den store tittelen øverst på forsiden',
    'hero_subtitle': 'Beskrivende tekst under hovedtittelen',
    'features_title': 'Tittelen for funksjoner-seksjonen',
    'about_title': 'Tittelen for "Om oss"-seksjonen',
    'about_text1': 'Første avsnitt i "Om oss"-seksjonen',
    'about_text2': 'Andre avsnitt i "Om oss"-seksjonen',
    'cta_title': 'Tittelen for "Book nå"-knappen',
    'cta_text': 'Teksten som vises på "Book nå"-knappen',
    'pageTitle': 'Hovedtittelen på siden',
    'pageSubtitle': 'Beskrivende tekst under sidetittelen',
    'contactTitle': 'Tittelen for kontaktinformasjon-seksjonen',
    'addressTitle': 'Tittelen for adresse-seksjonen',
    'addressText': 'Adressen og beskrivelse av lokasjonen',
    'phoneTitle': 'Tittelen for telefon-seksjonen',
    'phoneText': 'Telefonnummeret og beskrivelse',
    'emailTitle': 'Tittelen for e-post-seksjonen',
    'emailText': 'E-postadressen og beskrivelse',
    'hoursTitle': 'Tittelen for åpningstider-seksjonen',
    'socialTitle': 'Tittelen for sosiale medier-seksjonen',
    'formTitle': 'Tittelen for kontaktformularen',
    'mapTitle': 'Tittelen for kart-seksjonen',
    'mapText': 'Beskrivelse av kartet og lokasjonen',
    'locationTitle': 'Tittelen for lokasjon-seksjonen',
    'locationText': 'Beskrivelse av lokasjonen',
    'instructorsTitle': 'Tittelen for instruktører-seksjonen',
    'instructorsDescription': 'Beskrivelse av instruktørene',
    'historyTitle': 'Tittelen for historie-seksjonen',
    'historyText': 'Tekst om historien til organisasjonen',
    'missionTitle': 'Tittelen for misjon-seksjonen',
    'missionText': 'Tekst om organisasjonens misjon'
  };

  const pageLabels = {
    'landing': 'Forside',
    'kontakt': 'Kontakt oss',
    'instruktorer': 'Instruktører',
    'om-oss': 'Om oss'
  };

  // Get sections for a specific page
  const getSectionsForPage = (pageName) => {
    const sections = {
      'landing': [
        { value: 'hero_title', label: 'Hovedtittel', description: 'Den store tittelen øverst på forsiden' },
        { value: 'hero_subtitle', label: 'Undertekst under hovedtittel', description: 'Beskrivende tekst under hovedtittelen' },
        { value: 'features_title', label: 'Tittel for funksjoner', description: 'Tittelen for funksjoner-seksjonen' },
        { value: 'about_title', label: 'Tittel for "Om oss"', description: 'Tittelen for "Om oss"-seksjonen' },
        { value: 'about_text1', label: 'Første avsnitt "Om oss"', description: 'Første avsnitt i "Om oss"-seksjonen' },
        { value: 'about_text2', label: 'Andre avsnitt "Om oss"', description: 'Andre avsnitt i "Om oss"-seksjonen' },
        { value: 'cta_title', label: 'Tittel for "Book nå"', description: 'Tittelen for "Book nå"-knappen' },
        { value: 'cta_text', label: 'Tekst for "Book nå"', description: 'Teksten som vises på "Book nå"-knappen' }
      ],
      'kontakt': [
        { value: 'pageTitle', label: 'Sidetittel', description: 'Hovedtittelen på siden' },
        { value: 'pageSubtitle', label: 'Undertekst på siden', description: 'Beskrivende tekst under sidetittelen' },
        { value: 'contactTitle', label: 'Tittel for kontaktinformasjon', description: 'Tittelen for kontaktinformasjon-seksjonen' },
        { value: 'addressTitle', label: 'Tittel for adresse', description: 'Tittelen for adresse-seksjonen' },
        { value: 'addressText', label: 'Adresse og beskrivelse', description: 'Adressen og beskrivelse av lokasjonen' },
        { value: 'phoneTitle', label: 'Tittel for telefon', description: 'Tittelen for telefon-seksjonen' },
        { value: 'phoneText', label: 'Telefonnummer og beskrivelse', description: 'Telefonnummeret og beskrivelse' },
        { value: 'emailTitle', label: 'Tittel for e-post', description: 'Tittelen for e-post-seksjonen' },
        { value: 'emailText', label: 'E-postadresse og beskrivelse', description: 'E-postadressen og beskrivelse' },
        { value: 'hoursTitle', label: 'Tittel for åpningstider', description: 'Tittelen for åpningstider-seksjonen' },
        { value: 'socialTitle', label: 'Tittel for sosiale medier', description: 'Tittelen for sosiale medier-seksjonen' },
        { value: 'formTitle', label: 'Tittel for kontaktformular', description: 'Tittelen for kontaktformularen' },
        { value: 'mapTitle', label: 'Tittel for kart', description: 'Tittelen for kart-seksjonen' },
        { value: 'mapText', label: 'Beskrivelse av kart', description: 'Beskrivelse av kartet og lokasjonen' },
        { value: 'locationTitle', label: 'Tittel for lokasjon', description: 'Tittelen for lokasjon-seksjonen' },
        { value: 'locationText', label: 'Beskrivelse av lokasjon', description: 'Beskrivelse av lokasjonen' }
      ],
      'instruktorer': [
        { value: 'pageTitle', label: 'Sidetittel', description: 'Hovedtittelen på siden' },
        { value: 'pageSubtitle', label: 'Undertekst på siden', description: 'Beskrivende tekst under sidetittelen' },
        { value: 'instructorsTitle', label: 'Tittel for instruktører', description: 'Tittelen for instruktører-seksjonen' },
        { value: 'instructorsDescription', label: 'Beskrivelse av instruktører', description: 'Beskrivelse av instruktørene' }
      ],
      'om-oss': [
        { value: 'pageTitle', label: 'Sidetittel', description: 'Hovedtittelen på siden' },
        { value: 'pageSubtitle', label: 'Undertekst på siden', description: 'Beskrivende tekst under sidetittelen' },
        { value: 'aboutTitle', label: 'Tittel for "Om oss"', description: 'Tittelen for "Om oss"-seksjonen' },
        { value: 'aboutText1', label: 'Første avsnitt "Om oss"', description: 'Første avsnitt i "Om oss"-seksjonen' },
        { value: 'aboutText2', label: 'Andre avsnitt "Om oss"', description: 'Andre avsnitt i "Om oss"-seksjonen' },
        { value: 'historyTitle', label: 'Tittel for historie', description: 'Tittelen for historie-seksjonen' },
        { value: 'historyText', label: 'Historietekst', description: 'Tekst om historien til organisasjonen' },
        { value: 'missionTitle', label: 'Tittel for misjon', description: 'Tittelen for misjon-seksjonen' },
        { value: 'missionText', label: 'Misjonstekst', description: 'Tekst om organisasjonens misjon' }
      ]
    };
    return sections[pageName] || [];
  };

  const groupedContent = pageContent.reduce((acc, item) => {
    if (!acc[item.page_name]) {
      acc[item.page_name] = [];
    }
    acc[item.page_name].push(item);
    return acc;
  }, {});

    return (
    <div className="page-container">
      <div className="page-header">
        <h1>Admin Panel</h1>
        <p className="page-subtitle">Administrer systeminnhold og innstillinger</p>
      </div>

      <div className="admin-tabs">
        <button 
          className={`tab-button ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveTab('content')}
        >
          Sideinnhold
        </button>
        <button 
          className={`tab-button ${activeTab === 'blocking' ? 'active' : ''}`}
          onClick={() => setActiveTab('blocking')}
        >
          Blokkeringer
        </button>
        <button 
          className={`tab-button ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          Bookinger
        </button>
        <button 
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Brukere
        </button>
      </div>

      {activeTab === 'content' && (
        <div className="content-management">
          <div className="content-header">
            <h2>Rediger sideinnhold</h2>
            <button 
              className="btn btn-primary"
              onClick={() => setEditingContent({ isNew: true })}
            >
              Legg til nytt innhold
            </button>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {loading && <div>Laster...</div>}

          {editingContent && editingContent.isNew && (
            <div className="content-editor">
              <h3>Legg til nytt innhold</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                createContent(
                  formData.get('pageName'),
                  formData.get('sectionName'),
                  formData.get('content'),
                  formData.get('contentType')
                );
              }}>
                <div className="form-group">
                  <label>Side:</label>
                  <select 
                    name="pageName" 
                    required 
                    value={selectedPage}
                    onChange={(e) => setSelectedPage(e.target.value)}
                  >
                    <option value="">Velg side</option>
                    <option value="landing">Forside</option>
                    <option value="kontakt">Kontakt oss</option>
                    <option value="om-oss">Om oss</option>
                    <option value="instruktorer">Instruktører</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Seksjon:</label>
                  <select name="sectionName" required disabled={!selectedPage}>
                    <option value="">{selectedPage ? 'Velg seksjon' : 'Velg side først'}</option>
                    {getSectionsForPage(selectedPage).map((section) => (
                      <option key={section.value} value={section.value} title={section.description}>
                        {section.label}
                      </option>
                    ))}
                  </select>
                  {selectedPage && getSectionsForPage(selectedPage).length === 0 && (
                    <small className="form-help">Ingen seksjoner tilgjengelig for denne siden</small>
                  )}
                </div>
                <div className="form-group">
                  <label>Innholdstype:</label>
                  <select name="contentType">
                    <option value="text">Tekst</option>
                    <option value="html">HTML</option>
                    <option value="markdown">Markdown</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Innhold:</label>
                  <textarea name="content" rows="6" required></textarea>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">Opprett</button>
                  <button 
                    type="button" 
                    className="btn btn-ghost" 
                    onClick={() => {
                      setEditingContent(null);
                      setSelectedPage('');
                    }}
                  >
                    Avbryt
                  </button>
                </div>
              </form>
            </div>
          )}

          {Object.entries(groupedContent).map(([pageName, sections]) => (
            <div key={pageName} className="page-section">
              <h3>{pageLabels[pageName] || pageName}</h3>
              {sections.map((item) => (
                <div key={item.id} className="content-item">
                  <div className="content-info">
                    <strong>{sectionLabels[item.section_name] || item.section_name}</strong>
                    <span className="content-type">({item.content_type})</span>
                    <div className="content-description">
                      {sectionDescriptions[item.section_name] || 'Beskrivelse ikke tilgjengelig'}
                    </div>
                    <small>Oppdatert: {new Date(item.updated_at).toLocaleString()}</small>
                  </div>
                  <div className="content-preview">
                    {item.content.length > 100 
                      ? `${item.content.substring(0, 100)}...` 
                      : item.content
                    }
                  </div>
                  <div className="content-actions">
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => setEditingContent(item)}
                    >
                      Rediger
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'blocking' && (
        <div className="blocking-management">
          <div className="content-header">
            <h2>Administrer blokkeringer</h2>
            <button 
              className="btn btn-primary"
              onClick={() => setEditingBlockedTime({ isNew: true })}
            >
              Legg til blokkering
            </button>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {loading && <div>Laster...</div>}

          {editingBlockedTime && editingBlockedTime.isNew && (
            <div className="blocking-editor">
              <h3>Legg til ny blokkering</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                createBlockedTime(
                  formData.get('blockType'),
                  formData.get('startDate'),
                  formData.get('endDate'),
                  formData.get('hour') ? parseInt(formData.get('hour')) : null,
                  formData.get('dayOfWeek') ? parseInt(formData.get('dayOfWeek')) : null,
                  formData.get('reason')
                );
              }}>
                <div className="form-group">
                  <label>Blokkeringstype:</label>
                  <select name="blockType" required onChange={(e) => {
                    const hourSelection = document.getElementById('hourSelection');
                    const daySelection = document.getElementById('daySelection');
                    if (e.target.value === 'hour') {
                      hourSelection.style.display = 'block';
                      daySelection.style.display = 'none';
                    } else if (e.target.value === 'weekly') {
                      hourSelection.style.display = 'none';
                      daySelection.style.display = 'block';
                    } else {
                      hourSelection.style.display = 'none';
                      daySelection.style.display = 'none';
                    }
                  }}>
                    <option value="">Velg type</option>
                    <option value="day">Hele dag(er)</option>
                    <option value="hour">Enkelt time</option>
                    <option value="weekly">Ukedag</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Periode:</label>
                  <div className="date-quick-select">
                    <button type="button" className="btn btn-sm btn-outline" onClick={() => {
                      const today = new Date();
                      const tomorrow = new Date(today);
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      document.querySelector('input[name="startDate"]').value = today.toISOString().split('T')[0];
                      document.querySelector('input[name="endDate"]').value = today.toISOString().split('T')[0];
                    }}>I dag</button>
                    <button type="button" className="btn btn-sm btn-outline" onClick={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      document.querySelector('input[name="startDate"]').value = tomorrow.toISOString().split('T')[0];
                      document.querySelector('input[name="endDate"]').value = tomorrow.toISOString().split('T')[0];
                    }}>I morgen</button>
                    <button type="button" className="btn btn-sm btn-outline" onClick={() => {
                      const today = new Date();
                      const nextWeek = new Date(today);
                      nextWeek.setDate(nextWeek.getDate() + 7);
                      document.querySelector('input[name="startDate"]').value = today.toISOString().split('T')[0];
                      document.querySelector('input[name="endDate"]').value = nextWeek.toISOString().split('T')[0];
                    }}>Neste uke</button>
                    <button type="button" className="btn btn-sm btn-outline" onClick={() => {
                      const today = new Date();
                      const nextMonth = new Date(today);
                      nextMonth.setMonth(nextMonth.getMonth() + 1);
                      document.querySelector('input[name="startDate"]').value = today.toISOString().split('T')[0];
                      document.querySelector('input[name="endDate"]').value = nextMonth.toISOString().split('T')[0];
                    }}>Neste måned</button>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Startdato:</label>
                  <input type="date" name="startDate" required />
                </div>
                <div className="form-group">
                  <label>Sluttdato:</label>
                  <input type="date" name="endDate" required />
                </div>
                
                <div className="form-group" id="hourSelection" style={{display: 'none'}}>
                  <label>Time (kun for enkelt time-blokkering):</label>
                  <select name="hour">
                    <option value="">Velg time</option>
                    <option value="17">17:00-18:00</option>
                    <option value="18">18:00-19:00</option>
                    <option value="19">19:00-20:00</option>
                    <option value="20">20:00-21:00</option>
                    <option value="21">21:00-22:00</option>
                    <option value="22">22:00-23:00</option>
                    <option value="23">23:00-24:00</option>
                  </select>
                </div>
                
                <div className="form-group" id="daySelection" style={{display: 'none'}}>
                  <label>Ukedag (kun for ukedag-blokkering):</label>
                  <select name="dayOfWeek">
                    <option value="">Velg ukedag</option>
                    <option value="0">Mandag</option>
                    <option value="1">Tirsdag</option>
                    <option value="2">Onsdag</option>
                    <option value="3">Torsdag</option>
                    <option value="4">Fredag</option>
                    <option value="5">Lørdag</option>
                    <option value="6">Søndag</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Årsak (valgfritt):</label>
                  <input type="text" name="reason" placeholder="f.eks. Ferie, vedlikehold" />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">Opprett blokkering</button>
                  <button type="button" className="btn btn-ghost" onClick={() => setEditingBlockedTime(null)}>Avbryt</button>
                </div>
              </form>
            </div>
          )}

          <div className="blocked-times-list">
            {blockedTimes.map((blocked) => (
              <div key={blocked.id} className="blocked-time-item">
                <div className="blocked-time-info">
                  <strong>
                    {blocked.block_type === 'day' && 'Hele dag(er)'}
                    {blocked.block_type === 'hour' && 'Enkelt time'}
                    {blocked.block_type === 'weekly' && 'Ukedag'}
                  </strong>
                  <div className="blocked-time-dates">
                    {new Date(blocked.start_date).toLocaleDateString()} - {new Date(blocked.end_date).toLocaleDateString()}
                  </div>
                  {blocked.hour !== null && (
                    <div className="blocked-time-hour">
                      {blocked.hour}:00-{blocked.hour + 1}:00
                    </div>
                  )}
                  {blocked.day_of_week !== null && (
                    <div className="blocked-time-day">
                      {['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag'][blocked.day_of_week]}
                    </div>
                  )}
                  {blocked.reason && (
                    <div className="blocked-time-reason">
                      {blocked.reason}
                    </div>
                  )}
                </div>
                <div className="blocked-time-actions">
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => deleteBlockedTime(blocked.id)}
                  >
                    Slett
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="bookings-management">
          <div className="content-header">
            <h2>Booking-historikk</h2>
            <div className="booking-stats">
              <span className="stat-item">
                <strong>{bookings.length}</strong> totalt bookinger
              </span>
              <span className="stat-item">
                <strong>{filteredBookings.length}</strong> filtrerte
              </span>
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {loading && <div>Laster bookinger...</div>}

          {/* Filter Section */}
          <div className="booking-filters">
            <div className="filter-row">
              <div className="form-group">
                <label>Søk:</label>
                <input
                  type="text"
                  placeholder="Søk etter navn, e-post, telefon eller hall..."
                  value={bookingFilter.search}
                  onChange={(e) => setBookingFilter({...bookingFilter, search: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Hall:</label>
                <select
                  value={bookingFilter.hall}
                  onChange={(e) => setBookingFilter({...bookingFilter, hall: e.target.value})}
                >
                  <option value="">Alle haller</option>
                  {getUniqueHalls().map(hall => (
                    <option key={hall} value={hall}>{hall}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="filter-row">
              <div className="form-group">
                <label>Fra dato:</label>
                <input
                  type="date"
                  value={bookingFilter.dateFrom}
                  onChange={(e) => setBookingFilter({...bookingFilter, dateFrom: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Til dato:</label>
                <input
                  type="date"
                  value={bookingFilter.dateTo}
                  onChange={(e) => setBookingFilter({...bookingFilter, dateTo: e.target.value})}
                />
              </div>
              <div className="form-group">
                <button
                  className="btn btn-outline"
                  onClick={() => setBookingFilter({search: '', hall: '', dateFrom: '', dateTo: ''})}
                >
                  Nullstill filter
                </button>
              </div>
            </div>
          </div>

          {/* Bookings List */}
          <div className="bookings-list">
            {filteredBookings.length === 0 ? (
              <div className="no-bookings">
                <p>Ingen bookinger funnet med de valgte filtrene.</p>
              </div>
            ) : (
              filteredBookings.map((booking) => (
                <div key={booking.id} className="booking-item">
                  <div className="booking-info">
                    <div className="booking-header">
                      <h4>{booking.hall}</h4>
                      <span className="booking-id">#{booking.id.slice(0, 8)}</span>
                    </div>
                    <div className="booking-details">
                      <div className="booking-time">
                        <strong>Tid:</strong> {new Date(booking.start_time).toLocaleString('no-NO')} - {new Date(booking.end_time).toLocaleString('no-NO', {hour: '2-digit', minute: '2-digit'})}
                      </div>
                      <div className="booking-user">
                        <strong>Bruker:</strong> {booking.user?.name || 'Ukjent'} ({booking.user?.email || 'Ukjent e-post'})
                      </div>
                      {booking.user?.phone && (
                        <div className="booking-phone">
                          <strong>Telefon:</strong> {booking.user.phone}
                        </div>
                      )}
                      <div className="booking-created">
                        <strong>Opprettet:</strong> {new Date(booking.created_at).toLocaleString('no-NO')}
                      </div>
                    </div>
                  </div>
                  <div className="booking-actions">
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => editBooking(booking)}
                      title="Rediger booking"
                    >
                      Rediger
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => deleteBooking(booking.id)}
                      title="Slett booking"
                    >
                      Slett
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {editingContent && !editingContent.isNew && (
        <div className="content-editor-modal">
          <div className="modal-content">
            <h3>Rediger innhold: {sectionLabels[editingContent.section_name] || editingContent.section_name}</h3>
            <p className="content-description">
              {sectionDescriptions[editingContent.section_name] || 'Beskrivelse ikke tilgjengelig'}
            </p>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              saveContent(
                editingContent.id,
                formData.get('content'),
                formData.get('contentType')
              );
            }}>
              <div className="form-group">
                <label>Innholdstype:</label>
                <select name="contentType" defaultValue={editingContent.content_type}>
                  <option value="text">Tekst</option>
                  <option value="html">HTML</option>
                  <option value="markdown">Markdown</option>
                </select>
              </div>
              <div className="form-group">
                <label>Innhold:</label>
                <textarea 
                  name="content" 
                  rows="10" 
                  defaultValue={editingContent.content}
                  required
                ></textarea>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Lagre</button>
                <button type="button" className="btn btn-ghost" onClick={() => setEditingContent(null)}>Avbryt</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Booking Edit Modal */}
      {editingBooking && (
        <div className="booking-edit-modal">
          <div className="modal-overlay" onClick={cancelBookingEdit}></div>
          <div className="modal-content">
            <div className="modal-header">
              <h3>Rediger booking</h3>
              <button className="modal-close" onClick={cancelBookingEdit}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Hall:</label>
                <select
                  value={bookingEditForm.hall}
                  onChange={(e) => setBookingEditForm({...bookingEditForm, hall: e.target.value})}
                >
                  <option value="">Velg hall</option>
                  <option value="Hovedhall">Hovedhall</option>
                  <option value="Sidehall">Sidehall</option>
                  <option value="Utendørs">Utendørs</option>
                </select>
              </div>
              <div className="form-group">
                <label>Starttid:</label>
                <input
                  type="datetime-local"
                  value={bookingEditForm.start_time}
                  onChange={(e) => setBookingEditForm({...bookingEditForm, start_time: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Sluttid:</label>
                <input
                  type="datetime-local"
                  value={bookingEditForm.end_time}
                  onChange={(e) => setBookingEditForm({...bookingEditForm, end_time: e.target.value})}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={cancelBookingEdit}>
                Avbryt
              </button>
              <button className="btn btn-primary" onClick={saveBookingEdit} disabled={loading}>
                {loading ? 'Lagrer...' : 'Lagre endringer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="users-management">
          <div className="content-header">
            <h2>Brukeradministrasjon</h2>
            <div className="user-stats">
              <span className="stat-item">
                <strong>{users.length}</strong> totalt brukere
              </span>
              <span className="stat-item">
                <strong>{users.filter(u => u.is_superuser).length}</strong> administratorer
              </span>
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {loading && <div>Laster brukere...</div>}

          {/* User Filter Section */}
          <div className="user-filters">
            <div className="filter-row">
              <div className="form-group">
                <label>Søk:</label>
                <input
                  type="text"
                  placeholder="Søk etter navn eller e-post..."
                  value={userFilter.search}
                  onChange={(e) => setUserFilter({...userFilter, search: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Rolle:</label>
                <select
                  value={userFilter.role}
                  onChange={(e) => setUserFilter({...userFilter, role: e.target.value})}
                >
                  <option value="">Alle roller</option>
                  <option value="admin">Administrator</option>
                  <option value="user">Standard bruker</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status:</label>
                <select
                  value={userFilter.status}
                  onChange={(e) => setUserFilter({...userFilter, status: e.target.value})}
                >
                  <option value="">Alle statuser</option>
                  <option value="active">Aktiv</option>
                  <option value="inactive">Inaktiv</option>
                </select>
              </div>
            </div>
            <button 
              className="btn btn-outline"
              onClick={() => setUserFilter({search: '', role: '', status: ''})}
            >
              Nullstill filtre
            </button>
          </div>

          {/* Users List */}
          <div className="users-list">
            {filteredUsers.length === 0 ? (
              <div className="no-users">
                <p>Ingen brukere funnet med de valgte filtrene.</p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div key={user.id} className="user-item">
                  <div className="user-info">
                    <div className="user-header">
                      <h4>{user.full_name || 'Ikke satt'}</h4>
                      <span className={`user-role ${user.is_superuser ? 'admin' : 'user'}`}>
                        {user.is_superuser ? 'Administrator' : 'Standard bruker'}
                      </span>
                    </div>
                    <div className="user-details">
                      <div className="user-email">
                        <strong>E-post:</strong> {user.email}
                      </div>
                      {user.phone && (
                        <div className="user-phone">
                          <strong>Telefon:</strong> {user.phone}
                        </div>
                      )}
                      <div className="user-status">
                        <strong>Status:</strong> 
                        <span className={`status ${user.is_active ? 'active' : 'inactive'}`}>
                          {user.is_active ? 'Aktiv' : 'Inaktiv'}
                        </span>
                      </div>
                      <div className="user-verified">
                        <strong>E-post bekreftet:</strong> 
                        <span className={`status ${user.is_verified ? 'verified' : 'unverified'}`}>
                          {user.is_verified ? 'Ja' : 'Nei'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="user-actions">
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => {/* TODO: Edit user */}}
                      title="Rediger bruker"
                    >
                      Rediger
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => {/* TODO: Delete user */}}
                      title="Slett bruker"
                    >
                      Slett
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      </div>
    );
  }
  
  export default AdminPanel;