"""
アジアンハンデ（Asian Handicap）判定ロジック

【ルール】
ハンデ（handicap）はホームチームが背負うハンデ点数。

【精算ルール】
1. home側ベッターの実効スコア差 d = home_score - away_score - handicap
   away側ベッターの実効スコア差 d = away_score - home_score + handicap

2. 判定:
   - d > 0  → 勝ち（×1.9倍）
   - d < 0  → 負け（全額没収）
   - d = 0  → 引き分け Push（全額返還）

3. ハンデの整数部分でちょうど点差がカバーされる場合（部分精算）：
   小数部分 frac がそのまま没収/獲得の割合になる。
   - 負け側: frac分没収、(1-frac)分返還  → 「X歩負け」（X = frac×10）
   - 勝ち側: frac分は1.9倍、(1-frac)分は返還 → 「X歩勝ち」

【具体例（ユーザー確認済み）】
ハンデ1.1、スコア1-0（1点差）:
  home: d = 1 - 1.1 = -0.1 → |d|=frac=0.1 → 10%没収（1歩負け）
  away: d = -1 + 1.1 = 0.1 → d=frac=0.1 → 10%は1.9倍（1歩勝ち）

ハンデ1.7、スコア1-0（1点差）:
  home: d = 1 - 1.7 = -0.7 → |d|=frac=0.7 → 70%没収（7歩負け）

ハンデ1.3、スコア1-0（1点差）:
  home: d = 1 - 1.3 = -0.3 → |d|=frac=0.3 → 30%没収（3歩負け）
"""

from decimal import Decimal, ROUND_HALF_UP
from models import BetResult

ODDS = Decimal("1.9")
EPSILON = Decimal("0.001")  # 浮動小数点誤差対策


def calculate_result_v2(
    home_score: int,
    away_score: int,
    handicap: float,
    side: str  # "home" or "away"
) -> tuple[BetResult, Decimal]:
    """
    アジアンハンデ判定。

    小数部分がそのまま部分精算の割合になる。
    例: ハンデ1.3で1点差 → 30%没収（3歩負け）

    Returns:
        (BetResult, payout_multiplier)
        payout = amount * payout_multiplier
    """
    h = Decimal(str(handicap))
    score_diff = Decimal(str(home_score - away_score))

    if side == "home":
        d = score_diff - h
    else:
        d = -score_diff + h

    # ハンデの小数部分（0.0〜0.99...）
    frac = h % Decimal("1")

    if frac < EPSILON:
        # ハンデが整数の場合（部分精算なし）
        if d > EPSILON:
            return BetResult.win, ODDS
        elif d < -EPSILON:
            return BetResult.loss, Decimal("0")
        else:
            return BetResult.push, Decimal("1.0")
    else:
        # ハンデが小数の場合
        # 部分精算の判定: |d| ≈ frac かどうか
        if abs(d - frac) < EPSILON:
            # d ≈ +frac → 部分勝ち（X歩勝ち）
            payout = frac * ODDS + (Decimal("1") - frac)
            # frac <= 0.5 → partial_win_50（歩勝ち系）, > 0.5 → partial_win_75（3分勝ち系）
            if frac <= Decimal("0.5"):
                return BetResult.partial_win_50, payout
            else:
                return BetResult.partial_win_75, payout
        elif abs(d + frac) < EPSILON:
            # d ≈ -frac → 部分負け（X歩負け）
            payout = Decimal("1") - frac
            if frac <= Decimal("0.5"):
                return BetResult.partial_loss_50, payout
            else:
                return BetResult.partial_loss_75, payout
        elif d > EPSILON:
            return BetResult.win, ODDS
        elif d < -EPSILON:
            return BetResult.loss, Decimal("0")
        else:
            return BetResult.push, Decimal("1.0")


def calculate_payout(amount: Decimal, result: BetResult, handicap: float) -> Decimal:
    """
    賭けポイントと結果から払い戻し額を計算する。
    """
    h = Decimal(str(handicap))
    frac = h % Decimal("1")

    if result == BetResult.win:
        return (amount * ODDS).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    elif result in (BetResult.partial_win_75, BetResult.partial_win_50):
        payout = frac * ODDS + (Decimal("1") - frac)
        return (amount * payout).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    elif result == BetResult.push:
        return amount
    elif result in (BetResult.partial_loss_50, BetResult.partial_loss_75):
        return (amount * (Decimal("1") - frac)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    elif result == BetResult.loss:
        return Decimal("0")
    else:
        return amount  # pending/cancelled → 返還


def get_result_label(result: BetResult, handicap: float = 0.0) -> str:
    """
    結果ラベルを返す。部分精算の場合は「X歩負け/勝ち」形式で動的に生成。
    """
    if result in (BetResult.partial_loss_50, BetResult.partial_loss_75):
        frac = Decimal(str(handicap)) % Decimal("1")
        # 小数部分を「X歩」形式に変換（例: 0.3 → 3歩、0.75 → 7.5歩）
        steps = frac * 10
        # 末尾の0を除去: 7.50 → 7.5, 3.00 → 3
        steps_str = f"{float(steps):.10g}"
        label = f"{steps_str}歩負け"
        return label
    elif result in (BetResult.partial_win_50, BetResult.partial_win_75):
        frac = Decimal(str(handicap)) % Decimal("1")
        steps = frac * 10
        steps_str = f"{float(steps):.10g}"
        label = f"{steps_str}歩勝ち"
        return label

    labels = {
        BetResult.win: "勝ち",
        BetResult.push: "引き分け（返還）",
        BetResult.loss: "負け",
        BetResult.pending: "未確定",
        BetResult.cancelled: "キャンセル",
    }
    return labels.get(result, "不明")


def get_result_label_simple(result: BetResult) -> str:
    """ハンデなしのシンプルなラベル（API互換用）"""
    labels = {
        BetResult.win: "勝ち",
        BetResult.partial_win_75: "3分勝ち",
        BetResult.partial_win_50: "歩勝ち",
        BetResult.push: "引き分け（返還）",
        BetResult.partial_loss_50: "歩負け",
        BetResult.partial_loss_75: "3分負け",
        BetResult.loss: "負け",
        BetResult.pending: "未確定",
        BetResult.cancelled: "キャンセル",
    }
    return labels.get(result, "不明")
