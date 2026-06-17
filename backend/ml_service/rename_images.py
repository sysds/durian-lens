# save as rename_images.py
import os

# Change this to your folder path
folder = "data/train/musang-king"
prefix = "musang"

for i, filename in enumerate(os.listdir(folder)):
    if filename.endswith(('.jpg', '.png', '.jpeg')):
        old_path = os.path.join(folder, filename)
        new_path = os.path.join(folder, f"{prefix}_{i+1:03d}.jpg")
        os.rename(old_path, new_path)
        print(f"Renamed: {filename} → {prefix}_{i+1:03d}.jpg")