import type { ParsedStory, StorySection, StoryDirective } from '../../core/src/index';

export interface StorymarkRendererProps {
  content: string;
  className?: string;
}

export interface StorymarkSectionProps {
  section: StorySection;
  index: number;
  className?: string;
}

export interface DirectiveHandlers {
  image?: (directive: StoryDirective) => React.ReactNode;
  template?: (directive: StoryDirective) => React.ReactNode;
  justify?: (directive: StoryDirective) => string; // Returns CSS class
  delay?: (directive: StoryDirective) => number; // Returns delay in ms
  fade?: (directive: StoryDirective) => string; // Returns CSS class
  [key: string]: any;
}