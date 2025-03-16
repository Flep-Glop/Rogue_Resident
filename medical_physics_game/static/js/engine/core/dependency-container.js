// medical_physics_game/static/js/engine/core/dependency-container.js

/**
 * Simple dependency injection container
 * Allows registering services and resolving their dependencies
 */
class DependencyContainer {
  constructor() {
    this.services = new Map();
    this.instances = new Map();
  }

  /**
   * Register a service with the container
   * @param {string} name - Service name
   * @param {Function} factory - Factory function to create the service
   * @param {Array<string>} dependencies - Names of dependencies
   * @returns {DependencyContainer}
   */
  register(name, factory, dependencies = []) {
    this.services.set(name, { factory, dependencies });
    return this;
  }

  /**
   * Get an instance of a service, resolving dependencies
   * @param {string} name - Service name
   * @returns {any} - Service instance
   */
  getInstance(name) {
    // Return cached instance if available
    if (this.instances.has(name)) {
      return this.instances.get(name);
    }

    // Get service definition
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service not registered: ${name}`);
    }

    // Resolve dependencies recursively
    const dependencies = service.dependencies.map(dep => this.getInstance(dep));
    
    // Create instance with dependencies
    const instance = service.factory(...dependencies);
    
    // Cache instance
    this.instances.set(name, instance);
    
    return instance;
  }
}

// Export the container
window.DependencyContainer = DependencyContainer;
export default DependencyContainer;
