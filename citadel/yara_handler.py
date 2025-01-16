from pathlib import Path

import yara

from citadel.models.Yara import Yara


def get_yara_rules(rules_file_or_directory: Path) -> list[Path]:
    """
    get all the yara rules

    :return: path to the yara rules
    :rtype: list[Path]
    """

    rules = []

    if rules_file_or_directory.is_file():
        rules.append(rules_file_or_directory)
    else:
        rules = list(rules_file_or_directory.glob("*.yar"))

    return rules


def compile_yara_rules(rules: list[Path]) -> yara.Rules:
    """
    compile the yara rules

    :param rules: the yara rules
    :type rules: list[Path]
    :return: the compiled yara rules
    :rtype: yara.Rules
    """
    yara_files = {}

    for rule in rules:
        yara_files[rule.stem] = str(rule.resolve())

    yara_rules = yara.compile(filepaths=yara_files)

    return yara_rules


def match_yara_rules(target_file: str, rules_file_or_directory: str) -> list[Yara]:
    """
    match the yara rules against the target file

    :param target_file: the file to match against
    :type target_file: str
    :param rules_file_or_directory: the rules to match against
    :type rules_file_or_directory: str
    :return: the matches
    :rtype: list[Yara]
    """

    files = get_yara_rules(Path(rules_file_or_directory))

    yara_rules = compile_yara_rules(files)

    matches = yara_rules.match(target_file)

    yaras = []

    for match in matches:
        y = Yara(
            name=match.rule,
            description=match.meta.get("description", ""),
            author=match.meta.get("author", ""),
            reference=match.meta.get("reference", ""),
            date=match.meta.get("date", ""),
            rule_id=match.meta.get("id", ""),
            strings=match.strings,
            tags=match.tags,
        )

        yaras.append(y)

    return yaras
