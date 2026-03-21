import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8000';

const getAuthHeaders = (token) => ({
    headers: { 'Authorization': `Bearer ${token}` }
});

export const getPlaylists = (token) => {
    return axios.get(`${BASE_URL}/playlists`, getAuthHeaders(token));
};

export const startGame = (playlistId, token, rounds) => {
    return axios.post(`${BASE_URL}/start_game`, null, {
        params: { 
            playlist_id: playlistId,
            rounds: rounds
        },
        ...getAuthHeaders(token)
    });
};

export const submitGuess = (guess, token) => {
    return axios.post(`${BASE_URL}/submit_guess`, {
        guess_name: guess.guess_name || '',
        guess_artist: guess.guess_artist || '',
        guess_album: guess.guess_album || ''
    }, getAuthHeaders(token));
};

export const nextRound = (token) => {
    return axios.get(`${BASE_URL}/next_round`, getAuthHeaders(token));
};

export const playTrack = (token, deviceId, uri) => {
    return axios.put(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        uris: [uri]
    }, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
};
