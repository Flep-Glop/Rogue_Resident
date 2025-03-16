// elite_component.js - Component for elite node type

// Since elite nodes are just harder questions, we can reuse the question component
if (typeof NodeComponents !== 'undefined') {
    // Check if question component is registered
    const questionComponent = NodeComponents.registry['question'];
    
    if (questionComponent) {
      // Reuse the question component for elite nodes
      NodeComponents.register('elite', questionComponent);
      NodeComponents.register('boss', questionComponent); // Also reuse for boss nodes
    } else {
      console.warn("Question component not found. Elite nodes will use default component.");
    }
  }