from django.http import HttpResponse

def create_booking(request):
    return HttpResponse("<h1>Success!</h1><p>The booking view is working.</p>")

def home_page(request):
    return HttpResponse("Booking Page successfull!!!")