import { useMemo } from 'react';
import { useStorymark } from '../hooks/useStorymark';
import { StorymarkSection } from './StorymarkSection';
import type { StorymarkRendererProps } from '../types';

export function StorymarkRenderer({ content, className = '' }: StorymarkRendererProps) {
  const story = useStorymark(content);

  const hasErrors = story.errors.length > 0;

  if (hasErrors) {
    return (
      <div className={`storymark-renderer error ${className}`}>
        <div className="storymark-errors">
          <h3>Story Parsing Errors:</h3>
          <ul>
            {story.errors.map((error, index) => (
              <li key={index} className={`error-${error.type}`}>
                {error.message}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className={`storymark-renderer ${className}`}>
      <header className="storymark-header">
        <h1 className="storymark-title">{story.metadata.title}</h1>
        {story.metadata.category && (
          <span className="storymark-category">{story.metadata.category}</span>
        )}
      </header>
      
      <main className="storymark-content">
        {story.sections.map((section, index) => (
          <StorymarkSection
            key={index}
            section={section}
            index={index}
            className="storymark-section"
          />
        ))}
      </main>
    </div>
  );
}