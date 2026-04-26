"""ILOSTAT — employment by sector, and mean earnings by sector AND by
education level. The earnings-by-education slice drives
lib/returns-to-education.ts (§6.2).

Country namespace was migrated to ISO-3 (GHA, BOL, VNM) when the
recommendations system was rewired to consume data/ilo_emp_occ_*.csv.
Sector-keyed wage values are still seed-grade order-of-magnitude numbers;
swap with live ILOSTAT fetches before publication.

TODO (requires network): replace the seed with live CSVs from ILOSTAT:
  EMP_TEMP_SEX_ECO_NB_A — employment by economic activity
  EAR_4MTH_SEX_ECO_CUR_NB_A — mean monthly earnings by sector
  Add by-education-level breakdown for returns-to-education signal.
"""
from __future__ import annotations

from _common import write_output


# ── Sector employment time series, in thousands of persons. ────────────────

EMPLOYMENT_GHA = [
    {"sector": "Agriculture", "year": 2020, "employment_thousands": 3450},
    {"sector": "Agriculture", "year": 2021, "employment_thousands": 3480},
    {"sector": "Agriculture", "year": 2022, "employment_thousands": 3500},
    {"sector": "Agriculture", "year": 2023, "employment_thousands": 3510},
    {"sector": "Agriculture", "year": 2024, "employment_thousands": 3520},

    {"sector": "Manufacturing", "year": 2020, "employment_thousands": 1200},
    {"sector": "Manufacturing", "year": 2021, "employment_thousands": 1240},
    {"sector": "Manufacturing", "year": 2022, "employment_thousands": 1280},
    {"sector": "Manufacturing", "year": 2023, "employment_thousands": 1310},
    {"sector": "Manufacturing", "year": 2024, "employment_thousands": 1340},

    {"sector": "Construction", "year": 2020, "employment_thousands": 550},
    {"sector": "Construction", "year": 2021, "employment_thousands": 580},
    {"sector": "Construction", "year": 2022, "employment_thousands": 610},
    {"sector": "Construction", "year": 2023, "employment_thousands": 635},
    {"sector": "Construction", "year": 2024, "employment_thousands": 655},

    {"sector": "Wholesale and retail trade", "year": 2020, "employment_thousands": 2100},
    {"sector": "Wholesale and retail trade", "year": 2021, "employment_thousands": 2155},
    {"sector": "Wholesale and retail trade", "year": 2022, "employment_thousands": 2210},
    {"sector": "Wholesale and retail trade", "year": 2023, "employment_thousands": 2260},
    {"sector": "Wholesale and retail trade", "year": 2024, "employment_thousands": 2295},

    {"sector": "Information and communication", "year": 2020, "employment_thousands": 62},
    {"sector": "Information and communication", "year": 2021, "employment_thousands": 70},
    {"sector": "Information and communication", "year": 2022, "employment_thousands": 80},
    {"sector": "Information and communication", "year": 2023, "employment_thousands": 92},
    {"sector": "Information and communication", "year": 2024, "employment_thousands": 103},

    {"sector": "Accommodation and food service", "year": 2020, "employment_thousands": 380},
    {"sector": "Accommodation and food service", "year": 2021, "employment_thousands": 395},
    {"sector": "Accommodation and food service", "year": 2022, "employment_thousands": 415},
    {"sector": "Accommodation and food service", "year": 2023, "employment_thousands": 430},
    {"sector": "Accommodation and food service", "year": 2024, "employment_thousands": 445},
]

