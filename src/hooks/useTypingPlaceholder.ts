import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * TypingPlaceholder Hook - สำหรับสร้าง placeholder animation
 * Decouple จาก value: ทำงานเฉพาะ placeholder เท่านั้น
 */
export function useTypingPlaceholder(
  phrases: string[] = ['ค้นหาบ้าน...', 'ค้นหาคอนโด...', 'ค้นหาทาวน์โฮม...'],
  typingSpeed: number = 100,
  deletingSpeed: number = 50,
  pauseTime: number = 2000
) {
  const [displayText, setDisplayText] = useState('');
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isStopped, setIsStopped] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentIndexRef = useRef(0);

  const stop = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsStopped(true);
    setIsPaused(true);
  }, []);

  const start = useCallback(() => {
    setIsStopped(false);
    setIsPaused(false);
    setIsTyping(true);
    setDisplayText('');
    setCurrentPhraseIndex(0);
    currentIndexRef.current = 0;
  }, []);

  useEffect(() => {
    if (phrases.length === 0 || isStopped) return;

    const currentPhrase = phrases[currentPhraseIndex];
    if (!currentPhrase) return;

    const type = () => {
      if (currentIndexRef.current < currentPhrase.length) {
        setDisplayText(currentPhrase.slice(0, currentIndexRef.current + 1));
        currentIndexRef.current++;
        timeoutRef.current = setTimeout(type, typingSpeed);
      } else {
        setIsPaused(true);
        timeoutRef.current = setTimeout(() => {
          setIsPaused(false);
          setIsTyping(false);
        }, pauseTime);
      }
    };

    const deleteText = () => {
      if (currentIndexRef.current > 0) {
        setDisplayText(currentPhrase.slice(0, currentIndexRef.current - 1));
        currentIndexRef.current--;
        timeoutRef.current = setTimeout(deleteText, deletingSpeed);
      } else {
        setIsTyping(true);
        setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
        currentIndexRef.current = 0;
      }
    };

    if (isTyping && !isPaused && !isStopped) {
      type();
    } else if (!isTyping && !isPaused && !isStopped) {
      deleteText();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [phrases, currentPhraseIndex, isTyping, isPaused, isStopped, typingSpeed, deletingSpeed, pauseTime]);

  return { displayText, stop, start };
}
