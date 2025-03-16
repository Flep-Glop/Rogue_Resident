// boss_professor.js - Professor component for boss encounters

const BossProfessor = {
  // Render the professor with appropriate state
  render: function(container, professorState, dialogueText) {
    if (!container) return;
    
    const professorHTML = `
      <div class="professor-container ${professorState}-state">
        <div class="professor-portrait">
          <div class="professor-image"></div>
          <div class="professor-glow"></div>
          <div class="quantum-particles"></div>
        </div>
        <div class="professor-dialogue">
          <p id="professor-text">${dialogueText}</p>
        </div>
      </div>
    `;
    
    container.innerHTML = professorHTML;
    
    // Add particle effects for quantum/cosmic states
    if (professorState !== 'normal') {
      this.addParticleEffects(container, professorState);
    }
  },
  
  // Update professor state based on reality distortion
  updateState: function(distortion) {
    let newState = 'normal';
    
    if (distortion >= 70) {
      newState = 'cosmic';
    } else if (distortion >= 40) {
      newState = 'quantum';
    }
    
    return newState;
  },
  
  // Add particles to professor portrait
  addParticleEffects: function(container, state) {
    if (!container) return;
    
    const particlesContainer = container.querySelector('.quantum-particles');
    if (!particlesContainer) return;
    
    const particleCount = state === 'cosmic' ? 10 : 5;
    
    // Create particles
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'quantum-particle';
      
      // Random position
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      
      // Random size (cosmic particles are larger)
      const size = state === 'cosmic' ? 3 + Math.random() * 6 : 2 + Math.random() * 3;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      
      // Random animation duration
      particle.style.animationDuration = `${2 + Math.random() * 5}s`;
      
      // Color based on state
      particle.style.backgroundColor = state === 'cosmic' ? '#d35db3' : '#5b8dd9';
      
      // Add to container
      particlesContainer.appendChild(particle);
      
      // Remove after animation
      setTimeout(() => {
        if (particle && particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }, 7000);
    }
  }
};

// Export globally
window.BossProfessor = BossProfessor;