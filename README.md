# Citadel 🛡️

Citadel is a payload analysis framework that I built to enable me to review payloads prior to using them on engagements. The inner PE parsing logic will also be used for future projects and will act as a core component to my research projects. My extension of the preprocessing phase and the addition of the capability detectors, Citadel will report on [MITRE ATT&CK](https://attack.mitre.org/) and [Malware Behavior Catalog](https://github.com/MBCProject/mbc-markdown).

## 🎯 Overview

Figuring out why an implant is being detected (statically) is a frustrating game. Tools such as ThreatCheck and GoCheck exist to tackle this problem, and do a decent job. However, an issue I had with these is that when I want to execute it, I need to copy a file onto a Virtual Machine. But, at this point, Defender would eat it before I even got to test it. That's where projects like avred come in, this introduces a HTTP API to allow a more remote implementation.

## 🚀 Installation

See detailed installation guide at: [mez0.cc/posts/citadel/#installing](https://mez0.cc/posts/citadel/#installing)

```bash
git clone https://github.com/radareorg/radare2.git
cd radare2
sys/install.sh
python3 -m venv venv
source venv/bin/activate
pip install .
```

## 🔧 Parsers

| Parser         | Description                                                                                | Link                                                        |
| -------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| LIEF           | For internal file names and export details                                                 | [LIEF](https://github.com/lief-project/LIEF)                |
| PEFILE         | For optional headers, timestamps, and code-signing information                             | [PEFILE](https://github.com/erocarrera/pefile)              |
| Radare2        | For detailed binary analysis, including sections, imports, exports, functions, and strings | [Radare2](https://github.com/radareorg/radare2)             |
| Detect-It-Easy | For identifying compilers, libraries, linkers, packers, and tools                          | [Detect-It-Easy](https://github.com/horsicq/Detect-It-Easy) |

## 🔗 Capability Detectors

| Project                                                                | Description                                                                                                                                                                                                    |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [capa](https://github.com/mandiant/capa)                               | Automatically identify malware capabilities                                                                                                                                                                    |
| [Malware Behavior Catalog](https://github.com/MBCProject/mbc-markdown) | The Malware Behavior Catalog (MBC) is a catalog of malware objectives and behaviors, created to support malware analysis-oriented use cases, such as labeling, similarity analysis, and standardized reporting |