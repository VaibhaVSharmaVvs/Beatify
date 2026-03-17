import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const Login = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');

        if (accessToken) {
            localStorage.setItem('access_token', accessToken);
            localStorage.setItem('refresh_token', refreshToken);
            navigate('/game');
        }
    }, [searchParams, navigate]);

    const handleLogin = () => {
        window.location.href = 'http://localhost:8000/login';
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-500/20 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[100px]"></div>
            </div>

            <div className="glass-panel p-12 rounded-3xl max-w-lg w-full text-center space-y-8 transform transition-all hover:scale-[1.01]">
                <div className="space-y-4">
                    <h1 className="text-6xl font-bold tracking-tighter mb-2">
                        Guess The <span className="text-gradient">Song</span>
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Test your music knowledge with your own Spotify playlists.
                    </p>
                </div>

                <div className="py-8">
                    <div className="flex justify-center gap-2 mb-8">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div
                                key={i}
                                className="w-2 bg-green-500 rounded-full visualizer-bar"
                                style={{
                                    height: '40px',
                                    animationDelay: `${i * 0.1}s`,
                                    animationDuration: '0.8s'
                                }}
                            ></div>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleLogin}
                    className="btn-primary w-full py-4 rounded-full text-lg flex items-center justify-center gap-3 group"
                >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.48.66.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                    </svg>
                    <span>Connect with Spotify</span>
                </button>

                <p className="text-xs text-gray-500 mt-4">
                    Premium required for full playback.
                </p>
            </div>
        </div>
    );
};

export default Login;
