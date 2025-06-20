# Manual Testing Guide

## Current Test Status

✅ **Core Parser Tests**: All 11 tests passing via `npm test`
❓ **React Components**: Not yet integrated in test suite (dependency issues)
❓ **Build Process**: Rollup config needs fixing

## How to Test Current Implementation

### 1. Core Parser (Working)
```bash
npm test
```
This runs the Jest test suite for the core parser and validates:
- YAML frontmatter parsing
- Section splitting
- Directive parsing (@image, @template, @justify, @delay, @fade)
- Error handling
- Framework-agnostic output format

### 2. Manual Core Testing
You can test the core parser directly in Node.js:

```javascript
// Note: Requires ts-node or compilation
const { parseStory } = require('./packages/core/dist/index.js'); // After build

const story = `id: test_story
title: My Test Story
category: adventure
---

First section with text.

@image: hero.jpg "Hero image"
@justify: center

---

Second section.

@fade: slow
@delay: 2s`;

const result = parseStory(story);
console.log('Metadata:', result.metadata);
console.log('Sections:', result.sections.length);
console.log('Directives:', result.sections[0].directives);
```

### 3. React Component Testing (Planned)
To test React components once dependencies are resolved:

```jsx
import { StorymarkRenderer } from './packages/react/src';

function App() {
  const storyContent = `id: demo
title: Demo Story
---
Hello world!
@image: demo.jpg`;

  return <StorymarkRenderer content={storyContent} />;
}
```

## Expected Output Format

The parser outputs framework-agnostic data:

```javascript
{
  metadata: {
    id: "test_story",
    title: "My Test Story", 
    category: "adventure"
  },
  sections: [
    {
      text: "First section with text.",
      directives: [
        {
          type: "image",
          value: "hero.jpg",
          params: ["Hero image"],
          raw: "@image: hero.jpg \"Hero image\""
        },
        {
          type: "justify",
          value: "center",
          raw: "@justify: center"
        }
      ]
    }
  ],
  errors: []
}
```

## Next Steps for Full Testing

1. **Fix build configuration** (Rollup/module issues)
2. **Resolve React dependency conflicts**  
3. **Add integration tests** between core and React
4. **Create visual component testing** with Storybook
5. **Add end-to-end story rendering tests**

## Current Capabilities Validated

✅ Parse `.syml` files with YAML frontmatter
✅ Split content into sections
✅ Extract all directive types generically  
✅ Handle images with captions
✅ Framework-agnostic data structure
✅ Error handling and validation
✅ Test data file separation