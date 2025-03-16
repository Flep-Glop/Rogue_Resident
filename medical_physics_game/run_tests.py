import unittest
import sys
import os

def run_tests():
    """Run all tests in the project"""
    # Discover and run tests
    loader = unittest.TestLoader()
    tests = loader.discover('tests')
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(tests)
    
    return result.wasSuccessful()
    
if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)
