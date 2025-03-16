# backend/data/repositories/patient_case_repo.py
import os
import json
import random
from backend.data.models.patient_case import PatientCase

class PatientCaseRepository:
    _patient_cases = None
    
    @classmethod
    def _load_patient_cases(cls):
        """Load patient cases from data file"""
        if cls._patient_cases is not None:
            return cls._patient_cases
            
        data_path = os.path.join(os.path.dirname(__file__), '../../../data/questions/patient_cases.json')
        try:
            with open(data_path, 'r') as f:
                cases_data = json.load(f)
                cls._patient_cases = [PatientCase.from_dict(case) for case in cases_data]
        except FileNotFoundError:
            cls._patient_cases = []
            
        return cls._patient_cases
        
    @classmethod
    def get_all_patient_cases(cls):
        """Get all patient cases"""
        return cls._load_patient_cases()
        
    @classmethod
    def get_patient_case_by_id(cls, case_id):
        """Get a specific patient case by ID"""
        cases = cls._load_patient_cases()
        for case in cases:
            if str(case.id) == str(case_id):
                return case
        return None
        
    @classmethod
    def get_patient_cases_by_category(cls, category):
        """Get patient cases filtered by category"""
        cases = cls._load_patient_cases()
        return [case for case in cases if case.category == category]
        
    @classmethod
    def get_patient_cases_by_difficulty(cls, difficulty):
        """Get patient cases filtered by difficulty"""
        cases = cls._load_patient_cases()
        return [case for case in cases if case.difficulty == difficulty]
        
    @classmethod
    def get_random_patient_case(cls, category=None, difficulty=None):
        """Get a random patient case, optionally filtered by category and/or difficulty"""
        cases = cls._load_patient_cases()
        
        # Apply filters
        if category:
            cases = [case for case in cases if case.category == category]
            
        if difficulty:
            cases = [case for case in cases if case.difficulty == difficulty]
            
        if not cases:
            return None
            
        return random.choice(cases)