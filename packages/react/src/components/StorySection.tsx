import { useMemo } from 'react';
import type { StoryDirective } from '@storymark/core';
import type { StorySectionProps } from '../types';

export function StorySection({
  section,
  index,
  className = '',
}: StorySectionProps) {
  // Process directives to extract styling and content modifications
  const processedDirectives = useMemo(() => {
    const styles: React.CSSProperties = {};
    const cssClasses: string[] = [];
    const imageDirectives: StoryDirective[] = [];

    section.directives.forEach(directive => {
      switch (directive.type) {
        case 'justify':
          styles.textAlign = directive.value as
            | 'left'
            | 'center'
            | 'right'
            | 'justify';
          break;
        case 'delay': {
          // Parse delay value (e.g., "2.5s" or "500ms")
          const match = directive.value.match(/^(\d+(?:\.\d+)?)(s|ms)?$/);
          if (match) {
            const value = parseFloat(match[1]);
            const unit = match[2] || 's';
            const delayMs = unit === 'ms' ? value : value * 1000;
            styles.animationDelay = `${delayMs}ms`;
          }
          break;
        }
        case 'fade':
          cssClasses.push(`fade-${directive.value}`);
          break;
        case 'template':
          cssClasses.push(`template-${directive.value}`);
          break;
        case 'image':
          imageDirectives.push(directive);
          break;
      }
    });

    return { styles, cssClasses, imageDirectives };
  }, [section.directives]);

  const sectionClasses = [
    'story-section',
    `section-${index}`,
    ...processedDirectives.cssClasses,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={sectionClasses} style={processedDirectives.styles}>
      {section.text && (
        <div className="section-text">
          <p>{section.text}</p>
        </div>
      )}

      {processedDirectives.imageDirectives.map((imageDirective, imgIndex) => (
        <div
          key={imgIndex}
          className="section-image"
          style={{ marginBottom: '1rem' }}
        >
          <img
            src={imageDirective.value}
            alt={imageDirective.params?.[0] || ''}
            className="story-image"
            style={{
              maxWidth: '100%',
              height: 'auto',
              display: 'block',
              borderRadius: '6px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}
          />
          {imageDirective.params?.[0] && (
            <figcaption
              className="image-caption"
              style={{
                marginTop: '0.5rem',
                fontSize: '0.875rem',
                color: '#9ca3af',
                textAlign: 'center',
                fontStyle: 'italic',
              }}
            >
              {imageDirective.params[0]}
            </figcaption>
          )}
        </div>
      ))}

      {/* Debug directives hidden as requested
      {section.directives.length > 0 && (
        <details
          className="section-debug"
          style={{ fontSize: '0.8em', opacity: 0.7 }}
        >
          <summary>Debug: Directives ({section.directives.length})</summary>
          <pre>{JSON.stringify(section.directives, null, 2)}</pre>
        </details>
      )}
      */}
    </section>
  );
}
