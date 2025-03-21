// map-enhancer-fixed.js - Safe version that doesn't override core functions
(function() {
    // Wait for MapRenderer to be available
    const checkInterval = setInterval(function() {
      if (typeof MapRenderer === 'undefined') {
        console.log("Waiting for MapRenderer to load...");
        return;
      }
      
      clearInterval(checkInterval);
      console.log("MapRenderer found, applying safe enhancements...");
      safeEnhanceMapRenderer();
    }, 500);
    
    function safeEnhanceMapRenderer() {
      try {
        // Don't override key functions that might break things
        // Instead, just enhance the appearance
        
        // Enhanced node colors - we'll apply these differently
        const enhancedNodeColors = {
          'start': '#45e17c', // bright green
          'question': '#5d9cff', // bright blue
          'elite': '#9c77db', // purple
          'boss': '#ff6a00', // orange
          'treasure': '#ffcc55', // gold
          'rest': '#45e17c', // green
          'event': '#e67e73', // red
          'shop': '#e5de6a', // yellow
          'patient_case': '#5d9cff', // blue
          'S': '#45e17c', // start
          'Q': '#5d9cff', // question
          'E': '#9c77db', // elite
          'B': '#ff6a00', // boss
          'T': '#ffcc55', // treasure
          'R': '#45e17c', // rest
          'V': '#e67e73', // event
          'P': '#5d9cff', // patient case
          '?': '#9c77db' // random
        };
        
        // Enhanced path styles
        const enhancedPathStyles = {
          lineWidth: 3,
          strokeStyle: 'rgba(255, 255, 255, 0.4)',
          shadowColor: 'rgba(93, 156, 255, 0.8)',
          shadowBlur: 8
        };
        
        // Safely apply path styles if configuration exists
        if (MapRenderer.config && MapRenderer.config.pathStyles) {
          // Only modify specific properties, don't replace the whole object
          MapRenderer.config.pathStyles.lineWidth = enhancedPathStyles.lineWidth;
          MapRenderer.config.pathStyles.strokeStyle = enhancedPathStyles.strokeStyle;
          MapRenderer.config.pathStyles.shadowColor = enhancedPathStyles.shadowColor;
          MapRenderer.config.pathStyles.shadowBlur = enhancedPathStyles.shadowBlur;
        }
        
        // Add an after-render effect rather than overriding the render function
        const originalRenderMap = MapRenderer.renderMap;
        if (originalRenderMap) {
          MapRenderer.renderMap = function() {
            // Call original first
            const result = originalRenderMap.apply(this, arguments);
            
            // Add background grid pattern to canvas
            const canvas = document.getElementById('floor-map');
            if (canvas && canvas.getContext) {
              const ctx = canvas.getContext('2d');
              if (ctx) {
                // Draw grid pattern on the canvas
                ctx.save();
                ctx.globalAlpha = 0.1;
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 0.5;
                
                // Draw grid lines
                const gridSize = 20;
                for (let x = 0; x < canvas.width; x += gridSize) {
                  ctx.beginPath();
                  ctx.moveTo(x, 0);
                  ctx.lineTo(x, canvas.height);
                  ctx.stroke();
                }
                
                for (let y = 0; y < canvas.height; y += gridSize) {
                  ctx.beginPath();
                  ctx.moveTo(0, y);
                  ctx.lineTo(canvas.width, y);
                  ctx.stroke();
                }
                
                ctx.restore();
                
                // Add subtle scanlines
                ctx.save();
                ctx.globalAlpha = 0.05;
                for (let y = 0; y < canvas.height; y += 4) {
                  ctx.beginPath();
                  ctx.moveTo(0, y);
                  ctx.lineTo(canvas.width, y);
                  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                  ctx.lineWidth = 1;
                  ctx.stroke();
                }
                ctx.restore();
              }
            }
            
            return result;
          };
        }
        
        // Apply custom styling to canvas
        const mapCanvas = document.getElementById('floor-map');
        if (mapCanvas) {
          mapCanvas.style.backgroundColor = "rgba(15, 22, 49, 0.5)";
          mapCanvas.style.boxShadow = "inset 0 0 20px rgba(0, 0, 0, 0.4)";
          mapCanvas.style.imageRendering = "pixelated";
          mapCanvas.style.border = "1px solid rgba(93, 156, 255, 0.2)";
          mapCanvas.style.borderRadius = "4px";
        }
        
        // Safely style map container
        const mapContainer = document.querySelector('.map-container');
        if (mapContainer) {
          mapContainer.style.backgroundColor = "rgba(15, 22, 49, 0.95)";
          mapContainer.style.border = "2px solid #5d9cff";
          mapContainer.style.boxShadow = "0 0 15px rgba(93, 156, 255, 0.4), inset 0 0 20px rgba(0, 0, 0, 0.4)";
          mapContainer.style.borderRadius = "8px";
          mapContainer.style.padding = "15px";
        }
        
        // Style map title
        const mapTitle = document.querySelector('.map-container h3');
        if (mapTitle) {
          mapTitle.style.fontFamily = "'Press Start 2P', cursive";
          mapTitle.style.color = "#5d9cff";
          mapTitle.style.textShadow = "0 0 8px rgba(93, 156, 255, 0.6)";
          mapTitle.style.textTransform = "uppercase";
          mapTitle.style.letterSpacing = "2px";
          mapTitle.style.textAlign = "center";
          mapTitle.style.position = "relative";
          mapTitle.style.zIndex = "2";
        }
        
        // Force a re-render with the new styles
        setTimeout(() => {
          if (typeof MapRenderer.renderMap === 'function') {
            console.log("Re-rendering map with enhanced styles...");
            MapRenderer.renderMap();
          }
        }, 500);
        
        console.log('✅ Successfully applied safe map enhancements');
      } catch (error) {
        console.error('❌ Error applying map enhancements:', error);
      }
    }
    
    // Also add grid backgrounds and other basic styling
    function enhanceElements() {
      // Add grid background class
      document.querySelectorAll('.map-container, .character-stats, .inventory-container').forEach(container => {
        if (container) {
          container.classList.add('grid-bg');
        }
      });
      
      // Apply styles directly to character panel
      const characterStats = document.querySelector('.character-stats');
      if (characterStats) {
        characterStats.style.backgroundColor = "rgba(15, 22, 49, 0.95)";
        characterStats.style.border = "2px solid #5d9cff";
        characterStats.style.boxShadow = "0 0 15px rgba(93, 156, 255, 0.4), inset 0 0 20px rgba(0, 0, 0, 0.4)";
        characterStats.style.borderRadius = "8px";
        characterStats.style.padding = "15px";
      }
      
      // Apply styles to inventory container
      const inventoryContainer = document.getElementById('inventory-container');
      if (inventoryContainer) {
        inventoryContainer.style.backgroundColor = "rgba(15, 22, 49, 0.95)";
        inventoryContainer.style.border = "2px solid #5d9cff";
        inventoryContainer.style.boxShadow = "0 0 15px rgba(93, 156, 255, 0.4), inset 0 0 20px rgba(0, 0, 0, 0.4)";
        inventoryContainer.style.borderRadius = "8px";
        inventoryContainer.style.padding = "15px";
      }
      
      // Add Press Start 2P font if not already loaded
      if (!document.getElementById('press-start-font')) {
        const fontLink = document.createElement('link');
        fontLink.id = 'press-start-font';
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);
      }
      
      console.log('✅ Enhanced basic UI elements');
    }
    
    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', enhanceElements);
    } else {
      enhanceElements();
    }
    
    console.log('🎮 Safe map enhancer script loaded');
  })();