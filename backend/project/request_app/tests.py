from django.test import TestCase
from .models import User, Candidate

class CandidateModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create(username='testuser', email='test@example.com')
        self.candidate = Candidate.objects.create(user=self.user, phone_number='1234567890')

    def test_candidate_str(self):
        self.assertEqual(str(self.candidate), 'testuser')