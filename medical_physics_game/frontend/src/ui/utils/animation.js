// frontend/src/ui/utils/animation.js
class AnimationManager {
    constructor() {
      this.animations = {};
    }
    
    registerAnimation(name, duration, timingFunction = 'ease', delay = 0) {
      this.animations[name] = {
        duration,
        timingFunction,
        delay
      };
    }
    
    animate(element, animationName, onComplete = null) {
      if (!this.animations[animationName]) {
        console.error(`Animation "${animationName}" not registered`);
        return;
      }
      
      const animation = this.animations[animationName];
      
      element.style.transition = `all ${animation.duration}ms ${animation.timingFunction} ${animation.delay}ms`;
      
      // Add animation class
      element.classList.add(`animation-${animationName}`);
      
      // Remove class after animation completes
      setTimeout(() => {
        element.classList.remove(`animation-${animationName}`);
        element.style.transition = '';
        
        if (onComplete && typeof onComplete === 'function') {
          onComplete();
        }
      }, animation.duration + animation.delay);
    }
    
    shake(element, intensity = 5, duration = 500) {
      const originalPosition = element.style.transform;
      const steps = 10;
      const stepDuration = duration / steps;
      
      let currentStep = 0;
      
      const interval = setInterval(() => {
        if (currentStep >= steps) {
          clearInterval(interval);
          element.style.transform = originalPosition;
          return;
        }
        
        const xOffset = Math.random() * intensity * 2 - intensity;
        const yOffset = Math.random() * intensity * 2 - intensity;
        
        element.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
        
        currentStep++;
      }, stepDuration);
    }
    
    fadeIn(element, duration = 300) {
      element.style.opacity = '0';
      element.style.display = 'block';
      
      setTimeout(() => {
        element.style.transition = `opacity ${duration}ms ease`;
        element.style.opacity = '1';
      }, 10);
      
      setTimeout(() => {
        element.style.transition = '';
      }, duration + 10);
    }
    
    fadeOut(element, duration = 300, remove = false) {
      element.style.transition = `opacity ${duration}ms ease`;
      element.style.opacity = '0';
      
      setTimeout(() => {
        if (remove) {
          element.remove();
        } else {
          element.style.display = 'none';
        }
        element.style.transition = '';
      }, duration);
    }
    
    slideIn(element, direction = 'right', distance = 50, duration = 300) {
      // Store original position
      const originalPosition = window.getComputedStyle(element).position;
      if (originalPosition === 'static') {
        element.style.position = 'relative';
      }
      
      // Set starting position
      let translateProperty;
      switch (direction) {
        case 'left':
          translateProperty = `translateX(${distance}px)`;
          break;
        case 'right':
          translateProperty = `translateX(-${distance}px)`;
          break;
        case 'up':
          translateProperty = `translateY(${distance}px)`;
          break;
        case 'down':
          translateProperty = `translateY(-${distance}px)`;
          break;
        default:
          translateProperty = `translateX(-${distance}px)`;
      }
      
      element.style.transform = translateProperty;
      element.style.opacity = '0';
      element.style.display = 'block';
      
      // Trigger animation
      setTimeout(() => {
        element.style.transition = `transform ${duration}ms ease, opacity ${duration}ms ease`;
        element.style.transform = 'translate(0, 0)';
        element.style.opacity = '1';
      }, 10);
      
      // Clean up
      setTimeout(() => {
        element.style.transition = '';
        if (originalPosition === 'static') {
          // Only reset position if we changed it
          element.style.position = 'static';
        }
      }, duration + 10);
    }
    
    pulse(element, scale = 1.05, duration = 300) {
      element.style.transition = `transform ${duration / 2}ms ease`;
      element.style.transform = `scale(${scale})`;
      
      setTimeout(() => {
        element.style.transform = 'scale(1)';
        
        setTimeout(() => {
          element.style.transition = '';
        }, duration / 2);
      }, duration / 2);
    }
    
    highlight(element, color = '#ffff99', duration = 1000) {
      const originalBg = element.style.backgroundColor;
      const originalTransition = element.style.transition;
      
      // Apply highlight
      element.style.transition = `background-color ${duration / 2}ms ease`;
      element.style.backgroundColor = color;
      
      // Fade back to original
      setTimeout(() => {
        element.style.backgroundColor = originalBg;
        
        // Clean up
        setTimeout(() => {
          element.style.transition = originalTransition;
        }, duration / 2);
      }, duration / 2);
    }
    
    // Utility method to create CSS keyframes for complex animations
    createKeyframes(name, keyframes) {
      // Check if keyframes already exist
      if (document.querySelector(`style[data-keyframes="${name}"]`)) {
        return;
      }
      
      const style = document.createElement('style');
      style.setAttribute('data-keyframes', name);
      
      let keyframesRule = `@keyframes ${name} {\n`;
      
      for (const key in keyframes) {
        keyframesRule += `  ${key} {\n`;
        
        for (const prop in keyframes[key]) {
          keyframesRule += `    ${prop}: ${keyframes[key][prop]};\n`;
        }
        
        keyframesRule += `  }\n`;
      }
      
      keyframesRule += `}\n`;
      
      style.textContent = keyframesRule;
      document.head.appendChild(style);
    }
    
    applyKeyframes(element, name, duration = 1000, timingFunction = 'ease', iterationCount = 1, onComplete = null) {
      element.style.animation = `${name} ${duration}ms ${timingFunction} ${iterationCount}`;
      
      // Handle animation end
      const handleAnimationEnd = () => {
        element.style.animation = '';
        element.removeEventListener('animationend', handleAnimationEnd);
        
        if (onComplete && typeof onComplete === 'function') {
          onComplete();
        }
      };
      
      element.addEventListener('animationend', handleAnimationEnd);
    }
  }
  
  // Create and export a singleton instance
  export default new AnimationManager();