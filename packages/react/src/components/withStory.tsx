import React, { ComponentType } from 'react';
import {
  useStory,
  useStorymarkContext,
  StoryPropOptions,
} from '../context/StorymarkContext';
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
    const { sections, metadata } = useStory();
    const { storyProp } = useStorymarkContext();

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
