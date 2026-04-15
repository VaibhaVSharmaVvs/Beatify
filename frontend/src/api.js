import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

// Dynamically pull the freshest token directly from localStorage
// This prevents React state from becoming desynced if the token auto-refreshes!
const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return { headers: { 'Authorization': `Bearer ${token}` } };
};

// Configure Axios Interceptor to catch 401 Unauthorized errors globally
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the backend threw a 401 and we haven't already retried this request
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          // Ask Python backend to silently trade the refresh token for a new access token
          const res = await axios.get(`${BASE_URL}/refresh?refresh_token=${refreshToken}`);
          
          if (res.data && res.data.access_token) {
            const newAccessToken = res.data.access_token;
            // Update the browser cache silently
            localStorage.setItem('access_token', newAccessToken);
            
            // Update the failed request with the brand new token
            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
            
            // Transparently retry the failed request! The user won't even notice.
            return axios(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed (maybe the refresh token expired too). Force logout.
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          clearGameCache();
          window.location.href = '/';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token exists. Force logout.
        localStorage.removeItem('access_token');
        clearGameCache();
        window.location.href = '/';
      }
    }
    
    return Promise.reject(error);
  }
);

export const clearGameCache = () => {
  localStorage.removeItem('beatify_cache_playlists');
  localStorage.removeItem('beatify_cache_profile');
};

const fetchWithCache = async (cacheKey, ttlMs, fetcher, forceRefresh = false) => {
    if (!forceRefresh) {
        const cachedItem = localStorage.getItem(cacheKey);
        if (cachedItem) {
            try {
                const parsed = JSON.parse(cachedItem);
                if (Date.now() - parsed.timestamp < ttlMs) {
                    return Promise.resolve({ data: parsed.data });
                }
            } catch (e) {
                console.warn("Invalid cache data, refetching.");
            }
        }
    }
    
    // Fetch fresh
    const response = await fetcher();
    // Cache it
    localStorage.setItem(cacheKey, JSON.stringify({
        data: response.data,
        timestamp: Date.now()
    }));
    return response;
};

// We keep the 'token' argument for backward compatibility with Index.tsx, 
// but getAuthHeaders strictly enforces using the absolute freshest token from localStorage.
export const getPlaylists = (token, forceRefresh = false) => {
    return fetchWithCache(
        'beatify_cache_playlists',
        60 * 60 * 1000, // 1 hour
        () => axios.get(`${BASE_URL}/playlists`, getAuthHeaders()),
        forceRefresh
    );
};

export const getUserProfile = (token, forceRefresh = false) => {
    return fetchWithCache(
        'beatify_cache_profile',
        24 * 60 * 60 * 1000, // 24 hours
        () => axios.get(`${BASE_URL}/me`, getAuthHeaders()),
        forceRefresh
    );
};

export const startGame = (playlistId, token, rounds, categories) => {
    return axios.post(`${BASE_URL}/start_game`, null, {
        params: { 
            playlist_id: playlistId,
            rounds: rounds,
            artist: categories.artist,
            album: categories.album,
            year: categories.year
        },
        ...getAuthHeaders()
    });
};

export const submitGuess = (guess, token) => {
    return axios.post(`${BASE_URL}/submit_guess`, {
        guess_name: guess.guess_name || '',
        guess_artist: guess.guess_artist || '',
        guess_album: guess.guess_album || '',
        guess_year: guess.guess_year || ''
    }, getAuthHeaders());
};

export const nextRound = (token) => {
    return axios.get(`${BASE_URL}/next_round`, getAuthHeaders());
};

export const playTrack = (token, deviceId, uri) => {
    return axios.put(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        uris: [uri]
    }, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
        }
    });
};

export const saveSession = (payload) => {
    return axios.post(`${BASE_URL}/save_session`, payload, getAuthHeaders());
};
