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
      value: 'reykjavik_morning.jpg',
      params: ['Perfect morning light over colorful Reykjavik rooftops'],
      raw: '@image: reykjavik_morning.jpg "Perfect morning light over colorful Reykjavik rooftops"'
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

  test('should parse @template directives', () => {
    const content = `id: test
title: Test Story
---

This is a section with a template directive.

@template: comic_panel_4

Some more text here.`;

    const result = parseStory(content);
    
    expect(result.sections[0].directives).toContainEqual({
      type: 'template',
      value: 'comic_panel_4',
      raw: '@template: comic_panel_4'
    });
    expect(result.sections[0].text).not.toContain('@template:');
  });

  test('should parse @justify directives', () => {
    const content = `id: test
title: Test Story
---

This text should be centered.

@justify: center

More content here.`;

    const result = parseStory(content);
    
    expect(result.sections[0].directives).toContainEqual({
      type: 'justify',
      value: 'center',
      raw: '@justify: center'
    });
    expect(result.sections[0].text).not.toContain('@justify:');
  });

  test('should parse @delay directives', () => {
    const content = `id: test
title: Test Story
---

Wait a moment before showing this.

@delay: 2.5s

---

Also test milliseconds.

@delay: 500ms`;

    const result = parseStory(content);
    
    expect(result.sections[0].directives).toContainEqual({
      type: 'delay',
      value: '2.5s',
      raw: '@delay: 2.5s'
    });
    expect(result.sections[1].directives).toContainEqual({
      type: 'delay',
      value: '500ms',
      raw: '@delay: 500ms'
    });
  });

  test('should parse @fade directives', () => {
    const content = `id: test
title: Test Story
---

This should fade in slowly.

@fade: slow

---

This should fade out.

@fade: out`;

    const result = parseStory(content);
    
    expect(result.sections[0].directives).toContainEqual({
      type: 'fade',
      value: 'slow',
      raw: '@fade: slow'
    });
    expect(result.sections[1].directives).toContainEqual({
      type: 'fade',
      value: 'out',
      raw: '@fade: out'
    });
  });

  test('should parse multiple directives in one section', () => {
    const content = `id: test
title: Test Story
---

This section has multiple directives.

@template: photo_essay
@justify: center
@delay: 1s
@fade: in
@image: test.jpg "A test image"

All directives should be parsed.`;

    const result = parseStory(content);
    
    expect(result.sections[0].directives).toHaveLength(5);
    expect(result.sections[0].directives).toEqual(
      expect.arrayContaining([
        { type: 'template', value: 'photo_essay', raw: '@template: photo_essay' },
        { type: 'justify', value: 'center', raw: '@justify: center' },
        { type: 'delay', value: '1s', raw: '@delay: 1s' },
        { type: 'fade', value: 'in', raw: '@fade: in' },
        { type: 'image', value: 'test.jpg', params: ['A test image'], raw: '@image: test.jpg "A test image"' }
      ])
    );
  });
});
