import { renderHook } from '@testing-library/react';
import { useStory } from '../hooks/useStory';

describe('useStory Hook', () => {
  test('should parse story content and return structured data', () => {
    const content = `id: test_story
title: Test Story
category: test
---

This is a test section.

@image: test.jpg "Test image"
@justify: center

---

Another section here.

@fade: slow`;

    const { result } = renderHook(() => useStory(content));

    expect(result.current.metadata.id).toBe('test_story');
    expect(result.current.metadata.title).toBe('Test Story');
    expect(result.current.sections).toHaveLength(2);
  });

  test('should handle parsing errors gracefully', () => {
    const invalidContent = `invalid content without frontmatter`;

    const { result } = renderHook(() => useStory(invalidContent));

    expect(result.current.errors.length).toBeGreaterThan(0);
    expect(result.current.sections).toHaveLength(0);
  });

  test('should memoize results for same content', () => {
    const content = `id: test
title: Test
---
Content here.`;

    const { result, rerender } = renderHook(() => useStory(content));
    const firstResult = result.current;

    rerender();
    const secondResult = result.current;

    expect(firstResult).toBe(secondResult); // Same object reference due to memoization
  });

  test('should re-parse when content changes', () => {
    let content = `id: test1
title: Test 1
---
Content 1.`;

    const { result, rerender } = renderHook(
      ({ content }) => useStory(content),
      { initialProps: { content } }
    );

    const firstResult = result.current;
    expect(firstResult.metadata.title).toBe('Test 1');

    content = `id: test2
title: Test 2
---
Content 2.`;

    rerender({ content });

    const secondResult = result.current;
    expect(secondResult.metadata.title).toBe('Test 2');
    expect(firstResult).not.toBe(secondResult); // Different object reference
  });
});
