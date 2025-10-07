import { useCallback, useRef } from 'react';
import { detectSectionCreation, editor } from '@storymark/core';

export interface UseStoryEditorOptions {
  onContentChange?: (content: string) => void;
  onPageSwitch?: (page: number) => void;
  allowBlankPages?: boolean;
}

export interface UseStoryEditorResult {
  handleContentChange: HandleContentChangeFn;
  shouldSwitchToPage: ShouldSwitchToPageFn;
}

type ShouldSwitchToPageFn = (content: string) => number | null;
type HandleContentChangeFn = (content: string) => void;

export function useStoryEditor(
  options: UseStoryEditorOptions = {}
): UseStoryEditorResult {
  const { onContentChange, onPageSwitch, allowBlankPages = true } = options;
  const previousContentRef = useRef<string>('');

  const shouldSwitchToPage: ShouldSwitchToPageFn = useCallback(
    content => {
      // Check if new section was created
      const sectionCreated = detectSectionCreation(
        previousContentRef.current,
        content
      );
      if (!sectionCreated) return null;

      // Find target page for the new content
      const targetPage = editor.findTargetPageForEdit(content, allowBlankPages);
      return targetPage;
    },
    [allowBlankPages]
  );

  const handleContentChange: HandleContentChangeFn = useCallback(
    content => {
      // Check for auto-navigation BEFORE updating ref
      const targetPage = shouldSwitchToPage(content);

      // Call the provided content change handler
      if (onContentChange) {
        onContentChange(content);
      }

      // Handle page switching if needed
      if (targetPage !== null && onPageSwitch) {
        onPageSwitch(targetPage);
      }

      // Update previous content reference LAST
      previousContentRef.current = content;
    },
    [onContentChange, onPageSwitch, shouldSwitchToPage]
  );

  return {
    handleContentChange,
    shouldSwitchToPage,
  };
}
