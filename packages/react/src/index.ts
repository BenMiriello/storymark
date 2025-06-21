// Components
export { StorymarkRenderer } from './components/StorymarkRenderer';
export { StorymarkSection } from './components/StorymarkSection';
export { withStory } from './components/withStory';

// Template Components (examples)
export { ComicPanel4 } from './components/templates/ComicPanel4';
export { PhotoEssay } from './components/templates/PhotoEssay';

// Context and Hooks
export {
  StorymarkProvider,
  useStory,
  useStoryProp,
  useStorymarkContext,
} from './context/StorymarkContext';

// Template Registration
export {
  registerTemplate,
  getTemplateComponent,
  getRegisteredTemplates,
} from './registry/templateRegistry';

// Legacy Hook (for backward compatibility)
export { useStorymark } from './hooks/useStorymark';

// Types
export type {
  StorymarkRendererProps,
  StorymarkSectionProps,
  StorymarkProviderProps,
  StorymarkContextValue,
  StoryPropOptions,
  WithStoryProps,
} from './types';
