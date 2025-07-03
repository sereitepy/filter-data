```tsx
import { NextResponse } from 'next/server'

// Simulated data (replace with Medusa API fetch)
const properties = [/* your property objects */]

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const search = searchParams.get('search')?.toLowerCase() || ''
  const sort_by = searchParams.get('sort_by') || 'last_updated'
  const order = searchParams.get('order') || 'desc'
  const status = searchParams.get('status')?.split(',') || []
  const type = searchParams.get('type')?.split(',') || []
  const minPrice = parseFloat(searchParams.get('min_price') || '0')
  const maxPrice = parseFloat(searchParams.get('max_price') || 'Infinity')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')

  let filtered = properties.filter((p) => {
    return (
      (!search || p.name.toLowerCase().includes(search) || p.location.toLowerCase().includes(search)) &&
      (!status.length || status.includes(p.status)) &&
      (!type.length || type.includes(p.type)) &&
      p.price >= minPrice &&
      p.price <= maxPrice
    )
  })

  filtered.sort((a, b) => {
    if (sort_by === 'price' || sort_by === 'rating') {
      return order === 'asc' ? a[sort_by] - b[sort_by] : b[sort_by] - a[sort_by]
    } else if (sort_by === 'last_updated') {
      return order === 'asc'
        ? new Date(a.last_updated).getTime() - new Date(b.last_updated).getTime()
        : new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
    }
    return 0
  })

  const start = (page - 1) * limit
  const paginated = filtered.slice(start, start + limit)

  return NextResponse.json({
    data: paginated,
    total: filtered.length,
    page,
    totalPages: Math.ceil(filtered.length / limit),
  })
}

```

I'll teach you how to build a comprehensive filtering system! Let's break this down into logical chunks and understand the core concepts.

## Core Concepts You Need to Master

**1. State Management Pattern** The key insight is that all your filters are just different pieces of state that modify a single query object. Think of it like this:

```jsx
// Your filter state is like a recipe
const filterState = {
  search: "",
  sortBy: "last_updated",
  sortDirection: "desc",
  status: [],
  type: [],
  minPrice: 0,
  maxPrice: 1000,
  page: 1
}

// This gets converted to a query string
// ?search=villa&sortBy=price&sortDirection=asc&status=active&page=1

```

**2. The Filter-to-Query Pipeline** Every filter system follows this pattern: `User Input → State Update → Query Building → API Call → UI Update`

Let me show you how to implement this step by step:Now let me explain the **mental model** behind this system:

## The Mental Framework

**1. Think of filters as a recipe** Your `filters` state is like a recipe that describes exactly what the user wants to see. Every time they change a filter, you're updating the recipe, and then you use that recipe to "cook" (fetch) the data.

**2. The State → Query → API → UI Pipeline** This is the most important pattern to understand:

- **State**: User interactions update your filter state
- **Query**: Your filter state gets converted to URL parameters
- **API**: Your Next.js API receives these parameters
- **UI**: The fetched data updates your component

**3. Key Patterns You Should Master:**

**Pattern 1: Single Source of Truth**

```jsx
// ✅ Good: One state object controls everything
const [filters, setFilters] = useState({
  search: "",
  sortBy: "price",
  // ... all your filters
});

// ❌ Bad: Multiple separate states
const [search, setSearch] = useState("");
const [sortBy, setSortBy] = useState("price");
// This becomes messy fast!

```

**Pattern 2: Immutable Updates**

```jsx
// ✅ Good: Always create new objects
const updateFilter = (key, value) => {
  setFilters(prev => ({
    ...prev,
    [key]: value,
    page: 1  // Reset pagination when filters change
  }));
};

// ❌ Bad: Mutating state directly
filters.search = "new value"; // React won't re-render!

```

**Pattern 3: Array Filter Toggle**

```jsx
// For checkboxes (status, type filters)
const toggleArrayFilter = (key, value) => {
  setFilters(prev => ({
    ...prev,
    [key]: prev[key].includes(value)
      ? prev[key].filter(item => item !== value)  // Remove if exists
      : [...prev[key], value]                     // Add if doesn't exist
  }));
};

```

## Now, Your Next.js API Route

Create `/pages/api/properties.js` or `/app/api/properties/route.js`:

