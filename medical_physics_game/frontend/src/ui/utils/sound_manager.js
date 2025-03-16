// frontend/src/ui/utils/sound_manager.js
class SoundManager {
    constructor() {
      this.sounds = {};
      this.music = null;
      this.musicVolume = 0.5;
      this.soundVolume = 0.7;
      this.muted = false;
      
      // Load user preferences from localStorage
      this.loadPreferences();
      
      // Initialize categories for organization
      this.categories = {
        ui: {},
        gameplay: {},
        achievements: {},
        ambient: {}
      };
      
      // Flag to track initialization status
      this.initialized = false;
    }
    
    loadPreferences() {
      try {
        const preferences = JSON.parse(localStorage.getItem('soundPreferences')) || {};
        this.musicVolume = preferences.musicVolume !== undefined ? preferences.musicVolume : this.musicVolume;
        this.soundVolume = preferences.soundVolume !== undefined ? preferences.soundVolume : this.soundVolume;
        this.muted = preferences.muted !== undefined ? preferences.muted : this.muted;
      } catch (e) {
        console.error('Error loading sound preferences:', e);
      }
    }
    
    savePreferences() {
      const preferences = {
        musicVolume: this.musicVolume,
        soundVolume: this.soundVolume,
        muted: this.muted
      };
      
      localStorage.setItem('soundPreferences', JSON.stringify(preferences));
    }
    
    initialize(onComplete = null) {
      // Load common UI sounds
      this.loadSound('ui.click', 'sounds/ui/click.mp3', 'ui');
      this.loadSound('ui.hover', 'sounds/ui/hover.mp3', 'ui');
      this.loadSound('ui.success', 'sounds/ui/success.mp3', 'ui');
      this.loadSound('ui.error', 'sounds/ui/error.mp3', 'ui');
      this.loadSound('ui.notification', 'sounds/ui/notification.mp3', 'ui');
      
      // Load gameplay sounds
      this.loadSound('gameplay.correct', 'sounds/gameplay/correct.mp3', 'gameplay');
      this.loadSound('gameplay.incorrect', 'sounds/gameplay/incorrect.mp3', 'gameplay');
      this.loadSound('gameplay.heal', 'sounds/gameplay/heal.mp3', 'gameplay');
      this.loadSound('gameplay.damage', 'sounds/gameplay/damage.mp3', 'gameplay');
      this.loadSound('gameplay.levelUp', 'sounds/gameplay/level_up.mp3', 'gameplay');
      
      // Load achievement sounds
      this.loadSound('achievements.unlock', 'sounds/achievements/unlock.mp3', 'achievements');
      
      // Load ambient sounds
      this.loadSound('ambient.hospital', 'sounds/ambient/hospital.mp3', 'ambient');
      this.loadSound('ambient.laboratory', 'sounds/ambient/laboratory.mp3', 'ambient');
      
      // Load music tracks
      this.loadSound('music.main', 'sounds/music/main_theme.mp3');
      this.loadSound('music.gameplay', 'sounds/music/gameplay.mp3');
      this.loadSound('music.menu', 'sounds/music/menu.mp3');
      this.loadSound('music.victory', 'sounds/music/victory.mp3');
      
      this.initialized = true;
      
      if (onComplete && typeof onComplete === 'function') {
        onComplete();
      }
    }
    
    loadSound(id, url, category = null) {
      // Create new Audio element
      const audio = new Audio();
      audio.preload = 'auto';
      
      // Handle loading errors gracefully
      audio.onerror = () => {
        console.warn(`Failed to load sound: ${id} from ${url}`);
      };
      
      // Set the source
      audio.src = url;
      
      // Store in sounds collection
      this.sounds[id] = audio;
      
      // Add to category if specified
      if (category && this.categories[category]) {
        this.categories[category][id] = audio;
      }
      
      return audio;
    }
    
