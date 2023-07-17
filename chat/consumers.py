import json
from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.utils.timesince import timesince

from account.models import User
from .templatetags.chatextras import initials
from .models import Message, Room


class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'
        self.user = self.scope['user']

        # join group channel
        await self.get_room()
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        # inform user when one is typing
        if self.user.is_staff:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'update_user',  # this is the method to handle the update logic

                }
            )

    async def disconnect(self, close_code):
        # leave room
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        if not self.user.is_staff:
            await self.set_room_closed()

    async def receive(self, text_data=None, bytes_data=None):
        # receive message from a websocket (frontend)
        text_data_json = json.loads(text_data)
        type_ = text_data_json['type']
        message = text_data_json['message']
        name = text_data_json['name']
        agent = text_data_json.get('agent', '')

        print('Receive', type_)

        if type_ == 'message':
            new_message = await self.create_message(name, message, agent)
            # send message to group/room
            await self.channel_layer.group_send(
                self.room_group_name, {
                    'type': 'chat_message',
                    'message': message,
                    'name': name,
                    'agent': agent,
                    'initials': initials(name),
                    'created_at': timesince(new_message.created_at)
                }
            )
        elif type_ == 'update':
            # send update to the room
            print('is update')
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'writing_active',
                    'message': message,
                    'name': name,
                    'agent': agent,
                    'initials': initials(name),
                }

            )

    async def chat_message(self, event):
        # Send message to websocket (frontend)

        # get values from group_send
        await self.send(text_data=json.dumps({
            'type': event['type'],
            'message': event['message'],
            'name': event['name'],
            'agent': event['agent'],
            'initials': event['initials'],
            'created_at': event['created_at'],
        }
        ))

    async def writing_active(self, event):
        # send user typing message to the room members
        await self.send(text_data=json.dumps({
            'type': event['type'],
            'message': event['message'],
            'name': event['name'],
            'agent': event['agent'],
            'initials': event['initials'],
        }))

    async def update_user(self, event):
        # send information to the websocket frontend
        await self.send(text_data=json.dumps({
            'type': 'users_update',  # will be sent to frontend telling the other user has joined the room
        }))

    # USE sync_to_async when talking to the database
    @sync_to_async
    def get_room(self):
        self.room = Room.objects.get(room_id=self.room_name)

    @sync_to_async
    def set_room_closed(self):
        self.room = Room.objects.get(room_id=self.room_name)
        self.room.status = Room.CLOSED
        self.room.save()

    @sync_to_async
    def create_message(self, sent_by, message, agent):
        message = Message.objects.create(body=message, sent_by=sent_by)

        if agent:
            message.created_by = User.objects.get(pk=agent)
            message.save()

        self.room.messages.add(message)

        return message
