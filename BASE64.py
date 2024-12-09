import base64

# Path to the image file
image_path = "frame.jpg"

# Read the image file and encode it as Base64
with open(image_path, "rb") as image_file:
    base64_string = base64.b64encode(image_file.read()).decode("utf-8")

print(base64_string)  # Copy this string for your hardcoded test
with open("base64_image.txt", "w") as f:
    f.write(base64_string)