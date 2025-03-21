// map-enhancer.js - Enhances the MapRenderer with retro styling
(function() {
    // Wait for MapRenderer to be available
    const checkInterval = setInterval(function() {
      if (typeof MapRenderer === 'undefined') {
        console.log("Waiting for MapRenderer to load...");
        return;
      }
      
      clearInterval(checkInterval);
      console.log("MapRenderer found, applying enhancements...");
      enhanceMapRenderer();
    }, 500);
    
    function enhanceMapRenderer() {
      try {
        // Store original render function to extend it
        const originalRenderMap = MapRenderer.renderMap;
        
        // Enhanced node colors
        const enhancedNodeColors = {
          start: '#45e17c', // bright green
          question: '#5d9cff', // bright blue
          elite: '#9c77db', // purple
          boss: '#ff6a00', // orange
          treasure: '#ffcc55', // gold
          rest: '#45e17c', // green
          event: '#e67e73', // red
          shop: '#e5de6a', // yellow
          patient_case: '#5d9cff', // blue
          random: '#9c77db' // purple
        };
        
        // Enhanced path styles
        const enhancedPathStyles = {
          lineWidth: 3,
          strokeStyle: 'rgba(255, 255, 255, 0.4)',
          lineDash: [],
          shadowColor: 'rgba(93, 156, 255, 0.8)',
          shadowBlur: 8,
          shadowOffsetX: 0,
          shadowOffsetY: 0
        };
        
        // Apply enhanced styles to MapRenderer
        if (MapRenderer.config) {
          // If using config object
          if (!MapRenderer.config.nodeColors) MapRenderer.config.nodeColors = {};
          if (!MapRenderer.config.pathStyles) MapRenderer.config.pathStyles = {};
          
          Object.assign(MapRenderer.config.nodeColors, enhancedNodeColors);
          Object.assign(MapRenderer.config.pathStyles, enhancedPathStyles);
        } else {
          // Direct assignment fallback
          MapRenderer.nodeColors = enhancedNodeColors;
          MapRenderer.pathStyles = enhancedPathStyles;
        }
        
        // Add node glow function
        MapRenderer.drawNodeGlow = function(ctx, x, y, radius, color) {
          ctx.save();
          ctx.shadowColor = color;
          ctx.shadowBlur = 15;
          ctx.fillStyle = color;
          ctx.globalAlpha = 0.6;
          ctx.beginPath();
          ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        };
        
        // Override renderMap to add enhanced effects
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
              
              // Create gradient vignette effect for CRT feel
              const gradient = ctx.createRadialGradient(
                canvas.width / 2, canvas.height / 2, canvas.width / 10,
                canvas.width / 2, canvas.height / 2, canvas.width / 1.5
              );
              gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
              gradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
              
              ctx.save();
              ctx.globalCompositeOperation = 'multiply';
              ctx.fillStyle = gradient;
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.restore();
            }
          }
          
          console.log('✨ Enhanced map rendered with retro effects');
          return result;
        };
        
        // Enhanced node drawing function
        const originalDrawNode = MapRenderer.drawNode;
        if (typeof originalDrawNode === 'function') {
          MapRenderer.drawNode = function(ctx, node, position, selected) {
            // Draw glow effect first
            const color = this.getNodeColor(node);
            const radius = this.getNodeRadius(node);
            
            // Add glow for selected nodes
            if (selected) {
              this.drawNodeGlow(ctx, position.x, position.y, radius * 1.2, color);
            }
            
            // Call original draw function
            originalDrawNode.apply(this, arguments);
            
            // Add inner highlight
            ctx.save();
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(position.x, position.y - radius/3, radius/4, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fill();
            ctx.restore();
          };
        }
        
        // Force a re-render with the new styles
        setTimeout(() => {
          if (typeof MapRenderer.renderMap === 'function') {
            MapRenderer.renderMap();
          }
        }, 500);
        
        console.log('✅ Successfully enhanced map renderer');
      } catch (error) {
        console.error('❌ Error enhancing map renderer:', error);
      }
    }
    
    // Also add grid backgrounds and scanlines
    function enhanceElements() {
      // Add grid background class to main containers
      document.querySelectorAll('.map-container, .character-stats, .inventory-container').forEach(container => {
        container.classList.add('grid-bg');
      });
      
      // Add scanlines if not already present
      if (!document.querySelector('.scanlines')) {
        const scanlines = document.createElement('div');
        scanlines.className = 'scanlines';
        document.body.appendChild(scanlines);
      }
      
      // Add retro font if not already loaded
      const fontAvailable = Array.from(document.fonts.values()).some(font => 
        font.family.includes('Press Start 2P')
      );
      
      if (!fontAvailable) {
        const fontLink = document.createElement('link');
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);
      }
    }
    
    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', enhanceElements);
    } else {
      enhanceElements();
    }
    
    console.log('🎮 Map enhancer script loaded');
  })();