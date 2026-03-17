import axios from 'axios';

const API_URL = 'http://localhost:8000';

const api = axios.create({
    baseURL: API_URL,
});

export const login = () => {
    window.location.href = `${API_URL}/login`;
};

export const getPlaylists = (token) => {
    return api.get('/playlists', { headers: { Authorization: `Bearer ${token}` } });
};

export const startGame = (playlistId, token, rounds = 10) => {
    return api.post(`/start_game?playlist_id=${playlistId}&rounds=${rounds}`, {}, { headers: { Authorization: `Bearer ${token}` } });
};

export const submitGuess = (guess, token) => {
    return api.post('/submit_guess', guess, { headers: { Authorization: `Bearer ${token}` } });
};

export const nextRound = (token) => {
    return api.get('/next_round', { headers: { Authorization: `Bearer ${token}` } });
};

export const playTrack = (token, deviceId, trackUri) => {
    return axios.put(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        uris: [trackUri],
        position_ms: 0
    }, {
        headers: { Authorization: `Bearer ${token}` }
    });
};
