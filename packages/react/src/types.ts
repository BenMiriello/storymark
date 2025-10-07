import type {
  StorySection,
  StoryDirective,
  ParsedStory,
  StoryMetadata,
} from '@storymark/core';
import type { ReactNode } from 'react';

export interface StoryRendererProps {
  content: string;
  className?: string;
}

export interface StorySectionProps {
  section: StorySection;
  index: number;
  className?: string;
}

// New Context and Provider types
export interface StoryProviderProps {
  story: ParsedStory;
  children: ReactNode;
  templateProps?: Record<string, any>;
}

export interface StoryContextValue {
  story: ParsedStory;
  sections: StorySection[];
  metadata: StoryMetadata;
  storyProp: (_name: string, _options?: StoryPropOptions) => any;
}

export interface StoryPropOptions {
  default?: any;
  options?: any[];
  max?: number;
  min?: number;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array';
}

// HOC props for class components
export interface WithStoryProps {
  sections: StorySection[];
  metadata: StoryMetadata;
  storyProp: (_name: string, _options?: StoryPropOptions) => any;
}

export interface DirectiveHandlers {
  image?: (directive: StoryDirective) => React.ReactNode;
  template?: (directive: StoryDirective) => React.ReactNode;
  justify?: (directive: StoryDirective) => string; // Returns CSS class
  delay?: (directive: StoryDirective) => number; // Returns delay in ms
  fade?: (directive: StoryDirective) => string; // Returns CSS class
  [key: string]: any;
}
