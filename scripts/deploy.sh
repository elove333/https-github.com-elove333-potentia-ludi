#!/bin/bash

################################################################################
# Potentia Ludi - DigitalOcean Deployment Script
################################################################################
# 
# This script automates the deployment of the Potentia Ludi application
# and backend services on DigitalOcean using doctl.
#
# Prerequisites:
#   - doctl installed and configured (run 'doctl auth init')
#   - SSH key added to your DigitalOcean account
#   - Node.js 24+ for the backend services
#   - PostgreSQL 16+ and Redis 7+ (can be installed on droplet)
#
# Usage:
#   ./scripts/deploy.sh [OPTIONS]
#
# Options:
#   --droplet-name     Name for the droplet (default: potentia-ludi-server)
#   --region           DigitalOcean region (default: nyc3)
#   --size             Droplet size (default: s-2vcpu-4gb)
#   --ssh-key-id       Your SSH key ID (required)
#   --help             Display this help message
#
# Example:
#   ./scripts/deploy.sh --droplet-name my-app --region nyc3 --size s-2vcpu-4gb --ssh-key-id 12345678
#
################################################################################

set -e  # Exit on error

# Default configuration
DROPLET_NAME="potentia-ludi-server"
REGION="nyc3"
SIZE="s-2vcpu-4gb"
IMAGE="ubuntu-22-04-x64"
SSH_KEY_ID=""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Print colored messages
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Display help message
show_help() {
    cat << EOF
Potentia Ludi Deployment Script

This script automates the deployment of Potentia Ludi on DigitalOcean.

Usage:
    ./scripts/deploy.sh [OPTIONS]

Options:
    --droplet-name NAME    Name for the droplet (default: potentia-ludi-server)
    --region REGION        DigitalOcean region (default: nyc3)
    --size SIZE            Droplet size (default: s-2vcpu-4gb)
    --ssh-key-id ID        Your SSH key ID (required)
    --help                 Display this help message

Available Regions:
    nyc1, nyc3, sfo1, sfo2, sfo3, ams2, ams3, sgp1, lon1, fra1, tor1, blr1

Common Sizes:
    s-1vcpu-1gb     - 1 vCPU, 1GB RAM (basic testing)
    s-2vcpu-2gb     - 2 vCPUs, 2GB RAM (light workload)
    s-2vcpu-4gb     - 2 vCPUs, 4GB RAM (recommended)
    s-4vcpu-8gb     - 4 vCPUs, 8GB RAM (production)

Example:
    ./scripts/deploy.sh --droplet-name my-app --region nyc3 --size s-2vcpu-4gb --ssh-key-id 12345678

Get your SSH key ID:
    doctl compute ssh-key list

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --droplet-name)
            DROPLET_NAME="$2"
            shift 2
            ;;
        --region)
            REGION="$2"
            shift 2
            ;;
        --size)
            SIZE="$2"
            shift 2
            ;;
        --ssh-key-id)
            SSH_KEY_ID="$2"
            shift 2
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate required parameters
if [ -z "$SSH_KEY_ID" ]; then
    log_error "SSH key ID is required. Use --ssh-key-id option."
    echo ""
    echo "Get your SSH key ID by running:"
    echo "  doctl compute ssh-key list"
    echo ""
    show_help
    exit 1
fi

# Check if doctl is installed
if ! command -v doctl &> /dev/null; then
    log_error "doctl is not installed. Please install it first:"
    echo "  macOS:   brew install doctl"
    echo "  Linux:   See https://docs.digitalocean.com/reference/doctl/how-to/install/"
    echo "  Windows: choco install doctl"
    exit 1
fi

# Check if doctl is authenticated
if ! doctl account get &> /dev/null; then
    log_error "doctl is not authenticated."
    echo ""
    echo "To authenticate doctl:"
    echo "  1. Create a DigitalOcean API token at: https://cloud.digitalocean.com/account/api/tokens"
    echo "  2. Run: doctl auth init"
    echo "  3. Enter your API token when prompted"
    exit 1
fi

log_info "Starting deployment of Potentia Ludi..."
log_info "Configuration:"
echo "  Droplet Name: $DROPLET_NAME"
echo "  Region:       $REGION"
echo "  Size:         $SIZE"
echo "  Image:        $IMAGE"
echo "  SSH Key ID:   $SSH_KEY_ID"
echo ""

# Check if droplet with the same name already exists
log_info "Checking for existing droplets..."
EXISTING_DROPLET=$(doctl compute droplet list --format Name --no-header | grep "^${DROPLET_NAME}$" || true)

if [ -n "$EXISTING_DROPLET" ]; then
    log_warn "A droplet named '$DROPLET_NAME' already exists."
    read -p "Do you want to delete it and create a new one? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Deleting existing droplet..."
        DROPLET_ID=$(doctl compute droplet list --format ID,Name --no-header | grep "$DROPLET_NAME" | awk '{print $1}')
        doctl compute droplet delete "$DROPLET_ID" --force
        log_info "Waiting for droplet deletion to complete..."
        sleep 5
    else
        log_info "Deployment cancelled."
        exit 0
    fi
