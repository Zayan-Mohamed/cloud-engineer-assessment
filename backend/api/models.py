from django.db import models

class Task(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    file_attachment = models.FileField(upload_to='uploads/', blank=True, null=True)

    def __str__(self):
        return self.title
