# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
Este es un proyecto React moderno con TypeScript usando Vite como build tool.

## Stack Tecnológico
- **Framework**: React 18+ con TypeScript
- **Build Tool**: Vite
- **Styling**: CSS Modules / CSS-in-JS (según necesidad)
- **Testing**: Vitest (recomendado para proyectos Vite)

## Convenciones de Código
- Usar TypeScript para todos los archivos de componentes
- Nombrar componentes con PascalCase
- Usar arrow functions para componentes funcionales
- Implementar props con interfaces TypeScript
- Usar hooks de React de manera efectiva
- Mantener componentes pequeños y reutilizables

## Estructura de Carpetas
```
src/
├── components/     # Componentes reutilizables
├── pages/         # Páginas/vistas principales
├── hooks/         # Custom hooks
├── utils/         # Utilidades y helpers
├── types/         # Definiciones de tipos TypeScript
├── styles/        # Estilos globales
└── assets/        # Recursos estáticos
```

## Mejores Prácticas
- Usar TypeScript estricto
- Implementar manejo de errores adecuado
- Optimizar rendimiento con React.memo, useMemo, useCallback cuando sea necesario
- Seguir principios de accesibilidad web
- Escribir código limpio y bien documentado
