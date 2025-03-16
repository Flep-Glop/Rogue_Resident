// medical_physics_game/static/js/bootstrap.js

// Import core modules
import DependencyContainer from './engine/core/dependency-container.js';
import SkillEffectSystem from './engine/effects/skill-effect-system.js';
import { skillTreeStore } from './engine/skill-tree/skill-tree-store.js';

/**
 * Bootstrap the application
 * Sets up dependency container and initializes all systems
 * @returns {Promise<object>} - Container with initialized services
 */
export async function bootstrap() {
  console.log('Bootstrapping application...');
  
  // Create container
  const container = new DependencyContainer();
  
  // Register services with dependencies
  container
    // Core services
    .register('eventSystem', () => {
      // Use existing event system if available
      return window.EventSystem || {
        on: () => console.warn('EventSystem not available'),
        emit: () => console.warn('EventSystem not available')
      };
    })
    
    // Effect system
    .register('skillEffectSystem', (eventSystem) => {
      const system = new SkillEffectSystem(eventSystem);
      // Store reference for global access (for backward compatibility)
      window.skillEffectSystem = system;
      return system;
    }, ['eventSystem'])
    
    // Skill tree services
    .register('skillTreeStore', () => skillTreeStore)
    
    // Add more services as needed...
    ;
  
  try {
    // Initialize services in order
    
    // First get all services that need initialization
    const effectSystem = container.getInstance('skillEffectSystem');
    
    // Initialize them in sequence
    await Promise.all([
      effectSystem.initialize()
    ]);
    
    console.log('Application bootstrap complete');
    return container;
  } catch (error) {
    console.error('Error during bootstrap:', error);
    throw error;
  }
}

// Auto-bootstrap when document is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    bootstrap().catch(err => {
      console.error('Bootstrap failed:', err);
    });
  });
} else {
  // Document already loaded, bootstrap immediately
  bootstrap().catch(err => {
    console.error('Bootstrap failed:', err);
  });
}

// Make bootstrap available globally
window.bootstrapApplication = bootstrap;
