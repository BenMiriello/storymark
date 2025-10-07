import React from 'react';
import {
  registerTemplate,
  getTemplateComponent,
  getRegisteredTemplates,
  reactTemplateRegistry,
} from '../registry/templateRegistry';
import { useStoryTemplate, useStoryProp } from '../context/StoryContext';
import { templateRegistry as coreRegistry } from '@storymark/core';

// Test components
function ComicPanel() {
  const { sections } = useStoryTemplate();
  const columns = useStoryProp('columns', { default: 4, max: 6 });
  const spacing = useStoryProp('spacing', {
    default: 'md',
    options: ['sm', 'md', 'lg'],
  });

  return (
    <div className={`comic-panel-${columns} spacing-${spacing}`}>
      {sections.map((section, i) => (
        <div key={i}>{section.text}</div>
      ))}
    </div>
  );
}

function PhotoEssay() {
  const { sections } = useStoryTemplate();
  const layout = useStoryProp('layout', { default: 'grid' });

  return (
    <div className={`photo-essay-${layout}`}>
      {sections.map((section, i) => (
        <div key={i}>{section.text}</div>
      ))}
    </div>
  );
}

class ClassComponentTemplate extends React.Component {
  render() {
    return <div>Class Component Template</div>;
  }
}

describe('React Template Registry', () => {
  beforeEach(() => {
    // Clear registries before each test
    reactTemplateRegistry.clear();
    coreRegistry.clear();
  });

  describe('registerTemplate function', () => {
    test('should register functional component with auto-generated name', () => {
      registerTemplate(ComicPanel);

      const component = getTemplateComponent('comic_panel');
      expect(component).toBe(ComicPanel);

      const registeredNames = getRegisteredTemplates();
      expect(registeredNames).toContain('comic_panel');
    });

    test('should register component with custom name', () => {
      registerTemplate(ComicPanel, 'custom_comic_template');

      const component = getTemplateComponent('custom_comic_template');
      expect(component).toBe(ComicPanel);

      const registeredNames = getRegisteredTemplates();
      expect(registeredNames).toContain('custom_comic_template');
    });

    test('should register class component', () => {
      registerTemplate(ClassComponentTemplate);

      const component = getTemplateComponent('class_component_template');
      expect(component).toBe(ClassComponentTemplate);
    });

    test('should register schema with core registry', () => {
      registerTemplate(PhotoEssay);

      const schema = coreRegistry.getSchema('photo_essay');
      expect(schema).toBeDefined();
      expect(schema?.name).toBe('photo_essay');
      expect(schema?.usesStoryContent).toBe(true);
      expect(schema?.category).toBe('react');
    });

    test('should convert camelCase to snake_case correctly', () => {
      function MyAwesomeTemplate() {
        return <div>My Awesome Template</div>;
      }

      registerTemplate(MyAwesomeTemplate);

      const registeredNames = getRegisteredTemplates();
      expect(registeredNames).toContain('my_awesome_template');
    });

    test('should handle components with no name', () => {
      const AnonymousComponent = () => <div>Anonymous</div>;
      Object.defineProperty(AnonymousComponent, 'name', { value: '' });

      registerTemplate(AnonymousComponent);

      const registeredNames = getRegisteredTemplates();
      expect(registeredNames).toContain('anonymous');
    });
  });

  describe('getTemplateComponent function', () => {
    beforeEach(() => {
      registerTemplate(ComicPanel);
      registerTemplate(PhotoEssay);
    });

    test('should return registered component', () => {
      registerTemplate(ComicPanel);
      const component = getTemplateComponent('comic_panel');
      expect(component).toBe(ComicPanel);
    });

    test('should return undefined for unknown template', () => {
      const component = getTemplateComponent('unknown_template');
      expect(component).toBeUndefined();
    });
  });

  describe('getRegisteredTemplates function', () => {
    test('should return empty array when no templates registered', () => {
      const templates = getRegisteredTemplates();
      expect(templates).toEqual([]);
    });

    test('should return all registered template names sorted', () => {
      registerTemplate(PhotoEssay);
      registerTemplate(ComicPanel);

      const templates = getRegisteredTemplates();
      expect(templates).toEqual(['comic_panel', 'photo_essay']);
    });

    test('should include custom named templates', () => {
      registerTemplate(ComicPanel, 'custom_name');
      registerTemplate(PhotoEssay);

      const templates = getRegisteredTemplates();
      expect(templates).toEqual(['custom_name', 'photo_essay']);
    });
  });

  describe('registry integration', () => {
    test('should register both component and schema', () => {
      registerTemplate(ComicPanel);

      // Check React registry
      expect(getTemplateComponent('comic_panel')).toBe(ComicPanel);

      // Check core registry
      const schema = coreRegistry.getSchema('comic_panel');
      expect(schema).toBeDefined();
      expect(schema?.name).toBe('comic_panel');
    });

    test('should clear both registries', () => {
      registerTemplate(ComicPanel);
      registerTemplate(PhotoEssay);

      expect(getRegisteredTemplates()).toHaveLength(2);
      expect(coreRegistry.getAllTemplateNames()).toHaveLength(2);

      reactTemplateRegistry.clear();

      expect(getRegisteredTemplates()).toHaveLength(0);
      expect(coreRegistry.getAllTemplateNames()).toHaveLength(0);
    });
  });

  describe('component analysis', () => {
    test('should create basic schema for components', () => {
      registerTemplate(ComicPanel);

      const schema = coreRegistry.getSchema('comic_panel');
      expect(schema).toMatchObject({
        name: 'comic_panel',
        usesStoryContent: true,
        category: 'react',
        description: 'React template component: ComicPanel',
      });
    });

    test('should handle components with different structures', () => {
      function SimpleTemplate() {
        return <div>Simple</div>;
      }

      registerTemplate(SimpleTemplate);

      const schema = coreRegistry.getSchema('simple_template');
      expect(schema).toBeDefined();
      expect(schema?.props).toEqual([]); // No props discovered yet
    });
  });

  describe('error handling', () => {
    test('should handle registration without errors', () => {
      expect(() => {
        registerTemplate(ComicPanel);
      }).not.toThrow();
    });

    test('should handle multiple registrations of same component', () => {
      registerTemplate(ComicPanel);
      registerTemplate(ComicPanel, 'alternate_name');

      expect(getTemplateComponent('comic_panel')).toBe(ComicPanel);
      expect(getTemplateComponent('alternate_name')).toBe(ComicPanel);
    });
  });
});
