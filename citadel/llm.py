import os

from openai import OpenAI

from citadel.models.PayloadFile import PayloadFile
from citadel.models.Task import Task


def get_openai_env_key() -> str:
    """
    Gets the OpenAI environment variable key

    :return: The OpenAI environment variable key
    :rtype: str
    """

    return os.environ.get("OPENAI_API_KEY")


def summarise_task_with_openai(task: Task, payload: PayloadFile) -> str:
    """
    Summarises a task with the OpenAI API

    :param task: The task to summarise
    :param payload: The payload to summarise
    """

    api_key = get_openai_env_key()

    if not api_key:
        return ""

    client = OpenAI(api_key=api_key)

    yara_summary = ""
    capa_summary = ""
    function_mapping_summary = ""
    toolchain_summary = ""
    certificate_summary = ""

    for yara in task.yara_matches:
        yara_summary += f"""
        - Yara Rule: {yara.name}
        - Yara Description: {yara.description}
        - Yara Author: {yara.author}
        - Yara Reference: {yara.reference}
        - Yara Date: {yara.date}
        """

    for capa in task.capa_reports:
        capa_summary += f"""
        - Capa Name: {capa.name}
        - Capa Description: {capa.description}
        - Capa Namespace: {capa.namespace}
        - Capa References: {', '.join(capa.references)}
        """
        for mbc in capa.malware_behaviour_catalogs:
            capa_summary += f"""
            - MBC ID: {mbc.mid}
            - MBC Objective: {mbc.objective}
            - MBC Behavior: {mbc.behavior}
            - MBC Method: {mbc.method}
            - MBC Parts: {', '.join(mbc.parts)}
            """
        for mt in capa.mitre_techniques:
            capa_summary += f"""
            - MITRE ATT&CK ID: {mt.tid}
            - MITRE ATT&CK Parts: {', '.join(mt.parts)}
            - MITRE ATT&CK Technique: {mt.technique}
            - MITRE ATT&CK Subtechnique: {mt.subtechnique}
            - MITRE ATT&CK Tactic: {mt.tactic}
            """

    for function_mapping in task.function_mappings:
        function_mapping_summary += f"""
        - Function Mapping Function: {function_mapping.dll}!{function_mapping.function}
        - Function Mapping Description: {function_mapping.description}
        - Function Mapping Category: {function_mapping.category}
        """

    for tool in payload.compilers:
        toolchain_summary += f"""
        - Tool Name: {tool.name}
        - Tool info: {tool.info}
        - Tool string: {tool.string}
        - Tool version: {tool.version}
        """

    for tool in payload.libraries:
        toolchain_summary += f"""
        - Tool Name: {tool.name}
        - Tool info: {tool.info}
        - Tool string: {tool.string}
        - Tool version: {tool.version}
        """

    for tool in payload.linkers:
        toolchain_summary += f"""
        - Tool Name: {tool.name}
        - Tool info: {tool.info}
        - Tool string: {tool.string}
        - Tool version: {tool.version}
        """

    for tool in payload.packers:
        toolchain_summary += f"""
        - Tool Name: {tool.name}
        - Tool info: {tool.info}
        - Tool string: {tool.string}
        - Tool version: {tool.version}
        """

    for tool in payload.sign_tools:
        toolchain_summary += f"""
        - Tool Name: {tool.name}
        - Tool info: {tool.info}
        - Tool string: {tool.string}
        - Tool version: {tool.version}
        """

    for tool in payload.tools:
        toolchain_summary += f"""
        - Tool Name: {tool.name}
        - Tool info: {tool.info}
        - Tool string: {tool.string}
        - Tool version: {tool.version}
        """

    for certificate in payload.certificates:
        certificate_summary += f"""
        - Certificate Serial Number: {certificate.serial_number}
        - Certificate Issuer: {certificate.issuer}
        - Certificate Subject: {certificate.subject}
        """

    message = f"""
    ## Summary
    
    ### Metadata
    - Payload SHA256: {payload.sha256}
    - Payload Architecture: {payload.architecture}
    - Payload Timestamp: {payload.timestamp}
    - Payload Entropy: {payload.entropy}
    
    ### Scan Results
    - Windows Defender result: {task.defender_result}
    - Windows AMSI result: {task.amsi_result}
    - Threat Names: {', '.join(task.threat_names)}
    - ML Score: {task.ember_result.score} {task.ember_result.prediction}
    - Similar TLSH Hashes: {len(task.similar_tlsh_hashes)}
    
    ### Yara Matches
    {yara_summary}
    
    ### Capa Reports
    {capa_summary}
    
    ### Function Mappings
    {function_mapping_summary}
    
    ### Toolchain
    {toolchain_summary}
    
    ### Certificates
    {certificate_summary}
    """

    response = client.responses.create(
        model="gpt-4o",
        instructions="""
        You are a malware researcher focusing on malware triage to determine whether a file is malicious or not.
        You will be given metadata and scan results from a sample, and you must use it to determine whether the file is malicious or not.
        You must provide a detailed explanation of your reasoning for your answer.
        """,
        input=message,
    )

    return response.output_text
