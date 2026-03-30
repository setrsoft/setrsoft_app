from rest_framework import serializers
from .models import Gym, Wall, HoldType, HoldInstance, WallSession


class HoldTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = HoldType
        fields = ['id', 'manufacturer_ref', 'cdn_ref', 'hold_usage_type']


class HoldInstanceSerializer(serializers.ModelSerializer):
    hold_type = HoldTypeSerializer(read_only=True)

    class Meta:
        model = HoldInstance
        fields = ['id', 'name', 'usage_type', 'hold_type']


class WallSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wall
        fields = ['id', 'name']


class WallSessionSerializer(serializers.ModelSerializer):
    related_wall = WallSerializer(source='wall', read_only=True)
    holds_collection_instances = HoldInstanceSerializer(
        source='holds_collection', many=True, read_only=True
    )
    related_holds_collection = serializers.SerializerMethodField()
    gym = serializers.SerializerMethodField()

    class Meta:
        model = WallSession
        fields = [
            'id',
            'session_name',
            'related_wall',
            'related_holds_collection',
            'holds_collection_instances',
            'gym',
        ]

    def get_related_holds_collection(self, obj):
        return obj.holds_collection.exists()

    def get_gym(self, obj):
        return {'id': obj.gym_id}
