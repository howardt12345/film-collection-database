# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a film photography collection management application built with Vue 3, TypeScript, Vuetify 3, and Supabase. It allows photographers to track their film inventory, cameras, and photography events.

## Development Commands

- **Start development server**: `npm run dev` (runs on port 3000)
- **Build for production**: `npm run build` (includes TypeScript type checking)
- **Preview production build**: `npm run preview`
- **Format code**: `npm run format`
- **Check formatting**: `npm run format:check`
- **Type checking**: `vue-tsc --noEmit` (part of build process)

## Architecture Overview

### Data Layer
- **Database**: Supabase with a `film_collection` schema
- **API Layer**: `/src/api/` contains Supabase client and data access functions
- **Types**: Core types defined in `/src/types/film-collection.ts`

### Core Entities
- **FilmEntry**: Individual film rolls with metadata (brand, ISO, format, etc.)
- **FilmEvent**: Events related to films (purchase, development, etc.) 
- **Camera**: Camera equipment in collection
- **Event**: Base event type with date, location, notes

### Component Architecture
- **Main Component**: `FilmCollection.vue` - UI-focused component using composables for business logic
- **Composables**: `/src/composables/` - reusable business logic (films, events, cameras, error handling)
- **Film Components**: `/src/components/film-collection/film/` - film management UI
- **Camera Components**: `/src/components/film-collection/camera/` - camera management UI
- **Event Components**: `/src/components/film-collection/event/` - event tracking UI
- **Shared Components**: `/src/components/shared/` - reusable UI components (notifications)

### Key Technologies
- **Vue 3 Composition API**: All components use `<script setup>` syntax
- **Vuetify 3**: UI component library for Material Design
- **TypeScript**: Strict typing throughout
- **Auto-imports**: Components are auto-imported via unplugin-vue-components
- **Vite**: Build tool with HMR

### Environment Configuration
- Requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_KEY` environment variables
- Uses `/src/api/supabase.ts` for database connection

### Code Conventions
- TypeScript strict mode enabled
- Prettier for code formatting
- Components use Composition API with `<script setup lang="ts">`
- API functions handle date serialization between JS Date objects and string formats
- Enums used for FilmType and FilmFormat constants
- Business logic separated into composables for reusability and testability
- Comprehensive error handling with user feedback via notifications

### Available Composables
- **useFilmCollection**: Film CRUD operations, unique value computations
- **useEvents**: Event management and film-event relationships  
- **useCameras**: Camera CRUD operations
- **useErrorHandling**: Centralized error handling and user notifications
- **useLoadingState**: Loading state management across operations