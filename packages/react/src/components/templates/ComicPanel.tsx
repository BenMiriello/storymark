import { useStoryTemplate, useStoryProp } from '../../context/StoryContext';
import { StorySection } from '../StorySection';

export function ComicPanel() {
  const { sections } = useStoryTemplate();
  const columns = useStoryProp('columns', {
    default: 4,
    type: 'number',
    min: 1,
    max: 6,
    // description: 'Number of comic panels (1-6)',
  });
  const spacing = useStoryProp('spacing', {
    default: 'md',
    options: ['sm', 'md', 'lg'],
    // description: 'Spacing between panels',
  });

  const panelClasses = [
    'comic-panel-grid',
    `columns-${columns}`,
    `spacing-${spacing}`,
  ].join(' ');

  return (
    <div className={panelClasses}>
      {sections.map((section, index) => (
        <div key={index} className="comic-panel">
          <StorySection
            section={section}
            index={index}
            className="panel-content"
          />
        </div>
      ))}
    </div>
  );
}
