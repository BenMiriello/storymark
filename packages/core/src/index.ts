// Re-export all types
export type {
  StoryMetadata,
  StoryDirective,
  StorySection,
  ParseError,
  ParseOptions,
  ParsedStory,
  TemplatePropSchema,
  TemplateSchema,
  ValidationResult,
} from './types';

// Re-export template registry functionality
export { TemplateRegistry, templateRegistry } from './TemplateRegistry';

// Re-export parsing functionality
export {
  parseStory,
  detectSectionCreation,
  getLastNonEmptySection,
  getSectionCount,
} from './parseStory';

// Re-export editor-specific utilities
export * as editor from './editor';

// Backward compatibility: Export CoreTemplateRegistry as alias for TemplateRegistry
export { TemplateRegistry as CoreTemplateRegistry } from './TemplateRegistry';
