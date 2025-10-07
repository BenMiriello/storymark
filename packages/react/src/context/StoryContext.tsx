import { createContext, useContext, ReactNode } from 'react';
import type { ParsedStory, StorySection, StoryMetadata } from '@storymark/core';

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

export interface StoryProviderProps {
  story: ParsedStory;
  children: ReactNode;
  templateProps?: Record<string, any>;
}

const StoryContext = createContext<StoryContextValue | null>(null);

export function StoryProvider({
  story,
  children,
  templateProps = {},
}: StoryProviderProps) {
  const contextValue: StoryContextValue = {
    story,
    sections: story.sections,
    metadata: story.metadata,
    storyProp: (name: string, options?: StoryPropOptions) => {
      // Get value from templateProps, fallback to default
      let value = templateProps[name];

      if (value === undefined || value === null) {
        value = options?.default;
      }

      // Type coercion if needed
      if (value !== undefined && options?.type) {
        switch (options.type) {
          case 'number': {
            const num = Number(value);
            if (!isNaN(num)) value = num;
            break;
          }
          case 'boolean':
            if (typeof value === 'string') {
              value = value.toLowerCase() === 'true';
            }
            break;
          case 'array':
            if (typeof value === 'string') {
              value = value.split(',').map(s => s.trim());
            }
            break;
        }
      }

      // Validation
      if (options?.required && (value === undefined || value === null)) {
        if (process.env.NODE_ENV !== 'test') {
          console.warn(`Required story prop '${name}' is missing`);
        }
      }

      if (
        value !== undefined &&
        options?.options &&
        !options.options.includes(value)
      ) {
        if (process.env.NODE_ENV !== 'test') {
          console.warn(
            `Story prop '${name}' must be one of: ${options.options.join(', ')}`
          );
        }
      }

      if (value !== undefined && typeof value === 'number') {
        if (options?.max !== undefined && value > options.max) {
          if (process.env.NODE_ENV !== 'test') {
            console.warn(
              `Story prop '${name}' exceeds maximum value of ${options.max}`
            );
          }
        }
        if (options?.min !== undefined && value < options.min) {
          if (process.env.NODE_ENV !== 'test') {
            console.warn(
              `Story prop '${name}' is below minimum value of ${options.min}`
            );
          }
        }
      }

      return value;
    },
  };

  return (
    <StoryContext.Provider value={contextValue}>
      {children}
    </StoryContext.Provider>
  );
}

export function useStoryContext(): StoryContextValue {
  const context = useContext(StoryContext);
  if (!context) {
    throw new Error('useStoryContext must be used within a StoryProvider');
  }
  return context;
}

// Hook for accessing story data
export function useStoryTemplate(): {
  sections: StorySection[];
  metadata: StoryMetadata;
} {
  const { sections, metadata } = useStoryContext();
  return { sections, metadata };
}

// Hook for accessing story props with validation
export function useStoryProp(name: string, options?: StoryPropOptions): any {
  const { storyProp } = useStoryContext();
  return storyProp(name, options);
}
