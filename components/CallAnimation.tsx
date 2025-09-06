
import React from 'react';

const Particle: React.FC = () => {
    const style = {
        '--x': `${Math.random() * 100}vw`,
        '--y': `${Math.random() * 100}vh`,
        '--size': `${Math.random() * 3 + 1}px`,
        '--duration': `${Math.random() * 10 + 10}s`,
        '--delay': `${Math.random() * -20}s`,
    } as React.CSSProperties;

    return <div className="particle" style={style}></div>;
};

export const CallAnimation: React.FC = () => {
    const particles = Array.from({ length: 50 });

    return (
        <div className="fixed inset-0 bg-gray-900 pointer-events-none z-0 overflow-hidden">
            <style>
                {`
                    @keyframes float {
                        0% { transform: translate(var(--x), var(--y)) scale(1); opacity: 0; }
                        10% { opacity: 1; }
                        90% { opacity: 1; }
                        100% {
                            transform: translate(calc(var(--x) + ${Math.random() * 100 - 50}px), calc(var(--y) - 100vh)) scale(1.5);
                            opacity: 0;
                        }
                    }
                    .particle {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: var(--size);
                        height: var(--size);
                        background-color: rgba(255, 255, 255, 0.7);
                        border-radius: 50%;
                        animation: float var(--duration) var(--delay) linear infinite;
                    }

                    @keyframes background-pan {
                        0% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                        100% { background-position: 0% 50%; }
                    }
                `}
            </style>
            <div 
                className="absolute inset-0"
                style={{
                    background: 'linear-gradient(270deg, #0f172a, #1e293b, #3b0764, #2c1a4d)',
                    backgroundSize: '800% 800%',
                    animation: 'background-pan 15s ease infinite',
                }}
            ></div>
            {particles.map((_, i) => <Particle key={i} />)}
        </div>
    );
};
