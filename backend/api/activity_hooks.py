"""
Future extension hooks for activity history (undo, notifications, scheduled exports).

These are intentional stubs so integrations can attach without changing the core writer.
"""

from typing import Callable

_undo_handlers: dict[str, Callable] = {}
_notification_hooks: list[Callable] = []


def register_undo_handler(action: str, handler: Callable) -> None:
    """Register a compensating-action builder for a given activity action."""
    _undo_handlers[action] = handler


def register_activity_notification_hook(hook: Callable) -> None:
    """Called after record_activity commits (future)."""
    _notification_hooks.append(hook)


def get_undo_handler(action: str) -> Callable | None:
    return _undo_handlers.get(action)
