import React, { useEffect, useRef } from 'react';

interface SnapScrollContainerProps {
  children: React.ReactNode;
  onActiveIndexChange: (index: number) => void;
  activeIndex: number;
}

export const SnapScrollContainer: React.FC<SnapScrollContainerProps> = ({
  children,
  onActiveIndexChange,
  activeIndex,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const activeIndexRef = useRef(activeIndex);
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const onActiveIndexChangeRef = useRef(onActiveIndexChange);
  useEffect(() => {
    onActiveIndexChangeRef.current = onActiveIndexChange;
  }, [onActiveIndexChange]);

  // Compute a stable string of keys representing the current children structure to avoid running effect on every render
  const childrenKeys = React.Children.map(children, (child) => {
    return React.isValidElement(child) ? (child.key || '') : '';
  }).join(',');

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // We query items on the next layout/paint to ensure they exist post-render
    const items = container.querySelectorAll('[data-snap-slide]');
    if (items.length === 0) return;

    // Direct intersection observer with thresholds suitable for 100vh slides
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const indexAttribute = entry.target.getAttribute('data-index');
            if (indexAttribute !== null) {
              const activeIdx = parseInt(indexAttribute, 10);
              if (activeIdx !== activeIndexRef.current) {
                onActiveIndexChangeRef.current(activeIdx);
              }
            }
          }
        });
      },
      {
        root: container,
        threshold: 0.5, // Slide is considered active when 50% or more is within view
      }
    );

    items.forEach((item) => observer.observe(item));

    return () => {
      items.forEach((item) => observer.unobserve(item));
      observer.disconnect();
    };
  }, [childrenKeys]);

  return (
    <div
      ref={containerRef}
      className="feed-scroll-container select-none"
    >
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return null;
        return React.cloneElement(child as React.ReactElement<any>, {
          'data-snap-slide': 'true',
          'data-index': index.toString(),
          className: `${child.props.className || ''} feed-cell relative`,
          style: { ...child.props.style, height: '100vh', minHeight: '100vh' },
        });
      })}
    </div>
  );
};

