import base64

from chartkick.flask import BarChart, PieChart
from quart import Quart, jsonify, render_template, request

from citadel import logger
from citadel.db import CitadelDatabaseApi
from citadel.enums import MONGO_COLLECTIONS
from citadel.models.Bytes import Bytes
from citadel.models.Task import TASK_STATUS

app = Quart(__name__)

db_api = CitadelDatabaseApi()

COLOUR_PALLETE = ["#FF5A5F", "#00A699", "#FC642D", "#007A87", "#FFB400"]


@app.route("/", methods=["GET"])
async def index():
    """
    Endpoint to check if the API is up.
    Returns a JSON response.
    """

    tasks = await db_api.get_all_objects(MONGO_COLLECTIONS.TASKS)

    threat_names_data = {}
    detection_data = {
        "detected": 0,
        "not_detected": 0,
    }

    for t in tasks:
        for threat in t.threat_names:
            if threat in threat_names_data:
                if not threat:
                    continue
                threat_names_data[threat] += 1
            else:
                threat_names_data[threat] = 1

        if t.defender_result == "DEFENDER_RESULT_NOT_DETECTED":
            detection_data["not_detected"] += 1
        else:
            detection_data["detected"] += 1

    threat_names_chart = PieChart(
        threat_names_data, colors=COLOUR_PALLETE, download=True
    )

    defender_chart = BarChart(detection_data, colors=COLOUR_PALLETE, download=True)

    return await render_template(
        "index.html",
        tasks=tasks,
        threat_names_chart=threat_names_chart,
        defender_chart=defender_chart,
    )


@app.route("/tasks/summary/<uuid>", methods=["GET"])
async def get_task_summary(uuid: str):
    """
    a render html endpoint which renders summary.html given the uuid
    """

    task = await db_api.get_object_by_uuid(uuid, MONGO_COLLECTIONS.TASKS)

    if not task:
        return await render_template("summary.html", task=None)

    payload = await db_api.get_payload_by_sha256(task.file_sha256)

    function_mapping_count = {}

    imports_count = {}

    entropy_values = {
        "0_x": task.zero_x_malicious_bytes.entropy,
        "x_y": task.x_y_malicious_bytes.entropy,
    }

    if payload:
        entropy_values["file"] = payload.entropy

        for i in payload.imports:
            dll = i.libname.upper()

            if dll in imports_count:
                imports_count[dll] += 1
            else:
                imports_count[dll] = 1

    if task.thorough_malicious_bytes:
        for idx, b in enumerate(task.thorough_malicious_bytes):
            entropy_values[f"thorough_{idx}"] = b.entropy

    if task.function_mappings:
        for fm in task.function_mappings:
            if fm.category in function_mapping_count:
                function_mapping_count[fm.category] += 1
            else:
                function_mapping_count[fm.category] = 1

    function_mapping_chart = PieChart(
        function_mapping_count, colors=COLOUR_PALLETE, download=True
    )

    imports_count = dict(
        sorted(imports_count.items(), key=lambda item: item[1], reverse=True)
    )

    entropy_chart = BarChart(entropy_values, colors=COLOUR_PALLETE, download=True)

    imports_chart = BarChart(imports_count, colors=COLOUR_PALLETE, download=True)

    return await render_template(
        "summary.html",
        task=task,
        payload=payload,
        function_mapping_chart=function_mapping_chart,
        entropy_chart=entropy_chart,
        imports_chart=imports_chart,
    )


@app.route("/tasks/get", methods=["GET"])
async def get_tasks():
    """
    Endpoint to fetch the list of tasks.
    Returns a JSON response containing all tasks.
    """

    tasks = await db_api.get_all_objects(MONGO_COLLECTIONS.TASKS)

    return jsonify(
        [
            t.to_dict()
            for t in tasks
            if t.task_status == str(TASK_STATUS.PENDING).upper()
        ],
    )


@app.route("/tasks/update/<uuid>", methods=["POST"])
async def update_task(uuid):
    """
    Endpoint to update a task.
    Returns a JSON response containing the updated task.
    """

    task = await db_api.get_object_by_uuid(uuid, MONGO_COLLECTIONS.TASKS)

    if not task:
        logger.bad(f"Task not found: {uuid}")
        return jsonify({"error": "Task not found."})

    data = await request.get_json()

    task.task_status = data.get("task_status", "").upper()

    task.time_updated = data.get("time_updated", 0)

    task.amsi_result = data.get("amsi_result", "")

    task.defender_result = data.get("defender_result", "")

    task.threat_names = data.get("defender_threats", [])

    task.zero_x_malicious_bytes = Bytes(
        base64_bytes=data.get("0_x_base64_malicious_bytes", ""),
    )

    task.x_y_malicious_bytes = Bytes(
        base64_bytes=data.get("x_y_base64_malicious_bytes", ""),
    )

    for b64 in data.get("list_of_base64_malicious_bytes", []):
        task.thorough_malicious_bytes.append(
            Bytes(
                base64_bytes=b64,
            )
        )

    task.threat_names = list(set([t for t in task.threat_names if t]))

    if await db_api.update_singular_object_in_db(task, MONGO_COLLECTIONS.TASKS):
        return jsonify(task.to_dict())
    else:
        return jsonify({"error": "Failed to update task."})


@app.route("/payloads/get/<uuid>/bytes", methods=["GET"])
async def send_payload_bytes(uuid):
    """
    Endpoint to fetch the list of payloads.
    Returns a JSON response containing all payloads.
    """

    task = await db_api.get_object_by_uuid(uuid, MONGO_COLLECTIONS.TASKS)

    if not task:
        logger.bad(f"Task not found: {uuid}")
        return jsonify({"error": "Task not found."})

    payload_bytes = None

    try:
        with open(task.file_name, "rb") as f:
            payload_bytes = f.read()

            if not payload_bytes:
                raise FileNotFoundError

            return jsonify(
                {
                    "payload": base64.b64encode(payload_bytes).decode("utf-8"),
                }
            )

    except FileNotFoundError:
        logger.bad(f"File not found: {task.file_name}")
        return jsonify({"error": "File not found."})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5566, use_reloader=True, debug=True)
