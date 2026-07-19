import pandas as pd
import json
import re

# Load Excel files
coords_df = pd.read_excel("/Users/masahito/Desktop/島ログ 座標半径データ.xlsx")
points_df = pd.read_excel("/Users/masahito/Desktop/島ログ 全島ポイント計算.xlsx")

# 7 Unreachable Islands
unreachable = [
    ("馬毛島", "鹿児島県"),
    ("海栗島", "長崎県"),
    ("若宮島", "長崎県"),
    ("竹ノ島", "長崎県"),
    ("鹿島", "長崎県"),
    ("鹿島", "広島県"),
    ("櫃島", "山口県")
]

# Create dictionaries for fast lookup
# Key: (島名, 都道府県)
coords_map = {}
for _, row in coords_df.iterrows():
    name = str(row['島名']).strip()
    pref = str(row['都道府県']).strip()
    coords_map[(name, pref)] = {
        'area': row.get('面積(km2)'),
        'radius_m': row.get('等価半径(m)')
    }

points_map = {}
for _, row in points_df.iterrows():
    name = str(row['島名']).strip()
    pref = str(row['都道府県']).strip()
    points_map[(name, pref)] = {
        'points': row.get('ポイント'),
        'difficulty': row.get('Rank名')
    }

# Read current TS file
with open("src/data/allIslandsMaster.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Extract the JSON part
match = re.search(r"export const ALL_ISLANDS_MASTER_DICTIONARY: Record<string, any> = (\{.*?\});", content, re.DOTALL)
if not match:
    print("Failed to find dictionary in TS file")
    exit(1)

master_dict = json.loads(match.group(1))

# Update master_dict
match_count = 0
for k, island in master_dict.items():
    name = island['name']
    pref = island.get('prefecture', '')
    
    # Clean name (remove parenthesis for matching if needed, though Excel seems to have exact names in some cases. Let's try exact first)
    clean_name = name.split("（")[0].strip()
    
    coord_data = coords_map.get((clean_name, pref))
    point_data = points_map.get((clean_name, pref))
    
    # Try exact name if clean name didn't match
    if not coord_data:
        coord_data = coords_map.get((name, pref))
    if not point_data:
        point_data = points_map.get((name, pref))
        
    if coord_data:
        island['area'] = coord_data['area'] if not pd.isna(coord_data['area']) else None
        r = coord_data['radius_m']
        if not pd.isna(r):
            island['radius_m'] = r
            island['checkin_radius_m'] = r + 1000
            
    if point_data:
        p = point_data['points']
        island['points'] = p if not pd.isna(p) else 0
        d = point_data['difficulty']
        island['difficulty'] = d if not pd.isna(d) else "未設定"
        match_count += 1
        
    # Unreachable check
    island['is_conquest_target'] = True
    for un_name, un_pref in unreachable:
        if clean_name == un_name and pref == un_pref:
            island['is_conquest_target'] = False
            break

print(f"Matched and updated {match_count} islands.")

# Write back
new_json = json.dumps(master_dict, ensure_ascii=False, indent=2)
new_content = content[:match.start(1)] + new_json + content[match.end(1):]

with open("src/data/allIslandsMaster.ts", "w", encoding="utf-8") as f:
    f.write(new_content)

print("Successfully updated src/data/allIslandsMaster.ts")
