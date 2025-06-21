import {
  CoreTemplateRegistry,
  templateRegistry,
  TemplateSchema,
} from '../index';

describe('Core Template Registry', () => {
  let registry: CoreTemplateRegistry;

  beforeEach(() => {
    registry = new CoreTemplateRegistry();
  });

  describe('schema registration', () => {
    test('should register and retrieve template schemas', () => {
      const schema: TemplateSchema = {
        name: 'comic_panel_4',
        props: [
          {
            name: 'columns',
            type: 'number',
            default: 4,
            validator: value => value >= 1 && value <= 6,
          },
        ],
        usesStoryContent: true,
        description: 'A 4-panel comic layout',
        category: 'comic',
      };

      registry.registerSchema('comic_panel_4', schema);
      const retrieved = registry.getSchema('comic_panel_4');

      expect(retrieved).toEqual(schema);
      expect(retrieved?.name).toBe('comic_panel_4');
    });

    test('should return undefined for unknown templates', () => {
      expect(registry.getSchema('unknown_template')).toBeUndefined();
    });

    test('should list all registered template names', () => {
      registry.registerSchema('template_a', {
        name: 'template_a',
        props: [],
        usesStoryContent: true,
      });
      registry.registerSchema('template_b', {
        name: 'template_b',
        props: [],
        usesStoryContent: false,
      });

      const names = registry.getAllTemplateNames();
      expect(names).toEqual(['template_a', 'template_b']);
    });
  });

  describe('template validation', () => {
    beforeEach(() => {
      const schema: TemplateSchema = {
        name: 'test_template',
        props: [
          {
            name: 'columns',
            type: 'number',
            default: 4,
            validator: value => value >= 1 && value <= 6,
            required: true,
          },
          {
            name: 'spacing',
            type: 'string',
            options: ['sm', 'md', 'lg'],
            default: 'md',
          },
          {
            name: 'title',
            type: 'string',
            required: false,
          },
        ],
        usesStoryContent: true,
      };

      registry.registerSchema('test_template', schema);
    });

    test('should validate correct props', () => {
      const result = registry.validateTemplate('test_template', {
        columns: 4,
        spacing: 'lg',
        title: 'My Title',
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    test('should fail validation for unknown template', () => {
      const result = registry.validateTemplate('unknown_template', {});

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Unknown template: unknown_template');
    });

    test('should fail validation for missing required props', () => {
      const result = registry.validateTemplate('test_template', {
        spacing: 'md',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Required prop 'columns' is missing");
    });

    test('should fail validation for wrong prop types', () => {
      const result = registry.validateTemplate('test_template', {
        columns: '4', // should be number
        spacing: 'md',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Prop 'columns' should be of type number, got string"
      );
    });

    test('should fail validation for invalid options', () => {
      const result = registry.validateTemplate('test_template', {
        columns: 4,
        spacing: 'xl', // not in options
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Prop 'spacing' must be one of: sm, md, lg"
      );
    });

    test('should fail validation for custom validator', () => {
      const result = registry.validateTemplate('test_template', {
        columns: 10, // exceeds max of 6
        spacing: 'md',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Prop 'columns' failed validation");
    });

    test('should warn about unknown props', () => {
      const result = registry.validateTemplate('test_template', {
        columns: 4,
        unknownProp: 'value',
      });

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain(
        "Unknown prop 'unknownProp' for template 'test_template'"
      );
    });

    test('should validate with no props provided', () => {
      const result = registry.validateTemplate('test_template');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Required prop 'columns' is missing");
    });
  });

  describe('template filtering and organization', () => {
    beforeEach(() => {
      registry.registerSchema('comic_panel', {
        name: 'comic_panel',
        props: [],
        usesStoryContent: true,
        category: 'comic',
      });

      registry.registerSchema('photo_essay', {
        name: 'photo_essay',
        props: [],
        usesStoryContent: true,
        category: 'photography',
      });

      registry.registerSchema('basic_text', {
        name: 'basic_text',
        props: [],
        usesStoryContent: true,
      });
    });

    test('should filter templates by category', () => {
      const comicTemplates = registry.getTemplatesByCategory('comic');
      expect(comicTemplates).toHaveLength(1);
      expect(comicTemplates[0].name).toBe('comic_panel');

      const photoTemplates = registry.getTemplatesByCategory('photography');
      expect(photoTemplates).toHaveLength(1);
      expect(photoTemplates[0].name).toBe('photo_essay');
    });

    test('should return all templates when no category specified', () => {
      const allTemplates = registry.getTemplatesByCategory();
      expect(allTemplates).toHaveLength(3);
    });

    test('should return empty array for unknown category', () => {
      const unknownTemplates = registry.getTemplatesByCategory('unknown');
      expect(unknownTemplates).toHaveLength(0);
    });
  });

  describe('registry management', () => {
    test('should clear all registered templates', () => {
      registry.registerSchema('template1', {
        name: 'template1',
        props: [],
        usesStoryContent: true,
      });

      expect(registry.getAllTemplateNames()).toHaveLength(1);

      registry.clear();
      expect(registry.getAllTemplateNames()).toHaveLength(0);
    });
  });

  describe('global registry instance', () => {
    test('should provide a global template registry', () => {
      expect(templateRegistry).toBeInstanceOf(CoreTemplateRegistry);
    });

    test('should allow registration on global instance', () => {
      // Clear any existing registrations
      templateRegistry.clear();

      templateRegistry.registerSchema('global_test', {
        name: 'global_test',
        props: [],
        usesStoryContent: true,
      });

      expect(templateRegistry.getSchema('global_test')).toBeDefined();
      expect(templateRegistry.getAllTemplateNames()).toContain('global_test');

      // Clean up
      templateRegistry.clear();
    });
  });

  describe('prop type validation', () => {
    test('should validate string props', () => {
      const schema: TemplateSchema = {
        name: 'string_test',
        props: [{ name: 'text', type: 'string' }],
        usesStoryContent: true,
      };

      registry.registerSchema('string_test', schema);

      expect(
        registry.validateTemplate('string_test', { text: 'hello' }).valid
      ).toBe(true);
      expect(
        registry.validateTemplate('string_test', { text: 123 }).valid
      ).toBe(false);
    });

    test('should validate number props', () => {
      const schema: TemplateSchema = {
        name: 'number_test',
        props: [{ name: 'count', type: 'number' }],
        usesStoryContent: true,
      };

      registry.registerSchema('number_test', schema);

      expect(
        registry.validateTemplate('number_test', { count: 42 }).valid
      ).toBe(true);
      expect(
        registry.validateTemplate('number_test', { count: '42' }).valid
      ).toBe(false);
      expect(
        registry.validateTemplate('number_test', { count: NaN }).valid
      ).toBe(false);
    });

    test('should validate boolean props', () => {
      const schema: TemplateSchema = {
        name: 'boolean_test',
        props: [{ name: 'enabled', type: 'boolean' }],
        usesStoryContent: true,
      };

      registry.registerSchema('boolean_test', schema);

      expect(
        registry.validateTemplate('boolean_test', { enabled: true }).valid
      ).toBe(true);
      expect(
        registry.validateTemplate('boolean_test', { enabled: false }).valid
      ).toBe(true);
      expect(
        registry.validateTemplate('boolean_test', { enabled: 'true' }).valid
      ).toBe(false);
    });

    test('should validate array props', () => {
      const schema: TemplateSchema = {
        name: 'array_test',
        props: [{ name: 'items', type: 'array' }],
        usesStoryContent: true,
      };

      registry.registerSchema('array_test', schema);

      expect(registry.validateTemplate('array_test', { items: [] }).valid).toBe(
        true
      );
      expect(
        registry.validateTemplate('array_test', { items: [1, 2, 3] }).valid
      ).toBe(true);
      expect(
        registry.validateTemplate('array_test', { items: 'not array' }).valid
      ).toBe(false);
    });
  });
});
