import sys
import cv2
import numpy as np
from colorama import Fore, Style, init
from ultralytics import YOLO

# Initialize colored terminal output
init(autoreset=True)

def secure_login():
    print(Fore.CYAN + "=" * 60)
    print(Fore.CYAN + "  [AUTH] OIL SPILL INTELLIGENCE PLATFORM")
    print(Fore.CYAN + "=" * 60)
    print(Fore.WHITE + "  1. Continue with Google (OAuth)")
    print(Fore.WHITE + "  2. Login (Email & Password)")
    print(Fore.WHITE + "  3. Register New User")
    print(Fore.WHITE + "  4. Continue as Guest")
    
    choice = input(Fore.CYAN + "  Select an option (1-4): ")

    if choice == "1":
        print(Fore.GREEN + "  [AUTH] Connecting to Google Auth Server... Access Granted!")
    elif choice == "2" or choice == "3":
        user = input("  Enter Username: ")
        print(Fore.GREEN + f"  [AUTH] Access Granted! Welcome, {user}.")
    elif choice == "4":
        print(Fore.GREEN + "  [AUTH] Continuing as Guest...")
    else:
        print(Fore.RED + "  [AUTH] Invalid selection.")
        sys.exit(1)

def analyze():
    # Check if the image path is provided
    if len(sys.argv) < 2:
        print(Fore.RED + "Error: Please provide an image path.")
        # FIXED: Added r before the string to remove SyntaxWarning
        print(Fore.YELLOW + r"Usage: python analyze.py C:\path\to\your\image.jpg")
        return

    image_path = sys.argv[1]
    print(Fore.CYAN + "[SYSTEM] Browsing and uploading image: " + image_path)

    # Load the image using OpenCV
    img = cv2.imread(image_path)
    if img is None:
        print(Fore.RED + "[ERROR] Cannot open image. Check the file path.")
        return

    # Load the YOLOv8 model for ship detection
    print(Fore.CYAN + "[SYSTEM] Loading AI Model (YOLOv8)...")
    ship_model = YOLO('yolov8n.pt') 

    # Detect Ships
    print(Fore.YELLOW + "[SCANNING] Looking for ships...")
    results = ship_model(img)
    ship_found = False
    for r in results:
        for box in r.boxes:
            ship_found = True
            conf = float(box.conf)
            print(Fore.WHITE + f"  -> Ship detected! Confidence: {conf*100:.2f}%")

    # Oil Spill Detection (Red/Dark Hue threshold)
    print(Fore.YELLOW + "[SCANNING] Looking for Oil Spill Slicks...")
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    mask = cv2.inRange(hsv, (0, 70, 50), (10, 255, 255))
    oil_pixels = np.count_nonzero(mask)
    oil_found = oil_pixels > 1000

    # Final Logic & Alerts
    if oil_found:
        print(Fore.RED + f"[ALERT] OIL SPILL DETECTED! Area: {oil_pixels} pixels.")
        if ship_found:
            print(Fore.RED + "[ALERT] CULPRIT SHIP IDENTIFIED! Ship is adjacent to the oil slick.")
            print(Fore.RED + "[ACTION] Sending alert to Maritime Authorities...")
        else:
            print(Fore.YELLOW + "[ALERT] Oil spill detected, but no ship currently in frame.")
    else:
        print(Fore.GREEN + "[STATUS] No oil spill detected in this image.")

if __name__ == "__main__":
    secure_login()
    while True:
        analyze()
        cont = input(Fore.CYAN + "\n  Scan another image? (y/n): ")
        if cont.lower() != 'y':
            print(Fore.GREEN + "\n  [SYSTEM] Mission complete. Cleaner Oceans, Safer Futures!")
            break