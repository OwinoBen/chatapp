from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.contrib import messages
from django.contrib.auth.models import Group
from django.shortcuts import render, redirect
from django.views.decorators.http import require_POST

from account.forms import AddUserForm, EditUserForm
from account.models import User
from .models import Room


@require_POST
def create_room(request, room_id):
    name = request.POST.get('name', '')
    url = request.POST.get('url', '')

    Room.objects.create(room_id=room_id, client=name, url=url)

    return JsonResponse({'message': 'Room created'})


@login_required
def admin(request):
    rooms = Room.objects.all()
    users = User.objects.filter(is_staff=True)

    return render(request, 'chat/admin.html', {
        'rooms': rooms,
        'users': users
    })


@login_required
def room(request, room_id):
    room_info = Room.objects.get(room_id=room_id)

    # Activate the room whe the agent clicks on it to view room details
    if room_info.status == Room.WAITING:
        room_info.status = Room.ACTIVE
        room_info.agent = request.user
        room_info.save()

    return render(request, 'chat/room.html', {
        'room': room_info,

    })


@login_required
def delete_room(request, room_id):
    if request.user.has_perm('room.delete_room'):
        room_info = Room.objects.get(room_id=room_id)
        room_info.delete()
        messages.success(request, f'Room {room_info.room_id} was deleted!')
        return redirect('/chat-admin/')
    else:
        messages.error(request, 'You don\'t have access to delete rooms!')
        return redirect('/chat-admin/')


@login_required
def user_detail(request, user_id):
    user = User.objects.get(pk=user_id)
    rooms = user.rooms.all()

    return render(request, 'chat/user_details.html', {
        'user': user,
        'rooms': rooms
    })


@login_required
def edit_user(request, user_id):
    if request.user.has_perm('user.edit_user'):
        user = User.objects.get(pk=user_id)

        if request.method == 'POST':
            form = EditUserForm(request.POST, instance=user)

            if form.is_valid():
                form.save()

                messages.success(request, f'{user.name} was updated!')
                return redirect('/chat-admin/')
        else:
            form = EditUserForm(instance=user)  # use instance to prefill the form fields with user details

        return render(request, 'chat/edit_user.html', {
            'user': user,
            'form': form
        })
    else:
        messages.error(request, 'You don\'t have access to edit users!')
        return redirect('/chat-admin/')


@login_required
def add_user(request):
    if request.user.has_perm('user.add_user'):
        if request.method == 'POST':
            form = AddUserForm(request.POST)
            if form.is_valid():
                user = form.save(commit=False)  # create user object but not saving in the db
                user.is_staff = True
                user.set_password(request.POST.get('password'))
                user.save()  # now save the user to the database

                if user.role == User.MANAGER:
                    group = Group.objects.get(name='Managers')
                    group.user_set.add(user)
                else:
                    group = Group.objects.get(name='Agent')
                    group.user_set.add(user)

                messages.success(request, f'{user.name} was add in the database!')
                return redirect('/chat-admin/')

        else:
            form = AddUserForm()

        return render(request, 'chat/add_user.html', {
            'form': form
        })
    else:
        messages.error(request, 'You don\'t have access to add users!')
        return redirect('/chat-admin/')
