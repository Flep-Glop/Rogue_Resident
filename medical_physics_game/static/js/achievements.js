// achievements.js - Simple achievement system for tracking player accomplishments

window.Achievements = {
    achievements: [
        {
            id: 'first_steps',
            name: 'First Steps',
            description: 'Complete your first floor successfully.',
            icon: '🏆',
            unlocked: false,
            reward: null,
            secret: false
        },
        {
            id: 'perfect_floor',
            name: 'Perfect Round',
            description: 'Answer all questions correctly on a floor.',
            icon: '🎯',
            unlocked: false,
            reward: 'energy_drink',
            secret: false
        },
        {
            id: 'dose_detective',
            name: 'Dose Detective',
            description: 'Correctly identify the cause of a suspicious dose discrepancy.',
            icon: '🔎',
            unlocked: false,
            reward: 'reference_manual',
            secret: false
        },
        {
            id: 'survivor',
            name: 'Survivor',
            description: 'Complete a floor with only 1 life remaining.',
            icon: '❤️',
            unlocked: false,
            reward: null,
            secret: false
        },
        {
            id: 'collector',
            name: 'Collector',
            description: 'Collect 5 different items in one run.',
            icon: '💼',
            unlocked: false,
            reward: null,
            secret: false
        },
        {
            id: 'knowledge_is_power',
            name: 'Knowledge is Power',
            description: 'Reach 100 insight points in one run.',
            icon: '💡',
            unlocked: false,
            reward: 'cheat_sheet',
            secret: false
        },
        {
            id: 'calibration_expert',
            name: 'Calibration Expert',
            description: 'Answer 3 dosimetry questions correctly in a row.',
            icon: '📊',
            unlocked: false,
            reward: null,
            secret: false
        },
        {
            id: 'physicist_in_training',
            name: 'Physicist in Training',
            description: 'Complete a run and reach the 3rd floor.',
            icon: '🎓',
            unlocked: false,
            reward: 'badge',
            secret: false
        },
        {
            id: 'close_call',
            name: 'Close Call',
            description: 'Answer a question correctly after using a hint.',
            icon: '😅',
            unlocked: false,
            reward: null,
            secret: true
        },
        {
            id: 'qa_master',
            name: 'QA Master',
            description: 'Complete a floor without making any mistakes.',
            icon: '✓',
            unlocked: false,
            reward: null,
            secret: false
        }
    ],
    
    // Initialize achievement system
    initialize: function() {
        // Load achievements from localStorage if available
        const savedAchievements = localStorage.getItem('medical_physics_achievements');
        if (savedAchievements) {
            try {
                const parsed = JSON.parse(savedAchievements);
                // Update only the 'unlocked' state from saved data
                this.achievements.forEach((achievement, index) => {
                    if (parsed[index] && achievement.id === parsed[index].id) {
                        achievement.unlocked = parsed[index].unlocked;
                    }
                });
                console.log('Achievements loaded from localStorage');
            } catch (e) {
                console.error('Error loading achievements:', e);
            }
        }
    },
    
    // Save achievements to localStorage
    saveAchievements: function() {
        localStorage.setItem('medical_physics_achievements', JSON.stringify(this.achievements));
    },
    
    // Check and unlock an achievement by id
    unlock: function(achievementId) {
        const achievement = this.achievements.find(a => a.id === achievementId);
        if (achievement && !achievement.unlocked) {
            achievement.unlocked = true;
            this.saveAchievements();
            this.showAchievementNotification(achievement);
            
            // If achievement has a reward, give it to the player
            if (achievement.reward) {
                this.giveReward(achievement.reward);
            }
            
            return true;
        }
        return false;
    },
    
    // Show notification when achievement is unlocked
    showAchievementNotification: function(achievement) {
        // Create achievement notification element
        const notificationElement = document.createElement('div');
        notificationElement.className = 'achievement-notification';
        
        notificationElement.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-details">
                <div class="achievement-name">Achievement Unlocked!</div>
                <div class="achievement-title">${achievement.name}</div>
                <div class="achievement-desc">${achievement.description}</div>
            </div>
        `;
        
        document.body.appendChild(notificationElement);
        
        // Add the show class after a small delay for animation
        setTimeout(() => {
            notificationElement.classList.add('show');
        }, 10);
        
        // Remove after animation completes
        setTimeout(() => {
            notificationElement.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notificationElement);
            }, 500);
        }, 5000);
    },
    
    // Give reward to player
    giveReward: function(itemId) {
        // Fetch item data
        fetch(`/api/item/${itemId}`)
            .then(response => response.json())
            .then(itemData => {
                if (typeof Character !== 'undefined' && typeof Character.addItemToInventory === 'function') {
                    const added = Character.addItemToInventory(itemData);
                    if (added) {
                        UiUtils.showFloatingText(`Achievement reward: ${itemData.name}!`, 'success');
                    }
                }
            })
            .catch(error => console.error('Error fetching reward item:', error));
    },
    
    // Check multiple achievement conditions
    checkAchievements: function(gameState) {
        // Check for collector achievement
        if (gameState.inventory && gameState.inventory.length >= 5) {
            this.unlock('collector');
        }
        
        // Check for knowledge_is_power achievement
        if (gameState.character && gameState.character.insight >= 100) {
            this.unlock('knowledge_is_power');
        }
        
        // Add more checks as needed
    },
    
    // Show achievements screen
    showAchievementsScreen: function() {
        // Create modal for achievements
        const modal = document.createElement('div');
        modal.className = 'game-modal';
        modal.style.display = 'flex';
        
        // Generate HTML for all achievements
        let achievementsHTML = '';
        this.achievements.forEach(achievement => {
            // Skip secret achievements that are not unlocked
            if (achievement.secret && !achievement.unlocked) {
                achievementsHTML += `
                    <div class="achievement-item locked secret">
                        <div class="achievement-icon">?</div>
                        <div class="achievement-details">
                            <div class="achievement-name">Secret Achievement</div>
                            <div class="achievement-desc">Keep playing to discover this achievement!</div>
                        </div>
                    </div>
                `;
            } else {
                achievementsHTML += `
                    <div class="achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}">
                        <div class="achievement-icon">${achievement.icon}</div>
                        <div class="achievement-details">
                            <div class="achievement-name">${achievement.name}</div>
                            <div class="achievement-desc">${achievement.description}</div>
                            ${achievement.reward ? `<div class="achievement-reward">Reward: ${achievement.reward.replace('_', ' ')}</div>` : ''}
                        </div>
                    </div>
                `;
            }
        });
        
        // Create modal content
        modal.innerHTML = `
            <div class="modal-content achievements-modal">
                <div class="modal-header">
                    <h3>Achievements</h3>
                    <button class="close-modal" id="close-achievements">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="achievements-container">
                        ${achievementsHTML}
                    </div>
                    <button id="close-achievements-btn" class="btn btn-primary mt-3">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners for close buttons
        document.getElementById('close-achievements').addEventListener('click', () => {
            modal.remove();
        });
        
        document.getElementById('close-achievements-btn').addEventListener('click', () => {
            modal.remove();
        });
    }
};