EMPLOYMENT_BOL = [
    {"sector": "Agriculture", "year": 2020, "employment_thousands": 1450},
    {"sector": "Agriculture", "year": 2021, "employment_thousands": 1480},
    {"sector": "Agriculture", "year": 2022, "employment_thousands": 1490},
    {"sector": "Agriculture", "year": 2023, "employment_thousands": 1490},
    {"sector": "Agriculture", "year": 2024, "employment_thousands": 1495},

    {"sector": "Manufacturing", "year": 2020, "employment_thousands": 540},
    {"sector": "Manufacturing", "year": 2021, "employment_thousands": 560},
    {"sector": "Manufacturing", "year": 2022, "employment_thousands": 580},
    {"sector": "Manufacturing", "year": 2023, "employment_thousands": 595},
    {"sector": "Manufacturing", "year": 2024, "employment_thousands": 610},

    {"sector": "Construction", "year": 2020, "employment_thousands": 380},
    {"sector": "Construction", "year": 2021, "employment_thousands": 395},
    {"sector": "Construction", "year": 2022, "employment_thousands": 410},
    {"sector": "Construction", "year": 2023, "employment_thousands": 425},
    {"sector": "Construction", "year": 2024, "employment_thousands": 440},

    {"sector": "Wholesale and retail trade", "year": 2020, "employment_thousands": 980},
    {"sector": "Wholesale and retail trade", "year": 2021, "employment_thousands": 1010},
    {"sector": "Wholesale and retail trade", "year": 2022, "employment_thousands": 1040},
    {"sector": "Wholesale and retail trade", "year": 2023, "employment_thousands": 1075},
    {"sector": "Wholesale and retail trade", "year": 2024, "employment_thousands": 1105},

    {"sector": "Information and communication", "year": 2020, "employment_thousands": 38},
    {"sector": "Information and communication", "year": 2021, "employment_thousands": 42},
    {"sector": "Information and communication", "year": 2022, "employment_thousands": 47},
    {"sector": "Information and communication", "year": 2023, "employment_thousands": 53},
    {"sector": "Information and communication", "year": 2024, "employment_thousands": 60},

    {"sector": "Accommodation and food service", "year": 2020, "employment_thousands": 240},
    {"sector": "Accommodation and food service", "year": 2021, "employment_thousands": 248},
    {"sector": "Accommodation and food service", "year": 2022, "employment_thousands": 258},
    {"sector": "Accommodation and food service", "year": 2023, "employment_thousands": 270},
    {"sector": "Accommodation and food service", "year": 2024, "employment_thousands": 282},
]

EMPLOYMENT_VNM = [
    {"sector": "Agriculture", "year": 2020, "employment_thousands": 17900},
    {"sector": "Agriculture", "year": 2021, "employment_thousands": 17500},
    {"sector": "Agriculture", "year": 2022, "employment_thousands": 17100},
    {"sector": "Agriculture", "year": 2023, "employment_thousands": 16800},
    {"sector": "Agriculture", "year": 2024, "employment_thousands": 16500},

    {"sector": "Manufacturing", "year": 2020, "employment_thousands": 11200},
    {"sector": "Manufacturing", "year": 2021, "employment_thousands": 11550},
    {"sector": "Manufacturing", "year": 2022, "employment_thousands": 11900},
    {"sector": "Manufacturing", "year": 2023, "employment_thousands": 12250},
    {"sector": "Manufacturing", "year": 2024, "employment_thousands": 12550},

    {"sector": "Construction", "year": 2020, "employment_thousands": 4500},
    {"sector": "Construction", "year": 2021, "employment_thousands": 4620},
    {"sector": "Construction", "year": 2022, "employment_thousands": 4750},
    {"sector": "Construction", "year": 2023, "employment_thousands": 4880},
    {"sector": "Construction", "year": 2024, "employment_thousands": 5000},

    {"sector": "Wholesale and retail trade", "year": 2020, "employment_thousands": 7400},
    {"sector": "Wholesale and retail trade", "year": 2021, "employment_thousands": 7520},
    {"sector": "Wholesale and retail trade", "year": 2022, "employment_thousands": 7660},
    {"sector": "Wholesale and retail trade", "year": 2023, "employment_thousands": 7790},
    {"sector": "Wholesale and retail trade", "year": 2024, "employment_thousands": 7920},

    {"sector": "Information and communication", "year": 2020, "employment_thousands": 350},
    {"sector": "Information and communication", "year": 2021, "employment_thousands": 380},
    {"sector": "Information and communication", "year": 2022, "employment_thousands": 415},
    {"sector": "Information and communication", "year": 2023, "employment_thousands": 455},
    {"sector": "Information and communication", "year": 2024, "employment_thousands": 495},

    {"sector": "Accommodation and food service", "year": 2020, "employment_thousands": 2400},
    {"sector": "Accommodation and food service", "year": 2021, "employment_thousands": 2300},
    {"sector": "Accommodation and food service", "year": 2022, "employment_thousands": 2470},
    {"sector": "Accommodation and food service", "year": 2023, "employment_thousands": 2580},
    {"sector": "Accommodation and food service", "year": 2024, "employment_thousands": 2680},
]


# ── Mean monthly earnings by sector (seed values for the wage-floor signal). ─

