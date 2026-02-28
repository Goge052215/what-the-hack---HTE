import json
import os
import urllib.error
import urllib.request

DEFAULT_BASE_URL = os.getenv("FOCUS_TUTOR_API_BASE_URL", "https://api.focus-tutor.app")


def _parse_json(raw):
    if not raw:
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None


def api_request(path, method="GET", body=None, base_url=None, timeout=10):
    base = (base_url or DEFAULT_BASE_URL).rstrip("/")
    url = f"{base}{path}"
    data = json.dumps(body).encode("utf-8") if body is not None else None
    request = urllib.request.Request(url, data=data, method=method)
    request.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            raw = response.read().decode("utf-8")
            payload = _parse_json(raw)
            if payload is None:
                return {"ok": False, "status": response.status, "error": "invalid_response"}
            if isinstance(payload, dict):
                return {
                    "ok": response.status < 400 and payload.get("ok", True),
                    "status": response.status,
                    **payload,
                }
            return {"ok": response.status < 400, "status": response.status, "data": payload}
    except urllib.error.HTTPError as error:
        raw = error.read().decode("utf-8") if error.fp else ""
        payload = _parse_json(raw)
        return {
            "ok": False,
            "status": error.code,
            "error": "http_error",
            "data": payload,
        }
    except Exception:
        return {"ok": False, "status": 0, "error": "network_error"}


def health(base_url=None):
    return api_request("/health", method="GET", base_url=base_url)


def create_task(title, base_url=None):
    return api_request("/api/tasks", method="POST", body={"title": title}, base_url=base_url)


def schedule_suggestions(description, task_type="task", deadline=None, base_url=None):
    return api_request(
        "/api/analyze/schedule-suggestions",
        method="POST",
        body={"task": {"description": description, "type": task_type, "deadline": deadline}},
        base_url=base_url,
    )


def analyze_focus(page_data, task_name, base_url=None):
    return api_request(
        "/api/analyze/focus",
        method="POST",
        body={"pageData": page_data, "task": task_name},
        base_url=base_url,
    )
