# servislot 
A fullstack web based appointment booking and scheduling system for service based businesses. The system allows customers to book appointments online while enabling business owners to manage schedules, availability, and client records through an intuitive dashboard.

Objectives
•	Provide an easy-to-use booking system for clients
•	Prevent double-booking using backend validation
•	Allow service providers to manage availability and appointments
•	Implement role-based authentication (Client vs Provider)
•	Demonstrate software engineering principles including teamwork, version control, testing, and documentation

Tech Stack
= Frontend - HTML, CSS, JavaScript, React
- Backend - Python, Django, Django REST Framework
- Database - PostgreSQL
- Tools - Git & GitHub, Postman (API testing), VS Code

Installation required:
- Python
- Node.js and npm
- PostgreSQL

                                    -----------Steps-----------
1.Clone repo
-   git clone https://github.com/zilu30/project-servislot.git
-   cd servislot

2.Setting up database
-   Open psql and run the command.
-   CREATE DATABASE servislot_db;

3.Setting up backend
-   cd backend

- setting up virtual environement:
- python -m venv venv
- venv\Scripts\activate

- pip install django djangorestframework djangorestframework-simplejwt django-cars-headers psycopg2-binary python-dotenv

- Create .env file inside backend folder
- EMAIL_HOST_USER=hail.gail1530@gmail.com
- EMAIL_HOST_PASSWORD=ptkx jryn tydv zive

- Migration to create a database
- python manage.py makemigrations
- python manage.py migrate

- Start backend server:
- python manage.py runserver

4.Setting up frontend

-   In terminal:
-     cd frontend
-     npm install
-     npm start

- Frontend :http://localhost:3000
