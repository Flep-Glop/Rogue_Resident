/**
 * Skill Tree Integration Testing Strategy
 * 
 * This file outlines the process for testing the integration of the new
 * API client and error handler with the rest of the skill tree system.
 */

/**
 * PHASE 1: Basic Loading Test
 * 
 * First, ensure the new modules load correctly without errors.
 */
function testModuleLoading() {
  console.group('Phase 1: Module Loading Test');
  
  // Test ErrorHandler loading
  try {
    console.log('ErrorHandler available:', !!window.ErrorHandler);
    console.log('ErrorHandler severity levels:', Object.keys(window.ErrorHandler.SEVERITY).join(', '));
    console.log('ErrorHandler initialized:', window.ErrorHandler.initialize !== undefined);
    console.log('ErrorHandler passed basic loading test ✓');
  } catch (error) {
    console.error('ErrorHandler loading failed:', error);
  }
  
  // Test ApiClient loading
  try {
    console.log('ApiClient available:', !!window.ApiClient);
    console.log('ApiClient has skill methods:', 
      window.ApiClient.loadSkillTree !== undefined && 
      window.ApiClient.saveSkillProgress !== undefined
    );
    console.log('ApiClient passed basic loading test ✓');
  } catch (error) {
    console.error('ApiClient loading failed:', error);
  }
  
  console.groupEnd();
}

/**
 * PHASE 2: Error Handler Integration Test
 * 
 * Test error handling with a controlled error scenario
 */
function testErrorHandling() {
  console.group('Phase 2: Error Handler Integration Test');
  
  // Test basic error handling
  try {
    // Create test error
    const testError = new Error('This is a test error');
    
    // Handle with error handler
    const errorId = window.ErrorHandler.handleError(
      testError,
      'Integration Test',
      window.ErrorHandler.SEVERITY.WARNING
    );
    
    console.log('Error handler processed test error with ID:', errorId);
    console.log('Error handler stats:', window.ErrorHandler.getStats());
    console.log('ErrorHandler passed basic error test ✓');
  } catch (error) {
    console.error('Error handler test failed:', error);
  }
  
  // Test retry mechanism
  try {
    let attempts = 0;
    const operation = async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Simulated failure for retry test');
      }
      return 'Success on attempt ' + attempts;
    };
    
    window.ErrorHandler.withRetry(operation, 3, 100)
      .then(result => {
        console.log('Retry mechanism result:', result);
        console.log('Retry mechanism passed test ✓');
      })
      .catch(error => {
        console.error('Retry mechanism test failed:', error);
      });
  } catch (error) {
    console.error('Error in retry test setup:', error);
  }
  
  console.groupEnd();
}

/**
 * PHASE 3: API Client Integration Test
 * 
 * Test API client with skill tree data loading
 */
function testApiClient() {
  console.group('Phase 3: API Client Integration Test');
  
  // Test skill tree data loading
  window.ApiClient.loadSkillTree()
    .then(data => {
      console.log('Skill tree data loaded successfully:', 
        data ? `${Object.keys(data).join(', ')}` : 'No data'
      );
      console.log('ApiClient skill tree loading passed test ✓');
    })
    .catch(error => {
      console.error('Skill tree loading failed:', error);
    });
  
  // Test skill progress loading
  window.ApiClient.loadSkillProgress()
    .then(data => {
      console.log('Skill progress loaded:', 
        data ? `Reputation: ${data.reputation}, Unlocked: ${data.unlocked_skills?.length || 0}` : 'No data'
      );
      console.log('ApiClient skill progress loading passed test ✓');
    })
    .catch(error => {
      console.error('Skill progress loading failed:', error);
    });
  
  console.groupEnd();
}

/**
 * PHASE 4: Full Skill Tree Integration Test
 * 
 * Test complete skill tree loading and interaction
 */
function testSkillTreeIntegration() {
  console.group('Phase 4: Full Skill Tree Integration Test');
  
  // Only run if SkillTreeManager exists
  if (!window.SkillTreeManager) {
    console.warn('SkillTreeManager not available, skipping full integration test');
    console.groupEnd();
    return;
  }
  
  // Check if already initialized
  if (window.SkillTreeManager.initialized) {
    console.log('SkillTreeManager already initialized, checking state...');
    logSkillTreeState();
  } else {
    console.log('Initializing SkillTreeManager...');
    
    // Initialize skill tree manager
    window.SkillTreeManager.initialize()
      .then(() => {
        console.log('SkillTreeManager initialized successfully ✓');
        logSkillTreeState();
      })
      .catch(error => {
        console.error('SkillTreeManager initialization failed:', error);
      });
  }
  
  function logSkillTreeState() {
    console.log('Active skills:', window.SkillTreeManager.activeSkills.length);
    console.log('Unlocked skills:', window.SkillTreeManager.unlockedSkills.length);
    console.log('Reputation:', window.SkillTreeManager.reputation);
    console.log('Skill points:', window.SkillTreeManager.skillPointsAvailable);
    console.log('Full integration test passed ✓');
    console.groupEnd();
  }
}

/**
 * Run all tests in sequence
 */
function runAllTests() {
  console.log('Starting Skill Tree Integration Tests...');
  
  // Add a small delay between tests for better console readability
  testModuleLoading();
  
  setTimeout(() => {
    testErrorHandling();
    
    setTimeout(() => {
      testApiClient();
      
      setTimeout(() => {
        testSkillTreeIntegration();
        
        console.log('All integration tests completed.');
      }, 1000);
    }, 1000);
  }, 1000);
}

// Run tests when page is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Wait for other scripts to initialize
  setTimeout(() => {
    runAllTests();
  }, 2000);
});

// Expose test functions for manual testing
window.testSkillTreeIntegration = {
  runAllTests,
  testModuleLoading,
  testErrorHandling,
  testApiClient,
  testSkillTreeIntegration
};
