import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  StorymarkProvider,
  useStory,
  useStoryProp,
  useStorymarkContext,
} from '../context/StorymarkContext';
import type { ParsedStory } from '@storymark/core';

// Test components
function TestComponent() {
  const { sections, metadata } = useStory();
  const columns = useStoryProp('columns', { default: 4, type: 'number' });
  const spacing = useStoryProp('spacing', {
    default: 'md',
    options: ['sm', 'md', 'lg'],
  });
  const title = useStoryProp('title', { required: true });

  return (
    <div>
      <div data-testid="story-id">{metadata.id}</div>
      <div data-testid="sections-count">{sections.length}</div>
      <div data-testid="columns">{columns}</div>
      <div data-testid="spacing">{spacing}</div>
      <div data-testid="title">{title}</div>
    </div>
  );
}

function TestComponentWithContext() {
  const { story } = useStorymarkContext();
  return <div data-testid="story-title">{story.metadata.title}</div>;
}

// Mock story data
const mockStory: ParsedStory = {
  metadata: {
    id: 'test-story',
    title: 'Test Story',
    category: 'test',
    template: 'test_template',
  },
  content: 'Test content',
  sections: [
    {
      text: 'First section',
      directives: [
        { type: 'image', value: 'test.jpg', raw: '@image: test.jpg' },
      ],
    },
    {
      text: 'Second section',
      directives: [],
    },
  ],
  errors: [],
};

describe('StorymarkContext', () => {
  describe('StorymarkProvider', () => {
    test('should provide story data to children', () => {
      render(
        <StorymarkProvider story={mockStory}>
          <TestComponentWithContext />
        </StorymarkProvider>
      );

      expect(screen.getByTestId('story-title')).toHaveTextContent('Test Story');
    });

    test('should provide template props to storyProp hook', () => {
      const templateProps = {
        columns: 6,
        spacing: 'lg',
        title: 'Custom Title',
      };

      render(
        <StorymarkProvider story={mockStory} templateProps={templateProps}>
          <TestComponent />
        </StorymarkProvider>
      );

      expect(screen.getByTestId('columns')).toHaveTextContent('6');
      expect(screen.getByTestId('spacing')).toHaveTextContent('lg');
      expect(screen.getByTestId('title')).toHaveTextContent('Custom Title');
    });

    test('should use default values when template props not provided', () => {
      render(
        <StorymarkProvider
          story={mockStory}
          templateProps={{ title: 'Test Title' }}
        >
          <TestComponent />
        </StorymarkProvider>
      );

      expect(screen.getByTestId('columns')).toHaveTextContent('4'); // default
      expect(screen.getByTestId('spacing')).toHaveTextContent('md'); // default
      expect(screen.getByTestId('title')).toHaveTextContent('Test Title');
    });
  });

  describe('useStory hook', () => {
    test('should return sections and metadata', () => {
      render(
        <StorymarkProvider story={mockStory}>
          <TestComponent />
        </StorymarkProvider>
      );

      expect(screen.getByTestId('story-id')).toHaveTextContent('test-story');
      expect(screen.getByTestId('sections-count')).toHaveTextContent('2');
    });
  });

  describe('useStoryProp hook', () => {
    test('should perform type coercion for numbers', () => {
      const templateProps = { columns: '8' }; // string that should become number

      render(
        <StorymarkProvider story={mockStory} templateProps={templateProps}>
          <TestComponent />
        </StorymarkProvider>
      );

      expect(screen.getByTestId('columns')).toHaveTextContent('8');
    });

    test('should perform type coercion for booleans', () => {
      function BooleanTestComponent() {
        const enabled = useStoryProp('enabled', {
          type: 'boolean',
          default: false,
        });
        return <div data-testid="enabled">{enabled.toString()}</div>;
      }

      const templateProps = { enabled: 'true' }; // string that should become boolean

      render(
        <StorymarkProvider story={mockStory} templateProps={templateProps}>
          <BooleanTestComponent />
        </StorymarkProvider>
      );

      expect(screen.getByTestId('enabled')).toHaveTextContent('true');
    });

    test('should perform type coercion for arrays', () => {
      function ArrayTestComponent() {
        const items = useStoryProp('items', { type: 'array', default: [] });
        return <div data-testid="items">{items.join(',')}</div>;
      }

      const templateProps = { items: 'a,b,c' }; // string that should become array

      render(
        <StorymarkProvider story={mockStory} templateProps={templateProps}>
          <ArrayTestComponent />
        </StorymarkProvider>
      );

      expect(screen.getByTestId('items')).toHaveTextContent('a,b,c');
    });

    test('should handle required props gracefully', () => {
      function RequiredTestComponent() {
        const title = useStoryProp('title', { required: true });
        return <div data-testid="title">{title || 'undefined'}</div>;
      }

      render(
        <StorymarkProvider story={mockStory}>
          <RequiredTestComponent />
        </StorymarkProvider>
      );

      expect(screen.getByTestId('title')).toHaveTextContent('undefined');
    });

    test('should handle invalid options gracefully', () => {
      const templateProps = { spacing: 'xl' }; // not in allowed options

      render(
        <StorymarkProvider story={mockStory} templateProps={templateProps}>
          <TestComponent />
        </StorymarkProvider>
      );

      // Should still render with invalid value (validation warnings are suppressed in tests)
      expect(screen.getByTestId('spacing')).toHaveTextContent('xl');
    });

    test('should handle min/max violations gracefully', () => {
      function MinMaxTestComponent() {
        const value = useStoryProp('value', { min: 1, max: 10 });
        return <div data-testid="value">{value}</div>;
      }

      // Test max violation - should still render the value
      const { rerender } = render(
        <StorymarkProvider story={mockStory} templateProps={{ value: 15 }}>
          <MinMaxTestComponent />
        </StorymarkProvider>
      );

      expect(screen.getByTestId('value')).toHaveTextContent('15');

      // Test min violation - should still render the value
      rerender(
        <StorymarkProvider story={mockStory} templateProps={{ value: -5 }}>
          <MinMaxTestComponent />
        </StorymarkProvider>
      );

      expect(screen.getByTestId('value')).toHaveTextContent('-5');
    });
  });

  describe('error handling', () => {
    test('should throw error when hooks used outside provider', () => {
      // Suppress console.error for this test since React will log the error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useStorymarkContext must be used within a StorymarkProvider');

      consoleSpy.mockRestore();
    });
  });
});
