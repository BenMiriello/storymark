import { render, screen } from '@testing-library/react';
import {
  StoryProvider,
  useStoryTemplate,
  useStoryProp,
  useStoryContext,
} from '../context/StoryContext';
import type { ParsedStory } from '@storymark/core';

// Test components
function TestComponent() {
  const { sections, metadata } = useStoryTemplate();
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
  const { story } = useStoryContext();
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
  describe('StoryProvider', () => {
    test('should provide story data to children', () => {
      render(
        <StoryProvider story={mockStory}>
          <TestComponentWithContext />
        </StoryProvider>
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
        <StoryProvider story={mockStory} templateProps={templateProps}>
          <TestComponent />
        </StoryProvider>
      );

      expect(screen.getByTestId('columns')).toHaveTextContent('6');
      expect(screen.getByTestId('spacing')).toHaveTextContent('lg');
      expect(screen.getByTestId('title')).toHaveTextContent('Custom Title');
    });

    test('should use default values when template props not provided', () => {
      render(
        <StoryProvider
          story={mockStory}
          templateProps={{ title: 'Test Title' }}
        >
          <TestComponent />
        </StoryProvider>
      );

      expect(screen.getByTestId('columns')).toHaveTextContent('4'); // default
      expect(screen.getByTestId('spacing')).toHaveTextContent('md'); // default
      expect(screen.getByTestId('title')).toHaveTextContent('Test Title');
    });
  });

  describe('useStory hook', () => {
    test('should return sections and metadata', () => {
      render(
        <StoryProvider story={mockStory}>
          <TestComponent />
        </StoryProvider>
      );

      expect(screen.getByTestId('story-id')).toHaveTextContent('test-story');
      expect(screen.getByTestId('sections-count')).toHaveTextContent('2');
    });
  });

  describe('useStoryProp hook', () => {
    test('should perform type coercion for numbers', () => {
      const templateProps = { columns: '8' }; // string that should become number

      render(
        <StoryProvider story={mockStory} templateProps={templateProps}>
          <TestComponent />
        </StoryProvider>
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
        <StoryProvider story={mockStory} templateProps={templateProps}>
          <BooleanTestComponent />
        </StoryProvider>
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
        <StoryProvider story={mockStory} templateProps={templateProps}>
          <ArrayTestComponent />
        </StoryProvider>
      );

      expect(screen.getByTestId('items')).toHaveTextContent('a,b,c');
    });

    test('should handle required props gracefully', () => {
      function RequiredTestComponent() {
        const title = useStoryProp('title', { required: true });
        return <div data-testid="title">{title || 'undefined'}</div>;
      }

      render(
        <StoryProvider story={mockStory}>
          <RequiredTestComponent />
        </StoryProvider>
      );

      expect(screen.getByTestId('title')).toHaveTextContent('undefined');
    });

    test('should handle invalid options gracefully', () => {
      const templateProps = { spacing: 'xl' }; // not in allowed options

      render(
        <StoryProvider story={mockStory} templateProps={templateProps}>
          <TestComponent />
        </StoryProvider>
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
        <StoryProvider story={mockStory} templateProps={{ value: 15 }}>
          <MinMaxTestComponent />
        </StoryProvider>
      );

      expect(screen.getByTestId('value')).toHaveTextContent('15');

      // Test min violation - should still render the value
      rerender(
        <StoryProvider story={mockStory} templateProps={{ value: -5 }}>
          <MinMaxTestComponent />
        </StoryProvider>
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
      }).toThrow('useStoryContext must be used within a StoryProvider');

      consoleSpy.mockRestore();
    });
  });
});
