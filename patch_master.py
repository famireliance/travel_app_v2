import json
import re

with open("src/data/allIslandsMaster.ts", "r", encoding="utf-8") as f:
    content = f.read()

match = re.search(r"export const ALL_ISLANDS_MASTER_DICTIONARY: Record<string, any> = (\{.*?\});", content, re.DOTALL)
master_dict = json.loads(match.group(1))

for k, island in master_dict.items():
    if 'points' not in island:
        island['points'] = 10  # Default minimum point
    if 'difficulty' not in island:
        island['difficulty'] = "未設定"
    if 'checkin_radius_m' not in island:
        island['checkin_radius_m'] = 3000 # default 3km
    if 'is_conquest_target' not in island:
        island['is_conquest_target'] = True

new_json = json.dumps(master_dict, ensure_ascii=False, indent=2)
new_content = content[:match.start(1)] + new_json + content[match.end(1):]

with open("src/data/allIslandsMaster.ts", "w", encoding="utf-8") as f:
    f.write(new_content)

print("Patch applied")
