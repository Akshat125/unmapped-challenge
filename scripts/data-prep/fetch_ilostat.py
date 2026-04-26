"""ILOSTAT — employment by sector, and mean earnings by sector AND by
education level. The earnings-by-education slice drives
lib/returns-to-education.ts (§6.2).

TODO (requires network): replace the seed with live CSVs from ILOSTAT:
  EMP_TEMP_SEX_ECO_NB_A — employment by economic activity
  EAR_4MTH_SEX_ECO_CUR_NB_A — mean monthly earnings by sector
  Add by-education-level breakdown for returns-to-education signal.
"""
from __future__ import annotations

from _common import write_output

# Sector key = ISIC aggregation compatible with ILOSTAT ECO classification.
# Employment values are thousands of persons; wages are local currency/month.
# Values approximate recent ILOSTAT releases; swap with live data for production.

EMPLOYMENT_GH = [
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

EMPLOYMENT_BD = [
    {"sector": "Agriculture", "year": 2020, "employment_thousands": 24500},
    {"sector": "Agriculture", "year": 2021, "employment_thousands": 24400},
    {"sector": "Agriculture", "year": 2022, "employment_thousands": 24300},
    {"sector": "Agriculture", "year": 2023, "employment_thousands": 24200},
    {"sector": "Agriculture", "year": 2024, "employment_thousands": 24100},

    {"sector": "Manufacturing", "year": 2020, "employment_thousands": 9500},
    {"sector": "Manufacturing", "year": 2021, "employment_thousands": 9750},
    {"sector": "Manufacturing", "year": 2022, "employment_thousands": 10020},
    {"sector": "Manufacturing", "year": 2023, "employment_thousands": 10350},
    {"sector": "Manufacturing", "year": 2024, "employment_thousands": 10620},

    {"sector": "Construction", "year": 2020, "employment_thousands": 3800},
    {"sector": "Construction", "year": 2021, "employment_thousands": 3900},
    {"sector": "Construction", "year": 2022, "employment_thousands": 4000},
    {"sector": "Construction", "year": 2023, "employment_thousands": 4110},
    {"sector": "Construction", "year": 2024, "employment_thousands": 4220},

    {"sector": "Wholesale and retail trade", "year": 2020, "employment_thousands": 7800},
    {"sector": "Wholesale and retail trade", "year": 2021, "employment_thousands": 7920},
    {"sector": "Wholesale and retail trade", "year": 2022, "employment_thousands": 8050},
    {"sector": "Wholesale and retail trade", "year": 2023, "employment_thousands": 8180},
    {"sector": "Wholesale and retail trade", "year": 2024, "employment_thousands": 8300},

    {"sector": "Information and communication", "year": 2020, "employment_thousands": 210},
    {"sector": "Information and communication", "year": 2021, "employment_thousands": 240},
    {"sector": "Information and communication", "year": 2022, "employment_thousands": 280},
    {"sector": "Information and communication", "year": 2023, "employment_thousands": 320},
    {"sector": "Information and communication", "year": 2024, "employment_thousands": 365},

    {"sector": "Accommodation and food service", "year": 2020, "employment_thousands": 1400},
    {"sector": "Accommodation and food service", "year": 2021, "employment_thousands": 1440},
    {"sector": "Accommodation and food service", "year": 2022, "employment_thousands": 1490},
    {"sector": "Accommodation and food service", "year": 2023, "employment_thousands": 1530},
    {"sector": "Accommodation and food service", "year": 2024, "employment_thousands": 1570},
]

# Mean monthly earnings by sector (most recent year). Used for wage-floor signal.
EARNINGS_BY_SECTOR = {
    "GH": {
        "Agriculture": {"currency": "GHS", "mean_monthly": 720, "year": 2024},
        "Manufacturing": {"currency": "GHS", "mean_monthly": 1350, "year": 2024},
        "Construction": {"currency": "GHS", "mean_monthly": 1420, "year": 2024},
        "Wholesale and retail trade": {"currency": "GHS", "mean_monthly": 1180, "year": 2024},
        "Information and communication": {"currency": "GHS", "mean_monthly": 2840, "year": 2024},
        "Accommodation and food service": {"currency": "GHS", "mean_monthly": 980, "year": 2024},
    },
    "BD": {
        "Agriculture": {"currency": "BDT", "mean_monthly": 9800, "year": 2024},
        "Manufacturing": {"currency": "BDT", "mean_monthly": 14500, "year": 2024},
        "Construction": {"currency": "BDT", "mean_monthly": 16200, "year": 2024},
        "Wholesale and retail trade": {"currency": "BDT", "mean_monthly": 13400, "year": 2024},
        "Information and communication": {"currency": "BDT", "mean_monthly": 28600, "year": 2024},
        "Accommodation and food service": {"currency": "BDT", "mean_monthly": 11200, "year": 2024},
    },
}

# Mean monthly earnings by sector X education level. Drives
# returns-to-education ratio (§6.2). Education levels: basic | secondary | tertiary.
EARNINGS_BY_EDUCATION = {
    "GH": [
        {"sector": "Agriculture", "education": "basic", "mean_monthly": 640, "currency": "GHS"},
        {"sector": "Agriculture", "education": "secondary", "mean_monthly": 820, "currency": "GHS"},
        {"sector": "Agriculture", "education": "tertiary", "mean_monthly": 1100, "currency": "GHS"},
        {"sector": "Manufacturing", "education": "basic", "mean_monthly": 1050, "currency": "GHS"},
        {"sector": "Manufacturing", "education": "secondary", "mean_monthly": 1380, "currency": "GHS"},
        {"sector": "Manufacturing", "education": "tertiary", "mean_monthly": 2180, "currency": "GHS"},
        {"sector": "Construction", "education": "basic", "mean_monthly": 1150, "currency": "GHS"},
        {"sector": "Construction", "education": "secondary", "mean_monthly": 1460, "currency": "GHS"},
        {"sector": "Construction", "education": "tertiary", "mean_monthly": 2280, "currency": "GHS"},
        {"sector": "Information and communication", "education": "basic", "mean_monthly": 1600, "currency": "GHS"},
        {"sector": "Information and communication", "education": "secondary", "mean_monthly": 2200, "currency": "GHS"},
        {"sector": "Information and communication", "education": "tertiary", "mean_monthly": 3480, "currency": "GHS"},
        {"sector": "Wholesale and retail trade", "education": "basic", "mean_monthly": 950, "currency": "GHS"},
        {"sector": "Wholesale and retail trade", "education": "secondary", "mean_monthly": 1230, "currency": "GHS"},
        {"sector": "Wholesale and retail trade", "education": "tertiary", "mean_monthly": 1850, "currency": "GHS"},
        {"sector": "Accommodation and food service", "education": "basic", "mean_monthly": 850, "currency": "GHS"},
        {"sector": "Accommodation and food service", "education": "secondary", "mean_monthly": 1020, "currency": "GHS"},
        {"sector": "Accommodation and food service", "education": "tertiary", "mean_monthly": 1400, "currency": "GHS"},
    ],
    "BD": [
        {"sector": "Agriculture", "education": "basic", "mean_monthly": 8800, "currency": "BDT"},
        {"sector": "Agriculture", "education": "secondary", "mean_monthly": 11200, "currency": "BDT"},
        {"sector": "Agriculture", "education": "tertiary", "mean_monthly": 15800, "currency": "BDT"},
        {"sector": "Manufacturing", "education": "basic", "mean_monthly": 11800, "currency": "BDT"},
        {"sector": "Manufacturing", "education": "secondary", "mean_monthly": 15200, "currency": "BDT"},
        {"sector": "Manufacturing", "education": "tertiary", "mean_monthly": 24800, "currency": "BDT"},
        {"sector": "Construction", "education": "basic", "mean_monthly": 13400, "currency": "BDT"},
        {"sector": "Construction", "education": "secondary", "mean_monthly": 17200, "currency": "BDT"},
        {"sector": "Construction", "education": "tertiary", "mean_monthly": 25400, "currency": "BDT"},
        {"sector": "Information and communication", "education": "basic", "mean_monthly": 16200, "currency": "BDT"},
        {"sector": "Information and communication", "education": "secondary", "mean_monthly": 22400, "currency": "BDT"},
        {"sector": "Information and communication", "education": "tertiary", "mean_monthly": 36400, "currency": "BDT"},
        {"sector": "Wholesale and retail trade", "education": "basic", "mean_monthly": 10800, "currency": "BDT"},
        {"sector": "Wholesale and retail trade", "education": "secondary", "mean_monthly": 14100, "currency": "BDT"},
        {"sector": "Wholesale and retail trade", "education": "tertiary", "mean_monthly": 21600, "currency": "BDT"},
        {"sector": "Accommodation and food service", "education": "basic", "mean_monthly": 9600, "currency": "BDT"},
        {"sector": "Accommodation and food service", "education": "secondary", "mean_monthly": 11900, "currency": "BDT"},
        {"sector": "Accommodation and food service", "education": "tertiary", "mean_monthly": 16200, "currency": "BDT"},
    ],
}


def main() -> None:
    print("fetch_ilostat: building ILOSTAT employment + earnings subsets")
    write_output(
        "ilostat_employment.json",
        source="ILO ILOSTAT — EMP_TEMP_SEX_ECO_NB_A (seed values, swap for live fetch)",
        values={"GH": EMPLOYMENT_GH, "BD": EMPLOYMENT_BD},
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
