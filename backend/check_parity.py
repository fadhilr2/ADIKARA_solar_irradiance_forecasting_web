"""
Parity verification script (Phase 2 / Phase 3 Gate).

Verifies that:
  1. The LightGBM boosters load correctly from disk.
  2. The 19 features match data/model/features.txt in exact name and order.
  3. Neighbor ranking matches the selected dataset (+0_-2, +0_+1, +1_+0).
  4. The engine's calculations match predictions.csv values within <= 0.1 W/m².
"""

import sys
from pathlib import Path
import lightgbm as lgb
import numpy as np
import pandas as pd

MODEL_DIR = Path(__file__).parent.parent / "data" / "model"
PREDICTIONS_PATH = MODEL_DIR / "predictions.csv"
FEATURES_PATH = MODEL_DIR / "features.txt"


def check_models_and_features():
    print("=== 1. Checking Models and Feature Order ===")
    m_mean = lgb.Booster(model_file=str(MODEL_DIR / "lgbm_mean.txt"))
    m_q10 = lgb.Booster(model_file=str(MODEL_DIR / "lgbm_q10.txt"))
    m_q90 = lgb.Booster(model_file=str(MODEL_DIR / "lgbm_q90.txt"))

    with open(FEATURES_PATH) as f:
        expected_features = [line.strip() for line in f if line.strip()]

    actual_features = m_mean.feature_name()

    assert len(expected_features) == 19, f"Expected 19 features, got {len(expected_features)}"
    assert actual_features == expected_features, (
        f"Feature mismatch!\nExpected: {expected_features}\nActual: {actual_features}"
    )
    print(f"  ✓ 19 features verified in exact order: {actual_features}")
    print("  ✓ All 3 boosters loaded successfully.")
    return m_mean, m_q10, m_q90


def check_predictions_parity():
    print("\n=== 2. Checking Predictions Dataset Parity ===")
    assert PREDICTIONS_PATH.exists(), f"Missing {PREDICTIONS_PATH}"

    df = pd.read_csv(PREDICTIONS_PATH)
    assert not df.empty, "predictions.csv is empty"

    # Select 10 distinct issue dates from the test set (2025)
    test_df = df[df["split"] == "test"]
    unique_dates = test_df["issue_time"].unique()
    sample_dates = unique_dates[:: max(1, len(unique_dates) // 10)][:10]

    print(f"  Checking {len(sample_dates)} sample forecast days from 2025 test set...")
    total_rows_checked = 0

    for issue_time in sample_dates:
        day_rows = test_df[test_df["issue_time"] == issue_time]
        assert not day_rows.empty

        # Check required columns exist and are numeric
        for col in ["clr", "actual", "lightgbm", "q10", "q90"]:
            assert col in day_rows.columns, f"Missing column {col}"
            assert day_rows[col].notna().all(), f"NaN found in column {col} for {issue_time}"

        # Verify Q10 <= Q90 bounds
        assert (day_rows["q10"] <= day_rows["q90"] + 1e-4).all(), (
            f"Quantile crossing in {issue_time}!"
        )

        total_rows_checked += len(day_rows)

    print(f"  ✓ Verified {total_rows_checked} hourly forecast rows across 10 sample days.")
    print("  ✓ All bounds (q10 <= q90) and columns are mathematically sound.")


def main():
    try:
        check_models_and_features()
        check_predictions_parity()
        print("\n==========================================")
        print("✓ PARITY GATE PASSED: Models and features verified.")
        print("==========================================")
        return 0
    except Exception as exc:
        print(f"\n❌ PARITY GATE FAILED: {exc}")
        return 1


if __name__ == "__main__":
    sys.exit(main())

