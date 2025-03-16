// medical_physics_game/static/js/engine/effects/effect-handler.js

/**
 * Base class for effect handlers
 * Provides common functionality for all effect handlers
 */
class EffectHandler {
  constructor() {
    // Base implementation
  }
  
  /**
   * Apply an effect
   * @param {object} effect - Effect object
   * @param {object} context - Context for application
   * @returns {boolean} - Success status
   */
  apply(effect, context) {
    throw new Error('apply() must be implemented by subclass');
  }
  
  /**
   * Remove an effect
   * @param {object} effect - Effect object
   * @param {object} context - Context for removal
   * @returns {boolean} - Success status
   */
  remove(effect, context) {
    // Default implementation - override as needed
    return true;
  }
  
  /**
   * Check if a condition is met
   * @param {string|function|object} condition - Condition to check
   * @param {object} context - Context for evaluation
   * @returns {boolean} - Whether condition is met
   */
  checkCondition(condition, context) {
    if (!condition) return true; // No condition = always true
    
    // Handle different condition types
    if (typeof condition === 'string') {
      return this._evaluateStringCondition(condition, context);
    } else if (typeof condition === 'function') {
      return condition(context);
    } else if (typeof condition === 'object') {
      return this._evaluateObjectCondition(condition, context);
    }
    
    return false;
  }
  
  /**
   * Evaluate a string condition
   * @param {string} condition - Condition string like "question_category == 'quantum'"
   * @param {object} context - Context for evaluation
   * @returns {boolean} - Whether condition is met
   * @private
   */
  _evaluateStringCondition(condition, context) {
    // Handle string conditions like "question_category == 'quantum'"
    const operators = ['==', '!=', '>=', '<=', '>', '<'];
    let operator = '';
    let parts = [];
    
    // Find operator
    for (const op of operators) {
      if (condition.includes(op)) {
        operator = op;
        parts = condition.split(op).map(p => p.trim());
        break;
      }
    }
    
    if (parts.length !== 2) return false;
    
    const leftSide = parts[0];
    let rightSide = parts[1].replace(/['"]/g, ''); // Remove quotes
    
    // Get value from context
    const leftValue = this._getValueFromContext(leftSide, context);
    
    // Try to convert right side to appropriate type
    if (!isNaN(rightSide)) {
      rightSide = parseFloat(rightSide);
    } else if (rightSide === 'true') {
      rightSide = true;
    } else if (rightSide === 'false') {
      rightSide = false;
    }
    
    // Compare values
    switch (operator) {
      case '==': return leftValue == rightSide;
      case '!=': return leftValue != rightSide;
      case '>=': return leftValue >= rightSide;
      case '<=': return leftValue <= rightSide;
      case '>': return leftValue > rightSide;
      case '<': return leftValue < rightSide;
      default: return false;
    }
  }
  
  /**
   * Evaluate an object condition
   * @param {object} condition - Condition object
   * @param {object} context - Context for evaluation
   * @returns {boolean} - Whether condition is met
   * @private
   */
  _evaluateObjectCondition(condition, context) {
    // Handle object conditions - could have AND/OR logic, etc.
    if (condition.AND && Array.isArray(condition.AND)) {
      return condition.AND.every(subCond => this.checkCondition(subCond, context));
    }
    
    if (condition.OR && Array.isArray(condition.OR)) {
      return condition.OR.some(subCond => this.checkCondition(subCond, context));
    }
    
    // Simple object with key-value pairs - all must match
    return Object.keys(condition).every(key => {
      const contextValue = this._getValueFromContext(key, context);
      return contextValue == condition[key];
    });
  }
  
  /**
   * Get a value from context using a path
   * @param {string} path - Path to value like "question.category"
   * @param {object} context - Context object
   * @returns {any} - Value from context
   * @private
   */
  _getValueFromContext(path, context) {
    // Handle nested paths like "question.category"
    const parts = path.split('.');
    let value = context;
    
    for (const part of parts) {
      if (value === undefined || value === null) return undefined;
      value = value[part];
    }
    
    return value;
  }
}

// Export the class
window.EffectHandler = EffectHandler;
export default EffectHandler;
