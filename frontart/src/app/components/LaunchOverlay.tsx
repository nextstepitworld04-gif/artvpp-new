import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import logo from '../../assets/artvpplogo.png';

export function LaunchOverlay({ onLaunch }: { onLaunch: () => void }) {
    const [launching, setLaunching] = useState(false);
    const [particles, setParticles] = useState<number[]>([]);

    const handleLaunch = () => {
        setLaunching(true);
        // Create burst particles
        setParticles(Array.from({ length: 40 }, (_, i) => i));

        // Let the animation play, then reveal the site
        setTimeout(() => {
            onLaunch();
        }, 2000);
    };

    return (
        <AnimatePresence>
            {!launching ? (
                <motion.div
                    key="overlay"
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
                    style={{ background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0f 70%)' }}
                >
                    {/* Animated background particles */}
                    <div className="absolute inset-0 overflow-hidden">
                        {Array.from({ length: 60 }).map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-1 h-1 rounded-full"
                                style={{
                                    background: i % 3 === 0 ? '#a73f2b' : i % 3 === 1 ? '#a73f2b' : 'rgba(255,255,255,0.3)',
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                }}
                                animate={{
                                    y: [0, -30, 0],
                                    opacity: [0.2, 0.8, 0.2],
                                    scale: [1, 1.5, 1],
                                }}
                                transition={{
                                    duration: 3 + Math.random() * 4,
                                    repeat: Infinity,
                                    delay: Math.random() * 3,
                                    ease: 'easeInOut',
                                }}
                            />
                        ))}
                    </div>

                    {/* Glowing ring behind logo */}
                    <motion.div
                        className="absolute rounded-full"
                        style={{
                            width: 320,
                            height: 320,
                            background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)',
                        }}
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 0.8, 0.5],
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    />

                    {/* Logo */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
                        className="relative z-10 mb-8"
                    >
                        <img
                            src={logo}
                            alt="ArtVPP"
                            className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-2xl"
                        />
                    </motion.div>

                    {/* Title */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="relative z-10 text-center mb-4"
                    >
                        <h1 className="text-5xl md:text-2xl lg:text-2xl font-light tracking-[0.2em] text-white" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                            ART<span className="text-[#a73f2b] font-bold">VPP</span>
                        </h1>
                    </motion.div>

                    {/* Tagline */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.7 }}
                        className="relative z-10 text-base md:text-lg tracking-[0.4em] text-white/60 uppercase mb-16 text-center px-4"
                    >
                        Where Art Meets Freedom
                    </motion.p>

                    {/* Launch Button */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 1.2 }}
                        className="relative z-10"
                    >
                        {/* Pulsing ring around button */}
                        <motion.div
                            className="absolute inset-0 rounded-full border-2 border-[#a73f2b]"
                            animate={{
                                scale: [1, 1.3, 1],
                                opacity: [0.6, 0, 0.6],
                            }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            style={{ margin: -12 }}
                        />
                        <motion.div
                            className="absolute inset-0 rounded-full border border-[#a73f2b]/40"
                            animate={{
                                scale: [1, 1.6, 1],
                                opacity: [0.3, 0, 0.3],
                            }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                            style={{ margin: -20 }}
                        />

                        <button
                            onClick={handleLaunch}
                            className="relative px-14 py-5 md:px-20 md:py-6 bg-gradient-to-r from-[#a73f2b] via-[#E8C84A] to-[#a73f2b] text-black font-bold text-lg md:text-xl tracking-[0.25em] uppercase rounded-full shadow-[0_0_40px_rgba(212,175,55,0.4)] hover:shadow-[0_0_60px_rgba(212,175,55,0.6)] transition-all duration-500 hover:scale-105 active:scale-95 cursor-pointer"
                        >
                            🚀 LAUNCH WEBSITE
                        </button>
                    </motion.div>

                    {/* Bottom decorative text */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.8, duration: 1 }}
                        className="absolute bottom-8 text-white/30 text-xs tracking-[0.3em] uppercase z-10"
                    >
                        Empowering Artists Worldwide
                    </motion.p>
                </motion.div>
            ) : (
                /* Launch Animation */
                <motion.div
                    key="launching"
                    className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
                    style={{ background: '#0a0a0f' }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    {/* Burst particles */}
                    {particles.map((i) => {
                        const angle = (i / 40) * Math.PI * 2;
                        const distance = 600 + Math.random() * 400;
                        return (
                            <motion.div
                                key={i}
                                className="absolute rounded-full"
                                style={{
                                    width: 4 + Math.random() * 8,
                                    height: 4 + Math.random() * 8,
                                    background: i % 3 === 0 ? '#a73f2b' : i % 3 === 1 ? '#a73f2b' : '#fff',
                                    left: '50%',
                                    top: '50%',
                                }}
                                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                                animate={{
                                    x: Math.cos(angle) * distance,
                                    y: Math.sin(angle) * distance,
                                    opacity: 0,
                                    scale: 0,
                                }}
                                transition={{ duration: 1.5, ease: 'easeOut' }}
                            />
                        );
                    })}

                    {/* Center flash */}
                    <motion.div
                        className="absolute rounded-full bg-gradient-to-r from-[#a73f2b] to-[#b30452] hover:brightness-110 hover:shadow-[0px_6px_20px_rgba(179,4,82,0.35)]"
                        initial={{ width: 0, height: 0, opacity: 1 }}
                        animate={{ width: 3000, height: 3000, opacity: 0 }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                    />

                    {/* Text */}
                    <motion.h2
                        className="relative z-10 text-4xl md:text-6xl font-bold text-white tracking-[0.3em]"
                        style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1.1, 1, 1.2] }}
                        transition={{ duration: 2, times: [0, 0.3, 0.7, 1] }}
                    >
                        WELCOME
                    </motion.h2>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

