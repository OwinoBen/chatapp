from django.urls import path
from . import views

app_name = 'chat'

urlpatterns = [
    path('api/create-room/<str:room_id>/', views.create_room, name='create-room'),
    path('chat-admin/', views.admin, name='admin'),
    path('chat-admin/add-user/', views.add_user, name='add_user'),
    path('chat-admin/users/<uuid:user_id>/', views.user_detail, name='user_details'),
    path('chat-admin/users/<uuid:user_id>/edit/', views.edit_user, name='edit_user'),
    path('chat-admin/<str:room_id>/', views.room, name='room'),
    path('chat-admin/<str:room_id>/delete/', views.delete_room, name='delete_room'),
]
