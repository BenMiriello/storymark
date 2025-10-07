import { render, screen } from '@testing-library/react';
import { StoryRenderer } from '../components/StoryRenderer';

describe('StoryRenderer Component', () => {
  test('should render story with title and sections', () => {
    const content = `id: test_story
title: My Test Story
category: adventure
---

This is the first section of our story.

@image: hero.jpg "A heroic scene"

---

This is the second section.

@justify: center
@fade: slow`;

    render(<StoryRenderer content={content} />);

    // Check title and metadata
    expect(screen.getByText('My Test Story')).toBeInTheDocument();
    expect(screen.getByText('adventure')).toBeInTheDocument();

    // Check sections content
    expect(
      screen.getByText('This is the first section of our story.')
    ).toBeInTheDocument();
    expect(screen.getByText('This is the second section.')).toBeInTheDocument();

    // Check image rendering
    const image = screen.getByAltText('A heroic scene');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'hero.jpg');
  });

  test('should display errors when parsing fails', () => {
    const invalidContent = `invalid content without proper frontmatter`;

    render(<StoryRenderer content={invalidContent} />);

    expect(screen.getByText('Story Parsing Errors:')).toBeInTheDocument();
    expect(screen.getByText(/Invalid story format/)).toBeInTheDocument();
  });

  test('should apply custom className', () => {
    const content = `id: test
title: Test
---
Content.`;

    const { container } = render(
      <StoryRenderer content={content} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass(
      'storymark-renderer',
      'custom-class'
    );
  });

  test('should handle empty sections gracefully', () => {
    const content = `id: test
title: Test Story
---

Just text, no directives.

---



---

Another section after empty one.`;

    render(<StoryRenderer content={content} />);

    expect(screen.getByText('Just text, no directives.')).toBeInTheDocument();
    expect(
      screen.getByText('Another section after empty one.')
    ).toBeInTheDocument();
  });

  test('should render multiple images in one section', () => {
    const content = `id: test
title: Multi Image Test
---

A section with multiple images.

@image: image1.jpg "First image"
@image: image2.jpg "Second image"`;

    render(<StoryRenderer content={content} />);

    expect(screen.getByAltText('First image')).toBeInTheDocument();
    expect(screen.getByAltText('Second image')).toBeInTheDocument();
  });

  test('should apply directive-based styling', () => {
    const content = `id: test
title: Styled Test
---

This text should be centered.

@justify: center
@fade: slow
@template: photo_essay`;

    const { container } = render(<StoryRenderer content={content} />);

    const section = container.querySelector('.storymark-section');
    expect(section).toHaveStyle({ textAlign: 'center' });
    expect(section).toHaveClass('fade-slow', 'template-photo_essay');
  });
});