```jsx
// This is where the magic happens - converting query params to Medusa filters
export default async function handler(req, res) {
  const {
    search,
    sortBy = 'last_updated',
    sortDirection = 'desc',
    status,
    type,
    minPrice,
    maxPrice,
    page = 1,
    limit = 10
  } = req.query;

  // Build Medusa query object
  const medusaQuery = {
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
  };

  // Handle search (this depends on your Medusa setup)
  if (search) {
    medusaQuery.q = search; // or however Medusa handles search
  }

  // Handle sorting
  if (sortBy && sortDirection) {
    medusaQuery.order = `${sortBy}:${sortDirection}`;
  }

  // Handle array filters
  if (status) {
    medusaQuery.status = status.split(',');
  }
  if (type) {
    medusaQuery.type = type.split(',');
  }

  // Handle price range
  if (minPrice || maxPrice) {
    medusaQuery.price = {};
    if (minPrice) medusaQuery.price.gte = parseInt(minPrice);
    if (maxPrice) medusaQuery.price.lte = parseInt(maxPrice);
  }

  try {
    // Call your Medusa API
    const response = await fetch(`${process.env.MEDUSA_URL}/properties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(medusaQuery)
    });

    const data = await response.json();

    res.status(200).json({
      properties: data.properties,
      totalPages: Math.ceil(data.total / limit),
      currentPage: parseInt(page),
      total: data.total
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
}

```

## Key Learning Points:

1. **State is your single source of truth** - everything flows from your `filters` state
2. **useEffect + dependency array** - automatically fetch when filters change
3. **Query building** - convert your state to URL parameters systematically
4. **Immutable updates** - always create new objects when updating state
5. **Reset pagination** - when filters change, always go back to page 1

The beauty of this system is that once you understand the pattern, you can apply it to any filtering scenario. The core logic stays the same whether you're filtering properties, products, or any other data.

What specific part would you like me to dive deeper into?

---

Ah, this gives me much better context! Let me update this with the proper internationalization setup and the actual data structure you're working with.Perfect! Now let me explain the **key concepts** for your internationalized property management system:

## Understanding the Internationalization (i18n) Pattern

**1. Locale-Based API Routes**

```jsx
// Your API structure should be:
/api/[locale]/properties
// Examples:
// /api/en/properties
// /api/kh/properties
// /api/fr/properties

```

**2. API Route Implementation** Create `/pages/api/[locale]/properties.js` (or `/app/api/[locale]/properties/route.js` for App Router):

```jsx
export default async function handler(req, res) {
  const { locale } = req.query; // 'kh', 'en', 'fr'

  const {
    search,
    sortBy = 'last_updated',
    sortDirection = 'desc',
    status,
    type,
    minPrice,
    maxPrice,
    page = 1,
    limit = 10
  } = req.query;

  // Build query for your senior's Medusa API
  const medusaQuery = {
    locale, // Important: Pass locale to Medusa
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
  };

  // Add filters to query
  if (search) medusaQuery.search = search;
  if (sortBy) medusaQuery.sortBy = sortBy;
  if (sortDirection) medusaQuery.sortDirection = sortDirection;
  if (status) medusaQuery.status = status.split(',');
  if (type) medusaQuery.type = type.split(',');
  if (minPrice) medusaQuery.minPrice = parseInt(minPrice);
  if (maxPrice) medusaQuery.maxPrice = parseInt(maxPrice);

  try {
    // Call your senior's Medusa API
    const response = await fetch(`${process.env.MEDUSA_URL}/admin/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MEDUSA_TOKEN}`,
      },
      body: JSON.stringify(medusaQuery)
    });

    const data = await response.json();

    res.status(200).json({
      properties: data.properties,
      totalPages: Math.ceil(data.total / limit),
      currentPage: parseInt(page),
      total: data.total
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
}

```

## Key Learning Points for Your Table Implementation:

**1. Table Structure Pattern**

```jsx
// Think of your table as sections:
const tableStructure = {
  property: ['image', 'name', 'rating', 'bedroom', 'bathroom'],
  location: ['province', 'country'],
  price: ['amount', 'per_night'],
  status: ['active', 'archived', 'reject', 'draft'],
  last_updated: ['date'],
  actions: ['edit', 'delete']
};

```

**2. Status Color System**

```jsx
const getStatusColor = (status) => {
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    archived: 'bg-gray-100 text-gray-800',
    reject: 'bg-red-100 text-red-800',
    draft: 'bg-yellow-100 text-yellow-800'
  };
  return statusColors[status] || 'bg-gray-100 text-gray-800';
};

```

**3. Dropdown Action Pattern**

```jsx
// Pattern for action dropdowns
const [openDropdown, setOpenDropdown] = useState(null);

// Toggle logic
const toggleDropdown = (id) => {
  setOpenDropdown(openDropdown === id ? null : id);
};

// Close dropdown when clicking outside
useEffect(() => {
  const handleClickOutside = () => setOpenDropdown(null);
  document.addEventListener('click', handleClickOutside);
  return () => document.removeEventListener('click', handleClickOutside);
}, []);

```

**4. Date Formatting by Locale**

```jsx
const formatDate = (dateString, locale) => {
  const date = new Date(dateString);
  const localeMap = {
    'kh': 'km-KH',
    'en': 'en-US',
    'fr': 'fr-FR'
  };

  return date.toLocaleDateString(localeMap[locale], {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

```

## Mental Model for Your Filter System:

**Think of it like a cooking recipe:**

1. **Ingredients (State)**: Your filters object contains all the "ingredients"
2. **Recipe (Query Builder)**: Converts ingredients into API parameters
3. **Cooking (API Call)**: Sends the recipe to your backend
4. **Serving (UI Update)**: Displays the cooked result

**The Flow:**

```
User clicks filter → State updates → useEffect triggers →
Query builds → API calls → Data returns → Table re-renders

```

**Key Debugging Tips:**

- Always check the query string in your debug section
- Use browser Network tab to see actual API calls
- Console.log your filters state to understand what's changing
- Test each filter type individually first

The beauty of this system is that once you understand the pattern, you can add new filters easily. Just add them to your `filters` state, update the query builder, and handle them in your API route.

What specific part of this flow would you like me to explain deeper?

```tsx
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

  // Mock data with proper structure
  const mockProperties = [
    {
      id: 1,
      image: "/api/placeholder/300/200",
      name: "Luxury Sunset Villa",
      description: "Beautiful villa with ocean view",
      rating: 4.8,
      bedroom: 3,
      bathroom: 2,
      province: "Siem Reap",
      country: "Cambodia",
      price: 150,
      status: "active",
      last_updated: "2024-01-15T10:30:00Z",
      type: "villa"
    },
    {
      id: 2,
      image: "/api/placeholder/300/200",
      name: "Modern City Apartment",
      description: "Stylish apartment in city center",
      rating: 4.2,
      bedroom: 2,
      bathroom: 1,
      province: "Bangkok",
      country: "Thailand",
      price: 80,
      status: "draft",
      last_updated: "2024-01-10T14:20:00Z",
      type: "apartment"
    },
    {
      id: 3,
      image: "/api/placeholder/300/200",
      name: "Beachfront House",
      description: "Cozy house steps from the beach",
      rating: 4.9,
      bedroom: 4,
      bathroom: 3,
      province: "Phuket",
      country: "Thailand",
      price: 200,
      status: "archived",
      last_updated: "2024-01-20T09:15:00Z",
      type: "house"
    },
  ];

  const displayProperties = loading ? mockProperties : properties.length > 0 ? properties : mockProperties;

  
```

```tsx
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
```

```tsx
{/* RESULTS TABLE */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <p className="text-sm text-gray-600">
            {loading ? 'Loading...' : `Showing ${displayProperties.length} properties`}
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
              {displayProperties.map((property) => (
                <tr key={property.id} className="hover:bg-gray-50">
                  {/* PROPERTY COLUMN */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-16 w-16">
                        <img 
                          className="h-16 w-16 rounded-lg object-cover" 
                          src={property.image} 
                          alt={property.description}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{property.name}</div>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center text-sm text-gray-500">
                            <Star className="h-4 w-4 text-yellow-400 mr-1" />
                            {property.rating}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Bed className="h-4 w-4 mr-1" />
                            {property.bedroom}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Bath className="h-4 w-4 mr-1" />
                            {property.bathroom}
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* LOCATION COLUMN */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{property.province}</div>
                    <div className="text-sm text-gray-500">{property.country}</div>
                  </td>

                  {/* PRICE COLUMN */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">${property.price}</div>
                    <div className="text-sm text-gray-500">/night</div>
                  </td>

                  {/* STATUS COLUMN */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(property.status)}`}>
                      {property.status}
                    </span>
                  </td>

                  {/* LAST UPDATED COLUMN */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(property.last_updated)}
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
              ))}
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
```
