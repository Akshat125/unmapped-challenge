"""World Bank WDI — country-level context indicators.
GDP per capita, labor force participation, employment-to-population,
share of youth NEET.

TODO (requires network): live fetch via https://api.worldbank.org/v2/country/{code}/indicator/{id}?format=json
  NY.GDP.PCAP.CD          GDP per capita (current US$)
  SL.TLF.CACT.ZS          Labor force participation rate, total (%)
  SL.EMP.TOTL.SP.ZS       Employment to population ratio, 15+ (%)
  SL.UEM.NEET.ZS          Share of youth not in education, employment or training
"""
from __future__ import annotations

from _common import write_output

INDICATORS = {
    "GH": {
        "gdp_per_capita_usd": {"value": 2260, "year": 2023, "indicator": "NY.GDP.PCAP.CD"},
        "labor_force_participation_pct": {"value": 66.1, "year": 2023, "indicator": "SL.TLF.CACT.ZS"},
        "employment_to_population_pct": {"value": 62.4, "year": 2023, "indicator": "SL.EMP.TOTL.SP.ZS"},
        "youth_neet_pct": {"value": 24.7, "year": 2022, "indicator": "SL.UEM.NEET.ZS"},
    },
    "BD": {
        "gdp_per_capita_usd": {"value": 2530, "year": 2023, "indicator": "NY.GDP.PCAP.CD"},
        "labor_force_participation_pct": {"value": 58.3, "year": 2023, "indicator": "SL.TLF.CACT.ZS"},
        "employment_to_population_pct": {"value": 55.8, "year": 2023, "indicator": "SL.EMP.TOTL.SP.ZS"},
        "youth_neet_pct": {"value": 29.0, "year": 2022, "indicator": "SL.UEM.NEET.ZS"},
    },
}


def main() -> None:
    print("fetch_wdi: building WDI indicators for GH, BD")
    write_output(
        "wdi.json",
        source="World Bank WDI (seed values, swap for live fetch)",
        values=INDICATORS,
    )


if __name__ == "__main__":
    main()
