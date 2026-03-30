from django.contrib import admin
from .models import Gym, Wall, HoldType, HoldInstance, WallSession

admin.site.register(Gym)
admin.site.register(Wall)
admin.site.register(HoldType)
admin.site.register(HoldInstance)
admin.site.register(WallSession)
