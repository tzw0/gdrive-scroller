import React, { useRef, useEffect, ReactNode } from 'react';
import { gsap } from 'gsap';

type voidFunc = () => void

interface AutoScrollProps {
    scroll?: boolean;
    children: ReactNode;
    speed: number;
    resetFunc: voidFunc;
}

const AutoScroll: React.FC<AutoScrollProps> = ({ scroll = false, children, speed, resetFunc }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<gsap.core.Tween | null>(null);
    const isPausedRef = useRef(false);

    useEffect(() => {
        if (!containerRef.current || !contentRef.current) return;

        const container = containerRef.current;
        const content = contentRef.current;

        // Reset positions
        // gsap.set(content, { y: 0 });

        // Function to create the animation
        const createAnimation = () => {
            const containerHeight = container.offsetHeight;
            const contentHeight = content.offsetHeight;

            // Only animate if content is taller than container
            if (contentHeight > containerHeight + 300 && scroll) {
                const duration = contentHeight / (50 * speed); // Adjust speed factor as needed
                console.log(">>", contentHeight, containerHeight)

                animationRef.current = gsap.to(content, {
                    y: -(contentHeight - containerHeight),
                    duration: duration,
                    ease: 'none',
                    onComplete: () => {
                        // Immediate reset to top without animation
                        gsap.set(content, { y: 0 });
                        // Restart animation
                        createAnimation();
                        console.log("reset")
                        resetFunc();
                    },
                });
            }
        };

        createAnimation();

        // Pause on hover or focus for accessibility
        const pauseAnimation = () => {
            if (animationRef.current && !isPausedRef.current) {
                animationRef.current.pause();
                isPausedRef.current = true;
            }
        };

        const handleClick = () => {
            if (!animationRef.current) return
            if (isPausedRef.current) {
                animationRef.current.play();
            } else {
                animationRef.current.pause();
            }
            isPausedRef.current = !isPausedRef.current
        }

        // container.addEventListener('click', handleClick);

        return () => {
            if (animationRef.current) {
                animationRef.current.kill();
            }
            container.removeEventListener('click', handleClick)
        };
    }, [children, speed, scroll]);

    return (
        <div
            ref={containerRef}
            className="h-full relative overflow-hidden"
            tabIndex={0} // Make it focusable for keyboard users
        >
            <div ref={contentRef}>
                {children}
            </div>
        </div>
    );
};

export default AutoScroll;