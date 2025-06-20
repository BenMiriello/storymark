import { parseStory } from '../index';
import { readFileSync } from 'fs';
import { join } from 'path';

const icelandStoryContent = readFileSync(join(__dirname, 'icelandStory.syml'), 'utf-8');

describe('YAML Frontmatter Parser', () => {
  test('should parse basic YAML frontmatter', () => {
    const result = parseStory(icelandStoryContent);

    expect(result.metadata.id).toBe('iceland_highlands');
    expect(result.metadata.title).toBe('Hidden Valleys of Iceland');
    expect(result.metadata.category).toBe('travel');
    expect(result.metadata.template).toBe('photo_essay');
    expect(result.metadata.duration).toBe('4_days');
  });

  test('should separate content from frontmatter', () => {
    const result = parseStory(icelandStoryContent);

    expect(result.content).toContain('Day one in Reykjavik');
    expect(result.content).not.toContain('id: iceland_highlands');
    expect(result.content).not.toContain('---\n');
  });

  test('should split content into sections', () => {
    const result = parseStory(icelandStoryContent);

    expect(result.sections).toHaveLength(10);
    expect(result.sections[0].text).toContain('Day one in Reykjavik');
    expect(result.sections[1].text).toContain('hotel clerk wrote our room number');
    expect(result.sections[2].text).toContain('rental car came with all the highland essentials');
  });

  test('should parse @image directives in sections', () => {
    const result = parseStory(icelandStoryContent);

    const sectionWithImage = result.sections.find(section => 
      section.text.includes('coffee shop had those perfect Icelandic pastries')
    );

    expect(sectionWithImage?.directives).toContainEqual({
      type: 'image',
      src: 'reykjavik_morning.jpg',
      caption: 'Perfect morning light over colorful Reykjavik rooftops'
    });
  });

  test('should handle sections without directives', () => {
    const result = parseStory(icelandStoryContent);

    const firstSection = result.sections[0];
    expect(firstSection.directives).toEqual([]);
    expect(firstSection.text).toContain('Day one in Reykjavik');
  });

  test('should validate required frontmatter fields', () => {
    const invalidContent = `---
title: Test Story
---
Some content here.`;

    const result = parseStory(invalidContent);

    expect(result.errors).toContainEqual({
      type: 'validation',
      message: 'Missing required field: id'
    });
  });
});
