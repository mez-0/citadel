import base64
import json
from collections import defaultdict
from pathlib import Path

import yaml
from rich import box
from rich.console import Console
from rich.table import Table

from citadel import logger


def load_rules():
    """Load YAML-based ETW rules from the 'etw-rules' directory."""
    p = Path("etw-rules")
    rules = []

    for rule_file in p.rglob("*.yaml"):
        with open(rule_file, "r") as f:
            rule = yaml.safe_load(f)
            rules.append(rule["rule"])

    return rules


def process_valloc_data(matches: list):

    virtual_alloc_events = [
        match
        for match in matches
        if match["provider"] == "Windows Kernel" and match["task"] == "VirtualMem"
    ]

    # first pass -> collect allocation statistics
    allocation_stats = defaultdict(lambda: {"count": 0, "total_bytes": 0, "sizes": []})

    all_sizes = []

    stats = {
        "high_count_procs": [],
        "large_alloc_procs": [],
        "large_allocs": [],
    }

    for event in virtual_alloc_events:
        fields = event["fields"]
        process = event["process_name"]
        length = fields["Length"]

        allocation_stats[process]["count"] += 1
        allocation_stats[process]["total_bytes"] += length
        allocation_stats[process]["sizes"].append(length)
        all_sizes.append(length)

    # second pass -> look for stuff
    if all_sizes:
        high_count_procs = [
            (p, s["count"]) for p, s in allocation_stats.items() if s["count"] > 10
        ]

        large_alloc_procs = [
            (p, s["total_bytes"])
            for p, s in allocation_stats.items()
            if s["total_bytes"] > 1048576
        ]

        large_allocs = [
            (event["process_name"], event["fields"]["Length"])
            for event in virtual_alloc_events
            if event["fields"]["Length"] > 1048576
        ]

        stats["high_count_procs"] = high_count_procs
        stats["large_alloc_procs"] = large_alloc_procs
        stats["large_allocs"] = large_allocs

    logger.info("Virtual Memory Allocation Stats:")
    logger.info(f"Total Events: {len(virtual_alloc_events)}", indent=1)
    logger.info(f"Total Processes: {len(allocation_stats)}", indent=1)
    logger.info(f"Total Bytes Allocated: {sum(all_sizes)}", indent=1)
    logger.info(f"Average Allocation: {sum(all_sizes) / len(all_sizes)}", indent=1)
    logger.info(f"Max Allocation: {max(all_sizes)}", indent=1)
    logger.info(f"Min Allocation: {min(all_sizes)}", indent=1)
    logger.info(f"High Count Processes: {len(high_count_procs)}", indent=1)
    logger.info(f"Large Allocation Processes: {len(large_alloc_procs)}", indent=1)
    logger.info(f"Large Allocations: {len(large_allocs)}", indent=1)

    return stats


def process_dnsclient_3006(matches: list):

    dns_eventid3006_matches = [
        match
        for match in matches
        if match["provider"] == "Microsoft-Windows-DNS-Client"
        and match["task"] == "EventID(3006)"
    ]

    dns_record_types = {
        1: "A",
        2: "NS",
        5: "CNAME",
        6: "SOA",
        12: "PTR",
        15: "MX",
        16: "TXT",
        28: "AAAA",
        33: "SRV",
        35: "NAPTR",
        39: "DNAME",
        41: "OPT",
        43: "DS",
        46: "RRSIG",
        47: "NSEC",
        48: "DNSKEY",
        50: "NSEC3",
        51: "NSEC3PARAM",
        257: "CAA",
    }

    updated = []

    for match in dns_eventid3006_matches:
        fields = match["fields"]
        query_name = fields.get("QueryName")
        query_type = fields.get("QueryType")

        query_type = dns_record_types.get(query_type, query_type)

        updated.append(
            {
                "query_name": query_name,
                "query_type": query_type,
                "thread_id": match["thread_id"],
                "process_name": match["process_name"],
            }
        )

    table = Table(
        title="DNS Queries",
        show_lines=True,
        box=box.ROUNDED,
    )

    table.add_column("Process", style="magenta")
    table.add_column("Thread", style="cyan")
    table.add_column("Query Name", style="yellow")
    table.add_column("Query Type", style="yellow")

    seen = set()

    for record in updated:

        s = f"{record['query_name']} ({record['query_type']})"

        if s in seen:
            continue

        seen.add(s)

        table.add_row(
            record["process_name"],
            str(record["thread_id"]),
            record["query_name"],
            record["query_type"],
        )

    console = Console()

    print()

    console.print(table)

    return updated


