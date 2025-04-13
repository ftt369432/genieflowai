# GenieFlowAI User Guide

## Theme System

GenieFlowAI includes a flexible theme system that supports light and dark modes as well as system preference detection.

### Using the Theme in Components

To use the theme in your components, import the `useTheme` hook from the theme context:

```tsx
import { useTheme } from '../contexts/ThemeContext';

function MyComponent() {
  const { theme, isDark, setTheme, toggleTheme } = useTheme();
  
  // Use theme related values in your component
  return (
    <div className={isDark ? 'dark-mode' : 'light-mode'}>
      <button onClick={toggleTheme}>
        Switch to {isDark ? 'Light' : 'Dark'} Mode
      </button>
    </div>
  );
}
```

### Global Theme State

For components that need access to the theme outside the ThemeContext provider hierarchy, use the `useGlobalTheme` hook:

```tsx
import { useGlobalTheme } from '../hooks/useTheme';

function GlobalThemedComponent() {
  const { theme, isDark, setTheme, toggleTheme } = useGlobalTheme();
  
  // Use global theme values
  return (
    <div>
      Current theme: {theme}
    </div>
  );
}
```

## Common Development Issues

### React Hook Errors

If you encounter the "Invalid hook call" error, it could be due to:

1. **Multiple React instances**: Ensure you don't have duplicate React installations in your dependencies.
   - Check your package.json and node_modules for multiple versions
   - Use a tool like npm-dedupe to resolve duplicates

2. **Incorrect hook usage**: Hooks must follow these rules:
   - Only call hooks at the top level of React function components
   - Don't call hooks inside loops, conditions, or nested functions
   - Custom hooks should start with "use"

3. **React version mismatch**: Ensure react and react-dom versions match.

### Theme Troubleshooting

If theme switching doesn't work:

1. Check that ThemeProvider is correctly wrapping your application
2. Verify localStorage access if theme preferences aren't being saved
3. Ensure CSS classes for themes are properly defined in your stylesheets 