#!/usr/bin/env node

// Simple test script to validate our implementation works
const { parseStory } = require('./packages/core/src/index.ts');
const { readFileSync } = require('fs');
const { join } = require('path');

console.log('🧪 Testing Storymark Implementation\n');

// Test 1: Core parser functionality
console.log('1. Testing Core Parser...');
try {
  const testContent = `id: test_story
title: Test Implementation
category: test
template: basic
---

This is our first section with some text.

@image: test.jpg "A test image"
@justify: center

---

Second section with different directives.

@fade: slow
@delay: 2s
@template: photo_essay`;

  const result = parseStory(testContent);
  
  console.log('✅ Parser works!');
  console.log(`   - Metadata: ${result.metadata.title} (${result.metadata.category})`);
  console.log(`   - Sections: ${result.sections.length}`);
  console.log(`   - Total directives: ${result.sections.reduce((total, section) => total + section.directives.length, 0)}`);
  console.log(`   - Errors: ${result.errors.length}`);
  
  if (result.sections.length > 0) {
    console.log('\n   Sample directive parsing:');
    result.sections.forEach((section, i) => {
      if (section.directives.length > 0) {
        console.log(`   Section ${i + 1}:`);
        section.directives.forEach(directive => {
          console.log(`     - @${directive.type}: ${directive.value}${directive.params ? ` [${directive.params.join(', ')}]` : ''}`);
        });
      }
    });
  }
  
} catch (error) {
  console.log('❌ Core parser failed:', error.message);
}

// Test 2: Read Iceland story file
console.log('\n2. Testing .syml file reading...');
try {
  const icelandStory = readFileSync(join(__dirname, 'packages/core/src/__tests__/icelandStory.syml'), 'utf-8');
  const result = parseStory(icelandStory);
  
  console.log('✅ File reading works!');
  console.log(`   - Story: ${result.metadata.title}`);
  console.log(`   - Duration: ${result.metadata.duration}`);
  console.log(`   - Sections: ${result.sections.length}`);
  console.log(`   - Images found: ${result.sections.filter(s => s.directives.some(d => d.type === 'image')).length}`);
  
} catch (error) {
  console.log('❌ File reading failed:', error.message);
}

// Test 3: Framework-agnostic directive handling
console.log('\n3. Testing framework-agnostic design...');
try {
  const testDirectives = `id: directive_test
title: Directive Test
---

Testing all directive types.

@image: hero.jpg "Hero image"
@template: comic_panel_4
@justify: center
@delay: 1.5s
@fade: slow
@custom: some_value
@complex: value1 param2 param3`;

  const result = parseStory(testDirectives);
  const section = result.sections[0];
  
  console.log('✅ Framework-agnostic parsing works!');
  console.log('   Parsed directives:');
  section.directives.forEach(directive => {
    console.log(`   - Type: ${directive.type}`);
    console.log(`     Value: ${directive.value}`);
    if (directive.params) console.log(`     Params: [${directive.params.join(', ')}]`);
    console.log(`     Raw: ${directive.raw}`);
    console.log('');
  });
  
} catch (error) {
  console.log('❌ Framework-agnostic test failed:', error.message);
}

console.log('\n🎉 Implementation testing complete!');
console.log('\nTo test React components:');
console.log('1. Set up a React app or use Storybook');
console.log('2. Import { StorymarkRenderer } from "./packages/react/src"');
console.log('3. Use: <StorymarkRenderer content={symlContent} />');