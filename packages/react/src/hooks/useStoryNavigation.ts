import { useState, useMemo } from 'react';
import type { StorySection } from '@storymark/core';

export interface StoryNavigationState {
  currentPage: number;
  totalPages: number;
  currentSection: StorySection | null;
  isFirstPage: boolean;
  isLastPage: boolean;
}

export interface StoryNavigationActions {
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  reset: () => void;
}

export interface UseStoryNavigationResult
  extends StoryNavigationState,
    StoryNavigationActions {}

export interface UseStoryNavigationOptions {
  startPage?: number;
  onPageChange?: (page: number, section: StorySection | null) => void;
}

/**
 * Hook for managing story navigation and pagination
 * Each section (separated by ---) represents a page
 */
export function useStoryNavigation(
  sections: StorySection[],
  options: UseStoryNavigationOptions = {}
): UseStoryNavigationResult {
  const { startPage = 0, onPageChange } = options;

  const [currentPage, setCurrentPage] = useState(startPage);

  const navigationState = useMemo(() => {
    const totalPages = sections.length;
    const safeCurrentPage = Math.max(0, Math.min(currentPage, totalPages - 1));
    const currentSection = sections[safeCurrentPage] || null;

    return {
      currentPage: safeCurrentPage,
      totalPages,
      currentSection,
      isFirstPage: safeCurrentPage === 0,
      isLastPage: safeCurrentPage === totalPages - 1,
    };
  }, [sections, currentPage]);

  const goToPage = (page: number) => {
    const newPage = Math.max(0, Math.min(page, navigationState.totalPages - 1));
    setCurrentPage(newPage);

    if (onPageChange) {
      const section = sections[newPage] || null;
      onPageChange(newPage, section);
    }
  };

  const nextPage = () => {
    if (!navigationState.isLastPage) {
      goToPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (!navigationState.isFirstPage) {
      goToPage(currentPage - 1);
    }
  };

  const reset = () => {
    goToPage(startPage);
  };

  return {
    ...navigationState,
    nextPage,
    prevPage,
    goToPage,
    reset,
  };
}
