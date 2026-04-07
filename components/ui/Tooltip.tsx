'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 200,
  className = ''
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const positionStyles = {
    top: {
      initial: { opacity: 0, y: 8, scale: 0.95 },
      animate: { opacity: 1, y: 0, scale: 1 },
      className: 'bottom-full left-1/2 -translate-x-1/2 mb-2'
    },
    bottom: {
      initial: { opacity: 0, y: -8, scale: 0.95 },
      animate: { opacity: 1, y: 0, scale: 1 },
      className: 'top-full left-1/2 -translate-x-1/2 mt-2'
    },
    left: {
      initial: { opacity: 0, x: 8, scale: 0.95 },
      animate: { opacity: 1, x: 0, scale: 1 },
      className: 'right-full top-1/2 -translate-y-1/2 mr-2'
    },
    right: {
      initial: { opacity: 0, x: -8, scale: 0.95 },
      animate: { opacity: 1, x: 0, scale: 1 },
      className: 'left-full top-1/2 -translate-y-1/2 ml-2'
    }
  };

  const { initial, animate, className: positionClass } = positionStyles[position];

  return (
    <div
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={initial}
            animate={animate}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`
              absolute z-50 ${positionClass}
              px-3 py-2 text-sm
              bg-zinc-900 text-white
              rounded-lg shadow-lg
              whitespace-nowrap
              pointer-events-none
              ${className}
            `}
          >
            {content}
            {/* Arrow */}
            <div
              className={`
                absolute w-2 h-2 bg-zinc-900 rotate-45
                ${position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -translate-y-1/2' : ''}
                ${position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 translate-y-1/2' : ''}
                ${position === 'left' ? 'left-full top-1/2 -translate-y-1/2 -translate-x-1/2' : ''}
                ${position === 'right' ? 'right-full top-1/2 -translate-y-1/2 translate-x-1/2' : ''}
              `}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Info tooltip icon with built-in tooltip
interface InfoTooltipProps {
  content: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function InfoTooltip({ content, position = 'top' }: InfoTooltipProps) {
  return (
    <Tooltip content={content} position={position}>
      <svg
        className="w-4 h-4 text-white/40 hover:text-white/60 cursor-help transition-colors"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </Tooltip>
  );
}

export default Tooltip;
