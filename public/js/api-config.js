// API Configuration
const API_CONFIG = {
    BASE_URL: 'http://localhost:8000/api',
    ENDPOINTS: {
        // Auth endpoints
        SIGNUP: '/auth/signup',
        LOGIN: '/auth/login',
        
        // Package endpoints
        PACKAGES: '/packages',
        PACKAGE_BY_ID: (id) => `/packages/${id}`,
        
        // Booking endpoints
        BOOKINGS: '/bookings',
        MY_BOOKINGS: '/bookings/mine',
        BOOKING_BY_ID: (id) => `/bookings/${id}`
    }
};

// Helper function to get auth token
function getAuthToken() {
    try {
        const user = JSON.parse(localStorage.getItem('js_current_user'));
        return user?.token || null;
    } catch {
        return null;
    }
}

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    const token = getAuthToken();
    
    const defaultHeaders = {
        'Content-Type': 'application/json'
    };
    
    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
    
    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || `API call failed with status ${response.status}`);
        }
        
        return data;
    } catch (error) {
        console.error('API Call Error:', error);
        throw error;
    }
}

// Export for use in other files
if (typeof window !== 'undefined') {
    window.API_CONFIG = API_CONFIG;
    window.apiCall = apiCall;
    window.getAuthToken = getAuthToken;
}
