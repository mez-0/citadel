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


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5566, use_reloader=True, debug=True)