EARNINGS_BY_SECTOR = {
    "GHA": {
        "Agriculture": {"currency": "GHS", "mean_monthly": 720, "year": 2024},
        "Manufacturing": {"currency": "GHS", "mean_monthly": 1350, "year": 2024},
        "Construction": {"currency": "GHS", "mean_monthly": 1420, "year": 2024},
        "Wholesale and retail trade": {"currency": "GHS", "mean_monthly": 1180, "year": 2024},
        "Information and communication": {"currency": "GHS", "mean_monthly": 2840, "year": 2024},
        "Accommodation and food service": {"currency": "GHS", "mean_monthly": 980, "year": 2024},
    },
    "BOL": {
        "Agriculture": {"currency": "BOB", "mean_monthly": 1850, "year": 2024},
        "Manufacturing": {"currency": "BOB", "mean_monthly": 2900, "year": 2024},
        "Construction": {"currency": "BOB", "mean_monthly": 3200, "year": 2024},
        "Wholesale and retail trade": {"currency": "BOB", "mean_monthly": 2650, "year": 2024},
        "Information and communication": {"currency": "BOB", "mean_monthly": 5400, "year": 2024},
        "Accommodation and food service": {"currency": "BOB", "mean_monthly": 2200, "year": 2024},
    },
    "VNM": {
        "Agriculture": {"currency": "VND", "mean_monthly": 5200000, "year": 2024},
        "Manufacturing": {"currency": "VND", "mean_monthly": 8400000, "year": 2024},
        "Construction": {"currency": "VND", "mean_monthly": 8900000, "year": 2024},
        "Wholesale and retail trade": {"currency": "VND", "mean_monthly": 7600000, "year": 2024},
        "Information and communication": {"currency": "VND", "mean_monthly": 16200000, "year": 2024},
        "Accommodation and food service": {"currency": "VND", "mean_monthly": 6300000, "year": 2024},
    },
}


# ── Mean monthly earnings by sector × education level (returns to education). ─

def _edu_rows(currency: str, scale: dict[str, dict[str, float]]) -> list[dict]:
    out = []
    for sector, by_edu in scale.items():
        for edu, monthly in by_edu.items():
            out.append({
                "sector": sector,
                "education": edu,
                "mean_monthly": monthly,
                "currency": currency,
            })
    return out


GHA_EDU = {
    "Agriculture": {"basic": 640, "secondary": 820, "tertiary": 1100},
    "Manufacturing": {"basic": 1050, "secondary": 1380, "tertiary": 2180},
    "Construction": {"basic": 1150, "secondary": 1460, "tertiary": 2280},
    "Information and communication": {"basic": 1600, "secondary": 2200, "tertiary": 3480},
    "Wholesale and retail trade": {"basic": 950, "secondary": 1230, "tertiary": 1850},
    "Accommodation and food service": {"basic": 850, "secondary": 1020, "tertiary": 1400},
}

BOL_EDU = {
    "Agriculture": {"basic": 1500, "secondary": 1900, "tertiary": 2600},
    "Manufacturing": {"basic": 2350, "secondary": 2980, "tertiary": 4500},
    "Construction": {"basic": 2600, "secondary": 3300, "tertiary": 4800},
    "Information and communication": {"basic": 3200, "secondary": 4400, "tertiary": 7000},
    "Wholesale and retail trade": {"basic": 2150, "secondary": 2780, "tertiary": 4100},
    "Accommodation and food service": {"basic": 1900, "secondary": 2300, "tertiary": 3100},
}

VNM_EDU = {
    "Agriculture": {"basic": 4400000, "secondary": 5500000, "tertiary": 7400000},
    "Manufacturing": {"basic": 6800000, "secondary": 8800000, "tertiary": 13500000},
    "Construction": {"basic": 7200000, "secondary": 9300000, "tertiary": 13900000},
    "Information and communication": {"basic": 9000000, "secondary": 12500000, "tertiary": 21000000},
    "Wholesale and retail trade": {"basic": 6200000, "secondary": 8000000, "tertiary": 12200000},
    "Accommodation and food service": {"basic": 5400000, "secondary": 6500000, "tertiary": 9000000},
}

EARNINGS_BY_EDUCATION = {
    "GHA": _edu_rows("GHS", GHA_EDU),
    "BOL": _edu_rows("BOB", BOL_EDU),
    "VNM": _edu_rows("VND", VNM_EDU),
}


def main() -> None:
    print("fetch_ilostat: building ILOSTAT employment + earnings subsets")
    write_output(
        "ilostat_employment.json",
        source="ILO ILOSTAT — EMP_TEMP_SEX_ECO_NB_A (seed values, swap for live fetch)",
        values={"GHA": EMPLOYMENT_GHA, "BOL": EMPLOYMENT_BOL, "VNM": EMPLOYMENT_VNM},
    )
    write_output(
        "ilostat_earnings.json",
        source="ILO ILOSTAT — EAR_4MTH_SEX_ECO_CUR_NB_A (seed values, swap for live fetch)",
        values={
            "by_sector": EARNINGS_BY_SECTOR,
            "by_sector_and_education": EARNINGS_BY_EDUCATION,
        },
    )


if __name__ == "__main__":
    main()
