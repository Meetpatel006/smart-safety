# OsmMap Component Restructuring

The OsmMap component has been restructured into smaller, more manageable parts for easier debugging and maintenance. This README explains the changes and how to migrate to the new modular structure.

## New Structure

### Main Components:

1. `NewOsmMap.tsx` - The main entry point that orchestrates all sub-components
2. `OsmMap/` - Directory containing all modular components:
   - `MapHeader.tsx` - The title and refresh button
   - `ErrorMessage.tsx` - Error display and retry functionality
   - `MapContainer.tsx` - The WebView with Leaflet map
   - `LocationInfo.tsx` - Location coordinates and address display
   - `TileProviderSelector.tsx` - Tile provider selection chips
   - `MapActionButtons.tsx` - Map action buttons (My Location, Open Map, Share)

### Utility Files:

1. `OsmMap/types.ts` - All TypeScript interfaces and types
2. `OsmMap/constants.ts` - Constants like tile servers and colors
3. `OsmMap/geoUtils.ts` - Utility functions for geocoding and coordinates
4. `OsmMap/mapHtml.ts` - HTML generation for the Leaflet map
5. `OsmMap/index.ts` - Exports all components and utilities for easy imports

## Migration Steps

To migrate to the new structure:

1. Replace imports from the original OsmMap:
   ```typescript
   import OsmMap from '../components/OsmMap';
   ```
   
   with:
   ```typescript
   import OsmMap from '../components/NewOsmMap';
   ```

2. All props and functionality remain the same, so no other code changes are necessary.

## Benefits of Restructuring

1. **Easier Debugging** - Each component has a single responsibility
2. **Better Maintainability** - Smaller files are easier to understand and modify
3. **Code Reusability** - Some components can be reused in other parts of the application
4. **Improved Testing** - Smaller components are easier to test in isolation
5. **Faster Development** - Multiple developers can work on different components simultaneously

## Note

The original `OsmMap.tsx` file is still available for backward compatibility, but it's recommended to switch to the new modular structure for future development.
