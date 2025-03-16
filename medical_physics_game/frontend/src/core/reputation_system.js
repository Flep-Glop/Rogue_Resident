// reputation_system.js - Handles reputation rewards and tracking

const ReputationSystem = {
    // Types of achievements that award reputation
    ACHIEVEMENT_TYPES: {
        FLOOR_COMPLETED: 'floor_completed',
        BOSS_DEFEATED: 'boss_defeated',
        RUN_COMPLETED: 'run_completed',
        CHALLENGE_COMPLETED: 'challenge_completed',
        DISCOVERY: 'discovery'
    },
    
    // Initialize reputation system
    initialize: function() {
        console.log("Initializing reputation system");
        
        // Register event listeners
        this.registerEventListeners();
        
        return this;
    },
    
    // Register for game events
    registerEventListeners: function() {
        // Listen for floor completion
        EventSystem.on(GAME_EVENTS.FLOOR_COMPLETED, this.handleFloorCompleted.bind(this));
        
        // Listen for boss defeat
        EventSystem.on(GAME_EVENTS.NODE_COMPLETED, this.handleNodeCompleted.bind(this));
        
        // Listen for run completion
        EventSystem.on(GAME_EVENTS.RUN_COMPLETED, this.handleRunCompleted.bind(this));
    },
    
    // Award reputation to the player
    awardReputation: function(amount, reason, achievementType) {
        console.log(`Awarding ${amount} reputation for: ${reason}`);
        
        // Only if SkillTreeManager is initialized
        if (typeof SkillTreeManager !== 'undefined' && SkillTreeManager.initialized) {
            // Add reputation
            SkillTreeManager.addReputation(amount);
            
            // Show notification to player
            if (typeof UIUtils !== 'undefined') {
                UIUtils.showToast(`Gained ${amount} Reputation: ${reason}`, 'success');
            }
            
            // Emit event for tracking
            EventSystem.emit('reputation_gained', {
                amount: amount,
                reason: reason,
                achievementType: achievementType,
                timestamp: Date.now()
            });
            
            return true;
        }
        
        return false;
    },
    
    // Handle floor completion event
    handleFloorCompleted: function(floorNumber) {
        // Award reputation based on floor number
        const reputationAmount = Math.max(1, Math.floor(floorNumber / 2));
        this.awardReputation(
            reputationAmount,
            `Completed Floor ${floorNumber}`,
            this.ACHIEVEMENT_TYPES.FLOOR_COMPLETED
        );
    },
    
    // Handle node completion event (check for boss nodes)
    handleNodeCompleted: function(nodeData) {
        // Check if it's a boss node
        if (nodeData && nodeData.type === 'boss') {
            // Bosses give more reputation
            const reputationAmount = 5;
            this.awardReputation(
                reputationAmount,
                `Defeated ${nodeData.title || 'Boss'}`,
                this.ACHIEVEMENT_TYPES.BOSS_DEFEATED
            );
        }
    },
    
    // Handle run completion event
    handleRunCompleted: function(runData) {
        // Award reputation based on how far they got
        const floorsCompleted = runData.floorsCompleted || 1;
        const reputationAmount = Math.max(2, Math.floor(floorsCompleted * 1.5));
        
        this.awardReputation(
            reputationAmount,
            `Completed Run (${floorsCompleted} floors)`,
            this.ACHIEVEMENT_TYPES.RUN_COMPLETED
        );
    },
    
    // Manual reputation awards for specific achievements
    awardDiscovery: function(discoveryName, amount = 1) {
        return this.awardReputation(
            amount,
            `Discovery: ${discoveryName}`,
            this.ACHIEVEMENT_TYPES.DISCOVERY
        );
    },
    
    awardChallenge: function(challengeName, amount = 3) {
        return this.awardReputation(
            amount,
            `Challenge Completed: ${challengeName}`,
            this.ACHIEVEMENT_TYPES.CHALLENGE_COMPLETED
        );
    }
};

// Export the ReputationSystem object
window.ReputationSystem = ReputationSystem;