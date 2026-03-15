import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const IntroVideo = () => {
    const STORAGE_KEY = "artvpp_intro_seen";
    const VIDEO_DURATION = 8000; // 8 seconds fallback

    // Synchronous initial check to avoid flash of content
    const [isVisible, setIsVisible] = useState(() => {
        if (typeof window !== 'undefined') {
            return !localStorage.getItem(STORAGE_KEY);
        }
        return false;
    });

    // Default to muted for guaranteed autoplay, attempt to unmute on user interaction or if possible
    const [isMuted, setIsMuted] = useState(true);
    const videoRef = useRef(null);

    useEffect(() => {
        // Backup check in case of hydration or SSR issues
        const introSeen = localStorage.getItem(STORAGE_KEY);
        if (introSeen && isVisible) {
            setIsVisible(false);
        }

        if (isVisible) {
            // Guarantee cleanup even if video fails to play or end
            const timer = setTimeout(() => {
                handleIntroEnd();
            }, VIDEO_DURATION);

            // Try to play explicitly
            if (videoRef.current) {
                videoRef.current.play().catch(error => {
                    console.log("Autoplay blocked or failed:", error);
                });
            }

            return () => clearTimeout(timer);
        }
    }, [isVisible]);

    const handleIntroEnd = () => {
        setIsVisible(false);
        localStorage.setItem(STORAGE_KEY, "true");
    };

    const handleSkip = () => {
        if (videoRef.current) {
            videoRef.current.pause();
        }
        handleIntroEnd();
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        zIndex: 99999, // Extremely high z-index
                        background: 'black',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                    }}
                    onClick={handleSkip}
                >
                    <video
                        ref={videoRef}
                        src="/Launchvideo.mp4"
                        autoPlay
                        playsInline
                        muted={isMuted}
                        controls={false} // Requirement: not show controls
                        onEnded={handleIntroEnd}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover' // Requirement: cover entire screen properly
                        }}
                    />

                    {/* Unmute prompt if muted to satisfy "with sound" requirement on first visit */}
                    {isMuted && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsMuted(false);
                            }}
                            style={{
                                position: 'absolute',
                                top: '30px',
                                right: '30px',
                                background: 'rgba(0, 0, 0, 0.5)',
                                color: 'white',
                                border: 'none',
                                padding: '8px 15px',
                                borderRadius: '20px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                backdropFilter: 'blur(5px)',
                                zIndex: 100001
                            }}
                        >
                            🔊 Unmute
                        </button>
                    )}

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleSkip();
                        }}
                        style={{
                            position: 'absolute',
                            bottom: '40px',
                            right: '40px',
                            background: 'rgba(255, 255, 255, 0.15)',
                            color: 'white',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            padding: '12px 24px',
                            borderRadius: '50px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: '500',
                            backdropFilter: 'blur(10px)',
                            zIndex: 100000,
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(255, 255, 255, 0.25)';
                            e.target.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                            e.target.style.transform = 'scale(1)';
                        }}
                    >
                        Skip Intro
                    </button>

                    {/* Shadow overlay to make text/button pop if video is white at the bottom */}
                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '150px',
                        background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
                        pointerEvents: 'none'
                    }} />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default IntroVideo;