// Add CSS for achievements
const achievementStyles = document.createElement('style');
achievementStyles.textContent = `
    .achievement-notification {
        position: fixed;
        bottom: -100px;
        right: 20px;
        background-color: var(--background-alt, #21232d);
        border: 3px solid var(--primary, #5b8dd9);
        border-radius: 5px;
        padding: 15px;
        display: flex;
        align-items: center;
        width: 300px;
        transition: bottom 0.5s ease-in-out;
        z-index: 9999;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    }
    
    .achievement-notification.show {
        bottom: 20px;
    }
    
    .achievement-icon {
        font-size: 36px;
        margin-right: 15px;
    }
    
    .achievement-details {
        flex: 1;
    }
    
    .achievement-name {
        color: var(--primary, #5b8dd9);
        font-family: 'Press Start 2P', cursive;
        font-size: 12px;
        margin-bottom: 5px;
    }
    
    .achievement-title {
        color: var(--text, #d4dae0);
        font-family: 'Press Start 2P', cursive;
        font-size: 14px;
        margin-bottom: 5px;
    }
    
    .achievement-desc {
        color: var(--text, #d4dae0);
        font-size: 12px;
        opacity: 0.8;
    }
    
    .achievements-container {
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-height: 60vh;
        overflow-y: auto;
        padding-right: 10px;
    }
    
    .achievement-item {
        display: flex;
        align-items: center;
        padding: 10px;
        border-radius: 5px;
        background-color: var(--background, #292b36);
        border: 2px solid var(--primary, #5b8dd9);
    }
    
    .achievement-item.locked {
        opacity: 0.7;
        border-color: var(--dark, #3d4c60);
    }
    
    .achievement-item.secret {
        border-style: dashed;
    }
    
    .achievement-reward {
        color: var(--warning, #f0c866);
        font-size: 11px;
        margin-top: 5px;
    }
    
    .achievements-modal {
        width: 90%;
        max-width: 600px;
    }
`;

document.head.appendChild(achievementStyles);

// Initialize achievements on page load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        Achievements.initialize();
    }, 1000);
});