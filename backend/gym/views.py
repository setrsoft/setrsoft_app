from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Gym, Wall, HoldType, HoldInstance, WallSession
from .serializers import WallSessionSerializer, HoldInstanceSerializer


@api_view(['GET'])
def wall_session(request, wall_id):
    session = get_object_or_404(WallSession, wall__id=wall_id)
    return Response(WallSessionSerializer(session).data)


@api_view(['GET'])
def get_wall_session_layout(request, session_id):
    session = get_object_or_404(WallSession, id=session_id)
    return Response({'layout': session.layout})


@api_view(['PUT'])
def update_wall_session(request, session_id):
    session = get_object_or_404(WallSession, id=session_id)
    session.layout = request.data.get('layout', '')
    session.save(update_fields=['layout'])
    return Response({'status': 'ok'})


@api_view(['POST'])
def set_wall_session_name(request, session_id):
    session = get_object_or_404(WallSession, id=session_id)
    session.session_name = request.data.get('session_name', '')
    session.save(update_fields=['session_name'])
    return Response({'status': 'ok'})


@api_view(['GET'])
def get_wall_file(request, wall_id):
    wall = get_object_or_404(Wall, id=wall_id)
    if not wall.glb_file:
        raise Http404
    return FileResponse(wall.glb_file.open('rb'), content_type='model/gltf-binary')


@api_view(['GET'])
def get_hold_file(request, hold_type_id):
    hold_type = get_object_or_404(HoldType, id=hold_type_id)
    if not hold_type.glb_file:
        raise Http404
    return FileResponse(hold_type.glb_file.open('rb'), content_type='model/gltf-binary')


@api_view(['GET'])
def stock_explore(request, gym_id):
    get_object_or_404(Gym, id=gym_id)

    page = max(1, int(request.query_params.get('page', 1)))
    page_size = min(200, max(1, int(request.query_params.get('page_size', 20))))

    holds = HoldInstance.objects.filter(gym_id=gym_id).select_related('hold_type')
    count = holds.count()
    start = (page - 1) * page_size
    page_holds = holds[start:start + page_size]

    return Response({'count': count, 'holds': HoldInstanceSerializer(page_holds, many=True).data})


@api_view(['GET'])
def change_hold_to_session_collection(request, session_id, flag, hold_id):
    session = get_object_or_404(WallSession, id=session_id)
    hold = get_object_or_404(HoldInstance, id=hold_id)

    if flag == 1:
        session.holds_collection.add(hold)
    else:
        session.holds_collection.remove(hold)

    return Response({'status': 'ok'})
