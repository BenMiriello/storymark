import { parseStory } from '../index';
import { readFileSync } from 'fs';
import { join } from 'path';

const icelandStoryContent = readFileSync(join(__dirname, 'icelandStory.syml'), 'utf-8');

describe('Core Story Parser', () => {
  describe('frontmatter parsing', () => {
    test('should parse basic YAML metadata', () => {
      const result = parseStory(icelandStoryContent);
      
      expect(result.metadata.id).toBe('iceland_highlands');
      expect(result.metadata.title).toBe('Hidden Valleys of Iceland');
      expect(result.metadata.category).toBe('travel');
      expect(result.metadata.template).toBe('photo_essay');
      expect(result.metadata.duration).toBe('4_days');
    });

    test('should validate required fields', () => {
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

    test('should separate content from frontmatter', () => {
      const result = parseStory(icelandStoryContent);
      
      expect(result.content).toContain('Day one in Reykjavik');
      expect(result.content).not.toContain('id: iceland_highlands');
      expect(result.content).not.toContain('---\n');
    });
  });

  describe('section parsing', () => {
    test('should split content into sections', () => {
      const result = parseStory(icelandStoryContent);
      
      expect(result.sections).toHaveLength(10);
      expect(result.sections[0].text).toContain('Day one in Reykjavik');
      expect(result.sections[1].text).toContain('hotel clerk wrote our room number');
    });

    test('should handle sections without directives', () => {
      const result = parseStory(icelandStoryContent);

      const firstSection = result.sections[0];
      expect(firstSection.directives).toEqual([]);
      expect(firstSection.text).toContain('Day one in Reykjavik');
    });
  });

  describe('core directive parsing', () => {
    test('should parse @image directives with captions', () => {
      const result = parseStory(icelandStoryContent);

      const sectionWithImage = result.sections.find(section => 
        section.text.includes('coffee shop had those perfect Icelandic pastries')
      );

      expect(sectionWithImage?.directives).toContainEqual({
        type: 'image',
        value: 'reykjavik_morning.jpg',
        params: ['Perfect morning light over colorful Reykjavik rooftops'],
        raw: '@image: reykjavik_morning.jpg "Perfect morning light over colorful Reykjavik rooftops"'
      });
    });

    test('should parse @template directives', () => {
      const content = `id: test
title: Test Story
---

@template: comic_panel_4`;

      const result = parseStory(content);
      
      expect(result.sections[0].directives).toContainEqual({
        type: 'template',
        value: 'comic_panel_4',
        raw: '@template: comic_panel_4'
      });
    });

    test('should parse @video directives', () => {
      const content = `id: test
title: Test Story
---

@video: demo.mp4`;

      const result = parseStory(content);
      
      expect(result.sections[0].directives).toContainEqual({
        type: 'video',
        value: 'demo.mp4',
        raw: '@video: demo.mp4'
      });
    });

    test('should parse generic directive types', () => {
      const content = `id: test
title: Test Story
---

@custom: some_value
@audio: music.mp3`;

      const result = parseStory(content);
      
      expect(result.sections[0].directives).toEqual(
        expect.arrayContaining([
          { type: 'custom', value: 'some_value', raw: '@custom: some_value' },
          { type: 'audio', value: 'music.mp3', raw: '@audio: music.mp3' }
        ])
      );
    });

    test('should parse multiple directives in one section', () => {
      const content = `id: test
title: Test Story
---

This section has multiple directives.

@template: photo_essay
@image: test.jpg "A test image"

All directives should be parsed.`;

      const result = parseStory(content);
      
      expect(result.sections[0].directives).toHaveLength(2);
      expect(result.sections[0].directives).toEqual(
        expect.arrayContaining([
          { type: 'template', value: 'photo_essay', raw: '@template: photo_essay' },
          { type: 'image', value: 'test.jpg', params: ['A test image'], raw: '@image: test.jpg "A test image"' }
        ])
      );
    });
  });
});