    playSound(id, volume = null) {
      if (this.muted || !this.sounds[id]) return;
      
      // Create a copy of the sound to allow overlapping
      const sound = this.sounds[id].cloneNode();
      sound.volume = volume !== null ? volume : this.soundVolume;
      
      // Play the sound
      const playPromise = sound.play();
      
      // Handle autoplay restrictions in browsers
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn(`Sound playback prevented: ${error}`);
        });
      }
      
      return sound;
    }
    
    playSoundWithOptions(id, options = {}) {
      if (this.muted || !this.sounds[id]) return;
      
      const {
        volume = this.soundVolume,
        rate = 1.0,
        loop = false,
        pan = 0 // -1 (left) to 1 (right)
      } = options;
      
      // Create a copy of the sound
      const sound = this.sounds[id].cloneNode();
      sound.volume = volume;
      sound.playbackRate = rate;
      sound.loop = loop;
      
      // Apply stereo panning if the AudioContext API is available
      if (window.AudioContext && pan !== 0) {
        this.applyStereoPanning(sound, pan);
      }
      
      // Play the sound
      const playPromise = sound.play();
      
      // Handle autoplay restrictions
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn(`Sound playback prevented: ${error}`);
        });
      }
      
      return sound;
    }
    
    applyStereoPanning(audioElement, pan) {
      // Create an audio context if we don't have one
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      // Create a source from the audio element
      const source = this.audioContext.createMediaElementSource(audioElement);
      
      // Create a stereo panner
      const panner = this.audioContext.createStereoPanner();
      panner.pan.value = pan;
      
      // Connect the nodes
      source.connect(panner);
      panner.connect(this.audioContext.destination);
      
      return panner;
    }
    
    playMusic(id, fadeIn = 1000) {
      if (!this.sounds[id]) return;
      
      // Fade out current music if playing
      if (this.music) {
        this.fadeOutMusic(500, () => {
          this.startNewMusic(id, fadeIn);
        });
      } else {
        this.startNewMusic(id, fadeIn);
      }
    }
    
    startNewMusic(id, fadeIn = 1000) {
      this.music = this.sounds[id];
      this.music.loop = true;
      this.music.currentTime = 0;
      
      if (fadeIn > 0) {
        // Start at zero volume and fade in
        this.music.volume = 0;
        this.music.play();
        
        const startTime = performance.now();
        const targetVolume = this.muted ? 0 : this.musicVolume;
        
        const fadeStep = () => {
          const elapsed = performance.now() - startTime;
          const progress = Math.min(elapsed / fadeIn, 1);
          
          this.music.volume = progress * targetVolume;
          
          if (progress < 1) {
            requestAnimationFrame(fadeStep);
          }
        };
        
        requestAnimationFrame(fadeStep);
      } else {
        // Start at normal volume
        this.music.volume = this.muted ? 0 : this.musicVolume;
        this.music.play();
      }
    }
    
    fadeOutMusic(duration = 1000, onComplete = null) {
      if (!this.music) {
        if (onComplete) onComplete();
        return;
      }
      
      const startVolume = this.music.volume;
      const startTime = performance.now();
      
      const fadeStep = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        this.music.volume = startVolume * (1 - progress);
        
        if (progress < 1) {
          requestAnimationFrame(fadeStep);
        } else {
          this.music.pause();
          this.music.currentTime = 0;
          this.music = null;
          
          if (onComplete) onComplete();
        }
      };
      
      requestAnimationFrame(fadeStep);
    }
    
    stopMusic() {
      if (this.music) {
        this.music.pause();
        this.music.currentTime = 0;
        this.music = null;
      }
    }
    
    pauseMusic() {
      if (this.music) {
        this.music.pause();
      }
    }
    
    resumeMusic() {
      if (this.music) {
        this.music.play();
      }
    }
    
    setMusicVolume(volume) {
      this.musicVolume = Math.max(0, Math.min(1, volume));
      if (this.music) {
        this.music.volume = this.muted ? 0 : this.musicVolume;
      }
      this.savePreferences();
    }
    
    setSoundVolume(volume) {
      this.soundVolume = Math.max(0, Math.min(1, volume));
      this.savePreferences();
    }
    
    toggleMute() {
      this.muted = !this.muted;
      
      if (this.music) {
        this.music.volume = this.muted ? 0 : this.musicVolume;
      }
      
      this.savePreferences();
      return this.muted;
    }
    
    // Utility methods for common sounds
    playUISound(type) {
      return this.playSound(`ui.${type}`);
    }
    
    playGameplaySound(type) {
      return this.playSound(`gameplay.${type}`);
    }
    
    // Preload a group of sounds based on the current context
    preloadCategory(category) {
      if (!this.categories[category]) {
        return false;
      }
      
      // Iterate through all sounds in the category and trigger preload
      Object.values(this.categories[category]).forEach(audio => {
        audio.load();
      });
      
      return true;
    }
  }
  
  // Create and export a singleton instance
  export default new SoundManager();