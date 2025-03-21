// style-initializer.js - Applies CSS classes and loads fonts
document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Initializing enhanced retro styling...');
    
    // Add grid-bg class to main containers
    document.querySelectorAll('.map-container, .character-stats, .inventory-container').forEach(container => {
      container.classList.add('grid-bg');
    });
    
    // Add scanlines if not already present
    if (!document.querySelector('.scanlines')) {
      const scanlines = document.createElement('div');
      scanlines.className = 'scanlines';
      document.body.appendChild(scanlines);
    }
    
    // Add retro font if not already available
    const fontAvailable = Array.from(document.fonts.values()).some(font => 
      font.family.includes('Press Start 2P')
    );
    
    if (!fontAvailable) {
      const fontLink = document.createElement('link');
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
      fontLink.rel = 'stylesheet';
      document.head.appendChild(fontLink);
    }
    
    // Apply retro font to map title
    const mapTitle = document.querySelector('.map-container h3');
    if (mapTitle) {
      mapTitle.style.fontFamily = "'Press Start 2P', cursive";
      mapTitle.style.fontSize = '1rem';
      mapTitle.style.textShadow = '0 0 8px rgba(93, 156, 255, 0.6)';
      mapTitle.style.textTransform = 'uppercase';
    }
    
    // Enhance debug buttons
    document.querySelectorAll('.debug-buttons button').forEach(button => {
      button.style.fontFamily = "monospace";
      button.style.textShadow = "0 0 2px rgba(0, 0, 0, 0.8)";
      button.style.boxShadow = "0 0 5px rgba(93, 156, 255, 0.4)";
    });
    
    // Set map canvas background
    const mapCanvas = document.getElementById('floor-map');
    if (mapCanvas) {
      mapCanvas.style.backgroundColor = "rgba(15, 22, 49, 0.5)";
      mapCanvas.style.boxShadow = "inset 0 0 20px rgba(0, 0, 0, 0.4)";
      mapCanvas.style.imageRendering = "pixelated";
      mapCanvas.style.border = "1px solid rgba(93, 156, 255, 0.2)";
      mapCanvas.style.borderRadius = "4px";
    }
    
    // Style the next floor button
    const nextFloorBtn = document.getElementById('next-floor-btn');
    if (nextFloorBtn) {
      nextFloorBtn.style.fontFamily = "'Press Start 2P', cursive";
      nextFloorBtn.style.backgroundColor = "#45e17c";
      nextFloorBtn.style.boxShadow = "0 0 10px rgba(69, 225, 124, 0.5)";
      nextFloorBtn.style.textShadow = "0 0 3px rgba(0, 0, 0, 0.8)";
      nextFloorBtn.style.textTransform = "uppercase";
      nextFloorBtn.style.borderRadius = "4px";
      nextFloorBtn.style.border = "none";
      nextFloorBtn.style.fontSize = "0.8rem";
      nextFloorBtn.style.padding = "10px 15px";
    }
    
    console.log('✅ Enhanced retro styling initialization complete');
  });