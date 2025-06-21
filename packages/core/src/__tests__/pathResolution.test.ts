import { parseStory } from '../index';

describe('Path Resolution System', () => {
  const testStoryPath = '/home/user/stories/test.syml';

  describe('standard path conventions', () => {
    test('should resolve relative paths from story file directory', () => {
      const content = `id: test
title: Test Story
---

@image: images/photo.jpg`;

      const result = parseStory(content, { storyFilePath: testStoryPath });
      const imageDirective = result.sections[0].directives[0];

      expect(imageDirective.resolvedPath).toBe(
        '/home/user/stories/images/photo.jpg'
      );
      expect(imageDirective.pathType).toBe('relative');
      expect(imageDirective.originalPath).toBe('images/photo.jpg');
    });

    test('should resolve explicit relative paths with ./', () => {
      const content = `id: test
title: Test Story
---

@image: ./assets/photo.jpg`;

      const result = parseStory(content, { storyFilePath: testStoryPath });
      const imageDirective = result.sections[0].directives[0];

      expect(imageDirective.resolvedPath).toBe(
        '/home/user/stories/assets/photo.jpg'
      );
      expect(imageDirective.pathType).toBe('relative');
    });

    test('should resolve parent directory paths with ../', () => {
      const content = `id: test
title: Test Story
---

@image: ../shared/photo.jpg`;

      const result = parseStory(content, { storyFilePath: testStoryPath });
      const imageDirective = result.sections[0].directives[0];

      expect(imageDirective.resolvedPath).toBe('/home/user/shared/photo.jpg');
      expect(imageDirective.pathType).toBe('relative');
    });

    test('should handle absolute paths', () => {
      const content = `id: test
title: Test Story
---

@image: /absolute/path/photo.jpg`;

      const result = parseStory(content, { storyFilePath: testStoryPath });
      const imageDirective = result.sections[0].directives[0];

      expect(imageDirective.resolvedPath).toBe('/absolute/path/photo.jpg');
      expect(imageDirective.pathType).toBe('absolute');
    });

    test('should handle home directory expansion', () => {
      const content = `id: test
title: Test Story
---

@image: ~/Pictures/photo.jpg`;

      const originalHome = process.env.HOME;
      process.env.HOME = '/home/testuser';

      const result = parseStory(content, { storyFilePath: testStoryPath });
      const imageDirective = result.sections[0].directives[0];

      expect(imageDirective.resolvedPath).toBe(
        '/home/testuser/Pictures/photo.jpg'
      );
      expect(imageDirective.pathType).toBe('absolute');

      process.env.HOME = originalHome;
    });

    test('should handle URLs', () => {
      const content = `id: test
title: Test Story
---

@image: https://example.com/photo.jpg`;

      const result = parseStory(content, { storyFilePath: testStoryPath });
      const imageDirective = result.sections[0].directives[0];

      expect(imageDirective.resolvedPath).toBe('https://example.com/photo.jpg');
      expect(imageDirective.pathType).toBe('url');
    });

    test('should use baseDir when storyFilePath not provided', () => {
      const content = `id: test
title: Test Story
---

@image: photo.jpg`;

      const result = parseStory(content, { baseDir: '/custom/base' });
      const imageDirective = result.sections[0].directives[0];

      expect(imageDirective.resolvedPath).toBe('/custom/base/photo.jpg');
      expect(imageDirective.pathType).toBe('relative');
    });
  });

  describe('media history shorthand system', () => {
    test('should reference last imported media with .', () => {
      const content = `id: test
title: Test Story
---

@image: photo1.jpg
@video: video1.mp4

---

@image: .
@audio: .`;

      const result = parseStory(content, { storyFilePath: testStoryPath });

      // Media history is now looked up dynamically from sections

      const section2 = result.sections[1];
      expect(section2.directives[0].resolvedPath).toBe(
        '/home/user/stories/video1.mp4'
      );
      expect(section2.directives[0].pathType).toBe('history');
      expect(section2.directives[1].resolvedPath).toBe(
        '/home/user/stories/video1.mp4'
      );
      expect(section2.directives[1].pathType).toBe('history');
    });

    test('should reference second-to-last imported media with ..', () => {
      const content = `id: test
title: Test Story
---

@image: photo1.jpg
@video: video1.mp4
@audio: audio1.wav

---

@image: ..`;

      const result = parseStory(content, { storyFilePath: testStoryPath });

      // Media history is now looked up dynamically from sections

      const section2 = result.sections[1];
      expect(section2.directives[0].resolvedPath).toBe(
        '/home/user/stories/video1.mp4'
      );
      expect(section2.directives[0].pathType).toBe('history');
    });

    test('should reference third-to-last imported media with ...', () => {
      const content = `id: test
title: Test Story
---

@image: photo1.jpg
@video: video1.mp4
@audio: audio1.wav
@image: photo2.jpg

---

@image: ...`;

      const result = parseStory(content, { storyFilePath: testStoryPath });

      const section2 = result.sections[1];
      expect(section2.directives[0].resolvedPath).toBe(
        '/home/user/stories/video1.mp4'
      );
      expect(section2.directives[0].pathType).toBe('history');
    });

    test('should handle out-of-bounds history references gracefully', () => {
      const content = `id: test
title: Test Story
---

@image: photo1.jpg

---

@image: ..`;

      const result = parseStory(content, { storyFilePath: testStoryPath });

      const section2 = result.sections[1];
      expect(section2.directives[0].resolvedPath).toBe('..');
      expect(section2.directives[0].pathType).toBe('relative');
    });

    test('should not create infinite loops with history references', () => {
      const content = `id: test
title: Test Story
---

@image: photo1.jpg
@image: .
@image: photo2.jpg`;

      const result = parseStory(content, { storyFilePath: testStoryPath });
      const directives = result.sections[0].directives;

      expect(directives[0].resolvedPath).toBe('/home/user/stories/photo1.jpg');
      expect(directives[1].resolvedPath).toBe('/home/user/stories/photo1.jpg');
      expect(directives[2].resolvedPath).toBe('/home/user/stories/photo2.jpg');
    });
  });

  describe('multi-media directive support', () => {
    test('should apply path resolution to image, video, and audio directives', () => {
      const content = `id: test
title: Test Story
---

@image: photo.jpg "A photo"
@video: video.mp4
@audio: audio.wav "Background music"`;

      const result = parseStory(content, { storyFilePath: testStoryPath });
      const directives = result.sections[0].directives;

      expect(directives[0].type).toBe('image');
      expect(directives[0].resolvedPath).toBe('/home/user/stories/photo.jpg');
      expect(directives[0].params).toEqual(['A photo']);

      expect(directives[1].type).toBe('video');
      expect(directives[1].resolvedPath).toBe('/home/user/stories/video.mp4');

      expect(directives[2].type).toBe('audio');
      expect(directives[2].resolvedPath).toBe('/home/user/stories/audio.wav');
      expect(directives[2].params).toEqual(['Background music']);
    });

    test('should not apply path resolution to non-media directives', () => {
      const content = `id: test
title: Test Story
---

@template: comic_panel_4
@delay: 2s`;

      const result = parseStory(content, { storyFilePath: testStoryPath });
      const directives = result.sections[0].directives;

      expect(directives[0].resolvedPath).toBeUndefined();
      expect(directives[0].pathType).toBeUndefined();
      expect(directives[1].resolvedPath).toBeUndefined();
      expect(directives[1].pathType).toBeUndefined();
    });
  });

  describe('backward compatibility', () => {
    test('should work without ParseOptions', () => {
      const content = `id: test
title: Test Story
---

@image: photo.jpg`;

      const result = parseStory(content);
      const imageDirective = result.sections[0].directives[0];

      expect(imageDirective.value).toBe('photo.jpg');
      expect(imageDirective.resolvedPath).toBeDefined();
      expect(imageDirective.pathType).toBe('relative');
    });

    test('should preserve original directive structure', () => {
      const content = `id: test
title: Test Story
---

@image: photo.jpg "Caption"`;

      const result = parseStory(content, { storyFilePath: testStoryPath });
      const imageDirective = result.sections[0].directives[0];

      expect(imageDirective.type).toBe('image');
      expect(imageDirective.value).toBe('photo.jpg');
      expect(imageDirective.params).toEqual(['Caption']);
      expect(imageDirective.raw).toBe('@image: photo.jpg "Caption"');
    });
  });
});
