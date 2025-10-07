import { useStoryTemplate, useStoryProp } from '../../context/StoryContext';
import { StorySection } from '../StorySection';

export function PhotoEssay() {
  const { sections } = useStoryTemplate();
  const layout = useStoryProp('layout', {
    default: 'grid',
    options: ['grid', 'masonry', 'column'],
    // description: 'Photo layout style',
  });
  const aspectRatio = useStoryProp('aspectRatio', {
    default: 'auto',
    options: ['auto', '16:9', '4:3', '1:1'],
    // description: 'Image aspect ratio',
  });

  const essayClasses = [
    'photo-essay',
    `layout-${layout}`,
    `aspect-${aspectRatio.replace(':', '-')}`,
  ].join(' ');

  return (
    <div className={essayClasses}>
      {sections.map((section, index) => (
        <article key={index} className="photo-section">
          <StorySection
            section={section}
            index={index}
            className="essay-content"
          />
        </article>
      ))}
    </div>
  );
}
