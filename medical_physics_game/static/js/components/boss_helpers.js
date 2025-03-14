// boss_helpers.js - Utility functions for the boss component

const BossHelpers = {
  // Get boss data from node data or create default
  getBossData: function(nodeData) {
    if (!nodeData) return this.getDefaultBossData();
    
    // If node has a question but no specific boss data, adapt the question
    if (nodeData.question && !nodeData.boss) {
      return {
        title: nodeData.title || 'ABR Part 1 Examination',
        description: nodeData.description || 'Prove your knowledge of medical physics principles.',
        phases: [{
          title: 'Core Knowledge Assessment',
          questions: [nodeData.question]
        }]
      };
    }
    
    // If node has boss data, use it
    if (nodeData.boss) {
      return nodeData.boss;
    }
    
    // Default boss data with multiple phases
    return this.getDefaultBossData();
  },
  
  // Define default boss data
  getDefaultBossData: function() {
    return {
      title: 'Quantum Professor\'s ABR Part 1 Challenge',
      description: 'Face the Quantum Professor in a multidimensional examination of medical physics knowledge.',
      phases: [
        {
          title: 'Radiation Physics Fundamentals',
          description: 'Demonstrate understanding of basic radiation physics principles.',
          questions: [
            {
              text: 'Which interaction is most important for photoelectric effect?',
              options: [
                'Low-energy photons with high-Z materials',
                'High-energy photons with low-Z materials',
                'Mid-energy photons with any material',
                'Charged particles with any material'
              ],
              correct: 0,
              explanation: 'The photoelectric effect is dominant for low-energy photons interacting with high-Z materials, where the photon is completely absorbed and an electron is ejected.'
            }
          ]
        },
        {
          title: 'Quantum Mechanics Principles',
          description: 'Explore the quantum nature of radiation physics.',
          questions: [
            {
              text: 'What phenomenon best demonstrates the wave-particle duality of radiation?',
              options: [
                'Compton scattering',
                'Pair production',
                'Double-slit experiment',
                'Auger cascade'
              ],
              correct: 2,
              explanation: 'The double-slit experiment demonstrates the wave-particle duality of particles, including photons, showing interference patterns even with single particles.'
            }
          ]
        },
        {
          title: 'Dosimetry Under Pressure',
          description: 'Calculate dosimetric quantities under time pressure.',
          questions: [
            {
              text: 'A beam of 6 MV photons delivers 2 Gy at dmax. What is the approximate dose at 10 cm depth in water (assuming μ = 0.03 cm^-1)?',
              options: [
                '1.48 Gy',
                '0.74 Gy',
                '1.00 Gy',
                '0.37 Gy'
              ],
              correct: 1,
              explanation: 'Using exponential attenuation D = D₀e^(-μx), we get D = 2Gy × e^(-0.03 × 10) = 2Gy × 0.37 = 0.74 Gy'
            }
          ]
        }
      ]
    };
  },
  
  // Get exam phases from boss data
  getExamPhases: function(bossData) {
    return bossData && bossData.phases ? bossData.phases : [];
  },

  // Get professor dialogue based on phase and state
  getProfessorDialogue: function(phaseIndex, phaseComplete, professorState, distortion) {
    // Base dialogues for different states
    const dialogues = {
      normal: [
        "Welcome to your ABR Part 1 examination. Let's assess your knowledge of medical physics.",
        "Good. Now let's test your understanding of quantum principles in medical physics.",
        "Excellent progress. This section will test your ability to perform calculations under pressure."
      ],
      quantum: [
        "Welcome to your examination... *flickers* ...I seem to exist in multiple states simultaneously.",
        "Quantum mechanics is... *shifts* ...both fascinating and troubling. Shall we continue?",
        "In this universe—or perhaps another—we must test your calculations. *phases in and out*"
      ],
      cosmic: [
        "W̷E̴L̵C̶O̸M̷E̵ ̶T̷O̸ ̵T̸H̸E̵ ̷E̸X̵A̸M̴ ̷T̸H̵A̸T̵ ̸E̵X̶I̶S̶T̸S̸ ̴B̵E̵Y̵O̸N̸D̴ ̷S̵P̸A̶C̸E̸T̷I̵M̵E̸",
        "Quantum physics is but a glimpse into the abyss that stares back at all of us.",
        "Your calculations are meaningless in the grand entropy of the universe, yet we persist."
      ]
    };
    
    // Completion dialogues
    const completionDialogues = {
      normal: [
        "You've completed this section. Let's proceed to the next challenge.",
        "Section complete. You're making good progress.",
        "Well done. You've demonstrated adequate knowledge for this section."
      ],
      quantum: [
        "This section exists in a state of both completion and incompletion... fascinating.",
        "You've temporarily resolved the quantum uncertainty of this section.",
        "Your knowledge exists in superposition, yet somehow you progress..."
      ],
      cosmic: [
        "T̵H̵E̶ ̸B̶O̷U̵N̵D̴A̵R̷I̸E̵S̸ ̵B̵E̶T̶W̶E̵E̴N̸ ̷S̷E̸C̸T̵I̷O̵N̸S̸ ̵A̵R̸E̶ ̶I̴L̸L̸U̷S̶O̸R̶Y̷",
        "The cosmos laughs at our arbitrary delineations of knowledge.",
        "You progress through the exam as all things progress toward entropy."
      ]
    };
    
    // Get appropriate dialogue
    let dialogue;
    if (phaseComplete) {
      dialogue = completionDialogues[professorState][Math.min(phaseIndex, completionDialogues[professorState].length - 1)];
    } else {
      dialogue = dialogues[professorState][Math.min(phaseIndex, dialogues[professorState].length - 1)];
    }
    
    // Add cosmic distortions at high levels
    if (distortion > 60) {
      dialogue = dialogue.split(' ').map(word => 
        Math.random() < 0.2 ? this.distortText(word, Math.min(3, Math.floor(distortion / 30))) : word
      ).join(' ');
    }
    
    return dialogue;
  },
  
  // Distort text for cosmic effects
  distortText: function(text, zalgoLevel) {
    if (zalgoLevel === 0) return text;
    
    const zalgoMarks = [
      '\u0300', '\u0301', '\u0302', '\u0303', '\u0304', '\u0305', '\u0306', '\u0307', '\u0308', '\u0309',
      '\u030A', '\u030B', '\u030C', '\u030D', '\u030E', '\u030F', '\u0310', '\u0311', '\u0312', '\u0313',
      '\u0314', '\u0315', '\u0316', '\u0317', '\u0318', '\u0319', '\u031A', '\u031B', '\u031C', '\u031D',
      '\u031E', '\u031F', '\u0320', '\u0321', '\u0322', '\u0323', '\u0324', '\u0325', '\u0326', '\u0327'
    ];
    
    return text.split('').map(char => {
      let distorted = char;
      // Add zalgo marks
      for (let i = 0; i < zalgoLevel; i++) {
        if (Math.random() < 0.7) {
          distorted += zalgoMarks[Math.floor(Math.random() * zalgoMarks.length)];
        }
      }
      return distorted;
    }).join('');
  },
  
  // Format time remaining
  formatTime: function(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },

  // Get score text based on percentage
  getScoreText: function(percentage) {
    if (percentage >= 90) return "Excellent";
    if (percentage >= 80) return "Very Good";
    if (percentage >= 70) return "Good";
    if (percentage >= 60) return "Satisfactory";
    if (percentage >= 50) return "Borderline";
    return "Needs Improvement";
  },
  
  // Get final verdict text
  getFinalVerdict: function(percentage, distortion) {
    // Base verdicts
    const baseVerdicts = {
      high: "You have demonstrated exceptional understanding of medical physics principles.",
      pass: "You have demonstrated sufficient competency in medical physics.",
      fail: "You have not demonstrated sufficient competency at this time."
    };
    
    // Cosmic verdicts
    const cosmicVerdicts = {
      high: "Your understanding transcends conventional medical physics, bordering on the cosmic.",
      pass: "You comprehend enough to glimpse the true quantum nature of reality.",
      fail: "The quantum nature of reality eludes you, but you perceive more than most."
    };
    
    // Choose base or cosmic based on distortion
    const verdicts = distortion > 70 ? cosmicVerdicts : baseVerdicts;
    
    // Return appropriate verdict
    if (percentage >= 85) return verdicts.high;
    if (percentage >= 70) return verdicts.pass;
    return verdicts.fail;
  },
  
  // Determine item effect during exam
  getItemEffectForExam: function(item) {
    if (!item || !item.effect) return "You used an item with no effect";
    
    switch (item.effect.type) {
      case 'insight_boost':
        return `The ${item.name} calms your mind. +10% Confidence!`;
        
      case 'restore_life':
        return `The ${item.name} bends time. +15 seconds added!`;
        
      default:
        return `The ${item.name} distorts the fabric of the exam reality.`;
    }
  }
};

// Export globally
window.BossHelpers = BossHelpers;