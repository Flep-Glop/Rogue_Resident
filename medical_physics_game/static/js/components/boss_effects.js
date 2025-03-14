// boss_effects.js - Visual effects for the boss component

const BossEffects = {
  // Apply quantum effects based on reality distortion
  applyQuantumEffects: function(container, distortion) {
    if (!container) return;
    
    // Apply effects based on distortion level
    if (distortion >= 30) {
      // Add floating quantum particles
      this.addQuantumParticles(container, distortion);
    }
    
    if (distortion >= 50) {
      // Add flickering text
      this.addQuantumTextEffects(container);
    }
    
    if (distortion >= 70) {
      // Add reality warping
      this.addRealityWarpingEffects(container);
    }
    
    if (distortion >= 90) {
      // Full cosmic collapse
      this.addCosmicCollapseEffects(container);
    }
  },
  
  // Add quantum particles to the background
  addQuantumParticles: function(container, distortion) {
    if (!container) return;
    
    const particleCount = 10 + Math.floor(distortion / 10);
    
    // Create particles
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'quantum-particle';
      
      // Random position
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      
      // Random size
      const size = 2 + Math.random() * 5;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      
      // Random animation duration
      particle.style.animationDuration = `${3 + Math.random() * 7}s`;
      
      // Random color
      const colors = ['#5b8dd9', '#d35db3', '#f0c866', '#56b886'];
      particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      
      // Add to container
      container.appendChild(particle);
      
      // Remove after animation
      setTimeout(() => {
        if (particle && particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }, 10000);
    }
  },
  
  // Add quantum effects to text
  addQuantumTextEffects: function(container) {
    if (!container) return;
    
    // Make text quantum-uncertain
    const textElements = container.querySelectorAll('p, h4, button');
    
    textElements.forEach(element => {
      if (Math.random() < 0.3) { // Only apply to some elements
        element.classList.add('quantum-text');
      }
    });
  },
  
  // Add quantum effects to question display
  addQuantumQuestionEffects: function(container) {
    if (!container) return;
    
    // Add quantum uncertainty to options
    const options = container.querySelectorAll('.question-option');
    
    options.forEach(option => {
      // Small chance to swap option text with another randomly
      if (Math.random() < 0.2) {
        const randomIndex = Math.floor(Math.random() * options.length);
        if (options[randomIndex]) {
          const tempText = option.textContent;
          option.textContent = options[randomIndex].textContent;
          options[randomIndex].textContent = tempText;
        }
      }
      
      // Add quantum shimmer
      option.classList.add('quantum-shimmer');
    });
  },
  
  // Add quantum effects to results display
  addQuantumResultEffects: function(container) {
    if (!container) return;
    
    // Get all score displays
    const scoreElements = container.querySelectorAll('.score-value, .score-text');
    
    scoreElements.forEach(element => {
      // Add quantum uncertainty - occasionally change the displayed score
      if (Math.random() < 0.3) {
        if (element.classList.contains('score-value')) {
          const originalScore = parseInt(element.textContent);
          const quantumScore = originalScore + (Math.random() < 0.5 ? -10 : 10);
          element.textContent = `${quantumScore}%`;
          element.setAttribute('data-original', originalScore);
          
          // Flicker between values
          setInterval(() => {
            if (element.hasAttribute('data-original')) {
              element.textContent = `${element.getAttribute('data-original')}%`;
              element.removeAttribute('data-original');
            } else {
              element.setAttribute('data-original', element.textContent.replace('%', ''));
              element.textContent = `${Math.round(Math.random() * 100)}%`;
            }
          }, 2000 + Math.random() * 3000);
        }
      }
      
      // Add quantum shimmer
      element.classList.add('quantum-shimmer');
    });
  },
  
  // Add reality warping effects
  addRealityWarpingEffects: function(container) {
    if (!container) return;
    
    // Add reality warp class to container
    container.classList.add('reality-warped');
    
    // Create ripple effect
    const ripple = document.createElement('div');
    ripple.className = 'reality-ripple';
    ripple.style.left = `${50 + (Math.random() * 30 - 15)}%`;
    ripple.style.top = `${50 + (Math.random() * 30 - 15)}%`;
    
    container.appendChild(ripple);
    
    // Remove after animation
    setTimeout(() => {
      if (ripple && ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    }, 4000);
  },
  
  // Add cosmic collapse effects at highest distortion
  addCosmicCollapseEffects: function(container) {
    if (!container) return;
    
    // Add cosmic collapse class
    container.classList.add('cosmic-collapse');
    
    // Create a spacetime rift
    const rift = document.createElement('div');
    rift.className = 'cosmic-rift';
    
    // Random position near center
    rift.style.left = `${40 + Math.random() * 20}%`;
    rift.style.top = `${40 + Math.random() * 20}%`;
    
    container.appendChild(rift);
    
    // Grow and collapse
    setTimeout(() => {
      rift.classList.add('expanding');
      
      setTimeout(() => {
        if (rift && rift.parentNode) {
          rift.classList.add('collapsing');
          
          setTimeout(() => {
            if (rift && rift.parentNode) {
              rift.parentNode.removeChild(rift);
            }
          }, 2000);
        }
      }, 3000);
    }, 500);
  },
  
  // Add final cosmic effects to completion screen
  addFinalCosmicEffects: function(container, distortion) {
    if (!container) return;
    
    // Add appropriate cosmic effects based on distortion
    if (distortion > 50) {
      // Add cosmic particles
      for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'cosmic-particle';
        
        // Random position
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        
        // Random size
        const size = 4 + Math.random() * 8;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Add to container
        container.appendChild(particle);
      }
    }
    
    if (distortion > 80) {
      // Add cosmic seal animation
      const seal = container.querySelector('.cosmic-seal');
      if (seal) {
        seal.classList.add('active');
      }
      
      // Add reality unravel effect
      container.classList.add('reality-unravel');
    }
  }
};

// Export globally
window.BossEffects = BossEffects;