def process_wininet_data(matches: list):

    wininet_providers = [
        "Microsoft-Windows-WinINet",
        "Microsoft-Windows-WinINet-Capture",
    ]

    matches = [match for match in matches if match["provider"] in wininet_providers]

    requests = []
    responses = []
    root_handles = {}
    connection_handles = {}
    request_handles = {}

    for match in matches:
        provider = match["provider"]
        task = match["task"]
        fields = match["fields"]

        if (
            provider == "Microsoft-Windows-WinINet"
            and task == "Wininet_UsageLogRequest"
        ):
            url = fields.get("URL")
            verb = fields.get("Verb")
            request_headers = fields.get("RequestHeaders")

            if url and verb:
                request_data = {
                    "url": url,
                    "verb": verb,
                    "headers": request_headers,
                    "thread_id": match["thread_id"],
                    "process_name": match["process_name"],
                }
                requests.append(request_data)

        elif (
            provider == "Microsoft-Windows-WinINet-Capture" and task == "EventID(2004)"
        ):
            payload = fields.get("Payload")
            flags = fields.get("Flags")

            if payload:
                base64_decoded_body = base64.b64decode(payload).decode("utf-8")
                response_data = {
                    "flags": flags,
                    "thread_id": match["thread_id"],
                    "process_name": match["process_name"],
                    "body": base64_decoded_body,
                }
                responses.append(response_data)

        if task == "WININET_ROOT_HANDLE_CREATED":
            handle = fields.get("HINTERNET")
            if handle:
                root_handles[handle] = {
                    "user_agent": fields.get("UserAgent"),
                    "access_type": fields.get("AccessType"),
                    "proxy_bypass": fields.get("ProxyBypassList"),
                    "thread_id": match["thread_id"],
                    "process_name": match["process_name"],
                }

        elif task == "WININET_CONNECT_HANDLE_CREATED":
            handle = fields.get("ConnectionHandle")
            parent_handle = fields.get("ParentHandle")
            if handle and parent_handle:
                connection_handles[handle] = {
                    "parent_handle": parent_handle,
                    "server_name": fields.get("ServerName"),
                    "server_port": fields.get("ServerPort"),
                    "service": fields.get("Service"),
                    "thread_id": match["thread_id"],
                    "process_name": match["process_name"],
                }

        elif task == "WININET_HTTP_REQUEST_HANDLE_CREATED":
            handle = fields.get("ConnectionHandle")
            parent_handle = fields.get("ParentHandle")
            verb = fields.get("Verb")
            object_name = fields.get("ObjectName")

            if handle:
                if handle not in request_handles:
                    request_handles[handle] = {
                        "parent_handle": parent_handle,
                        "thread_id": match["thread_id"],
                        "process_name": match["process_name"],
                    }

                if verb is not None:
                    request_handles[handle]["verb"] = verb

                if object_name is not None:
                    request_handles[handle]["object_name"] = object_name

                if fields.get("Version") is not None:
                    request_handles[handle]["http_version"] = fields.get("Version")

                if fields.get("Referrer") is not None:
                    request_handles[handle]["referrer"] = fields.get("Referrer")

    enriched_records = []
    for req_handle, req_info in request_handles.items():
        if "verb" not in req_info or "object_name" not in req_info:
            continue

        conn_handle = req_info.get("parent_handle")
        conn_info = connection_handles.get(conn_handle, {})

        root_handle = conn_info.get("parent_handle")
        root_info = root_handles.get(root_handle, {})

        enriched = {
            "verb": req_info.get("verb"),
            "url": f"{conn_info.get('service', 'http').lower()}://{conn_info.get('server_name')}:{conn_info.get('server_port')}{req_info.get('object_name')}",
            "user_agent": root_info.get("user_agent"),
            "http_version": req_info.get("http_version"),
            "referrer": req_info.get("referrer"),
            "thread_id": req_info.get("thread_id"),
            "process_name": req_info.get("process_name"),
            "handles": {
                "root": root_handle,
                "connection": conn_handle,
                "request": req_handle,
            },
        }

        enriched_records.append(enriched)

    servers = []
    for conn_handle, conn_info in connection_handles.items():
        server_name = conn_info.get("server_name")
        server_port = conn_info.get("server_port")
        service_name = conn_info.get("service")
        if service_name != "HTTP":
            continue
        server = f"{server_name}:{server_port}"
        if server not in servers:
            servers.append(server)

    table = Table(
        title="WinINet Requests",
        show_lines=True,
        box=box.ROUNDED,
    )

    table.add_column("Process", style="magenta")
    table.add_column("Thread", style="cyan")
    table.add_column("Url", style="yellow")

    seen = set()

    for request in requests:
        url = request["url"]

        if url in seen:
            continue

        seen.add(url)

        table.add_row(request["process_name"], str(request["thread_id"]), url)

    console = Console()

    print()

    console.print(table)

    return {
        "requests": requests,
        "responses": responses,
        "servers": servers,
        "enriched_records": enriched_records,
    }


