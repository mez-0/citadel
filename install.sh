#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PY_VERSION="3.10"
CITADEL_DIR="~/.citadel"

CWD=$(pwd)

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

check_prerequisites() {
    log_info "Checking prerequisites..."

    if ! command_exists python3; then
        log_error "Python 3 is not installed. Please install Python 3.8+ before continuing."
        exit 1
    fi

    PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')

    if [[ "$(printf '%s\n' "$PY_VERSION" "$PYTHON_VERSION" | sort -V | head -n1)" != "$PY_VERSION" ]]; then
        log_error "Python version $PYTHON_VERSION is too old. Please install Python 3.8 or newer."
        exit 1
    fi
    
    if ! command_exists git; then
        log_error "Git is not installed. Please install git before continuing."
        exit 1
    fi
    
    if ! command_exists mongod && ! command_exists mongo && ! command_exists mongosh; then
        log_warning "MongoDB not found. Please ensure MongoDB is installed and running."
        log_info "You can install MongoDB using your package manager:"
        log_info "  Ubuntu/Debian: sudo apt-get install mongodb"
        log_info "  CentOS/RHEL: sudo yum install mongodb-server"
        log_info "  Or follow instructions at: https://docs.mongodb.com/manual/installation/"
    fi
    
    if ! command_exists uv; then
        log_info "Installing uv (Python package manager)..."
        curl -LsSf https://astral.sh/uv/install.sh | sh
        export PATH="$HOME/.cargo/bin:$PATH"
        if ! command_exists uv; then
            log_error "Failed to install uv. Please install it manually."
            exit 1
        fi
    fi    
}

install_citadel() {
    RESPONSE=$(uv pip install .)

    if [ $? -ne 0 ]; then
        log_error "Failed to install Citadel. Please check the error messages above."
        exit 1
    fi
    
    log_success "Installed Citadel!"
}

install_radare2() {
    TEMP_DIR=$(mktemp -d)
    cd "$TEMP_DIR"
    
    git clone https://github.com/radareorg/radare2.git
    cd radare2
    
    chmod +x sys/install.sh
    sys/install.sh
    
    cd "$PWD"
    rm -rf "$TEMP_DIR"
    
    log_success "Installed Radare2!"
}

install_ember2024() {
    cd "$CITADEL_DIR"

    if [ ! -d "EMBER2024" ]; then
        git clone https://github.com/FutureComputing4AI/EMBER2024
    fi
    
    uv pip install ./EMBER2024
    
    cd "$PWD"
    
    log_success "Installed EMBER2024!"
}

setup_tlsh_database() {
    if [ ! -f "data/tlsh.tar.gz" ]; then
        log_error "TLSH database file not found at data/tlsh.tar.gz"
        log_warning "Skipping TLSH database setup. You may need to download it manually."
        return
    fi
    
    tar -xvf data/tlsh.tar.gz
    
    if [ -f "scripts/upload_tlsh_map.py" ]; then
        python3 scripts/upload_tlsh_map.py
        log_success "TLSH database setup completed"
    else
        log_warning "upload_tlsh_map.py script not found. You may need to run it manually."
    fi
}

get_elastic_rule_artifacts() {
    cd "$CITADEL_DIR"

    if [ ! -d "protections-artifacts" ]; then
        git clone https://github.com/elastic/protections-artifacts.git
    fi    
}

main() {
    log_info "Starting Citadel installation..."
    log_info "🏰 Citadel - Binary Static Analysis Framework"
    echo ""
    
    
    check_prerequisites
    
    install_citadel
    install_radare2
    install_ember2024
    setup_tlsh_database
    
    echo ""
    log_success "🎉 Citadel installation completed successfully!"
    log_info "Yara rules @ $CITADEL_DIR/protections-artifacts/yara"
    echo ""
}

main "$@"
