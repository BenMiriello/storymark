# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Storymark** is a storytelling notation system project that enables writers to create rich, interactive stories using `.syml` files (Story Markup Language). The project is designed around a framework-agnostic core parser with React-specific components.

**Current Status:** Early planning phase - no codebase has been implemented yet. All current files are planning documents and notes.

## Core Architecture

### Package Structure (Planned)
- `@storymark/core` - Framework-agnostic parser and validation engine
- `@storymark/react` - React-specific components and hooks

### Story Markup Language (.syml)
- YAML frontmatter for metadata + custom story content format
- Section breaks using `---`
- Notation system with `@image:`, `@template:`, etc.
- Image reference system supporting relative references (`.`, `..`, `...`)

### Template System
- Layout templates: `magazine`, `minimal`, `scrolling_parallax`
- Interactive templates: `comic_panel_4`, `gallery_grid_3x2`
- Smart naming convention with variants (e.g., `comic_panel_4a`, `comic_panel_4b`)

## Development Commands

**Note:** No development environment is currently set up. When implementation begins, expect typical Node.js/TypeScript setup with:
- `npm install` or `yarn install` - Install dependencies
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run lint` - Run linting
- `npm run typecheck` - Run TypeScript type checking

## Natural Language Processing Strategy

The project plans to implement an NLP layer that translates natural language (screenplay-style commands) into structured `@notation`:

### Input → Output Translation
```
"show image coast.jpg with caption 'vista'"
→ "@image: coast.jpg 'vista'"

"center this text"
→ "@justify: center"

"wait 2 seconds"
→ "@delay: 2s"
```

### Implementation Approach
- Phase 1: Slot-filling + template mapping using NLP libraries (spaCy, Rasa)
- Phase 2: Macro grammar system for pattern caching
- Phase 3: Translation caching for deterministic results

## Key Design Principles

- **Simple for writers** - Natural language authoring with structured output
- **Framework agnostic** - Core parsing logic works with any framework
- **Free core tools** - Open source parser and basic components
- **Premium convenience** - Advanced templates and tooling as paid features
- **Export freedom** - Never locked into the platform

## Important Files

- `notes/chat/1_initial_plan.md` - Initial project vision and architecture
- `notes/chat/2_later_nlp_plan.md` - Natural language processing strategy
- `notes/roadmap/roadmap.md` - Project roadmap (currently empty)

## When Starting Development

1. Set up Node.js/TypeScript project structure
2. Create `@storymark/core` package first (framework-agnostic parser)
3. Implement `.syml` file parsing with YAML frontmatter + story content
4. Build template registry and validation system
5. Create `@storymark/react` package with components and hooks
6. Consider implementing NLP translation layer for natural language authoring

## Content Authoring Features (Planned)

- Real-time validation and error detection
- Auto-completion for directives (`@image:`, `@template:`)
- Image picker with thumbnail previews
- Template selector with layout previews
- Side-by-side or toggle preview modes