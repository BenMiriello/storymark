import type {
  TemplateSchema,
  TemplatePropSchema,
  ValidationResult,
} from './types.js';

export class TemplateRegistry {
  private schemas = new Map<string, TemplateSchema>();

  registerSchema(name: string, schema: TemplateSchema): void {
    this.schemas.set(name, { ...schema, name });
  }

  getSchema(name: string): TemplateSchema | undefined {
    return this.schemas.get(name);
  }

  getAllTemplateNames(): string[] {
    return Array.from(this.schemas.keys()).sort();
  }

  validateTemplate(
    name: string,
    props: Record<string, any> = {}
  ): ValidationResult {
    const schema = this.getSchema(name);

    if (!schema) {
      return {
        valid: false,
        errors: [`Unknown template: ${name}`],
        warnings: [],
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required props
    for (const propSchema of schema.props) {
      const value = props[propSchema.name];

      if (propSchema.required && (value === undefined || value === null)) {
        errors.push(`Required prop '${propSchema.name}' is missing`);
        continue;
      }

      if (value !== undefined && value !== null) {
        // Type validation
        if (!this.validatePropType(value, propSchema)) {
          errors.push(
            `Prop '${propSchema.name}' should be of type ${propSchema.type}, got ${typeof value}`
          );
        }

        // Options validation
        if (propSchema.options && !propSchema.options.includes(value)) {
          errors.push(
            `Prop '${propSchema.name}' must be one of: ${propSchema.options.join(', ')}`
          );
        }

        // Min/max validation for numbers
        if (propSchema.type === 'number' && typeof value === 'number') {
          if (propSchema.min !== undefined && value < propSchema.min) {
            errors.push(
              `Prop '${propSchema.name}' must be at least ${propSchema.min}`
            );
          }
          if (propSchema.max !== undefined && value > propSchema.max) {
            errors.push(
              `Prop '${propSchema.name}' must be at most ${propSchema.max}`
            );
          }
        }

        // Custom validator
        if (propSchema.validator && !propSchema.validator(value)) {
          errors.push(`Prop '${propSchema.name}' failed validation`);
        }
      }
    }

    // Check for unknown props
    for (const propName of Object.keys(props)) {
      if (!schema.props.find(p => p.name === propName)) {
        warnings.push(`Unknown prop '${propName}' for template '${name}'`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private validatePropType(
    value: any,
    propSchema: TemplatePropSchema
  ): boolean {
    switch (propSchema.type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      default:
        return true;
    }
  }

  getTemplatesByCategory(category?: string): TemplateSchema[] {
    const templates = Array.from(this.schemas.values());
    if (category) {
      return templates.filter(t => t.category === category);
    }
    return templates;
  }

  clear(): void {
    this.schemas.clear();
  }
}

// Global registry instance
export const templateRegistry = new TemplateRegistry();
