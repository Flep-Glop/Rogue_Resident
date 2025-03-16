#!/bin/bash

echo "Fixing character selection page..."

# Step 1: Fix the character_assets.js file to ensure it defines the characters properly
mkdir -p frontend/static/js
cat > frontend/static/js/character_assets.js << 'END'
// Character data for selection screen
const characters = [
    {
        id: 'physicist',
        name: 'Physicist',
        description: 'Strong analytical skills and problem-solving abilities.',
        stats: {
            intelligence: 9,
            persistence: 7,
            adaptability: 6
        },
        abilities: ['Critical Analysis', 'Problem Solving'],
        image: '/static/img/characters/physicist.png'
    },
    {
        id: 'resident',
        name: 'Resident',
        description: 'Well-rounded with clinical knowledge and patient care experience.',
        stats: {
            intelligence: 7,
            persistence: 8,
            adaptability: 8
        },
        abilities: ['Clinical Diagnosis', 'Patient Care'],
        image: '/static/img/characters/resident.png'
    },
    {
        id: 'qa_specialist',
        name: 'QA Specialist',
        description: 'Detail-oriented with exceptional testing and validation skills.',
        stats: {
            intelligence: 8,
            persistence: 9,
            adaptability: 6
        },
        abilities: ['Detail Oriented', 'Process Improvement'],
        image: '/static/img/characters/qa_specialist.png'
    }
];

// Make characters available globally
window.gameCharacters = characters;
END
echo "✅ Created proper character_assets.js with character data"

# Step 2: Create necessary CSS files
mkdir -p frontend/static/css

