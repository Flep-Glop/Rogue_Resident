// rest_component.js - Component for rest node type

const RestComponent = ComponentUtils.createComponent('rest', {
    // Initialize component
    initialize: function() {
      console.log("Initializing rest component");
    },
    
    // Render the rest UI
    render: function(nodeData, container) {
      console.log("Rendering rest component", nodeData);
      
      // Create rest UI
      container.innerHTML = `
        <h3>Break Room</h3>
        <p>Take a moment to rest and recuperate.</p>
        <div id="rest-options">
          <button id="rest-heal-btn" class="btn btn-success mb-2">Heal (+1 Life)</button>
          <button id="rest-study-btn" class="btn btn-primary mb-2">Study (+5 Insight)</button>
        </div>
        <button id="rest-continue-btn" class="btn btn-secondary mt-3">Continue</button>
      `;
      
      // Add event handlers
      this.bindAction('rest-heal-btn', 'click', 'heal', { nodeData });
      this.bindAction('rest-study-btn', 'click', 'study', { nodeData });
      this.bindAction('rest-continue-btn', 'click', 'continue', { nodeData });
    },
    
    // Handle component actions
    handleAction: function(nodeData, action, data) {
      console.log(`Rest component handling action: ${action}`, data);
      
      switch (action) {
        case 'heal':
          this.heal(nodeData);
          break;
          
        case 'study':
          this.study(nodeData);
          break;
          
        case 'continue':
          this.completeNode(nodeData);
          break;
          
        default:
          console.warn(`Unknown action: ${action}`);
      }
    },
    
    // Heal action - restore 1 life
    heal: function(nodeData) {
      this.updatePlayerLives(1);
      this.completeNode(nodeData);
    },
    
    // Study action - gain insight
    study: function(nodeData) {
      this.updatePlayerInsight(5);
      this.completeNode(nodeData);
    }
  });
  
  // Register the component
  if (typeof NodeComponents !== 'undefined') {
    NodeComponents.register('rest', RestComponent);
  }