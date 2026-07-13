"""アジアンハンデ判定ロジックのテスト（X歩負け/勝ち 仕様）"""
import sys
sys.path.insert(0, '/home/ubuntu/order-app/backend')
from handicap import calculate_result_v2, get_result_label, calculate_payout
from decimal import Decimal

# (home_score, away_score, handicap, side, expected_label, expected_payout_ratio)
test_cases = [
    # ユーザー確認済みケース
    (1, 0, 1.1,  'home', '1歩負け',          0.9),    # 10%没収、90%返還
    (1, 0, 1.3,  'home', '3歩負け',          0.7),    # 30%没収、70%返還
    (1, 0, 1.7,  'home', '7歩負け',          0.3),    # 70%没収、30%返還
    (1, 0, 1.75, 'home', '7.5歩負け',        0.25),   # 75%没収、25%返還
    # Push（引き分け）
    (1, 0, 1.0,  'home', '引き分け（返還）',  1.0),
    (0, 0, 0.0,  'home', '引き分け（返還）',  1.0),
    # 明確な勝ち（d > frac）
    (2, 0, 1.0,  'home', '勝ち',             1.9),
    (2, 0, 1.3,  'home', '勝ち',             1.9),    # d=2-1.3=0.7 > 0 → 勝ち
    (3, 0, 1.3,  'home', '勝ち',             1.9),    # d=3-1.3=1.7 > 0 → 勝ち
    # 部分勝ち（d = frac）
    (2, 0, 1.5,  'home', '5歩勝ち',          1.45),   # d=2-1.5=0.5=frac → 5歩勝ち
    (1, 0, 0.5,  'home', '5歩勝ち',          1.45),   # d=1-0.5=0.5=frac → 5歩勝ち
    (1, 0, 0.3,  'home', '3歩勝ち',          1.27),   # d=1-0.3=0.7 ≠ frac → 勝ち? No: d=0.7, frac=0.3 → 勝ち
    # ※ ハンデ0.3で1点差: d=1-0.3=0.7 → 明確な勝ち
    # 部分勝ちになるのは: d = frac のとき
    # ハンデ1.3で2点差: d=2-1.3=0.7, frac=0.3 → d≠frac → 勝ち ✓
    # ハンデ0.7で1点差: d=1-0.7=0.3, frac=0.7 → d≠frac → 勝ち
    # ハンデ0.3で0点差: d=0-0.3=-0.3, frac=0.3 → |d|=frac → 3歩負け
    (0, 0, 0.3,  'home', '3歩負け',          0.7),    # d=-0.3, frac=0.3 → 3歩負け
    # 明確な負け
    (0, 1, 1.1,  'home', '負け',             0.0),
    (0, 2, 1.0,  'home', '負け',             0.0),
    # away側
    (1, 0, 1.1,  'away', '1歩勝ち',          1.09),   # d=-1+1.1=0.1=frac → 1歩勝ち
    (0, 0, 0.5,  'away', '5歩勝ち',          1.45),   # d=0+0.5=frac → 5歩勝ち
    (1, 0, 1.3,  'away', '3歩勝ち',          1.27),   # d=-1+1.3=0.3=frac → 3歩勝ち
    (2, 0, 1.3,  'away', '負け',             0.0),    # d=-2+1.3=-0.7 → 負け
]

# 修正: ハンデ0.3で1点差は明確な勝ち（d=0.7 ≠ frac=0.3）
test_cases[11] = (1, 0, 0.3, 'home', '勝ち', 1.9)

print("=" * 75)
print("アジアンハンデ判定ロジック テスト（X歩負け/勝ち 仕様）")
print("=" * 75)
all_pass = True
for home_score, away_score, handicap, side, expected_label, expected_ratio in test_cases:
    result, multiplier = calculate_result_v2(home_score, away_score, handicap, side)
    label = get_result_label(result, handicap)
    ratio = float(multiplier)
    label_ok = label == expected_label
    ratio_ok = abs(ratio - expected_ratio) < 0.01
    status = "✅" if (label_ok and ratio_ok) else "❌"
    if not (label_ok and ratio_ok):
        all_pass = False
    print(f"{status} H:{handicap} {home_score}-{away_score} {side} → {label}({ratio:.3f}) 期待:{expected_label}({expected_ratio:.3f})")

print("=" * 75)
print(f"結果: {'全テスト通過 ✅' if all_pass else '一部失敗 ❌'}")