# Main CSS file
cat > frontend/static/css/main.css << 'END'
/* Main application styles */
body {
    font-family: 'Arial', sans-serif;
    margin: 0;
    padding: 0;
    background-color: #f0f0f0;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

h1, h2, h3 {
    color: #333;
}

.btn {
    display: inline-block;
    padding: 10px 20px;
    background-color: #4a90e2;
    color: white;
    text-decoration: none;
    border-radius: 5px;
    font-weight: bold;
    cursor: pointer;
    border: none;
    transition: background-color 0.3s;
}

.btn:hover {
    background-color: #3a7bc8;
}
END
echo "✅ Created main.css"

# Character image styles
cat > frontend/static/css/character_image_styles.css << 'END'
/* Character selection screen styles */
.character-selection {
    text-align: center;
    padding: 20px;
}

.character-carousel {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 30px 0;
    position: relative;
}

.carousel-button {
    background: #4a90e2;
    color: white;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    font-size: 20px;
    cursor: pointer;
    margin: 0 15px;
    z-index: 10;
}

.carousel-button:hover {
    background: #3a7bc8;
}

.character-cards {
    display: flex;
    overflow: hidden;
    width: 800px;
    position: relative;
}

.character-card {
    flex: 0 0 auto;
    width: 250px;
    padding: 20px;
    margin: 0 10px;
    background: white;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    transition: transform 0.3s;
}

.character-card:hover {
    transform: translateY(-5px);
}

.character-card.active {
    border: 3px solid #4a90e2;
}

.character-image {
    width: 150px;
    height: 150px;
    margin: 0 auto 15px;
    border-radius: 50%;
    overflow: hidden;
    background-color: #eee;
}

.character-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.character-name {
    font-size: 1.5em;
    margin-bottom: 10px;
}

.character-description {
    font-size: 0.9em;
    color: #666;
    margin-bottom: 15px;
}

.character-stats {
    text-align: left;
    margin-bottom: 15px;
}

.stat-bar {
    height: 10px;
    background: #eee;
    border-radius: 5px;
    margin-bottom: 8px;
}

.stat-fill {
    height: 100%;
    background: #4a90e2;
    border-radius: 5px;
}

.character-abilities {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 5px;
    margin-bottom: 15px;
}

.ability-tag {
    background: #f0f7ff;
    color: #4a90e2;
    padding: 5px 10px;
    border-radius: 15px;
    font-size: 0.8em;
}

.hidden {
    display: none;
}

.select-button {
    width: 100%;
}
END
echo "✅ Created character_image_styles.css"

# Step 3: Create a completely new character selection template that works correctly
mkdir -p frontend/templates/pages
cat > frontend/templates/pages/character_select.html << 'END'
{% extends "base.html" %}

{% block title %}Character Selection{% endblock %}

{% block additional_css %}
<link rel="stylesheet" href="{{ url_for('static', filename='css/main.css') }}">
<link rel="stylesheet" href="{{ url_for('static', filename='css/character_image_styles.css') }}">
{% endblock %}

{% block content %}
<div class="character-selection">
    <h1>Character Selection</h1>
    <p>Choose your character to begin the game</p>
    
    <div class="character-carousel">
        <button class="carousel-button prev-button">&lt;</button>
        <div class="character-cards" id="character-cards">
            <!-- Character cards will be inserted here by JavaScript -->
        </div>
        <button class="carousel-button next-button">&gt;</button>
    </div>
    
    <div class="character-details" id="character-details">
        <!-- Selected character details will be shown here -->
    </div>
    
    <button class="btn select-button" id="select-button">Select Character</button>
</div>

{% endblock %}

{% block additional_js %}
<script src="{{ url_for('static', filename='js/character_assets.js') }}"></script>
<script>
    // Character selection logic
    document.addEventListener('DOMContentLoaded', function() {
        // Define characters here as a fallback in case character_assets.js fails to load
        const fallbackCharacters = [
            {
                id: 'physicist',
                name: 'Physicist',
                description: 'Strong analytical skills and problem-solving abilities.',
                stats: {
                    intelligence: 9,
                    persistence: 7,
                    adaptability: 6
                },
                abilities: ['Critical Analysis', 'Problem Solving'],
                image: "{{ url_for('static', filename='img/characters/physicist.png') }}"
            },
            {
                id: 'resident',
                name: 'Resident',
                description: 'Well-rounded with clinical knowledge and patient care experience.',
                stats: {
                    intelligence: 7,
                    persistence: 8,
                    adaptability: 8
                },
                abilities: ['Clinical Diagnosis', 'Patient Care'],
                image: "{{ url_for('static', filename='img/characters/resident.png') }}"
            },
            {
                id: 'qa_specialist',
                name: 'QA Specialist',
                description: 'Detail-oriented with exceptional testing and validation skills.',
                stats: {
                    intelligence: 8,
                    persistence: 9,
                    adaptability: 6
                },
                abilities: ['Detail Oriented', 'Process Improvement'],
                image: "{{ url_for('static', filename='img/characters/qa_specialist.png') }}"
            }
        ];
        
        // Use window.gameCharacters if available, otherwise use fallback
        const characters = window.gameCharacters || fallbackCharacters;
        
        // DOM elements
        const characterCards = document.getElementById('character-cards');
        const characterDetails = document.getElementById('character-details');
        const selectButton = document.getElementById('select-button');
        const prevButton = document.querySelector('.prev-button');
        const nextButton = document.querySelector('.next-button');
        
        // State
        let currentIndex = 0;
        let selectedCharacter = null;
        
        // Render all character cards
        function renderCharacters() {
            if (!characters || !Array.isArray(characters)) {
                console.error('Error loading characters:', characters);
                return;
            }
            
            characterCards.innerHTML = '';
            
            characters.forEach((character, index) => {
                const card = document.createElement('div');
                card.className = 'character-card';
                card.dataset.index = index;
                
                card.innerHTML = `
                    <div class="character-image">
                        <img src="${character.image}" alt="${character.name}">
                    </div>
                    <h2 class="character-name">${character.name}</h2>
                    <p class="character-description">${character.description}</p>
                `;
                
                card.addEventListener('click', () => selectCharacter(index));
                characterCards.appendChild(card);
            });
            
            // Select the first character by default
            selectCharacter(0);
            updateCarousel();
        }
        
        // Select a character and show details
        function selectCharacter(index) {
            // Update current index
            currentIndex = index;
            selectedCharacter = characters[index];
            
            // Update active card
            document.querySelectorAll('.character-card').forEach((card, i) => {
                if (i === index) {
                    card.classList.add('active');
                } else {
                    card.classList.remove('active');
                }
            });
            
            // Show character details
            characterDetails.innerHTML = `
                <h2>${selectedCharacter.name}</h2>
                <div class="character-stats">
                    ${Object.entries(selectedCharacter.stats).map(([stat, value]) => `
                        <div>
                            <strong>${stat.charAt(0).toUpperCase() + stat.slice(1)}:</strong>
                            <div class="stat-bar">
                                <div class="stat-fill" style="width: ${value * 10}%"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="character-abilities">
                    ${selectedCharacter.abilities.map(ability => `
                        <span class="ability-tag">${ability}</span>
                    `).join('')}
                </div>
            `;
            
            updateCarousel();
        }
        
        // Navigate carousel
        function navigateCarousel(direction) {
            const totalCharacters = characters ? characters.length : 0;
            if (totalCharacters === 0) return;
            
            if (direction === 'prev') {
                currentIndex = (currentIndex - 1 + totalCharacters) % totalCharacters;
            } else {
                currentIndex = (currentIndex + 1) % totalCharacters;
            }
            
            selectCharacter(currentIndex);
        }
        
        // Update carousel position
        function updateCarousel() {
            if (!characters || characters.length === 0) return;
            
            const cardWidth = 270; // Width + margins
            const offset = -currentIndex * cardWidth;
            characterCards.style.transform = `translateX(${offset}px)`;
        }
        
        // Initialize event listeners
        prevButton.addEventListener('click', () => navigateCarousel('prev'));
        nextButton.addEventListener('click', () => navigateCarousel('next'));
        
        selectButton.addEventListener('click', () => {
            if (selectedCharacter) {
                // Store selected character
                localStorage.setItem('selectedCharacter', JSON.stringify(selectedCharacter));
                // Navigate to game
                window.location.href = "{{ url_for('game') }}";
            }
        });
        
        // Initialize
        try {
            renderCharacters();
        } catch (error) {
            console.error('Error loading characters:', error);
        }
    });
</script>
{% endblock %}
END
echo "✅ Created new character_select.html template"

# Step 4: Ensure we have the game route in app.py
if ! grep -q "def game():" "app.py"; then
    echo "⚠️ Game route not found in app.py, adding it..."
    # Find a good place to add the route
    if grep -q "def character_select():" "app.py"; then
        # Add after character_select route
        sed -i '/def character_select():/,/return render_template/a \
\
    @app.route("/game")\
    def game():\
        return render_template("pages/game.html")' "app.py"
    else
        # Add at the end of the file
        echo '
@app.route("/game")
def game():
    return render_template("pages/game.html")' >> "app.py"
    fi
    echo "✅ Added game route to app.py"
fi

# Step 5: Create a basic game.html template if it doesn't exist
if [ ! -f "frontend/templates/pages/game.html" ]; then
    cat > frontend/templates/pages/game.html << 'END'
{% extends "base.html" %}

{% block title %}Medical Physics Game{% endblock %}

{% block additional_css %}
<link rel="stylesheet" href="{{ url_for('static', filename='css/main.css') }}">
<style>
    .game-container {
        padding: 20px;
        text-align: center;
    }
    
    .character-info {
        margin: 20px auto;
        padding: 20px;
        max-width: 600px;
        background: white;
        border-radius: 10px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    
    .character-image {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        margin: 0 auto 15px;
        overflow: hidden;
    }
    
    .character-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    
    .stats-container {
        display: flex;
        justify-content: space-around;
        margin: 20px 0;
    }
    
    .stat {
        text-align: center;
    }
    
    .stat-value {
        font-size: 1.5em;
        font-weight: bold;
        color: #4a90e2;
    }
</style>
{% endblock %}

{% block content %}
<div class="game-container">
    <h1>Medical Physics Game</h1>
    
    <div class="character-info" id="character-info">
        <h2>Loading character data...</h2>
    </div>
    
    <div class="game-actions">
        <button class="btn" onclick="window.location.href='{{ url_for('index') }}'">Return to Home</button>
    </div>
</div>
{% endblock %}

{% block additional_js %}
<script>
    document.addEventListener('DOMContentLoaded', function() {
        const characterInfo = document.getElementById('character-info');
        
        // Try to load the selected character
        const savedCharacter = localStorage.getItem('selectedCharacter');
        
        if (savedCharacter) {
            try {
                const character = JSON.parse(savedCharacter);
                
                characterInfo.innerHTML = `
                    <div class="character-image">
                        <img src="${character.image}" alt="${character.name}">
                    </div>
                    <h2>${character.name}</h2>
                    <p>${character.description}</p>
                    
                    <div class="stats-container">
                        ${Object.entries(character.stats).map(([stat, value]) => `
                            <div class="stat">
                                <div class="stat-name">${stat.charAt(0).toUpperCase() + stat.slice(1)}</div>
                                <div class="stat-value">${value}</div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="abilities">
                        <strong>Abilities:</strong>
                        ${character.abilities.join(', ')}
                    </div>
                `;
            } catch (error) {
                console.error('Error parsing character data:', error);
                characterInfo.innerHTML = '<p>Error loading character data. Please return to the character selection screen.</p>';
            }
        } else {
            characterInfo.innerHTML = '<p>No character selected. Please return to the character selection screen.</p>';
        }
    });
</script>
{% endblock %}
END
    echo "✅ Created basic game.html template"
fi

echo "Character selection page fixes complete!"
