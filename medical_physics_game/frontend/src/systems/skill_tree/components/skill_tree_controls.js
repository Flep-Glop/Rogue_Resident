// frontend/src/systems/skill_tree/components/skill_tree_controls.js

/**
 * SkillTreeControls
 * Provides UI controls for filtering and interacting with the skill tree
 */
class SkillTreeControls {
    constructor(options = {}) {
      this.options = Object.assign({
        containerId: 'skill-tree-controls',
        zoomIncrementValue: 0.1,
        animateFilterTransition: true
      }, options);
      
      this.container = null;
      this.eventSystem = null;
      this.initialized = false;
      this.state = {
        specializations: [],
        filteredSpecialization: null,
        viewState: {
          zoom: 1,
          offsetX: 0,
          offsetY: 0
        }
      };
    }
    
    /**
     * Initialize the controls
     * @param {Object} options Configuration options
     * @returns {SkillTreeControls} This instance for chaining
     */
    initialize(options = {}) {
      if (this.initialized) return this;
      
      // Apply any new options
      Object.assign(this.options, options);
      
      // Get container
      this.container = document.getElementById(this.options.containerId);
      if (!this.container) {
        console.error(`Skill tree controls container not found: ${this.options.containerId}`);
        return this;
      }
      
      // Set up event system
      this.eventSystem = options.eventSystem || window.EventSystem;
      
      // Create initial UI
      this._createControlsUI();
      
      this.initialized = true;
      return this;
    }
    
    /**
     * Set specializations for filtering
     * @param {Array} specializations Specializations data
     */
    setSpecializations(specializations) {
      this.state.specializations = specializations || [];
      this._updateSpecializationFilters();
    }
    
    /**
     * Update the specialization filter UI
     * @private
     */
    _updateSpecializationFilters() {
      const filtersContainer = this.container.querySelector('.specialization-filters');
      if (!filtersContainer) return;
      
      // Clear existing filters
      filtersContainer.innerHTML = '';
      
      // Add "All" option
      const allChip = document.createElement('div');
      allChip.className = `specialization-chip ${this.state.filteredSpecialization === null ? 'selected' : ''}`;
      allChip.dataset.specialization = 'all';
      allChip.textContent = 'All';
      allChip.addEventListener('click', () => this._handleSpecializationFilter(null));
      filtersContainer.appendChild(allChip);
      
      // Add each specialization
      this.state.specializations.forEach(spec => {
        const chip = document.createElement('div');
        chip.className = `specialization-chip ${this.state.filteredSpecialization === spec.id ? 'selected' : ''}`;
        chip.dataset.specialization = spec.id;
        
        // Create color dot
        const colorDot = document.createElement('span');
        colorDot.className = 'specialization-color-dot';
        colorDot.style.backgroundColor = spec.color || '#888';
        
        chip.appendChild(colorDot);
        chip.appendChild(document.createTextNode(spec.name));
        
        chip.addEventListener('click', () => this._handleSpecializationFilter(spec.id));
        filtersContainer.appendChild(chip);
      });
    }
    
    /**
     * Create the controls UI
     * @private
     */
    _createControlsUI() {
      if (!this.container) return;
      
      // Clear container
      this.container.innerHTML = '';
      
      // Create specialization filters
      const filtersContainer = document.createElement('div');
      filtersContainer.className = 'specialization-filters';
      this.container.appendChild(filtersContainer);
      
      // Create view controls
      const viewControls = document.createElement('div');
      viewControls.className = 'view-controls';
      
      // Zoom in button
      const zoomInBtn = document.createElement('button');
      zoomInBtn.className = 'view-control-btn zoom-in-btn';
      zoomInBtn.innerHTML = '+';
      zoomInBtn.title = 'Zoom In';
      zoomInBtn.addEventListener('click', () => this._handleZoomIn());
      viewControls.appendChild(zoomInBtn);
      
      // Zoom out button
      const zoomOutBtn = document.createElement('button');
      zoomOutBtn.className = 'view-control-btn zoom-out-btn';
      zoomOutBtn.innerHTML = '−';
      zoomOutBtn.title = 'Zoom Out';
      zoomOutBtn.addEventListener('click', () => this._handleZoomOut());
      viewControls.appendChild(zoomOutBtn);
      
      // Reset view button
      const resetViewBtn = document.createElement('button');
      resetViewBtn.className = 'view-control-btn reset-view-btn';
      resetViewBtn.innerHTML = '⟲';
      resetViewBtn.title = 'Reset View';
      resetViewBtn.addEventListener('click', () => this._handleResetView());
      viewControls.appendChild(resetViewBtn);
      
      this.container.appendChild(viewControls);
      
      // Initialize specialization filters
      this._updateSpecializationFilters();
    }
    
