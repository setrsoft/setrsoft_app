from django.urls import path
from . import views

urlpatterns = [
    path('wallsession/update/<int:session_id>/', views.update_wall_session),
    path('wallsession/<int:wall_id>/', views.wall_session),
    path('getwallsessionlayout/<int:session_id>/', views.get_wall_session_layout),
    path('setwallsessionname/<int:session_id>/', views.set_wall_session_name),
    path('getwallfile/<int:wall_id>/', views.get_wall_file),
    path('getholdfile/hold/<int:hold_type_id>/', views.get_hold_file),
    path('stock-explore/<int:gym_id>/', views.stock_explore),
    path(
        'changeholdtosessioncollection/<int:session_id>/<int:flag>/<int:hold_id>/',
        views.change_hold_to_session_collection,
    ),
]
