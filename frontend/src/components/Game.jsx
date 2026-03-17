import React, { useState, useEffect, useRef } from 'react';
import { getPlaylists, startGame, submitGuess, nextRound, playTrack } from '../api';
import Scoreboard from './Scoreboard';

const Game = () => {
    const [token, setToken] = useState(localStorage.getItem('access_token'));
    const [playlists, setPlaylists] = useState([]);
    const [gameState, setGameState] = useState(null); // 'selection', 'playing', 'result', 'game_over'
    const [currentRoundData, setCurrentRoundData] = useState(null);
    const [guess, setGuess] = useState({ name: '', artist: '', album: '' });
    const [roundResult, setRoundResult] = useState(null);
    const [score, setScore] = useState(0);
    const [history, setHistory] = useState([]);
    const [timeLeft, setTimeLeft] = useState(10);
    const [error, setError] = useState(null);
    const [deviceId, setDeviceId] = useState(null);
    const [player, setPlayer] = useState(null);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [difficulty, setDifficulty] = useState('medium'); // Default to medium

    // Customization State
    const [timerEnabled, setTimerEnabled] = useState(true);
    const [customTime, setCustomTime] = useState(10);
    const [customRounds, setCustomRounds] = useState(10);

    const timerRef = useRef(null);
    const playbackTimeoutRef = useRef(null);
    const playerRef = useRef(null); // Ref to access player in timeouts

    const DIFFICULTIES = {
        easy: { label: 'Easy', duration: 13000, displayDuration: 10000, color: 'bg-green-500' },
        medium: { label: 'Medium', duration: 8000, displayDuration: 5000, color: 'bg-yellow-500' },
        hard: { label: 'Hard', duration: 5000, displayDuration: 3000, color: 'bg-orange-500' },
        impossible: { label: 'Impossible', duration: 3000, displayDuration: 1000, color: 'bg-red-500' }
    };

    // Initialize Web Playback SDK
    useEffect(() => {
        if (!token) return;

        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;
        document.body.appendChild(script);

        window.onSpotifyWebPlaybackSDKReady = () => {
            const player = new window.Spotify.Player({
                name: 'Guess the Song Game',
                getOAuthToken: cb => { cb(token); },
                volume: 0.5
            });

            player.addListener('ready', ({ device_id }) => {
                console.log('Ready with Device ID', device_id);
                setDeviceId(device_id);
                setIsPlayerReady(true);
            });

            player.addListener('not_ready', ({ device_id }) => {
                console.log('Device ID has gone offline', device_id);
                setIsPlayerReady(false);
            });

            player.addListener('initialization_error', ({ message }) => {
                console.error(message);
                setError("Failed to initialize Spotify Player. Check your Premium status.");
            });

            player.addListener('authentication_error', ({ message }) => {
                console.error(message);
                setError("Authentication failed. Please login again.");
            });

            player.addListener('account_error', ({ message }) => {
                console.error(message);
                setError("Account error. You need Spotify Premium to play.");
            });

            player.connect();
            setPlayer(player);
            playerRef.current = player;
        };

        return () => {
            if (player) player.disconnect();
        };
    }, [token]);

    useEffect(() => {
        if (token) {
            getPlaylists(token).then(res => {
                setPlaylists(res.data.items);
                setGameState('selection');
            }).catch(err => {
                console.error(err);
                setError("Failed to fetch playlists. Please try logging in again.");
            });
        }
    }, [token]);

    // Timer Auto-Submit Logic
    useEffect(() => {
        if (gameState === 'playing' && timerEnabled && timeLeft === 0) {
            handleAutoSubmit();
        }
    }, [timeLeft, gameState, timerEnabled]);

    const handleStartGame = (playlistId) => {
        if (!isPlayerReady) {
            setError("Player is not ready yet. Please wait...");
            return;
        }

        startGame(playlistId, token, customRounds).then(res => {
            setCurrentRoundData(res.data);
            setGameState('playing');
            playUri(res.data.uri);
            if (timerEnabled) {
                startTimer();
            } else {
                setTimeLeft(null);
            }
        }).catch(err => {
            console.error(err);
            setError("Failed to start game.");
        });
    };

    const playUri = (uri) => {
        if (deviceId && uri) {
            playTrack(token, deviceId, uri).catch(err => console.error("Playback failed", err));

            // Clear any existing timeout
            if (playbackTimeoutRef.current) clearTimeout(playbackTimeoutRef.current);

            // Stop after difficulty duration
            const duration = DIFFICULTIES[difficulty].duration;
            console.log(`Playing for ${duration}ms`);
            playbackTimeoutRef.current = setTimeout(() => {
                console.log("Pausing playback...");
                if (playerRef.current) playerRef.current.pause();
            }, duration);
        }
    };

    const startTimer = () => {
        setTimeLeft(customTime);

        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
    };

    const handleAutoSubmit = () => {
        clearInterval(timerRef.current);
        if (playerRef.current) playerRef.current.pause();
        submitGuessAndShowResults();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        clearInterval(timerRef.current);
        if (playerRef.current) playerRef.current.pause();
        submitGuessAndShowResults();
    };

    const submitGuessAndShowResults = () => {
        submitGuess({
            guess_name: guess.name,
            guess_artist: guess.artist,
            guess_album: guess.album
        }, token).then(res => {
            setRoundResult(res.data);
            setScore(res.data.total_score);
            setHistory(prev => [...prev, res.data]);
            setGameState('result');
        }).catch(err => console.error(err));
    };

    const handleNextRound = () => {
        nextRound(token).then(res => {
            if (res.data.game_over) {
                setGameState('game_over');
            } else {
                setCurrentRoundData(res.data);
                setGuess({ name: '', artist: '', album: '' });
                setRoundResult(null);
                setGameState('playing');
                playUri(res.data.uri);
                if (timerEnabled) {
                    startTimer();
                }
            }
        }).catch(err => console.error(err));
    };

    if (!token) return <div className="text-center mt-20 text-xl">Please login first</div>;
    if (error) return <div className="text-red-500 text-center mt-20 text-xl font-bold">{error}</div>;
    if (!gameState) return <div className="text-white text-center mt-20 text-xl animate-pulse">Loading Game...</div>;

    return (
        <div className="container mx-auto p-4 min-h-screen flex flex-col">
            {/* Header */}
            <header className="flex justify-between items-center mb-6 py-4 border-b border-white/10">
                <h1 className="text-2xl font-bold tracking-tight">Guess The <span className="text-green-500">Song</span></h1>
                <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-400">Score: <span className="text-white font-bold text-lg">{score}</span></div>
                    {!isPlayerReady && <span className="text-xs text-yellow-500 animate-pulse">Connecting Player...</span>}
                    {isPlayerReady && <span className="text-xs text-green-500">● Online</span>}
                </div>
            </header>

            {gameState === 'selection' && (
                <div className="flex-1 flex flex-col gap-6">
                    <div className="glass-panel p-6 rounded-2xl">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <svg width="24" height="24" className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            Game Settings
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Difficulty */}
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Difficulty</label>
                                <div className="flex flex-col gap-2">
                                    {Object.entries(DIFFICULTIES).map(([key, config]) => (
                                        <button
                                            key={key}
                                            onClick={() => setDifficulty(key)}
                                            className={`px-3 py-2 rounded-lg font-semibold text-left transition-all flex justify-between items-center text-sm ${difficulty === key ? 'bg-white/10 border-green-500 border text-green-400 shadow-lg shadow-green-900/20' : 'bg-black/20 hover:bg-black/40 text-gray-400 border border-transparent'}`}
                                        >
                                            {config.label}
                                            <span className="text-xs opacity-60">{config.displayDuration / 1000}s</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Timer */}
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Timer</label>
                                <div className="bg-black/20 p-3 rounded-lg border border-white/5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-300 text-sm">Enable Timer</span>
                                        <input
                                            type="checkbox"
                                            checked={timerEnabled}
                                            onChange={e => setTimerEnabled(e.target.checked)}
                                            className="w-4 h-4 accent-green-500 rounded cursor-pointer"
                                        />
                                    </div>
                                    {timerEnabled && (
                                        <div>
                                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                <span>Seconds</span>
                                                <span>{customTime}s</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="10"
                                                max="99"
                                                value={customTime}
                                                onChange={e => setCustomTime(parseInt(e.target.value))}
                                                className="w-full accent-green-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Rounds */}
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Rounds</label>
                                <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                        <span>Count</span>
                                        <span>{customRounds}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        value={customRounds}
                                        onChange={e => setCustomRounds(parseInt(e.target.value))}
                                        className="w-full accent-green-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-xl font-bold mb-4">Select Playlist</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {playlists.map(p => (
                                <div key={p.id} onClick={() => handleStartGame(p.id)}
                                    className="group bg-[#181818] p-3 rounded-xl cursor-pointer hover:bg-[#282828] transition-all duration-300 hover:-translate-y-1 shadow-lg">
                                    <div className="relative w-full pb-[100%] mb-3 overflow-hidden rounded-lg shadow-md bg-gray-800">
                                        {p.images && p.images[0] ? (
                                            <img src={p.images[0].url} alt={p.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-gray-600">No Art</div>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <div className="bg-green-500 rounded-full p-3 shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                                                <svg width="24" height="24" className="w-6 h-6 text-black fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-white truncate text-sm mb-1">{p.name}</h3>
                                    <p className="text-xs text-gray-400">{p.tracks.total} Tracks</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {gameState === 'playing' && (
                <div className="flex-1 flex flex-col items-center justify-center max-w-xl mx-auto w-full">
                    <div className="glass-panel p-6 md:p-8 rounded-3xl w-full relative overflow-hidden">
                        {/* Progress Bar Timer */}
                        {timerEnabled && (
                            <div className="absolute top-0 left-0 w-full h-1 bg-gray-800">
                                <div
                                    className={`h-full transition-all duration-1000 ease-linear ${timeLeft <= 3 ? 'bg-red-500' : 'bg-green-500'}`}
                                    style={{ width: `${(timeLeft / customTime) * 100}%` }}
                                ></div>
                            </div>
                        )}

                        <div className="flex justify-between items-end mb-6 mt-2">
                            <div>
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Round</span>
                                <div className="text-3xl font-bold text-white">{currentRoundData?.round}</div>
                            </div>
                            {timerEnabled && (
                                <div className="text-right">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Time</span>
                                    <div className={`text-3xl font-bold tabular-nums ${timeLeft <= 3 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                                        {timeLeft}<span className="text-base text-gray-500 ml-1">s</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Visualizer */}
                        <div className="h-24 flex items-center justify-center gap-2 mb-8">
                            {[...Array(12)].map((_, i) => (
                                <div
                                    key={i}
                                    className="w-2 bg-gradient-to-t from-green-500 to-green-300 rounded-full visualizer-bar"
                                    style={{
                                        height: '20%',
                                        animationDelay: `${i * 0.1}s`,
                                        animationDuration: '0.6s'
                                    }}
                                ></div>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    placeholder="Song Name"
                                    value={guess.name}
                                    onChange={e => setGuess({ ...guess, name: e.target.value })}
                                    className="glass-input w-full p-3 rounded-xl text-lg font-medium"
                                    autoFocus
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    placeholder="Artist"
                                    value={guess.artist}
                                    onChange={e => setGuess({ ...guess, artist: e.target.value })}
                                    className="glass-input w-full p-3 rounded-xl"
                                />
                                <input
                                    type="text"
                                    placeholder="Album"
                                    value={guess.album}
                                    onChange={e => setGuess({ ...guess, album: e.target.value })}
                                    className="glass-input w-full p-3 rounded-xl"
                                />
                            </div>
                            <button type="submit" className="btn-primary w-full py-3 rounded-xl text-lg mt-2">
                                Submit Guess
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {gameState === 'result' && roundResult && (
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                    <div className="glass-panel p-6 rounded-3xl max-w-sm w-full text-center animate-fade-in">
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Round Result</h2>

                        <div className="relative inline-block mb-4">
                            <img
                                src={roundResult.image_url}
                                alt="Album Art"
                                width="96"
                                height="96"
                                className="w-24 h-24 rounded-lg shadow-xl mx-auto border-2 border-white/10 object-cover"
                            />
                            <div className="absolute -bottom-2 -right-2 bg-green-500 text-black font-bold w-8 h-8 flex items-center justify-center rounded-full shadow-lg text-sm">
                                +{roundResult.points_earned}
                            </div>
                        </div>

                        <div className="space-y-1 mb-6">
                            <h3 className="text-xl font-bold text-white truncate px-2">{roundResult.correct_name}</h3>
                            <p className="text-base text-green-400 truncate px-2">{roundResult.correct_artist}</p>
                            <p className="text-xs text-gray-500 truncate px-2">{roundResult.correct_album}</p>
                        </div>

                        <button onClick={handleNextRound} className="btn-primary px-8 py-2 rounded-full font-bold text-sm">
                            Next Round
                        </button>
                    </div>
                </div>
            )}

            {gameState === 'game_over' && (
                <Scoreboard score={score} history={history} />
            )}
        </div>
    );
};

export default Game;
