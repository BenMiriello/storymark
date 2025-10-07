import { ComponentType } from 'react';
import {
  useStoryTemplate,
  useStoryContext,
  StoryPropOptions,
} from '../context/StoryContext';
import type { StorySection, StoryMetadata } from '@storymark/core';

export interface WithStoryProps {
  sections: StorySection[];
  metadata: StoryMetadata;
  storyProp: (_name: string, _options?: StoryPropOptions) => any;
}

export function withStory<P extends object>(
  WrappedComponent: ComponentType<P & WithStoryProps>
): ComponentType<P> {
  const WithStoryComponent = (props: P) => {
    const { sections, metadata } = useStoryTemplate();
    const { storyProp } = useStoryContext();

    return (
      <WrappedComponent
        {...props}
        sections={sections}
        metadata={metadata}
        storyProp={storyProp}
      />
    );
  };

  WithStoryComponent.displayName = `withStory(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithStoryComponent;
}
