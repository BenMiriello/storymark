import { useStory } from '../hooks/useStory';
import { StorySection as StorySectionComponent } from './StorySection';
import type { StoryRendererProps } from '../types';
import type { ParseError, StorySection } from '@storymark/core';

export function StoryRenderer({ content, className = '' }: StoryRendererProps) {
  const story = useStory(content);

  const hasErrors = story.errors.length > 0;

  if (hasErrors) {
    return (
      <div className={`storymark-renderer error ${className}`}>
        <div className="storymark-errors">
          <h3>Story Parsing Errors:</h3>
          <ul>
            {story.errors.map((error: ParseError, index: number) => (
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
        {(story.metadata.categories || story.metadata.category) && (
          <div className="storymark-categories">
            {story.metadata.categories ? (
              story.metadata.categories.map((category, index) => (
                <span key={index} className="storymark-category">
                  {category}
                </span>
              ))
            ) : (
              <span className="storymark-category">
                {story.metadata.category}
              </span>
            )}
          </div>
        )}
      </header>

      <main className="storymark-content">
        {story.sections.map((section: StorySection, index: number) => (
          <StorySectionComponent
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
