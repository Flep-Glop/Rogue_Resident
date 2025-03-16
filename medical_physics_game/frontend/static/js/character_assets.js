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
