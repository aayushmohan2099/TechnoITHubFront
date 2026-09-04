import os
import sys
import glob
import re
import requests
import urllib3

# SSL warnings disable karne ke liye
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# =========================================================
# CONFIGURATION
# =========================================================
REMOTE_USER = "th-deploy"
REMOTE_HOST = "66.116.207.88"
REMOTE_PASS = "techno@123"
REMOTE_BASE = "/home/th-deploy/TechnoITHub/media/builds"
API_URL = "http://66.116.207.88:14250/api/v1/updates/upload-build/"
BUILD_PREFIX = "release-new1/ETTM_v*.exe"

# =========================================================
# VISUAL ASSETS (ANSI COLORS)
# =========================================================
os.system("color") 

C_CYAN = '\033[96m'
C_GREEN = '\033[92m'
C_YELLOW = '\033[93m'
C_RED = '\033[91m'
C_MAGENTA = '\033[95m'
C_BLUE = '\033[94m'
C_RESET = '\033[0m'
C_BOLD = '\033[1m'

def print_banner():
    os.system("cls" if os.name == "nt" else "clear")
    print(f"{C_CYAN}{C_BOLD}")
    print(" ╔══════════════════════════════════════════════════════════╗")
    print(" ║        ETTM METADATA WIZARD - Django Database            ║")
    print(" ║                    TechnoIT Hub - Automated              ║")
    print(" ╚══════════════════════════════════════════════════════════╝")
    print(f"{C_RESET}")

def print_section(title):
    print(f"\n{C_MAGENTA} ── {C_BOLD}{title.upper()}{C_RESET} {C_MAGENTA}───────────────────────────────────────{C_RESET}\n")

def extract_version(filename):
    """ Filename se version nikalne ke liye (jaise 'ETTM_v1.0.0.exe' -> '1.0.0') """
    match = re.search(r'v(\d+\.\d+\.\d+)', filename)
    return match.group(1) if match else "1.0.0"

def main():
    print_banner()

    print_section("Scanning Local Directory")
    files = glob.glob(BUILD_PREFIX)
    
    if not files:
        print(f" {C_RED}✖ No builds matching '{BUILD_PREFIX}' found in release-new1 folder.{C_RESET}")
        sys.exit(1)

    print(f" {C_BLUE}╭────────────────────────────────────────────────────────╮{C_RESET}")
    print(f" {C_BLUE}│{C_RESET}{C_BOLD}  AVAILABLE BUILDS                                      {C_BLUE}│{C_RESET}")
    print(f" {C_BLUE}├────────────────────────────────────────────────────────┤{C_RESET}")
    
    for i, file in enumerate(files, 1):
        size_mb = os.path.getsize(file) / (1024 * 1024)
        ver = extract_version(file)
        pad = " " if i < 10 else ""
        print(f" {C_BLUE}│{C_RESET}  {C_YELLOW}[{i}]{pad}{C_RESET} {C_BOLD}{file:<28}{C_RESET} {C_CYAN}Ver: {ver}{C_RESET} {C_BLUE}│{C_RESET}")
        print(f" {C_BLUE}│{C_RESET}        {C_CYAN}Size: {size_mb:.1f} MB{C_RESET}{' ' * 24} {C_BLUE}│{C_RESET}")
        
    print(f" {C_BLUE}├────────────────────────────────────────────────────────┤{C_RESET}")
    print(f" {C_BLUE}│{C_RESET}  {C_YELLOW}[0]{C_RESET} Cancel Deployment                                    {C_BLUE}│{C_RESET}")
    print(f" {C_BLUE}╰────────────────────────────────────────────────────────╯{C_RESET}\n")

    while True:
        try:
            choice = int(input(f" {C_GREEN}❯ Select a build to deploy (0-{len(files)}): {C_RESET}"))
            if choice == 0:
                print(f"\n {C_RED}Deployment Cancelled.{C_RESET}")
                sys.exit(0)
            if 1 <= choice <= len(files):
                selected_file = files[choice - 1]
                break
        except ValueError:
            pass
        print(f" {C_RED}Invalid selection. Try again.{C_RESET}")

    version_code = extract_version(selected_file)
    
    # Yahan user se download URL / path liya jayega (jaise profile_pics/xyz.jpg hota hai)
    print(f"\n {C_GREEN}✓ Selected Build : {C_BOLD}{selected_file}{C_RESET}")
    print(f" {C_GREEN}✓ Detected Version : {C_YELLOW}{version_code}{C_RESET}\n")
    
    download_url = input(f" {C_GREEN}❯ Enter Download URL / Path for this .exe: {C_RESET}").strip()
    changelog = input(f" {C_GREEN}❯ Enter changelog/release notes (optional): {C_RESET}").strip()

    if not download_url:
        print(f"\n {C_RED}✖ Error: Download URL cannot be empty!{C_RESET}")
        sys.exit(1)

    print_banner()
    print_section("Sending Metadata to Django Server")
    print(f" {C_GREEN}✓{C_RESET} Version     : {C_YELLOW}{version_code}{C_RESET}")
    print(f" {C_GREEN}✓{C_RESET} Download URL: {C_BOLD}{download_url}{C_RESET}")
    print(f" {C_MAGENTA}Sending data via API... Please wait...{C_RESET}\n")

    # API Request bhejna (Sirf text/metadata data payload ke roop mein)
    payload = {
        'version_code': version_code,
        'download_url': download_url,
        'changelog': changelog
    }

    try:
        response = requests.post(API_URL, data=payload, verify=False)

        if response.status_code == 201:
            print_banner()
            print(f" {C_GREEN}╔════════════════════════════════════════════════════════╗{C_RESET}")
            print(f" {C_GREEN}║                  {C_BOLD}DEPLOYMENT SUCCESSFUL                 {C_RESET}{C_GREEN}║{C_RESET}")
            print(f" {C_GREEN}╚════════════════════════════════════════════════════════╝{C_RESET}\n")
            print(f"    Version     : {C_BOLD}{version_code}{C_RESET}")
            print(f"    Download URL: {C_BLUE}{download_url}{C_RESET}")
            print(f"    Server API  : {C_BLUE}{API_URL}{C_RESET}\n")
            print(f" {C_GREEN}{C_BOLD}✓ Metadata & URL saved to Database successfully!{C_RESET}\n")
        else:
            print(f"\n {C_RED}✖ Upload failed! Server response: {response.text}{C_RESET}")
            sys.exit(1)

    except Exception as e:
        print(f"\n {C_RED}✖ Connection Error: {e}{C_RESET}")
        sys.exit(1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n\n {C_RED}Operation aborted by user.{C_RESET}")
        sys.exit(0)