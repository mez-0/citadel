import json
import os
import zipfile
from pathlib import Path

import requests

from citadel import logger
from citadel.models.Capa import CapaReport, MalwareBehaviourCatalog, MitreTechnique

CAPA_OUTPUT_FILE = Path("/tmp/capa.json")
CAPA_BASE_DIR = Path("/tmp/capa")
CAPA_ZIP_FILE = Path("/tmp/capa.zip")
CAPA_ELF = CAPA_BASE_DIR / "capa"


def downlod_capa_release() -> bool:
    """
    clone a given repo

    :param url: the url of the repo to clone
    :type url: str
    :param location: the location to clone the repo to
    :type location: str
    :return: whether the repo was cloned successfully
    :rtype: bool
    """

    url = "https://github.com/mandiant/capa/releases/download/v9.0.0/capa-v9.0.0-linux.zip"

    if CAPA_ZIP_FILE.exists():
        return True

    try:
        r = requests.get(url)
        with open(CAPA_ZIP_FILE.resolve(), "wb") as f:
            f.write(r.content)
        return True
    except Exception as e:
        logger.bad(f"Error downloading capa release: {e}")
        return False


def unzip_capa_release() -> bool:
    """
    clone a given repo

    :param url: the url of the repo to clone
    :type url: str
    :param location: the location to clone the repo to
    :type location: str
    :return: whether the repo was cloned successfully
    :rtype: bool
    """

    if not CAPA_ZIP_FILE.exists():
        logger.bad("capa zip file does not exist")
        return False

    try:
        with zipfile.ZipFile(CAPA_ZIP_FILE.resolve(), "r") as zip_ref:
            zip_ref.extractall(CAPA_BASE_DIR.resolve())
        return True
    except Exception as e:
        logger.bad(f"Error unzipping capa release: {e}")
        return False


def chmod_capa() -> bool:
    """
    change the permissions of the capa binary

    :return: whether the permissions were changed successfully
    :rtype: bool
    """

    if not CAPA_ELF.exists():
        logger.bad("capa binary does not exist")
        return False

    try:
        os.system(f"chmod +x {CAPA_ELF.resolve()}")
        return True
    except Exception as e:
        logger.bad(f"Error changing permissions of capa binary: {e}")
        return False


def install_capa() -> bool:
    """
    install capa

    :return: whether capa was installed successfully
    :rtype: bool
    """

    if CAPA_ELF.exists():
        return True

    if not downlod_capa_release():
        logger.bad("Error downloading capa release")
        return False

    if not unzip_capa_release():
        logger.bad("Error unzipping capa release")
        return False

    if not chmod_capa():
        logger.bad("Error changing permissions of capa binary")
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

    cmd = f"{CAPA_ELF.resolve()} -vv {p} --json --os windows --format auto --color never --quiet > {CAPA_OUTPUT_FILE} 2>&1"

    if CAPA_OUTPUT_FILE.exists():
        CAPA_OUTPUT_FILE.unlink()

    if not install_capa():
        return False

    if not CAPA_ELF.exists():
        logger.bad("capa binary does not exist")
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
