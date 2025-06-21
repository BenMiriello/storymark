import { ComponentType } from 'react';
import {
  templateRegistry as coreRegistry,
  TemplateSchema,
  TemplatePropSchema,
} from '@storymark/core';

class ReactTemplateRegistry {
  private components = new Map<string, ComponentType<any>>();
  private registeredNames = new Set<string>();

  registerTemplate(component: ComponentType<any>, customName?: string): void {
    const templateName =
      customName || this.toSnakeCase(component.name || 'anonymous');

    // Analyze component to extract prop requirements
    const schema = this.analyzeComponent(component, templateName);

    // Register schema with core registry
    coreRegistry.registerSchema(templateName, schema);

    // Store component mapping for React rendering
    this.components.set(templateName, component);
    this.registeredNames.add(templateName);

    console.log(`Registered template: ${templateName}`);
  }

  getComponent(templateName: string): ComponentType<any> | undefined {
    return this.components.get(templateName);
  }

  getAllRegisteredNames(): string[] {
    return Array.from(this.registeredNames).sort();
  }

  clear(): void {
    this.components.clear();
    this.registeredNames.clear();
    coreRegistry.clear();
  }

  private toSnakeCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
  }

  private analyzeComponent(
    component: ComponentType<any>,
    templateName: string
  ): TemplateSchema {
    // For now, we'll create a basic schema
    // In the future, we could use static analysis to extract prop requirements
    // from useStoryProp() calls within the component

    return {
      name: templateName,
      props: this.extractPropsFromComponent(component),
      usesStoryContent: true, // Assume components use story content
      description: `React template component: ${component.name}`,
      category: 'react',
    };
  }

  private extractPropsFromComponent(
    _component: ComponentType<any>
  ): TemplatePropSchema[] {
    // This is where we would implement component analysis
    // For now, return empty array - props will be discovered at runtime
    //
    // Future implementation could:
    // 1. Parse component source code for useStoryProp() calls
    // 2. Extract prop names and options from hook calls
    // 3. Build schema automatically

    return [];
  }
}

// Global React template registry instance
export const reactTemplateRegistry = new ReactTemplateRegistry();

// Main registration function that users will call
export function registerTemplate(
  component: ComponentType<any>,
  customName?: string
): void {
  reactTemplateRegistry.registerTemplate(component, customName);
}

// Utility function to get registered component for rendering
export function getTemplateComponent(
  templateName: string
): ComponentType<any> | undefined {
  return reactTemplateRegistry.getComponent(templateName);
}

// Function to get all registered template names
export function getRegisteredTemplates(): string[] {
  return reactTemplateRegistry.getAllRegisteredNames();
}
