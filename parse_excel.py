import pandas as pd
import json

def parse_excel(file_path):
    try:
        df = pd.read_excel(file_path)
        return df.head(10).to_json(orient='records', force_ascii=False)
    except Exception as e:
        return str(e)

print("Coordinates Data:")
print(parse_excel("/Users/masahito/Desktop/島ログ 座標半径データ.xlsx"))
print("\nPoints Data:")
print(parse_excel("/Users/masahito/Desktop/島ログ 全島ポイント計算.xlsx"))
