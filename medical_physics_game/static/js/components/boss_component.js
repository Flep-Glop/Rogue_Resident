// Clean and optimized boss component

const CleanBossComponent = ComponentUtils.createComponent('boss', {
  
  // Initialize component 
  initialize: function() {
    console.log("Initializing clean boss component");
  },
  
  // Render function with improved layout
  render: function(nodeData, container) {
    console.log("Rendering boss component with clean layout");

    // Ensure we have a boss container
    if (!document.getElementById('boss-container')) {
      container.id = 'boss-container';
      container.className = 'interaction-container boss-exam';
    }
    
    // Add body class for expanded layout
    document.body.classList.add('boss-battle-active');
    
    // Use ionChamber boss class for styling
    const bossClass = 'ion-chamber-boss';
    
    // Create a cleaner, more spacious layout
    container.innerHTML = `
      <div class="boss-with-inventory">
        <!-- Main boss exam panel with clean layout -->
        <div class="game-panel boss-exam-panel ${bossClass}">
          <!-- Clean header section -->
          <div id="exam-header" class="exam-header">
            <h3 class="exam-title">Ionix</h3>
            <p class="exam-subtitle">The Sentient Ion Chamber</p>
          </div>
          
          <!-- Optimized two-column layout -->
          <div class="boss-battle-layout">
            <!-- Left column for Ionix - focused on crisp rendering -->
            <div id="boss-character-container" class="boss-character-container boss-side-layout">
              <div id="boss-sprite" class="boss-sprite boss-sprite-enlarged"></div>
            </div>
            
            <!-- Right column for content -->
            <div class="boss-content-section">
              <!-- Clean dialogue box -->
              <div id="boss-dialogue" class="boss-dialogue">
                <p>I am Ionix, a sentient ion chamber. Your knowledge of radiation physics will be tested.</p>
              </div>
              
              <!-- Section content -->
              <div id="exam-phase-container" class="exam-phase-container">
                <div class="phase-header">
                  <h4 class="phase-title">Section: Radiation Metrology</h4>
                  <p class="phase-description">Answer questions about ion chamber calibration and dosimetry.</p>
                </div>
              </div>
              
              <!-- Clean button styling -->
              <div id="exam-actions" class="exam-actions">
                <button id="next-phase-btn" class="game-btn game-btn--primary">
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Add clean layout styles
    this.addCleanLayoutStyles();
    
    // Initialize boss sprite with focus on crisp rendering
    this.initCrispBossSprite();
  },
  
  // Add clean layout styles
  addCleanLayoutStyles: function() {
    // Check if styles are already added
    if (document.getElementById('clean-boss-styles')) {
      return;
    }
    
    // Create style element
    const styleEl = document.createElement('style');
    styleEl.id = 'clean-boss-styles';
    styleEl.textContent = `
      /* Clean and crisp boss layout optimized for larger container */

      /* Clean slate for boss panel */
      .boss-exam-panel {
        background-color: rgba(30, 23, 45, 0.95);
        border: 2px solid #ff6a00;
        border-radius: 8px;
        padding: 30px;
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      
      /* Clean header with proper spacing */
      .exam-header {
        border-bottom: 2px solid rgba(255, 106, 0, 0.5);
        padding-bottom: 20px;
        margin-bottom: 30px;
      }
      
      .exam-title {
        font-size: 3rem;
        color: #ff6a00;
        margin: 0;
        text-shadow: 0 0 10px rgba(255, 106, 0, 0.3);
      }
      
      .exam-subtitle {
        font-size: 1.4rem;
        color: #ff9d4c;
        margin: 10px 0 0 0;
      }
      
      /* Optimized two-column layout */
      .boss-battle-layout {
        display: flex;
        gap: 40px;
        height: 100%;
        flex: 1;
      }
      
      /* Left column for Ionix - optimized for crisp pixel art */
      .boss-side-layout {
        width: 45%;
        display: flex;
        justify-content: center;
        align-items: center;
        background: radial-gradient(ellipse, rgba(0, 0, 0, 0.5) 30%, rgba(50, 15, 0, 0.2) 100%);
        border-radius: 50%;
        aspect-ratio: 3/4;
        padding: 20px;
        position: relative;
        overflow: visible;
      }
      
      /* Ensure crisp pixel rendering */
      .boss-sprite {
        position: relative;
        transform: scale(1);
        transform-origin: center center;
      }
      
      .boss-sprite img, 
      .boss-sprite canvas {
        image-rendering: pixelated !important;
        image-rendering: -moz-crisp-edges !important;
        image-rendering: crisp-edges !important;
        -webkit-font-smoothing: none;
        max-width: none;
        max-height: none;
      }
      
      /* Subtle glow effect behind Ionix */
      .boss-side-layout::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border-radius: 50%;
        box-shadow: inset 0 0 80px rgba(255, 106, 0, 0.4);
        pointer-events: none;
        z-index: 0;
      }
      
      /* Right column for content */
      .boss-content-section {
        width: 55%;
        display: flex;
        flex-direction: column;
        gap: 25px;
        overflow: auto;
      }
      
      /* Clean dialogue box */
      .boss-dialogue {
        background-color: rgba(0, 0, 0, 0.6);
        border-left: 3px solid #ff6a00;
        border-radius: 8px;
        padding: 25px;
        font-size: 1.2rem;
        line-height: 1.5;
        font-style: italic;
      }
      
      .boss-dialogue p {
        margin: 0;
        color: #fff;
      }
      
      /* Section header */
      .phase-header {
        margin-bottom: 25px;
      }
      
      .phase-title {
        font-size: 2rem;
        color: #ff9d4c;
        margin: 0 0 15px 0;
      }
      
      .phase-description {
        font-size: 1.2rem;
        color: #fff;
        line-height: 1.5;
        margin: 0;
      }
      
      /* Button styling */
      .game-btn--primary {
        background: linear-gradient(to bottom, #ff8f30, #e55b00);
        color: white;
        border: none;
        padding: 15px 20px;
        border-radius: 6px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 1.2rem;
        box-shadow: 0 4px 0 #c24d00;
        text-align: center;
        width: 100%;
      }
      
      .game-btn--primary:hover {
        background: linear-gradient(to bottom, #ffaa30, #ff6a00);
        transform: translateY(-2px);
      }
      
      .game-btn--primary:active {
        transform: translateY(2px);
        box-shadow: 0 2px 0 #c24d00;
      }
    `;
    
    document.head.appendChild(styleEl);
    console.log("Added clean boss styles");
  },
  
  // Initialize boss sprite with focus on crisp rendering
  initCrispBossSprite: function() {
    const container = document.getElementById('boss-sprite');
    if (!container) {
      console.error("Boss sprite container not found");
      return;
    }
    
    // Clear container
    container.innerHTML = '';
    
    // Set container dimensions for optimal sizing
    container.style.width = '300px';
    container.style.height = '500px';
    container.style.position = 'relative';
    
    // Create canvas element with optimal size for pixel art
    const canvas = document.createElement('canvas');
    canvas.id = 'ion-chamber-canvas';
    canvas.width = 300;
    canvas.height = 500;
    canvas.style.display = 'block';
    // Ensure crisp pixel rendering
    canvas.style.imageRendering = 'pixelated';
    canvas.style.imageRendering = 'crisp-edges';
    
    // Add canvas to container
    container.appendChild(canvas);
    
    // Load the sprite sheet
    const spriteSheet = new Image();
    spriteSheet.src = '/static/img/characters/ion_chamber/idle.png';
    
    // Animation variables
    const frameWidth = 97;
    const frameHeight = 108; // 864 / 8
    let currentFrame = 4; // Use middle frame for static display
    
    // Draw the current frame with focus on crisp rendering
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
        
        // Critical for crisp pixel art - disable image smoothing
        ctx.imageSmoothingEnabled = false;
        
        // Draw the current frame - scaled up to fill canvas
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
      
      // Draw crisp frame
      drawFrame();
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
  NodeComponents.register('boss', CleanBossComponent);
}