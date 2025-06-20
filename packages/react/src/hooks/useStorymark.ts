import { useMemo } from 'react';
import { parseStory, type ParsedStory } from '@storymark/core';

export function useStorymark(content: string): ParsedStory {
  return useMemo(() => {
    return parseStory(content);
  }, [content]);
}
