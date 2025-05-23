# Gazprom Request App
A web application for managing candidate resumes and interviews.

## Installation
1. Clone the repository: `git clone <repo-url>`
2. Backend:
   - `cd backend`
   - Install dependencies: `pip install -r requirements.txt`
   - Set up `.env` file (see `.env.example`)
   - Run migrations: `python manage.py migrate`
   - Start server: `python manage.py runserver`
3. Frontend:
   - `cd frontend`
   - Install dependencies: `npm install`
   - Start app: `npm start`

## API Endpoints
- POST `/api/token/`: Obtain JWT token
- GET `/api/candidates/`: List candidates
- GET `/api/resumes/`: List resumes