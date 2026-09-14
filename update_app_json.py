import json

path = r"C:\Users\Simplon-CI\Desktop\ChatAndGo\app.json"
with open(path, "r", encoding="utf-8") as f:
    data = json.load(f)

# Modification du package en minuscules
data["expo"]["android"]["package"] = "com.darelseke.chatandgo"

# Ajout du versionCode
data["expo"]["android"]["versionCode"] = 1

with open(path, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)

print("Modifications effectuees avec succes.")
