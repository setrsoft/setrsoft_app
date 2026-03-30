from django.db import models


class Gym(models.Model):
    name = models.CharField(max_length=200)

    def __str__(self):
        return self.name


class Wall(models.Model):
    gym = models.ForeignKey(Gym, on_delete=models.CASCADE, related_name='walls')
    name = models.CharField(max_length=200)
    glb_file = models.FileField(upload_to='walls/')

    def __str__(self):
        return f"{self.gym.name} — {self.name}"


class HoldType(models.Model):
    USAGE_CHOICES = [('hold', 'Hold'), ('volume', 'Volume')]

    manufacturer_ref = models.CharField(max_length=200)
    cdn_ref = models.CharField(max_length=500)
    hold_usage_type = models.CharField(max_length=20, choices=USAGE_CHOICES, default='hold')
    glb_file = models.FileField(upload_to='holds/', blank=True)

    def __str__(self):
        return self.manufacturer_ref


class HoldInstance(models.Model):
    USAGE_CHOICES = [('hold', 'Hold'), ('volume', 'Volume')]

    gym = models.ForeignKey(Gym, on_delete=models.CASCADE, related_name='hold_instances')
    hold_type = models.ForeignKey(HoldType, on_delete=models.CASCADE, related_name='instances')
    name = models.CharField(max_length=200)
    usage_type = models.CharField(max_length=20, choices=USAGE_CHOICES, default='hold')

    def __str__(self):
        return f"{self.gym.name} — {self.name}"


class WallSession(models.Model):
    wall = models.ForeignKey(Wall, on_delete=models.CASCADE, related_name='sessions')
    gym = models.ForeignKey(Gym, on_delete=models.CASCADE, related_name='sessions')
    session_name = models.CharField(max_length=200)
    layout = models.TextField(blank=True)
    holds_collection = models.ManyToManyField(HoldInstance, blank=True, related_name='sessions')

    def __str__(self):
        return f"{self.wall.name} — {self.session_name}"
