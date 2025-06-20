import { useMemo } from 'react';
import { parseStory, type ParsedStory } from '../../../core/src/index';

export function useStorymark(content: string): ParsedStory {
  return useMemo(() => {
    return parseStory(content);
  }, [content]);
}