    /**
     * Handle specialization filter selection
     * @param {String|null} specializationId Specialization ID or null for all
     * @private
     */
    _handleSpecializationFilter(specializationId) {
      // Update state
      this.state.filteredSpecialization = specializationId;
      
      // Update UI
      this._updateSpecializationFilters();
      
      // Notify filter change
      if (this.eventSystem) {
        this.eventSystem.publish('ui.specialization_filter_changed', {
          specialization: specializationId
        });
      }
    }
    
    /**
     * Handle zoom in
     * @private
     */
    _handleZoomIn() {
      // Notify zoom action
      if (this.eventSystem) {
        this.eventSystem.publish('ui.zoom_in', {
          increment: this.options.zoomIncrementValue
        });
      }
    }
    
    /**
     * Handle zoom out
     * @private
     */
    _handleZoomOut() {
      // Notify zoom action
      if (this.eventSystem) {
        this.eventSystem.publish('ui.zoom_out', {
          increment: this.options.zoomIncrementValue
        });
      }
    }
    
    /**
     * Handle reset view
     * @private
     */
    _handleResetView() {
      // Notify reset action
      if (this.eventSystem) {
        this.eventSystem.publish('ui.reset_view');
      }
    }
    
    /**
     * Update stats display
     * @param {Number} reputation Current reputation
     * @param {Number} skillPoints Available skill points
     * @param {Object} specializationProgress Progress in each specialization
     */
    updateStats(reputation, skillPoints, specializationProgress = {}) {
      // Look for stats container
      let statsContainer = this.container.querySelector('.skill-tree-stats');
      
      // Create if not exists
      if (!statsContainer) {
        statsContainer = document.createElement('div');
        statsContainer.className = 'skill-tree-stats';
        this.container.appendChild(statsContainer);
      }
      
      // Update content
      statsContainer.innerHTML = `
        <div class="stat-block reputation-stat">
          <div class="stat-label">Reputation</div>
          <div class="stat-value">${reputation}</div>
        </div>
        <div class="stat-block skill-points-stat">
          <div class="stat-label">Skill Points</div>
          <div class="stat-value">${skillPoints}</div>
        </div>
      `;
      
      // Add specialization progress if available
      if (Object.keys(specializationProgress).length > 0) {
        const progressSection = document.createElement('div');
        progressSection.className = 'specialization-progress-section';
        
        Object.entries(specializationProgress).forEach(([specId, count]) => {
          // Find specialization
          const spec = this.state.specializations.find(s => s.id === specId);
          if (!spec) return;
          
          const progressItem = document.createElement('div');
          progressItem.className = 'specialization-progress-item';
          
          // Calculate percentage if thresholds exist
          let percentage = 0;
          if (spec.threshold) {
            percentage = Math.min(100, Math.floor((count / spec.threshold) * 100));
          }
          
          progressItem.innerHTML = `
            <div class="progress-label">${spec.name}</div>
            <div class="progress-bar-container">
              <div class="progress-bar" style="width: ${percentage}%; background-color: ${spec.color || '#888'}"></div>
            </div>
            <div class="progress-value">${count}${spec.threshold ? `/${spec.threshold}` : ''}</div>
          `;
          
          progressSection.appendChild(progressItem);
        });
        
        statsContainer.appendChild(progressSection);
      }
    }
  }
  
  export default SkillTreeControls;