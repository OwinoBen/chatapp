from django.db import models

from account.models import User


class Message(models.Model):
    body = models.TextField()
    sent_by = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, blank=True, null=True, on_delete=models.SET_NULL)

    class Meta:
        ordering = ('created_at',)

    def __str__(self):
        return f'{self.sent_by}'


class Room(models.Model):
    ACTIVE = 'active'
    WAITING = 'waiting'
    CLOSED = 'closed'
    CHOICES = (
        (WAITING, 'Waiting'),
        (ACTIVE, 'Active'),
        (CLOSED, 'Closed')
    )
    room_id = models.CharField(max_length=255)
    client = models.CharField(max_length=255)  # user requesting to join the room from the frontend
    # agent accepts the client room and talk to the client
    agent = models.ForeignKey(User, related_name='rooms', blank=True, null=True, on_delete=models.SET_NULL)
    messages = models.ManyToManyField(Message, blank=True)
    url = models.CharField(max_length=255, blank=True, null=True)  # to identify the clients current page
    status = models.CharField(max_length=25, choices=CHOICES, default='waiting')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return f'{self.client} - {self.room_id}'
