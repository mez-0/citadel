import json
import os
from pathlib import Path

from citadel import logger
from citadel.models.Capa import CapaReport, MalwareBehaviourCatalog, MitreTechnique

CAPA_OUTPUT_FILE = Path("/tmp/capa.json")
CAPA_RULES_DIR = Path("/tmp/capa-rules")
CAPA_BASE_DIR = Path("/tmp/capa")
CAPA_SIGS_DIR = CAPA_BASE_DIR / "sigs"
CAPA_RULES_URL = "https://github.com/mandiant/capa-rules"
CAPA_REPO_URL = "https://github.com/mandiant/capa"


def clone_repo(url: str, location: str) -> bool:
    """
    clone a given repo

    :param url: the url of the repo to clone
    :type url: str
    :param location: the location to clone the repo to
    :type location: str
    :return: whether the repo was cloned successfully
    :rtype: bool
    """

    if os.system(f"git clone {url} {location}") == 0:
        return True
    else:
        logger.bad(f"Error cloning repo: {url}")
        return False


def clone_prereqs() -> bool:
    """
    clone all the prerequisites for capa

    :return: whether the prerequisites were cloned successfully
    :rtype: bool
    """

    if CAPA_BASE_DIR.exists() and CAPA_SIGS_DIR.exists() and CAPA_RULES_DIR.exists():
        return True

    if not CAPA_BASE_DIR.exists():
        if clone_repo(CAPA_REPO_URL, CAPA_BASE_DIR):
            return True
        else:
            logger.bad("Failed to clone capa repo")
            return False

    if not CAPA_SIGS_DIR.exists():
        logger.bad("Failed to find capa sigs directory")
        return False

    if not CAPA_RULES_DIR.exists():
        if clone_repo(CAPA_RULES_URL, CAPA_RULES_DIR):
            return True
        else:
            logger.bad("Failed to clone capa rules repo")
            return False

    return True


def execute_capa(p: str) -> bool:
    """
    run capa as an os command

    :param p: file to scan
    :type p: str
    :return: the result of the scan
    :rtype: bool
    """

    # the capa python stuff is awful, this is the example: https://github.com/mandiant/capa/blob/master/scripts/bulk-process.py#L84
    # until its not terrible, im wrapping it up.
    # ps. the output is probably less useful than this.,..

    cmd = f"capa -vv {p} -r {str(CAPA_RULES_DIR.resolve())} --signatures {str(CAPA_SIGS_DIR.resolve())} --json --os windows --format auto --color never --quiet > {CAPA_OUTPUT_FILE} 2>&1"

    if CAPA_OUTPUT_FILE.exists():
        CAPA_OUTPUT_FILE.unlink()

    if not clone_prereqs():
        return False

    try:
        if os.system(cmd) == 0:
            return True
        else:
            logger.bad(f"Error running capa: {cmd}")
            return False

    except Exception as e:
        logger.bad(f"Error running capa: {e}")
        return False


def get_capa_reports(p: str) -> list[CapaReport]:
    """
    get all capa report for a given file

    :param p: the file to scan
    :type p: str
    :return: the capa report
    :rtype: list[CapaReport]
    """

    if not execute_capa(p):
        return []

    reports = []

    with open(CAPA_OUTPUT_FILE, "r") as f:
        capa_output = json.load(f)

        rule_maches = capa_output["rules"]

        for rule_name, rule_data in rule_maches.items():
            meta = rule_data["meta"]
            source = rule_data["source"]

            cr = CapaReport(
                name=rule_name,
                namespace=meta.get("namespace", ""),
                description=meta["description"],
                references=meta["references"],
                rule=source,
            )

            if meta.get("attack"):
                attack = meta["attack"]

                for a in attack:
                    mt = MitreTechnique(
                        parts=a.get("parts", []),
                        tactic=a.get("tactic", ""),
                        technique=a.get("technique", ""),
                        subtechnique=a.get("subtechnique", ""),
                        tid=a.get("id", ""),
                    )

                    if mt.tid:
                        mt.tid = mt.tid.replace(".", "/")

                    cr.mitre_techniques.append(mt)

            if meta.get("mbc"):
                mbc = meta["mbc"]
                for m in mbc:
                    cr.malware_behaviour_catalogs.append(
                        MalwareBehaviourCatalog(
                            parts=m.get("parts", []),
                            objective=m.get("objective", ""),
                            behavior=m.get("behavior", ""),
                            method=m.get("method", ""),
                            mid=m.get("id", ""),
                        )
                    )

            reports.append(cr)

        CAPA_OUTPUT_FILE.unlink()

        return reports