def xref_threads_and_valloc(matches: list):
    suspicious_procs = set()

    thread_starts = [
        m for m in matches if m["task"] == "Thread" and m["opcode"] == "Start"
    ]

    logger.info(f"Thread Start Events: {len(thread_starts)}")

    vallocs = [
        m
        for m in matches
        if m["provider"] == "Windows Kernel" and m["task"] == "VirtualMem"
    ]

    logger.info(f"Virtual Memory Allocation Events: {len(vallocs)}")

    for alloc in vallocs:
        valloc_process_name = alloc["process_name"]
        valloc_process_id = alloc["process_id"]
        valloc_thread_id = alloc["thread_id"]

        if valloc_process_id == 0 or valloc_thread_id == 0:
            continue

        if alloc["fields"]["Length"]:
            for ts in thread_starts:
                thread_process_name = ts["process_name"]
                thread_process_id = ts["process_id"]
                thread_thread_id = ts["thread_id"]

                if thread_process_id == 0 or thread_thread_id == 0:
                    continue

                if thread_process_id != valloc_process_id:
                    continue

                if thread_thread_id != valloc_thread_id:
                    continue

                if thread_process_name != valloc_process_name:
                    continue

                print(
                    f"🚨 [red]Suspicious Process: {valloc_process_name} ({valloc_process_id}) -> {valloc_thread_id}"
                )

    return list(suspicious_procs)


def process_etw_logs(input_path: str) -> dict:
    """
    process all the etw logs and return a dictionary with the results

    :param input_path: the path to the directory containing the jsonl files
    :type input_path: str
    :return: a dictionary with the results
    :rtype: dict
    """

    rules = load_rules()

    logger.info(f"Loaded {len(rules)} rules:")

    for rule in rules:
        logger.info(f"⚙️ [orchid1]{rule['name']}", indent=1)
    print()

    jsonl_files = list(Path(input_path).rglob("*.jsonl"))

    providers = set()
    task_names = set()
    event_count = 0
    matches = []

    for jsonl_file in jsonl_files:
        with open(jsonl_file, "r") as f:
            for line in f:
                d = json.loads(line)

                keyword = d.get("Keyword")
                thread_id = d.get("ThreadId", 0)
                pid = d.get("ProcessId", 0)
                provider_name = d.get("ProviderName")
                process_name = d.get("ProcessName")
                task_name = d.get("TaskName")
                opcodename = d.get("OpcodeName")
                data = d.get("Data", {})

                providers.add(provider_name)
                task_names.add(task_name)
                event_count += 1

                for rule in rules:
                    if not (
                        rule["provider"] == provider_name
                        and rule["task"] == task_name
                        and rule["opcode"] == opcodename
                    ):
                        continue

                    fields = {field: data.get(field) for field in rule["fields"]}

                    if not fields:
                        continue

                    match_data = {
                        "rule_name": rule["name"],
                        "provider": provider_name,
                        "task": task_name,
                        "opcode": opcodename,
                        "fields": fields,
                        "process_id": pid,
                        "thread_id": thread_id,
                        "process_name": process_name,
                        "keyword": keyword,
                    }

                    matches.append(match_data)

    logger.info(f"Event Count: {event_count}")
    logger.info(f"Total Matches: {len(matches)}")

    # enrich the wininet data to get URLs and enriched requests
    processed_wininet_logs = process_wininet_data(matches)

    # process the valloc data to get memory allocation stats
    processed_valloc_logs = process_valloc_data(matches)

    # process the dnsclient 3006 data to get DNS queries
    processed_dnsclient_3006_logs = process_dnsclient_3006(matches)

    # xref threads and valloc data
    suspicious_allocs = xref_threads_and_valloc(matches)

    return {
        "matches": matches,
        "enriched": {
            "wininet": processed_wininet_logs,
            "valloc": processed_valloc_logs,
            "dnsclient_3006": processed_dnsclient_3006_logs,
            "suspicious_allocs": suspicious_allocs,
        },
    }
