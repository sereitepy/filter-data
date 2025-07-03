import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, ChevronUp, ChevronDown, X, Star, Bed, Bath, MoreHorizontal, Edit, Trash2 } from 'lucide-react';

const PropertyFilterSystem = () => {
  // Simulate getting locale from URL or props
  const [locale, setLocale] = useState('en'); // kh, en, fr
  
  // 1. FILTER STATE - This is your single source of truth
  const [filters, setFilters] = useState({
    search: "",
    sortBy: "last_updated", // last_updated, rating, price
    sortDirection: "desc", // asc, desc
    status: [], // active, archived, reject, draft
    type: [], // house, villa, apartment, building
    minPrice: 0,
    maxPrice: 1000,
    page: 1
  });

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [openDropdown, setOpenDropdown] = useState(null);

  // 2. QUERY BUILDER - Converts your filters into API query params
  const buildQuery = useCallback((filterState) => {
    const params = new URLSearchParams();
    
    // Add locale to API call
    params.append('locale', locale);
    
    // Search handling
    if (filterState.search.trim()) {
      params.append('search', filterState.search.trim());
    }
    
    // Sorting
    params.append('sortBy', filterState.sortBy);
    params.append('sortDirection', filterState.sortDirection);
    
    // Array filters (status, type)
    if (filterState.status.length > 0) {
      params.append('status', filterState.status.join(','));
    }
    if (filterState.type.length > 0) {
      params.append('type', filterState.type.join(','));
    }
    
    // Price range
    if (filterState.minPrice > 0) {
      params.append('minPrice', filterState.minPrice.toString());
    }
    if (filterState.maxPrice < 1000) {
      params.append('maxPrice', filterState.maxPrice.toString());
    }
    
    // Pagination
    params.append('page', filterState.page.toString());
    params.append('limit', '10');
    
    return params.toString();
  }, [locale]);

  // 3. API CALL FUNCTION - This calls your Next.js API with locale
  const fetchProperties = useCallback(async (filterState) => {
    setLoading(true);
    try {
      const queryString = buildQuery(filterState);
      // Note: API call includes locale in the URL path
      const response = await fetch(`/api/${locale}/properties?${queryString}`);
      const data = await response.json();
      
      setProperties(data.properties || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching properties:', error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [buildQuery, locale]);

  // 4. TRIGGER FETCH WHEN FILTERS OR LOCALE CHANGE
  useEffect(() => {
    fetchProperties(filters);
  }, [filters, fetchProperties]);

  // 5. FILTER UPDATE HELPERS
  const updateFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  const updateArrayFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value) 
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value],
      page: 1
    }));
  };

  const toggleSort = () => {
    setFilters(prev => ({
      ...prev,
      sortDirection: prev.sortDirection === 'asc' ? 'desc' : 'asc'
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      sortBy: "last_updated",
      sortDirection: "desc",
      status: [],
      type: [],
      minPrice: 0,
      maxPrice: 1000,
      page: 1
    });
  };

  const changePage = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  // Action handlers
  const handleEdit = (propertyId) => {
    console.log('Edit property:', propertyId);
    setOpenDropdown(null);
    // Navigate to edit page or open modal
  };

  const handleDelete = (propertyId) => {
    console.log('Delete property:', propertyId);
    setOpenDropdown(null);
    // Show confirmation dialog
  };

  // Format date based on locale
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString(locale === 'kh' ? 'km-KH' : locale === 'fr' ? 'fr-FR' : 'en-US', options);
  };

  // Status color mapping
  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      case 'reject': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle empty state properly
  const displayProperties = properties;

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* LOCALE SELECTOR */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Properties Management</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Language:</span>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-lg"
          >
            <option value="en">English</option>
            <option value="kh">ខ្មែរ</option>
            <option value="fr">Français</option>
          </select>
        </div>
      </div>
      
      {/* SEARCH BAR */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search properties by name or location..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* CONTROLS ROW */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <select
            value={filters.sortBy}
            onChange={(e) => updateFilter('sortBy', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="last_updated">Last Updated</option>
            <option value="rating">Rating</option>
            <option value="price">Price</option>
          </select>
          
          <button
            onClick={toggleSort}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            {filters.sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Filter className="h-4 w-4" />
          Filters
          {(filters.status.length > 0 || filters.type.length > 0 || filters.minPrice > 0 || filters.maxPrice < 1000) && (
            <span className="bg-blue-800 text-xs px-2 py-1 rounded-full">
              {filters.status.length + filters.type.length + (filters.minPrice > 0 ? 1 : 0) + (filters.maxPrice < 1000 ? 1 : 0)}
            </span>
          )}
        </button>

        <button
          onClick={clearFilters}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
        >
          Clear All
        </button>
      </div>

      {/* FILTER PANEL */}
      {isFilterOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Filters</h2>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Status Filter */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Status</h3>
                <div className="space-y-2">
                  {['active', 'archived', 'reject', 'draft'].map(status => (
                    <label key={status} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.status.includes(status)}
                        onChange={() => updateArrayFilter('status', status)}
                        className="mr-2"
                      />
                      <span className="capitalize">{status}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Type Filter */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Property Type</h3>
                <div className="space-y-2">
                  {['house', 'villa', 'apartment', 'building'].map(type => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.type.includes(type)}
                        onChange={() => updateArrayFilter('type', type)}
                        className="mr-2"
                      />
                      <span className="capitalize">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Price Range</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Min Price: ${filters.minPrice}</label>
                    <input
                      type="range"
                      min="0"
                      max="500"
                      value={filters.minPrice}
                      onChange={(e) => updateFilter('minPrice', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Max Price: ${filters.maxPrice}</label>
                    <input
                      type="range"
                      min="500"
                      max="1000"
                      value={filters.maxPrice}
                      onChange={(e) => updateFilter('maxPrice', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESULTS TABLE */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <p className="text-sm text-gray-600">
            {loading ? 'Loading properties...' : 
             properties.length === 0 ? 'No properties found' : 
             `Showing ${properties.length} properties`}
          </p>
        </div>
        
        {/* TABLE HEADER */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                // Loading skeleton rows
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-16 w-16 bg-gray-300 rounded-lg"></div>
                        <div className="ml-4">
                          <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
                          <div className="h-3 bg-gray-300 rounded w-24"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-300 rounded w-20 mb-1"></div>
                      <div className="h-3 bg-gray-300 rounded w-16"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-300 rounded w-16"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-6 bg-gray-300 rounded w-16"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-300 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-8 bg-gray-300 rounded w-8"></div>
                    </td>
                  </tr>
                ))
              ) : properties.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <div className="text-lg font-medium mb-2">No properties found</div>
                      <div className="text-sm">Try adjusting your filters or search terms</div>
                    </div>
                  </td>
                </tr>
              ) : (
                // Real data mapping
                displayProperties.map((property) => (
                  <tr key={property.id} className="hover:bg-gray-50">
                    {/* PROPERTY COLUMN */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-16 w-16">
                          <img 
                            className="h-16 w-16 rounded-lg object-cover" 
                            src={property.image || '/api/placeholder/300/200'} 
                            alt={property.description || property.name}
                            onError={(e) => {
                              e.target.src = '/api/placeholder/300/200';
                            }}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{property.name}</div>
                          <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center text-sm text-gray-500">
                              <Star className="h-4 w-4 text-yellow-400 mr-1" />
                              {property.rating || 'N/A'}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <Bed className="h-4 w-4 mr-1" />
                              {property.bedroom || 0}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <Bath className="h-4 w-4 mr-1" />
                              {property.bathroom || 0}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* LOCATION COLUMN */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{property.province || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{property.country || 'Unknown'}</div>
                    </td>

                    {/* PRICE COLUMN */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${property.price || 0}
                      </div>
                      <div className="text-sm text-gray-500">/night</div>
                    </td>

                    {/* STATUS COLUMN */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(property.status)}`}>
                        {property.status || 'unknown'}
                      </span>
                    </td>

                    {/* LAST UPDATED COLUMN */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {property.last_updated ? formatDate(property.last_updated) : 'Unknown'}
                    </td>

                    {/* ACTION COLUMN */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="relative">
                        <button
                          onClick={() => setOpenDropdown(openDropdown === property.id ? null : property.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        
                        {openDropdown === property.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                            <div className="py-1">
                              <button
                                onClick={() => handleEdit(property.id)}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(property.id)}
                                className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="px-6 py-3 bg-gray-50 border-t">
          <div className="flex justify-between items-center">
            <button
              onClick={() => changePage(filters.page - 1)}
              disabled={filters.page <= 1}
              className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {filters.page} of {totalPages}
            </span>
            <button
              onClick={() => changePage(filters.page + 1)}
              disabled={filters.page >= totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* DEBUG INFO */}
      <div className="mt-8 bg-gray-900 text-white p-4 rounded-lg">
        <h3 className="font-medium mb-2">Current API Call:</h3>
        <code className="text-sm break-all">/api/{locale}/properties?{buildQuery(filters)}</code>
      </div>
    </div>
  );
};

export default PropertyFilterSystem;
