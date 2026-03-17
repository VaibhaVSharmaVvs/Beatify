import React from 'react';

const Scoreboard = ({ score, history }) => {
    const handlePlayAgain = () => {
        window.location.reload();
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center py-10">
            <div className="glass-panel p-8 rounded-3xl max-w-2xl w-full">
                <div className="text-center mb-10">
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Game Over</h2>
                    <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-2">
                        {score} <span className="text-2xl text-gray-500">pts</span>
                    </div>
                    <p className="text-gray-400">Total Score</p>
                </div>

                <div className="space-y-4 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {history.map((round, index) => (
                        <div key={index} className="bg-white/5 p-4 rounded-xl flex items-center gap-4 border border-white/5 hover:bg-white/10 transition-colors">
                            <div className="font-bold text-gray-500 w-6 text-center">{index + 1}</div>

                            <img
                                src={round.image_url}
                                alt="Art"
                                className="w-12 h-12 rounded shadow-sm object-cover"
                            />

                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-white truncate">{round.correct_name}</h4>
                                <p className="text-sm text-gray-400 truncate">{round.correct_artist}</p>
                            </div>

                            <div className="text-right">
                                <div className="font-bold text-green-400">+{round.points_earned}</div>
                                <div className="text-xs text-gray-600">points</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center">
                    <button
                        onClick={handlePlayAgain}
                        className="btn-primary px-12 py-4 rounded-full text-lg font-bold"
                    >
                        Play Again
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Scoreboard;
