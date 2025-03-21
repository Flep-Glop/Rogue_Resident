// Ultra-wide boss component implementation

const FixedBossComponent = ComponentUtils.createComponent('boss', {
  
  // Initialize component 
  initialize: function() {
    console.log("Initializing ion chamber boss component with ultra-wide layout");
  },
  
  // Render function with dramatically wider layout
  render: function(nodeData, container) {
    console.log("Rendering ion chamber boss component with ultra-wide layout");

    // Ensure we have a boss container
    if (!document.getElementById('boss-container')) {
      container.id = 'boss-container';
      container.className = 'interaction-container boss-exam';
    }
    
    // Add body class for expanded layout
    document.body.classList.add('boss-battle-active');
    
    // Use ionChamber boss class for styling
    const bossClass = 'ion-chamber-boss';
    
    // Create a wrapper with the ultra-wide layout
    container.innerHTML = `
      <div class="boss-with-inventory">
        <!-- Main boss exam panel with ultra-wide layout -->
        <div class="game-panel boss-exam-panel ${bossClass} anim-fade-in">
          <div id="exam-header" class="exam-header">
            <div class="exam-title-container">
              <h3 class="exam-title">Ionix</h3>
              <p class="exam-subtitle">The Sentient Ion Chamber</p>
            </div>
          </div>
          
          <!-- Ultra-wide flexbox layout for boss and content -->
          <div class="boss-battle-layout">
            <!-- Boss character container - now much larger and wider -->
            <div id="boss-character-container" class="boss-character-container boss-side-layout">
              <div id="boss-sprite" class="boss-sprite boss-sprite-enlarged"></div>
            </div>
            
            <!-- Content section - more spacious -->
            <div class="boss-content-section">
              <div id="boss-dialogue" class="boss-dialogue">
                <p>I am Ionix, a sentient ion chamber. Your knowledge of radiation physics will be tested.</p>
              </div>
              
              <div id="exam-phase-container" class="exam-phase-container">
                <!-- Sample content to demonstrate layout -->
                <div class="phase-header">
                  <h4 class="phase-title">Section: Radiation Metrology</h4>
                  <p class="phase-description">Answer questions about ion chamber calibration and dosimetry.</p>
                </div>
              </div>
              
              <div id="exam-actions" class="exam-actions">
                <button id="next-phase-btn" class="game-btn game-btn--primary w-full">
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Make sure our ultra-wide styles are applied
    this.addUltraWideStyles();
    
    // Initialize boss animation with much larger size
    this.initBossAnimation();
  },
  
  // Add ultra-wide CSS styles
  addUltraWideStyles: function() {
    // Check if styles are already added
    if (document.getElementById('ultra-wide-boss-styles')) {
      return;
    }
    
    // Create style element
    const styleEl = document.createElement('style');
    styleEl.id = 'ultra-wide-boss-styles';
    styleEl.textContent = `
      /* Ultra-Wide Boss Layout - Almost double the width */

      /* DRAMATICALLY increase main container width */
      .boss-exam-panel {
        max-width: 1800px !important; /* Increased from 1200px */
        width: 98% !important;
        margin: 0 auto;
      }
      
      /* Make the boss battle container even wider */
      .boss-with-inventory {
        max-width: 1800px !important; /* Increased from 1400px */
        width: 98% !important;
        margin: 0 auto;
      }
      
      /* Make the entire battle area take up more screen space */
      .boss-battle-active .game-board-container,
      .boss-battle-active .container {
        max-width: 1800px !important; /* Increased from 1400px */
        width: 98% !important;
      }
      
      /* Create much more horizontal space in the layout */
      .boss-battle-layout {
        display: flex;
        gap: 50px; /* Increased from 30px */
        align-items: flex-start;
        margin-bottom: 20px;
        width: 100%;
        padding: 30px; /* Increased padding */
      }
      
      /* Make the boss container MUCH wider */
      .boss-side-layout {
        min-width: 450px !important; /* Increased from 300px */
        width: 40% !important; /* Increased from 30% */
        height: 650px !important;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: 20px;
        position: relative;
        background: rgba(30, 15, 40, 0.4);
        border-radius: 10px;
      }
      
      /* Make Ionix even BIGGER */
      .boss-sprite-enlarged {
        width: 350px !important;  /* Increased from 280px */
        height: 600px !important; /* Increased from 500px */
        position: relative;
        transform: scale(1.2);
        margin-top: -40px;
      }
      
      /* Make sure the canvas renders crisp pixels */
      .boss-sprite canvas {
        image-rendering: pixelated !important;
        image-rendering: -moz-crisp-edges !important;
        image-rendering: crisp-edges !important;
      }
      
      /* More spacious content section */
      .boss-content-section {
        flex: 1;
        min-width: 0;
        padding: 30px; /* Increased from 20px */
        background: rgba(30, 15, 40, 0.3);
        border-radius: 10px;
      }
      
      /* Make dialogue more spacious */
      .boss-dialogue {
        padding: 25px !important;
        margin-bottom: 30px !important;
        font-size: 1.2em !important;
      }
      
      /* Larger header area */
      .exam-header {
        padding: 20px 30px !important;
        margin-bottom: 30px !important;
      }
      
      /* Larger title text */
      .exam-title {
        font-size: 2.5rem !important;
        margin-bottom: 10px !important;
      }
      
      .exam-subtitle {
        font-size: 1.3rem !important;
      }
      
      /* Ensure Ionix is properly visible with dark oval background */
      .boss-character-container {
        background: radial-gradient(ellipse, rgba(0,0,0,0.6) 40%, rgba(30,15,40,0.2) 100%);
        overflow: visible !important;
        border-radius: 50%;
      }
    `;
    
    document.head.appendChild(styleEl);
    console.log("Added ultra-wide boss styles");
  },
  
  // Initialize boss animation with much larger size
  initBossAnimation: function() {
    const container = document.getElementById('boss-sprite');
    if (!container) {
      console.error("Boss sprite container not found");
      return;
    }
    
    // Clear container
    container.innerHTML = '';
    
    // Set container dimensions and styling - ULTRA LARGE NOW
    container.style.width = '350px';   // Dramatically increased
    container.style.height = '600px';  // Dramatically increased
    container.style.margin = '0 auto';
    container.style.position = 'relative';
    
    // Create canvas element with larger dimensions
    const canvas = document.createElement('canvas');
    canvas.id = 'ion-chamber-canvas';
    canvas.width = 350;  // Larger canvas width
    canvas.height = 600; // Larger canvas height
    canvas.style.display = 'block';
    canvas.style.imageRendering = 'pixelated';
    canvas.style.imageRendering = 'crisp-edges';
    
    // Add canvas to container
    container.appendChild(canvas);
    
    // Load the sprite sheet
    const spriteSheet = new Image();
    spriteSheet.src = '/static/img/characters/ion_chamber/idle.png';
    
    // Animation variables
    const frameCount = 8;
    const frameWidth = 97;
    const frameHeight = 108; // 864 / 8
    let currentFrame = 0;
    
    // Draw the current frame
    const drawFrame = () => {
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.error("Canvas context not available");
        return;
      }
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Only draw if the image is loaded
      if (spriteSheet.complete && spriteSheet.naturalHeight !== 0) {
        // Calculate source rectangle (from the sprite sheet)
        const sourceY = currentFrame * frameHeight;
        
        // Turn off image smoothing for crisp pixels
        ctx.imageSmoothingEnabled = false;
        
        // Draw the current frame - scaled up to fill larger canvas
        ctx.drawImage(
          spriteSheet,       // Image
          0, sourceY,        // Source position (x, y)
          frameWidth, frameHeight, // Source dimensions (width, height)
          0, 0,              // Destination position (x, y)
          canvas.width, canvas.height // Destination dimensions (width, height)
        );
      }
    };
    
    // Handle image loading
    spriteSheet.onload = () => {
      console.log("✅ Sprite sheet loaded successfully");
      
      // Draw initial frame
      drawFrame();
      
      // We're focusing on layout so we'll just show a static frame
      // and not animate for now
    };
    
    // Handle image loading error
    spriteSheet.onerror = () => {
      console.error("Failed to load sprite sheet");
      
      // Create fallback placeholder
      container.innerHTML = `
        <div class="ion-chamber-placeholder" style="width: 100%; height: 100%; background-color: #000; border-radius: 50%;"></div>
      `;
    };
  },
  
  // Handle component actions
  handleAction: function(nodeData, action, data) {
    console.log(`Boss component handling action: ${action}`, data);
    
    // Handle any necessary actions here
  }
});

// Register the component
if (typeof NodeComponents !== 'undefined') {
  NodeComponents.register('boss', FixedBossComponent);
}