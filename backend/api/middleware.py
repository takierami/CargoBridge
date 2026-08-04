"""Capture client IP / user-agent for activity metadata."""

from .activity import clear_request_activity_meta, set_request_activity_meta


def _client_ip(request) -> str:
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR', '')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '') or ''


class ActivityRequestMetaMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        set_request_activity_meta(
            ip=_client_ip(request),
            user_agent=(request.META.get('HTTP_USER_AGENT') or '')[:512],
            request_id=request.META.get('HTTP_X_REQUEST_ID', '') or '',
        )
        try:
            return self.get_response(request)
        finally:
            clear_request_activity_meta()
