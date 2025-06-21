import React, { createContext, useContext, ReactNode } from 'react';
import type { ParsedStory, StorySection, StoryMetadata } from '@storymark/core';

export interface StorymarkContextValue {
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

export interface StorymarkProviderProps {
  story: ParsedStory;
  children: ReactNode;
  templateProps?: Record<string, any>;
}

const StorymarkContext = createContext<StorymarkContextValue | null>(null);

export function StorymarkProvider({
  story,
  children,
  templateProps = {},
}: StorymarkProviderProps) {
  const contextValue: StorymarkContextValue = {
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
    <StorymarkContext.Provider value={contextValue}>
      {children}
    </StorymarkContext.Provider>
  );
}

export function useStorymarkContext(): StorymarkContextValue {
  const context = useContext(StorymarkContext);
  if (!context) {
    throw new Error(
      'useStorymarkContext must be used within a StorymarkProvider'
    );
  }
  return context;
}

// Hook for accessing story data
export function useStory(): {
  sections: StorySection[];
  metadata: StoryMetadata;
} {
  const { sections, metadata } = useStorymarkContext();
  return { sections, metadata };
}

// Hook for accessing story props with validation
export function useStoryProp(name: string, options?: StoryPropOptions): any {
  const { storyProp } = useStorymarkContext();
  return storyProp(name, options);
}
