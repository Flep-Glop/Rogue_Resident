# backend/core/event_system.py
from datetime import datetime

class EventSystem:
    def __init__(self, game_state):
        self.game_state = game_state
        self.event_queue = []
        self.event_history = []
        
    def queue_event(self, event_type, data=None):
        """Add an event to the queue"""
        event = {
            'type': event_type,
            'data': data or {},
            'timestamp': self._get_timestamp()
        }
        self.event_queue.append(event)
        
    def process_events(self):
        """Process all queued events"""
        while self.event_queue:
            event = self.event_queue.pop(0)
            self._process_event(event)
            self.event_history.append(event)
            
    def _process_event(self, event):
        """Process a single event"""
        event_type = event['type']
        data = event['data']
        
        if event_type == 'combat_started':
            # Initialize combat
            from backend.core.combat_system import CombatSystem
            enemy = data.get('enemy')
            character = self.game_state['character']
            combat_system = CombatSystem(character, enemy)
            self.game_state['combat'] = combat_system.start_combat()
            
        elif event_type == 'question_answered':
            correct = data.get('correct', False)
            question = data.get('question')
            
            if correct:
                # Award points for correct answer
                self.game_state['character']['skill_points'] += 1
                self.game_state['reputation'] += 2
                self.queue_event('message', {
                    'text': f"Correct! You've earned a skill point and 2 reputation."
                })
            else:
                # Penalty for incorrect answer
                self.game_state['character']['current_hp'] -= 10
                self.game_state['reputation'] -= 1
                self.queue_event('message', {
                    'text': f"Incorrect. You've lost 10 HP and 1 reputation."
                })
                
                # Check if character died
                if self.game_state['character']['current_hp'] <= 0:
                    self.queue_event('game_over', {'victory': False})
                    
        elif event_type == 'item_used':
            item = data.get('item')
            target = data.get('target')
            
            # Apply item effects
            if item.get('effect_type') == 'heal':
                amount = item.get('effect_value', 0)
                self.game_state['character']['current_hp'] = min(
                    self.game_state['character']['max_hp'],
                    self.game_state['character']['current_hp'] + amount
                )
                self.queue_event('message', {
                    'text': f"You used {item['name']} and recovered {amount} HP."
                })
                
            # Remove item from inventory
            self.game_state['inventory'] = [
                i for i in self.game_state['inventory'] 
                if i['id'] != item['id']
            ]
            
        elif event_type == 'game_over':
            self.game_state['game_over'] = True
            self.game_state['victory'] = data.get('victory', False)
            
            if data.get('victory', False):
                self.queue_event('message', {
                    'text': "Congratulations! You've completed your residency!"
                })
            else:
                self.queue_event('message', {
                    'text': "Game Over. Your residency has been terminated."
                })
                
    def _get_timestamp(self):
        """Get current timestamp"""
        return datetime.now().isoformat()