fi

# Create the droplet
log_info "Creating droplet '$DROPLET_NAME'..."
DROPLET_OUTPUT=$(doctl compute droplet create "$DROPLET_NAME" \
    --image "$IMAGE" \
    --size "$SIZE" \
    --region "$REGION" \
    --ssh-keys "$SSH_KEY_ID" \
    --wait \
    --format ID,Name,PublicIPv4,Status \
    --no-header)

if [ -z "$DROPLET_OUTPUT" ]; then
    log_error "Failed to create droplet"
    exit 1
fi

DROPLET_ID=$(echo "$DROPLET_OUTPUT" | awk '{print $1}')
DROPLET_IP=$(echo "$DROPLET_OUTPUT" | awk '{print $3}')

log_info "Droplet created successfully!"
echo "  Droplet ID: $DROPLET_ID"
echo "  IP Address: $DROPLET_IP"
echo ""

# Wait for droplet to be ready for SSH
log_info "Waiting for droplet to be ready for SSH connections..."
sleep 30

# Create deployment script for the droplet
REMOTE_SETUP_SCRIPT=$(cat << 'EOFSCRIPT'
#!/bin/bash
set -e

echo "=== Setting up Potentia Ludi Server ==="

# Generate random password for PostgreSQL
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# Update system
echo "Updating system packages..."
apt-get update
apt-get upgrade -y

# Install Node.js 24 LTS
echo "Installing Node.js 24 LTS..."
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt-get install -y nodejs

# Install PostgreSQL 16
echo "Installing PostgreSQL 16..."
apt-get install -y postgresql postgresql-contrib

# Install Redis 7
echo "Installing Redis..."
apt-get install -y redis-server

# Install Git
echo "Installing Git..."
apt-get install -y git

# Install PM2 for process management
echo "Installing PM2..."
npm install -g pm2

# Configure PostgreSQL
echo "Configuring PostgreSQL..."
sudo -u postgres psql -c "CREATE DATABASE potentia_ludi;" || echo "Database already exists"
sudo -u postgres psql -c "CREATE USER potentia_user WITH PASSWORD '$DB_PASSWORD';" || echo "User already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE potentia_ludi TO potentia_user;" || true

# Configure Redis
echo "Configuring Redis..."
systemctl enable redis-server
systemctl start redis-server

# Create application directory
echo "Creating application directory..."
mkdir -p /opt/potentia-ludi
cd /opt/potentia-ludi

# Setup firewall
echo "Configuring firewall..."
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
echo "y" | ufw enable || true

echo ""
echo "=== Server Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Clone your repository: git clone <your-repo-url> /opt/potentia-ludi/app"
echo "2. Configure environment variables in /opt/potentia-ludi/app/.env"
echo "3. Install dependencies: cd /opt/potentia-ludi/app && npm install"
echo "4. Build the application: npm run build"
echo "5. Start with PM2: pm2 start npm --name potentia-ludi -- start"
echo "6. Save PM2 config: pm2 save && pm2 startup"
echo ""
echo "Database connection string:"
echo "  postgresql://potentia_user:$DB_PASSWORD@localhost:5432/potentia_ludi"
echo ""
echo "Redis connection string:"
echo "  redis://localhost:6379"
echo ""
echo "IMPORTANT: Save the database password above - it will not be shown again!"
EOFSCRIPT
)

# Execute setup script on the droplet
log_info "Setting up server environment..."
echo "$REMOTE_SETUP_SCRIPT" | ssh -o StrictHostKeyChecking=no root@"$DROPLET_IP" 'bash -s'

log_info ""
log_info "=========================================="
log_info "Deployment completed successfully!"
log_info "=========================================="
log_info ""
log_info "Droplet Information:"
echo "  Name:       $DROPLET_NAME"
echo "  ID:         $DROPLET_ID"
echo "  IP Address: $DROPLET_IP"
echo "  Region:     $REGION"
echo "  Size:       $SIZE"
echo ""
log_info "Next Steps:"
echo "1. SSH into your server:"
echo "   ssh root@$DROPLET_IP"
echo ""
echo "2. Clone your repository:"
echo "   cd /opt/potentia-ludi"
echo "   git clone <your-repository-url> app"
echo "   # Example: git clone https://github.com/yourusername/yourrepo.git app"
echo ""
echo "3. Configure your environment:"
echo "   cd app"
echo "   cp .env.example .env"
echo "   # Edit .env with your configuration"
echo ""
echo "4. Install and build:"
echo "   npm install"
echo "   npm run build"
echo ""
echo "5. Start the application:"
echo "   pm2 start npm --name potentia-ludi -- start"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
log_warn "Security Reminder:"
echo "  - Change the default PostgreSQL password"
echo "  - Configure SSL/TLS for production"
echo "  - Set up proper backup procedures"
echo "  - Review and harden firewall rules"
echo ""
log_info "View droplet in DigitalOcean dashboard:"
echo "  https://cloud.digitalocean.com/droplets/$DROPLET_ID"
echo ""
