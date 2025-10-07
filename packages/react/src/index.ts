// Components
export { StoryRenderer } from './components/StoryRenderer';
export { StorySection } from './components/StorySection';
export { withStory } from './components/withStory';

// Template Components (examples)
export { ComicPanel } from './components/templates/ComicPanel';
export { PhotoEssay } from './components/templates/PhotoEssay';

// Context and Hooks
export {
  StoryProvider,
  useStoryTemplate,
  useStoryProp,
  useStoryContext,
} from './context/StoryContext';

// Template Registration
export {
  registerTemplate,
  getTemplateComponent,
  getRegisteredTemplates,
} from './registry/templateRegistry';

// Hooks
export { useStory } from './hooks/useStory';
export { useStoryNavigation } from './hooks/useStoryNavigation';
export type {
  UseStoryNavigationResult,
  UseStoryNavigationOptions,
  StoryNavigationState,
  StoryNavigationActions,
} from './hooks/useStoryNavigation';
export { useStoryEditor } from './hooks/useStoryEditor';
export type {
  UseStoryEditorOptions,
  UseStoryEditorResult,
} from './hooks/useStoryEditor';

// Types
export type {
  StoryRendererProps,
  StorySectionProps,
  StoryProviderProps,
  StoryContextValue,
  StoryPropOptions,
  WithStoryProps,
} from './types';
