# Citadel 🏰

A binary static analysis framework for payload analysis and malware research. Citadel helps identify why implants are being detected statically by providing comprehensive PE parsing, capability detection, and similarity analysis through a modern web interface.

## 🎯 Overview

Citadel addresses the frustration of static detection analysis by providing:
- **Remote Analysis**: HTTP API to avoid copying files to VMs where Defender might interfere
- **Comprehensive PE Parsing**: Multiple parsers for thorough binary analysis
- **Capability Detection**: MITRE ATT&CK and Malware Behavior Catalog mapping
- **Similarity Analysis**: TLSH fuzzy hashing for sample clustering
- **Modern UI**: Clean dashboard for analysis results

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- MongoDB
- Windows VM (for the .NET agent)

### Installation

#### Automated

```bash
bash install.sh
```

#### Manual

1. **Clone and install Citadel**:
   ```bash
   git clone https://github.com/mez-0/citadel
   cd citadel
   uv pip install .
   ```

2. **Install Radare2**:
   ```bash
   git clone https://github.com/radareorg/radare2.git
   cd radare2
   sys/install.sh
   ```

3. **Install EMBER2024**:
   ```bash
   git clone https://github.com/FutureComputing4AI/EMBER2024
   uv pip install ./EMBER2024
   ```

4. **Setup TLSH database**:
   ```bash
   cd citadel
   tar -xvf data/tlsh.tar.gz
   python3 scripts/upload_tlsh_map.py
   ```

5. **Start the API server**:
   ```bash
   python3 api/api.py
   ```

6. **Run the Windows agent** (on Windows VM):
   ```bash
   .\Citadel.Static.exe http://YOUR_API_IP:5566
   ```

## 📊 Usage

```bash
python3 citadel.py -f sample.exe --show-ascii-bytes --tlsh-distance 50
```

Access the web interface at `http://127.0.0.1:5566`

## 🔧 Analysis Components

| Component | Description |
|-----------|-------------|
| **PE Parsing** | LIEF, PEFILE, Radare2, Detect-It-Easy |
| **Capability Detection** | CAPA, Malware Behavior Catalog |
| **Similarity Analysis** | TLSH fuzzy hashing |
| **Static Detection** | Defender scanning with chunking analysis |

## 🎨 Features

- **Multiple Scanning Methods**: 0→X, X→Y, and thorough chunk analysis
- **Function Categorization**: LLM-powered Windows API categorization  
- **Visual Analytics**: Entropy charts, import analysis, detection heatmaps
- **MITRE ATT&CK Mapping**: Automated technique identification
- **Compiler Detection**: Tool and build chain identification

## 📚 Documentation

For detailed setup instructions and advanced configuration, see: [mez0.cc/posts/citadel](https://mez0.cc/posts/citadel/)

## ⚠️ Note

Requires a Windows VM with updated Windows Defender for the scanning agent. Consider disabling toast notifications for smoother operation.
