import sys

path = r'c:\xampp\htdocs\network-baba\network-baba\NB-Employer-Next\styles\allPostJobs.module.css'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Truncate at line 1919 (0-indexed 1918)
new_lines = lines[:1919]

# Append clean definitions
footer = [
    "\n",
    "@keyframes spinAnim {\n",
    "  0% { transform: rotate(0deg); }\n",
    "  100% { transform: rotate(360deg); }\n",
    "}\n"
]

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines + footer)

print("Fixed CSS file.")
