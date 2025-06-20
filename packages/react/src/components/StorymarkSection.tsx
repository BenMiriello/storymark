import { useMemo } from 'react';
import type { StoryDirective } from '../../../core/src/index';
import type { StorymarkSectionProps } from '../types';

export function StorymarkSection({ section, index, className = '' }: StorymarkSectionProps) {
  // Process directives to extract styling and content modifications
  const processedDirectives = useMemo(() => {
    const styles: React.CSSProperties = {};
    const cssClasses: string[] = [];
    const imageDirectives: StoryDirective[] = [];
    
    section.directives.forEach((directive) => {
      switch (directive.type) {
        case 'justify':
          styles.textAlign = directive.value as 'left' | 'center' | 'right' | 'justify';
          break;
        case 'delay':
          // Parse delay value (e.g., "2.5s" or "500ms")
          const match = directive.value.match(/^(\d+(?:\.\d+)?)(s|ms)?$/);
          if (match) {
            const value = parseFloat(match[1]);
            const unit = match[2] || 's';
            const delayMs = unit === 'ms' ? value : value * 1000;
            styles.animationDelay = `${delayMs}ms`;
          }
          break;
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
    'storymark-section',
    `section-${index}`,
    ...processedDirectives.cssClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <section className={sectionClasses} style={processedDirectives.styles}>
      {section.text && (
        <div className="section-text">
          <p>{section.text}</p>
        </div>
      )}
      
      {processedDirectives.imageDirectives.map((imageDirective, imgIndex) => (
        <div key={imgIndex} className="section-image">
          <img 
            src={imageDirective.value} 
            alt={imageDirective.params?.[0] || ''}
            className="storymark-image"
          />
          {imageDirective.params?.[0] && (
            <figcaption className="image-caption">
              {imageDirective.params[0]}
            </figcaption>
          )}
        </div>
      ))}
      
      {section.directives.length > 0 && (
        <details className="section-debug" style={{ fontSize: '0.8em', opacity: 0.7 }}>
          <summary>Debug: Directives ({section.directives.length})</summary>
          <pre>{JSON.stringify(section.directives, null, 2)}</pre>
        </details>
      )}
    </section>
  );
}