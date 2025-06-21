import { parseStory, templateRegistry, TemplateSchema } from '../index';

describe('Integration: Core Parser + Template Registry', () => {
  beforeEach(() => {
    templateRegistry.clear();
  });

  test('should parse story and validate template usage', () => {
    // Register a template schema
    const comicPanelSchema: TemplateSchema = {
      name: 'comic_panel_4',
      props: [
        {
          name: 'columns',
          type: 'number',
          default: 4,
          validator: value => value >= 1 && value <= 6,
          required: false,
        },
        {
          name: 'spacing',
          type: 'string',
          options: ['sm', 'md', 'lg'],
          default: 'md',
        },
      ],
      usesStoryContent: true,
      description: 'A 4-panel comic layout',
      category: 'comic',
    };

    templateRegistry.registerSchema('comic_panel_4', comicPanelSchema);

    // Parse a story that uses the template
    const storyContent = `id: my_comic
title: A Simple Comic
category: comic
template: comic_panel_4
---

First panel content here.

@template: comic_panel_4 columns=4 spacing=lg

---

Second panel with different template settings.

@template: comic_panel_4 columns=2 spacing=sm

---

Third panel content.

@image: comic_panel.jpg "Final panel illustration"`;

    const parsed = parseStory(storyContent);

    // Verify parsing worked
    expect(parsed.errors).toHaveLength(0);
    expect(parsed.metadata.template).toBe('comic_panel_4');
    expect(parsed.sections).toHaveLength(3);

    // Extract template directives
    const templateDirectives = parsed.sections
      .flatMap(section => section.directives)
      .filter(directive => directive.type === 'template');

    expect(templateDirectives).toHaveLength(2);

    // Validate first template usage
    const firstTemplate = templateDirectives[0];
    expect(firstTemplate.value).toBe('comic_panel_4');

    // Parse template props (this would normally be handled by React package)
    const firstProps = parseTemplateDirective(firstTemplate);
    const firstValidation = templateRegistry.validateTemplate(
      'comic_panel_4',
      firstProps
    );

    expect(firstValidation.valid).toBe(true);
    expect(firstValidation.errors).toHaveLength(0);

    // Validate second template usage
    const secondTemplate = templateDirectives[1];
    const secondProps = parseTemplateDirective(secondTemplate);
    const secondValidation = templateRegistry.validateTemplate(
      'comic_panel_4',
      secondProps
    );

    expect(secondValidation.valid).toBe(true);
    expect(secondValidation.errors).toHaveLength(0);
  });

  test('should detect invalid template usage', () => {
    // Register template with strict validation
    templateRegistry.registerSchema('strict_template', {
      name: 'strict_template',
      props: [
        {
          name: 'required_prop',
          type: 'string',
          required: true,
        },
        {
          name: 'limited_prop',
          type: 'string',
          options: ['option1', 'option2'],
        },
      ],
      usesStoryContent: true,
    });

    const storyContent = `id: test
title: Test Story
---

@template: strict_template limited_prop=invalid_option

This should fail validation.`;

    const parsed = parseStory(storyContent);
    const templateDirective = parsed.sections[0].directives[0];
    const props = parseTemplateDirective(templateDirective);

    const validation = templateRegistry.validateTemplate(
      'strict_template',
      props
    );

    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain(
      "Required prop 'required_prop' is missing"
    );
    expect(validation.errors).toContain(
      "Prop 'limited_prop' must be one of: option1, option2"
    );
  });

  test('should provide autocomplete data for tooling', () => {
    // Register multiple templates
    templateRegistry.registerSchema('comic_panel', {
      name: 'comic_panel',
      props: [{ name: 'panels', type: 'number' }],
      usesStoryContent: true,
      category: 'comic',
    });

    templateRegistry.registerSchema('photo_essay', {
      name: 'photo_essay',
      props: [{ name: 'layout', type: 'string' }],
      usesStoryContent: true,
      category: 'photography',
    });

    // Get all available templates (for autocomplete)
    const allTemplates = templateRegistry.getAllTemplateNames();
    expect(allTemplates).toEqual(['comic_panel', 'photo_essay']);

    // Get templates by category
    const comicTemplates = templateRegistry.getTemplatesByCategory('comic');
    expect(comicTemplates).toHaveLength(1);
    expect(comicTemplates[0].name).toBe('comic_panel');

    // Get schema for specific template (for prop validation/autocomplete)
    const comicSchema = templateRegistry.getSchema('comic_panel');
    expect(comicSchema?.props).toHaveLength(1);
    expect(comicSchema?.props[0].name).toBe('panels');
  });

  test('should handle complex story with multiple templates and media', () => {
    // Register templates
    templateRegistry.registerSchema('intro_section', {
      name: 'intro_section',
      props: [
        {
          name: 'style',
          type: 'string',
          options: ['minimal', 'bold'],
          default: 'minimal',
        },
      ],
      usesStoryContent: true,
      category: 'layout',
    });

    templateRegistry.registerSchema('gallery_grid', {
      name: 'gallery_grid',
      props: [{ name: 'columns', type: 'number', min: 1, max: 6, default: 3 }],
      usesStoryContent: true,
      category: 'media',
    });

    const complexStory = `id: complex_story
title: Complex Story Example
category: mixed
template: intro_section
---

@template: intro_section style=bold

Welcome to our story. This is the introduction.

@image: hero_image.jpg "Hero image for the story"

---

@template: gallery_grid columns=3

Here are some photos from our journey:

@image: photo1.jpg "First photo"
@image: photo2.jpg "Second photo" 
@image: . "Reusing second photo"

---

Final section with video content.

@video: conclusion.mp4 "Conclusion video"
@delay: 2s`;

    const parsed = parseStory(complexStory);

    expect(parsed.errors).toHaveLength(0);
    expect(parsed.sections).toHaveLength(3);

    // Verify template usage
    const templates = parsed.sections
      .flatMap(s => s.directives)
      .filter(d => d.type === 'template');

    expect(templates).toHaveLength(2);

    // Validate each template
    templates.forEach(template => {
      const props = parseTemplateDirective(template);
      const validation = templateRegistry.validateTemplate(
        template.value,
        props
      );
      expect(validation.valid).toBe(true);
    });

    // Verify media resolution worked
    const mediaDirectives = parsed.sections
      .flatMap(s => s.directives)
      .filter(d => ['image', 'video'].includes(d.type));

    expect(mediaDirectives).toHaveLength(5);

    // Check that media history shorthand worked
    const historyReference = mediaDirectives.find(
      d => d.pathType === 'history'
    );
    expect(historyReference).toBeDefined();
    expect(historyReference?.resolvedPath).toBeDefined();
  });
});

// Helper function to parse template directive props
// This simulates what the React package would do
function parseTemplateDirective(directive: any): Record<string, any> {
  const props: Record<string, any> = {};

  // Simple parsing of "key=value key2=value2" format
  if (directive.params && directive.params.length > 0) {
    const propsString = directive.params.join(' ');
    const matches = propsString.matchAll(/(\w+)=(\w+)/g);

    for (const match of matches) {
      const [, key, value] = match;
      // Try to convert numbers
      const numValue = Number(value);
      props[key] = isNaN(numValue) ? value : numValue;
    }
  }

  return props;
}
